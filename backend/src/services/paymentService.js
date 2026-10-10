import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import env from '../config/env.js';
import {
  getRazorpayInstance,
  isRazorpayConfigured,
  getPublicRazorpayKey,
  verifyPaymentSignature,
  verifyWebhookSignature
} from '../config/razorpay.js';

class PaymentService {
  /**
   * Get public payment gateway configuration.
   * Never exposes secrets.
   */
  static getPaymentConfig() {
    return {
      isConfigured: isRazorpayConfigured(),
      keyId: getPublicRazorpayKey(),
      currency: 'INR',
      supportedMethods: ['COD', 'UPI', 'CARD', 'NETBANKING']
    };
  }

  /**
   * Create Razorpay Order and initialize Payment record.
   * Calculates payable amount authoritatively from Order.
   */
  static async createPaymentOrder(userId, { orderId }) {
    // 1. Locate Order
    const query = mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId }
      : { orderNumber: orderId };

    const order = await Order.findOne(query);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Validate Order ownership
    if (order.user.toString() !== userId.toString()) {
      const err = new Error('Unauthorized: You do not have access to this order');
      err.statusCode = 403;
      throw err;
    }

    // 3. Prevent duplicate payment on already paid order
    if (order.payment && order.payment.status === 'PAID') {
      const err = new Error('This order has already been paid for.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Check if order is cancelled
    if (order.status === 'CANCELLED') {
      const err = new Error('Cannot initiate payment for a cancelled order.');
      err.statusCode = 400;
      throw err;
    }

    // 5. Authoritative amount check
    const payableAmount = order.pricing?.total;
    if (typeof payableAmount !== 'number' || payableAmount <= 0) {
      const err = new Error('Invalid order total amount.');
      err.statusCode = 400;
      throw err;
    }

    // 6. Check Razorpay configuration
    if (!isRazorpayConfigured()) {
      const err = new Error('Online payment gateway is not configured. Please choose Cash on Delivery (COD) or contact store support.');
      err.statusCode = 503;
      err.code = 'GATEWAY_NOT_CONFIGURED';
      err.isConfigured = false;
      throw err;
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      const err = new Error('Payment gateway client failed to initialize.');
      err.statusCode = 503;
      throw err;
    }

    // 7. Create Razorpay Order (amount in paise: ₹1 = 100 paise)
    const amountInPaise = Math.round(payableAmount * 100);
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `RCP_${order.orderNumber}`,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: userId.toString()
      }
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (gatewayErr) {
      const err = new Error(`Payment gateway error: ${gatewayErr.error?.description || gatewayErr.message}`);
      err.statusCode = 502;
      throw err;
    }

    // 8. Create or update Payment record
    let payment = await Payment.findOne({ order: order._id, status: 'PENDING' });
    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: userId,
        gateway: 'RAZORPAY',
        gatewayOrderId: razorpayOrder.id,
        amount: payableAmount,
        currency: 'INR',
        paymentMethod: 'UPI',
        status: 'PENDING',
        financialBreakdown: {
          subtotal: order.pricing.subtotal,
          tax: order.pricing.tax,
          deliveryFee: order.pricing.deliveryFee,
          discount: order.pricing.discount,
          total: order.pricing.total
        }
      });
    } else {
      payment.gatewayOrderId = razorpayOrder.id;
      payment.amount = payableAmount;
    }
    await payment.save();

    return {
      success: true,
      keyId: env.RAZORPAY.KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: {
        name: order.shippingAddress?.name || '',
        phone: order.shippingAddress?.phone || ''
      }
    };
  }

  /**
   * Prepaid checkout: create Razorpay session WITHOUT placing an Auriva order.
   * Order is created only after payment verification succeeds.
   */
  static async createCheckoutSession(userId, payload = {}) {
    const {
      addressId,
      paymentMethod = 'UPI',
      couponCode = null,
      guestId = null,
      items: clientItems = null
    } = payload;

    if (!addressId) {
      const err = new Error('Delivery address is required to start online payment.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedPaymentMethod = ['UPI', 'CARD', 'NETBANKING'].includes(
      String(paymentMethod).toUpperCase()
    )
      ? String(paymentMethod).toUpperCase()
      : 'UPI';

    if (normalizedPaymentMethod === 'COD') {
      const err = new Error('Use place-order for Cash on Delivery. This endpoint is for prepaid only.');
      err.statusCode = 400;
      throw err;
    }

    if (!isRazorpayConfigured()) {
      const err = new Error(
        'Online payment gateway is not configured. Please choose Cash on Delivery (COD) or contact store support.'
      );
      err.statusCode = 503;
      err.code = 'GATEWAY_NOT_CONFIGURED';
      throw err;
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      const err = new Error('Payment gateway client failed to initialize.');
      err.statusCode = 503;
      throw err;
    }

    // Merge guest cart then validate like placeOrder (without creating order)
    const Address = (await import('../models/Address.js')).default;
    const Product = (await import('../models/Product.js')).default;
    const settingsService = (await import('./settingsService.js')).default;
    const couponService = (await import('./couponService.js')).default;
    const { calculateOrderTotals } = await import('../utils/pricing.js');
    const { resolveShiprocketDeliveryFee } = await import('./shippingQuoteService.js');
    const cartService = (await import('./cartService.js')).default;

    const selectedAddress = await Address.findOne({ _id: addressId, user: userId });
    if (!selectedAddress) {
      const err = new Error('Selected delivery address was not found or does not belong to your account');
      err.statusCode = 400;
      throw err;
    }

    let cart = await Cart.findOne({ user: userId });
    const cartEmpty = !cart || !Array.isArray(cart.items) || cart.items.length === 0;
    if (cartEmpty) {
      const mergeItems = Array.isArray(clientItems) ? clientItems : [];
      if (guestId || mergeItems.length > 0) {
        await cartService.syncCart(userId, guestId, mergeItems);
        cart = await Cart.findOne({ user: userId });
      }
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      const err = new Error('Your cart is empty. Please add items before paying.');
      err.statusCode = 400;
      throw err;
    }

    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const draftItems = [];
    for (const item of cart.items) {
      const liveProduct = productMap.get(item.product.toString());
      if (!liveProduct || liveProduct.status !== 'ACTIVE') {
        const err = new Error(`Product "${item.name || 'item'}" is unavailable.`);
        err.statusCode = 400;
        throw err;
      }
      if (!liveProduct.inStock || (liveProduct.stockCount !== undefined && liveProduct.stockCount < item.qty)) {
        const err = new Error(
          `Insufficient stock for "${liveProduct.name}". Available: ${liveProduct.stockCount ?? 0}`
        );
        err.statusCode = 400;
        throw err;
      }

      let unitPrice = liveProduct.price;
      if (liveProduct.weightOptions?.length) {
        const matched = liveProduct.weightOptions.find((o) => o.weight === item.weight);
        if (matched) unitPrice = matched.price;
      }
      subtotal += unitPrice * item.qty;
      draftItems.push({
        productId: liveProduct._id.toString(),
        weight: item.weight,
        qty: item.qty,
        price: unitPrice,
        name: liveProduct.name
      });
    }

    let discount = 0;
    const rawCouponCode = couponCode || cart.appliedCoupon?.code;
    const activeCouponCode = rawCouponCode ? String(rawCouponCode).trim().toUpperCase() : null;
    if (activeCouponCode) {
      const validation = await couponService.validateCoupon({ code: activeCouponCode, subtotal });
      discount = validation.discount;
    }

    const settings = await settingsService.getSettings();
    const shipQuote = await resolveShiprocketDeliveryFee({
      pincode: selectedAddress.postalCode,
      paymentMethod: normalizedPaymentMethod,
      subtotal,
      items: draftItems,
      productMap
    });

    if (shipQuote.error && !shipQuote.freeDeliveryApplied && shipQuote.deliveryFee === 0) {
      const err = new Error(shipQuote.error);
      err.statusCode = 400;
      throw err;
    }

    const pricing = calculateOrderTotals({
      subtotal,
      discount,
      paymentMethod: normalizedPaymentMethod,
      settings,
      deliveryFee: shipQuote.deliveryFee
    });

    const amountInPaise = Math.round(pricing.total * 100);
    if (amountInPaise <= 0) {
      const err = new Error('Invalid checkout total amount.');
      err.statusCode = 400;
      throw err;
    }

    const receipt = `CHK_${Date.now().toString(36)}_${userId.toString().slice(-4)}`.slice(0, 40);
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          userId: userId.toString(),
          addressId: addressId.toString(),
          paymentMethod: normalizedPaymentMethod,
          checkout: 'prepaid_before_order'
        }
      });
    } catch (gatewayErr) {
      const err = new Error(
        `Payment gateway error: ${gatewayErr.error?.description || gatewayErr.message}`
      );
      err.statusCode = 502;
      throw err;
    }

    const payment = new Payment({
      order: null,
      user: userId,
      gateway: 'RAZORPAY',
      gatewayOrderId: razorpayOrder.id,
      amount: pricing.total,
      currency: 'INR',
      paymentMethod: normalizedPaymentMethod,
      status: 'PENDING',
      financialBreakdown: {
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        deliveryFee: pricing.deliveryFee,
        discount: pricing.discount,
        total: pricing.total
      },
      metadata: {
        checkoutIntent: {
          addressId: addressId.toString(),
          paymentMethod: normalizedPaymentMethod,
          couponCode: activeCouponCode,
          guestId: guestId || null,
          items: draftItems,
          expectedTotal: pricing.total,
          deliveryFee: pricing.deliveryFee
        }
      }
    });
    await payment.save();

    return {
      success: true,
      keyId: env.RAZORPAY.KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      payableTotal: pricing.total,
      deliveryFee: pricing.deliveryFee,
      paymentId: payment._id,
      customer: {
        name: selectedAddress.fullName || '',
        phone: selectedAddress.phoneNumber || ''
      }
    };
  }

  /**
   * After Razorpay success: verify signature, THEN create Auriva order (prepaid only).
   */
  static async verifyAndPlacePrepaidOrder(
    userId,
    { razorpayOrderId, razorpayPaymentId, razorpaySignature }
  ) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      const err = new Error('Missing Razorpay payment details for verification.');
      err.statusCode = 400;
      throw err;
    }

    if (!env.RAZORPAY.KEY_SECRET) {
      const err = new Error('Payment verification unavailable: Gateway secret not configured.');
      err.statusCode = 503;
      throw err;
    }

    const payment = await Payment.findOne({
      gatewayOrderId: razorpayOrderId,
      user: userId
    });

    if (!payment) {
      const err = new Error('Payment session not found. Please restart checkout.');
      err.statusCode = 404;
      throw err;
    }

    // Idempotent: already placed + paid
    if (payment.status === 'PAID' && payment.order) {
      const order = await Order.findById(payment.order);
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Payment already verified and order created.',
        order,
        payment
      };
    }

    const isValidSignature = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isValidSignature) {
      payment.status = 'FAILED';
      payment.gatewayPaymentId = razorpayPaymentId;
      payment.gatewaySignature = razorpaySignature;
      payment.failureReason = 'Cryptographic signature verification failed';
      await payment.save();
      const err = new Error('Invalid payment signature. Payment verification failed.');
      err.statusCode = 400;
      throw err;
    }

    const intent = payment.metadata?.checkoutIntent;
    if (!intent?.addressId) {
      const err = new Error('Checkout session is incomplete. Please restart payment.');
      err.statusCode = 400;
      throw err;
    }

    const { placeOrder } = await import('./orderService.js');
    const order = await placeOrder(userId, {
      addressId: intent.addressId,
      paymentMethod: intent.paymentMethod || payment.paymentMethod || 'UPI',
      paymentStatus: 'PAID',
      paymentDetails: {
        transactionId: razorpayPaymentId,
        upiApp: ''
      },
      couponCode: intent.couponCode || null,
      guestId: intent.guestId || null,
      items: intent.items || null,
      idempotencyKey: `paid_${razorpayPaymentId}`
    });

    payment.order = order._id;
    payment.status = 'PAID';
    payment.gatewayPaymentId = razorpayPaymentId;
    payment.gatewaySignature = razorpaySignature;
    payment.transactionId = razorpayPaymentId;
    payment.paidAt = new Date();
    payment.failureReason = '';
    await payment.save();

    // Ensure order payment fields are paid (placeOrder may have set them)
    if (order.payment?.status !== 'PAID') {
      order.payment.status = 'PAID';
      order.payment.transactionId = razorpayPaymentId;
      await order.save();
    }

    return {
      success: true,
      message: 'Payment verified and order placed successfully',
      order,
      payment
    };
  }

  /**
   * Verify Razorpay Payment Signature and finalize order payment.
   * Guaranteed idempotent.
   */
  static async verifyPayment(userId, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    // 1. Locate Order
    const query = mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId }
      : { orderNumber: orderId };

    const order = await Order.findOne(query);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Validate Order ownership
    if (order.user.toString() !== userId.toString()) {
      const err = new Error('Unauthorized: You do not have access to this order');
      err.statusCode = 403;
      throw err;
    }

    // 3. Idempotency Check: if already paid, return existing success state
    if (order.payment && order.payment.status === 'PAID') {
      const existingPayment = await Payment.findOne({
        order: order._id,
        $or: [{ gatewayPaymentId: razorpayPaymentId }, { status: 'PAID' }]
      });
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Payment has already been successfully verified and processed.',
        order,
        payment: existingPayment
      };
    }

    // 4. Check if gateway secret is configured
    if (!env.RAZORPAY.KEY_SECRET) {
      const err = new Error('Payment verification unavailable: Gateway secret not configured.');
      err.statusCode = 503;
      throw err;
    }

    // 5. Cryptographic signature verification
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    // 6. Handle Invalid Signature
    if (!isValidSignature) {
      // Find or create failed payment record
      await Payment.findOneAndUpdate(
        { order: order._id, gatewayOrderId: razorpayOrderId },
        {
          $set: {
            status: 'FAILED',
            gatewayPaymentId: razorpayPaymentId,
            gatewaySignature: razorpaySignature,
            failureReason: 'Cryptographic signature verification failed'
          }
        },
        { upsert: true }
      );

      order.payment.status = 'FAILED';
      await order.save();

      const err = new Error('Invalid payment signature. Payment verification failed.');
      err.statusCode = 400;
      throw err;
    }

    // 7. Signature is valid: Update Payment to PAID
    const now = new Date();
    const payment = await Payment.findOneAndUpdate(
      { order: order._id, $or: [{ gatewayOrderId: razorpayOrderId }, { status: 'PENDING' }] },
      {
        $set: {
          gatewayOrderId: razorpayOrderId,
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: razorpaySignature,
          transactionId: razorpayPaymentId,
          status: 'PAID',
          paidAt: now,
          failureReason: ''
        }
      },
      { new: true, upsert: true }
    );

    // 8. Update Order payment status and ensure confirmed
    order.payment.status = 'PAID';
    order.payment.transactionId = razorpayPaymentId;
    if (order.status === 'PENDING') {
      order.status = 'CONFIRMED';
    }
    await order.save();

    // Shiprocket is NOT pushed on payment — admin pushes on "Ready for Dispatch".

    // 9. Clear customer's cart
    await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0
        }
      }
    );

    return {
      success: true,
      message: 'Payment verified and captured successfully',
      payment,
      order
    };
  }

  /**
   * Handle Razorpay Webhooks idempotently.
   */
  static async handleWebhookEvent({ rawBody, signature, eventPayload }) {
    // 1. Signature Verification
    if (env.RAZORPAY.WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature({
        rawBody,
        signature,
        webhookSecret: env.RAZORPAY.WEBHOOK_SECRET
      });
      if (!isValid) {
        const err = new Error('Invalid webhook signature');
        err.statusCode = 400;
        throw err;
      }
    }

    const event = eventPayload.event;
    const payload = eventPayload.payload;

    if (!event || !payload) {
      return { received: true, ignored: true };
    }

    // 2. Process Events
    switch (event) {
      case 'payment.captured': {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const gatewayPaymentId = paymentEntity.id;
        const gatewayOrderId = paymentEntity.order_id;

        const payment = await Payment.findOne({
          $or: [{ gatewayOrderId }, { gatewayPaymentId }]
        });

        if (payment && payment.status !== 'PAID') {
          payment.status = 'PAID';
          payment.gatewayPaymentId = gatewayPaymentId;
          payment.transactionId = gatewayPaymentId;
          payment.paidAt = new Date(paymentEntity.created_at * 1000);
          payment.metadata = { ...payment.metadata, webhookCaptured: true };
          await payment.save();

          await Order.findByIdAndUpdate(payment.order, {
            $set: {
              'payment.status': 'PAID',
              'payment.transactionId': gatewayPaymentId
            }
          });

          // Shiprocket deferred until admin "Ready for Dispatch"
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const gatewayOrderId = paymentEntity.order_id;
        const failureReason = paymentEntity.error_description || 'Payment failed at gateway';

        const payment = await Payment.findOne({ gatewayOrderId });
        if (payment && payment.status !== 'PAID') {
          payment.status = 'FAILED';
          payment.failureReason = failureReason;
          await payment.save();

          await Order.findByIdAndUpdate(payment.order, {
            $set: { 'payment.status': 'FAILED' }
          });
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) break;

        const gatewayPaymentId = refundEntity.payment_id;
        const refundAmount = (refundEntity.amount || 0) / 100;

        const payment = await Payment.findOne({ gatewayPaymentId });
        if (payment) {
          const existingRefund = payment.refunds.find(r => r.refundId === refundEntity.id);
          if (existingRefund) {
            existingRefund.status = 'PROCESSED';
          } else {
            payment.refunds.push({
              refundId: refundEntity.id,
              amount: refundAmount,
              status: 'PROCESSED',
              reason: refundEntity.notes?.reason || 'Processed via Webhook'
            });
          }

          payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
          if (payment.refundedAmount >= payment.amount) {
            payment.status = 'REFUNDED';
          } else {
            payment.status = 'PARTIALLY_REFUNDED';
          }
          await payment.save();

          await Order.findByIdAndUpdate(payment.order, {
            $set: { 'payment.status': payment.status }
          });
        }
        break;
      }

      case 'refund.failed': {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) break;

        const payment = await Payment.findOne({ gatewayPaymentId: refundEntity.payment_id });
        if (payment) {
          const existingRefund = payment.refunds.find(r => r.refundId === refundEntity.id);
          if (existingRefund) {
            existingRefund.status = 'FAILED';
            await payment.save();
          }
        }
        break;
      }

      default:
        // Ignore unhandled events safely
        break;
    }

    return { received: true, event };
  }

  /**
   * Record a Cash on Delivery (COD) payment transaction in the ledger.
   */
  static async recordCodPayment(order, userId) {
    let payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: userId,
        gateway: 'COD',
        paymentMethod: 'COD',
        amount: order.pricing.total,
        status: order.payment?.status || 'PENDING',
        transactionId: `COD_${order.orderNumber}`,
        financialBreakdown: {
          subtotal: order.pricing.subtotal,
          tax: order.pricing.tax,
          deliveryFee: order.pricing.deliveryFee,
          discount: order.pricing.discount,
          total: order.pricing.total
        }
      });
      await payment.save();
    }
    return payment;
  }

  /**
   * Initiate a refund (Admin).
   */
  static async initiateRefund(adminUserId, paymentId, { amount, reason = 'Customer request' }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const err = new Error('Payment record not found');
      err.statusCode = 404;
      throw err;
    }

    if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
      const err = new Error(`Cannot refund payment in status ${payment.status}. Payment must be PAID.`);
      err.statusCode = 400;
      throw err;
    }

    const maxRefundable = payment.amount - (payment.refundedAmount || 0);
    const refundAmount = amount ? Number(amount) : maxRefundable;

    if (refundAmount <= 0) {
      const err = new Error('Refund amount must be greater than zero.');
      err.statusCode = 400;
      throw err;
    }

    if (refundAmount > maxRefundable) {
      const err = new Error(`Refund amount exceeds max refundable balance of ₹${maxRefundable}.`);
      err.statusCode = 400;
      throw err;
    }

    // If Razorpay gateway is configured, trigger gateway refund
    if (payment.gateway === 'RAZORPAY') {
      if (!isRazorpayConfigured()) {
        const err = new Error('Payment gateway credentials not configured to process online refund.');
        err.statusCode = 503;
        throw err;
      }

      const razorpay = getRazorpayInstance();
      let gatewayRefund;
      try {
        gatewayRefund = await razorpay.payments.refund(payment.gatewayPaymentId, {
          amount: Math.round(refundAmount * 100),
          notes: { reason, initiatedBy: adminUserId.toString() }
        });
      } catch (refundErr) {
        const err = new Error(`Gateway refund failed: ${refundErr.error?.description || refundErr.message}`);
        err.statusCode = 502;
        throw err;
      }

      payment.refunds.push({
        refundId: gatewayRefund.id,
        amount: refundAmount,
        status: gatewayRefund.status === 'processed' ? 'PROCESSED' : 'PENDING',
        reason,
        initiatedBy: adminUserId
      });
    } else {
      // Manual / COD refund ledger
      payment.refunds.push({
        refundId: `RFND_MANUAL_${Date.now()}`,
        amount: refundAmount,
        status: 'PROCESSED',
        reason,
        initiatedBy: adminUserId
      });
    }

    payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
    payment.status = payment.refundedAmount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      $set: { 'payment.status': payment.status }
    });

    return payment;
  }

  /**
   * Get payments for Admin dashboard with filtering and pagination.
   */
  static async getAllPaymentsAdmin(query = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      method,
      gateway,
      search
    } = query;

    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (method && method !== 'ALL') {
      filter.paymentMethod = method;
    }
    if (gateway && gateway !== 'ALL') {
      filter.gateway = gateway;
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { transactionId: { $regex: term, $options: 'i' } },
        { gatewayOrderId: { $regex: term, $options: 'i' } },
        { gatewayPaymentId: { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [payments, totalCount] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'name phone email')
        .populate('order', 'orderNumber status pricing')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(filter)
    ]);

    // Financial KPI stats
    const statsAgg = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const stats = {
      total: totalCount,
      paidAmount: 0,
      pendingCount: 0,
      paidCount: 0,
      failedCount: 0,
      refundedCount: 0
    };

    statsAgg.forEach(s => {
      if (s._id === 'PAID') {
        stats.paidAmount += s.totalAmount;
        stats.paidCount += s.count;
      } else if (s._id === 'PENDING') {
        stats.pendingCount += s.count;
      } else if (s._id === 'FAILED') {
        stats.failedCount += s.count;
      } else if (s._id === 'REFUNDED' || s._id === 'PARTIALLY_REFUNDED') {
        stats.refundedCount += s.count;
      }
    });

    return {
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount
      },
      stats
    };
  }

  /**
   * Get single Payment record by ID (Admin).
   */
  static async getPaymentByIdAdmin(id) {
    const payment = await Payment.findById(id)
      .populate('user', 'name phone email')
      .populate('order')
      .populate('refunds.initiatedBy', 'name email');

    if (!payment) {
      const err = new Error('Payment record not found');
      err.statusCode = 404;
      throw err;
    }

    return payment;
  }

  /**
   * Get payment history for a customer's order.
   */
  static async getPaymentByOrderId(userId, orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    if (order.user.toString() !== userId.toString()) {
      const err = new Error('Unauthorized');
      err.statusCode = 403;
      throw err;
    }

    const payment = await Payment.findOne({ order: orderId }).sort({ createdAt: -1 });
    return payment;
  }
}

export default PaymentService;
