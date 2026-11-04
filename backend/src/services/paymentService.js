import crypto from 'crypto';
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

/** Money helpers: all amounts are INR rupees (2dp); the gateway works in integer paise. */
const MONEY_EPS = 0.005;
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const toPaise = (rupees) => Math.round(Number(rupees) * 100);

/** Build an Error carrying an HTTP status code (and an optional machine-readable code). */
const fail = (message, statusCode = 400, code = undefined) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
};

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

  // ---------------------------------------------------------------------------
  // Shared verification helpers (Phase 1 payment security)
  // ---------------------------------------------------------------------------

  /**
   * Append an entry to the payment's audit trail. Best effort — never throws and never stores
   * secrets, signatures or card data.
   */
  static async audit(paymentId, action, actor = 'SYSTEM', meta = {}) {
    try {
      await Payment.updateOne(
        { _id: paymentId },
        {
          $push: {
            auditTrail: { $each: [{ action, actor: String(actor), at: new Date(), meta }], $slice: -200 }
          }
        }
      );
    } catch (e) {
      console.warn('[Payment Audit] could not record', action, e.message);
    }
  }

  /**
   * Put a payment on the admin reconciliation list. Always records WHY, WHEN, and (when known) which
   * Razorpay payment caused it. Never changes the payment's money status.
   */
  static async flagReconciliation(paymentId, reason, { razorpayPaymentId = null, extra = {}, skipIfResolved = false } = {}) {
    if (skipIfResolved && razorpayPaymentId) {
      // A replayed webhook about a gateway payment that an admin already reconciled must not re-open it
      const already = await Payment.exists({
        _id: paymentId,
        'metadata.reconciledAt': { $exists: true, $ne: null },
        'metadata.reconciliationPaymentId': razorpayPaymentId
      });
      if (already) return;
    }
    const set = {
      'metadata.needsReconciliation': true,
      'metadata.reconciliationReason': String(reason || 'Flagged for review').slice(0, 400),
      'metadata.reconciliationOpenedAt': new Date(),
      ...extra
    };
    if (razorpayPaymentId) set['metadata.reconciliationPaymentId'] = razorpayPaymentId;
    await Payment.updateOne({ _id: paymentId }, { $set: set });
  }

  /**
   * Ask Razorpay (server to server) for the real payment and confirm that it is for the expected
   * Razorpay order, the exact expected amount and currency, and is captured.
   * The client's word (or signature alone) is never enough to treat money as received.
   */
  static async fetchAndValidateGatewayPayment({ razorpayPaymentId, razorpayOrderId, expectedAmount, currency = 'INR' }) {
    const razorpay = getRazorpayInstance();
    if (!razorpay) throw fail('Payment gateway client failed to initialize.', 503);

    let entity;
    try {
      entity = await razorpay.payments.fetch(razorpayPaymentId);
    } catch (e) {
      throw fail(
        `Could not confirm the payment with the gateway: ${e?.error?.description || e.message}`,
        502,
        'GATEWAY_LOOKUP_FAILED'
      );
    }

    if (!entity || entity.id !== razorpayPaymentId) {
      throw fail('Gateway returned an unexpected payment record.', 502, 'GATEWAY_LOOKUP_FAILED');
    }
    if (entity.order_id !== razorpayOrderId) {
      throw fail('This payment was not made for the given order.', 400, 'PAYMENT_ORDER_MISMATCH');
    }
    if (String(entity.currency || '').toUpperCase() !== String(currency).toUpperCase()) {
      throw fail('Payment currency does not match the order currency.', 400, 'PAYMENT_CURRENCY_MISMATCH');
    }
    if (Number(entity.amount) !== toPaise(expectedAmount)) {
      throw fail(
        `Paid amount (₹${Number(entity.amount) / 100}) does not match the payable amount (₹${round2(expectedAmount)}).`,
        400,
        'PAYMENT_AMOUNT_MISMATCH'
      );
    }

    if (entity.status === 'authorized') {
      // Authorized-but-not-captured: capture the exact expected amount, then re-check
      try {
        entity = await razorpay.payments.capture(razorpayPaymentId, toPaise(expectedAmount), currency);
      } catch (e) {
        throw fail('The payment is authorized but could not be captured yet. Please retry shortly.', 409, 'PAYMENT_NOT_CAPTURED');
      }
    }
    if (entity.status === 'failed') {
      throw fail('The payment failed at the gateway.', 402, 'PAYMENT_FAILED');
    }
    if (entity.status !== 'captured') {
      throw fail('The payment has not been completed yet.', 409, 'PAYMENT_NOT_CAPTURED');
    }
    return entity;
  }

  /**
   * Atomically link a Razorpay payment id to this Payment record. The partial unique index on
   * gatewayPaymentId makes it impossible for the same Razorpay payment to be linked to a second
   * record (i.e. to pay a second order / session).
   */
  static async bindGatewayPayment(payment, razorpayPaymentId, razorpaySignature) {
    try {
      const bound = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          $or: [
            { gatewayPaymentId: '' },
            { gatewayPaymentId: null },
            { gatewayPaymentId: { $exists: false } },
            { gatewayPaymentId: razorpayPaymentId }
          ]
        },
        {
          $set: {
            gatewayPaymentId: razorpayPaymentId,
            gatewaySignature: razorpaySignature || payment.gatewaySignature || '',
            transactionId: razorpayPaymentId
          }
        },
        { new: true }
      );
      if (!bound) {
        throw fail('This payment session is already linked to a different payment.', 409, 'PAYMENT_ALREADY_LINKED');
      }
      return bound;
    } catch (e) {
      if (e?.code === 11000) {
        throw fail('This payment has already been used for another order.', 409, 'PAYMENT_ALREADY_USED');
      }
      throw e;
    }
  }

  /**
   * Create the Auriva order for a verified prepaid checkout session.
   * Shared by the customer verify call and the payment.captured webhook; safe to run twice or
   * concurrently (order idempotency key + guarded updates).
   */
  static async fulfilPrepaidIntent(payment, { razorpayPaymentId, actor = 'SYSTEM' }) {
    const intent = payment.metadata?.checkoutIntent;
    const idempotencyKey = `paid_${razorpayPaymentId}`;
    const { placeOrder } = await import('./orderService.js');

    let order;
    try {
      order = await placeOrder(payment.user, {
        addressId: intent.addressId,
        paymentMethod: intent.paymentMethod || payment.paymentMethod || 'UPI',
        paymentStatus: 'PAID',
        paymentDetails: { transactionId: razorpayPaymentId, upiApp: '' },
        couponCode: intent.couponCode || null,
        guestId: intent.guestId || null,
        items: intent.items || null,
        idempotencyKey,
        // Server-verified payment: the order total MUST equal what was actually paid
        trustedPayment: true,
        expectedTotal: payment.amount
      });
    } catch (placeErr) {
      // A concurrent request (verify vs webhook) may already have created the order
      const existing = await Order.findOne({ idempotencyKey, user: payment.user });
      if (existing) {
        order = existing;
      } else {
        await Payment.updateOne(
          { _id: payment._id },
          {
            $set: {
              status: 'PAID',
              paidAt: payment.paidAt || new Date(),
              'metadata.needsReconciliation': true,
              'metadata.reconciliationReason': `Payment received but the order could not be created: ${placeErr.message || 'unknown error'}`.slice(0, 400),
              'metadata.reconciliationOpenedAt': new Date(),
              'metadata.reconciliationPaymentId': razorpayPaymentId,
              'metadata.fulfillmentError': placeErr.message || 'placeOrder failed after valid payment',
              'metadata.fulfillmentErrorCode': placeErr.code || ''
            }
          }
        );
        await PaymentService.audit(payment._id, 'ORDER_PLACEMENT_FAILED_AFTER_PAYMENT', actor, {
          code: placeErr.code || null,
          message: placeErr.message
        });
        const err = new Error(
          placeErr.message ||
            'Payment succeeded but the order could not be created. Our team will reconcile shortly.'
        );
        err.statusCode = placeErr.statusCode || 500;
        err.code = placeErr.code;
        throw err;
      }
    }

    // Idempotent finalisation
    await Payment.updateOne(
      { _id: payment._id, order: null },
      { $set: { order: order._id, 'metadata.fulfillmentError': '' } }
    );
    // If this payment had been flagged, record that the system resolved it (unflagged payments are untouched)
    await Payment.updateOne(
      { _id: payment._id, 'metadata.needsReconciliation': true },
      {
        $set: {
          'metadata.needsReconciliation': false,
          'metadata.reconciledAt': new Date(),
          'metadata.reconciledBy': 'SYSTEM',
          'metadata.reconciliationNote': 'Order created after the payment was confirmed'
        }
      }
    );
    await Payment.updateOne(
      { _id: payment._id, status: { $in: ['PENDING', 'FAILED'] } },
      { $set: { status: 'PAID', paidAt: payment.paidAt || new Date(), failureReason: '' } }
    );
    await Order.updateOne(
      { _id: order._id, 'payment.status': { $in: ['PENDING', 'FAILED', 'AUTHORIZED'] } },
      { $set: { 'payment.status': 'PAID', 'payment.transactionId': razorpayPaymentId } }
    );
    await PaymentService.audit(payment._id, 'PAYMENT_VERIFIED_ORDER_PLACED', actor, {
      orderId: String(order._id),
      razorpayPaymentId
    });

    return {
      order: await Order.findById(order._id),
      payment: await Payment.findById(payment._id)
    };
  }

  /**
   * After Razorpay success: verify signature + gateway payment, THEN create Auriva order (prepaid only).
   */
  static async verifyAndPlacePrepaidOrder(
    userId,
    { razorpayOrderId, razorpayPaymentId, razorpaySignature }
  ) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw fail('Missing Razorpay payment details for verification.', 400);
    }
    if (!env.RAZORPAY.KEY_SECRET) {
      throw fail('Payment verification unavailable: Gateway secret not configured.', 503);
    }

    // The session must exist, belong to this customer, and have been created by us
    const payment = await Payment.findOne({
      gatewayOrderId: razorpayOrderId,
      user: userId,
      gateway: 'RAZORPAY'
    });
    if (!payment) throw fail('Payment session not found. Please restart checkout.', 404);

    // 1. Cryptographic signature (does not alter any state when it fails)
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });
    if (!isValidSignature) {
      await PaymentService.audit(payment._id, 'VERIFY_REJECTED_BAD_SIGNATURE', userId, { razorpayPaymentId });
      throw fail('Invalid payment signature. Payment verification failed.', 400, 'INVALID_SIGNATURE');
    }

    // 2. Idempotent replay of a completed session
    if (payment.status === 'PAID' && payment.order) {
      if (payment.gatewayPaymentId && payment.gatewayPaymentId !== razorpayPaymentId) {
        throw fail('This payment session was already completed with a different payment.', 409, 'PAYMENT_ALREADY_LINKED');
      }
      const order = await Order.findById(payment.order);
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Payment already verified and order created.',
        order,
        payment
      };
    }

    if (!payment.metadata?.checkoutIntent?.addressId) {
      throw fail('Checkout session is incomplete. Please restart payment.', 400);
    }

    // 3. Confirm with the gateway: right order, exact amount + currency, captured
    try {
      await PaymentService.fetchAndValidateGatewayPayment({
        razorpayPaymentId,
        razorpayOrderId,
        expectedAmount: payment.amount,
        currency: payment.currency || 'INR'
      });
    } catch (e) {
      await PaymentService.audit(payment._id, 'VERIFY_REJECTED', userId, {
        code: e.code || null,
        message: e.message,
        razorpayPaymentId
      });
      if (['PAYMENT_AMOUNT_MISMATCH', 'PAYMENT_CURRENCY_MISMATCH', 'PAYMENT_ORDER_MISMATCH'].includes(e.code)) {
        await PaymentService.flagReconciliation(payment._id, e.message, { razorpayPaymentId });
      }
      throw e;
    }

    // 4. Link this exact gateway payment to this session (unique — cannot be reused elsewhere)
    const bound = await PaymentService.bindGatewayPayment(payment, razorpayPaymentId, razorpaySignature);

    // 5. Create the order (amount re-checked against the paid amount inside placeOrder)
    const { order, payment: finalPayment } = await PaymentService.fulfilPrepaidIntent(bound, {
      razorpayPaymentId,
      actor: userId
    });

    return {
      success: true,
      message: 'Payment verified and order placed successfully',
      order,
      payment: finalPayment
    };
  }

  /**
   * Verify Razorpay Payment Signature and finalize payment for an EXISTING order (retry-payment flow).
   * Idempotent, bound to the Razorpay order created for this exact order, amount-checked.
   */
  static async verifyPayment(userId, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw fail('Missing Razorpay payment details for verification.', 400);
    }

    // 1. Locate order + ownership
    const query = mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
    const order = await Order.findOne(query);
    if (!order) throw fail('Order not found', 404);
    if (order.user.toString() !== userId.toString()) {
      throw fail('Unauthorized: You do not have access to this order', 403);
    }
    if (order.status === 'CANCELLED') throw fail('Cannot pay for a cancelled order.', 400);

    if (!env.RAZORPAY.KEY_SECRET) {
      throw fail('Payment verification unavailable: Gateway secret not configured.', 503);
    }

    // 2. The Razorpay order must be the one WE created for THIS order (payment-to-order mapping)
    const payment = await Payment.findOne({
      order: order._id,
      user: userId,
      gateway: 'RAZORPAY',
      gatewayOrderId: razorpayOrderId
    });
    if (!payment) {
      throw fail('This payment was not created for this order.', 400, 'PAYMENT_ORDER_MISMATCH');
    }

    // 3. Cryptographic signature (no state change on failure)
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });
    if (!isValidSignature) {
      await PaymentService.audit(payment._id, 'VERIFY_REJECTED_BAD_SIGNATURE', userId, { razorpayPaymentId });
      throw fail('Invalid payment signature. Payment verification failed.', 400, 'INVALID_SIGNATURE');
    }

    // 4. Idempotent replay
    if (payment.status === 'PAID') {
      if (payment.gatewayPaymentId && payment.gatewayPaymentId !== razorpayPaymentId) {
        throw fail('This order was already paid with a different payment.', 409, 'PAYMENT_ALREADY_LINKED');
      }
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Payment has already been successfully verified and processed.',
        order,
        payment
      };
    }

    // 5. Trusted amount: the order total, which must equal what the payment session was created for
    const payable = order.pricing?.total;
    if (typeof payable !== 'number' || payable <= 0 || Math.abs(payable - payment.amount) > 0.005) {
      await PaymentService.audit(payment._id, 'VERIFY_REJECTED_AMOUNT', userId, { payable, sessionAmount: payment.amount });
      throw fail('Payment session amount does not match the order total.', 400, 'PAYMENT_AMOUNT_MISMATCH');
    }

    // 6. Confirm with the gateway
    try {
      await PaymentService.fetchAndValidateGatewayPayment({
        razorpayPaymentId,
        razorpayOrderId,
        expectedAmount: payable,
        currency: payment.currency || 'INR'
      });
    } catch (e) {
      await PaymentService.audit(payment._id, 'VERIFY_REJECTED', userId, {
        code: e.code || null,
        message: e.message,
        razorpayPaymentId
      });
      if (['PAYMENT_AMOUNT_MISMATCH', 'PAYMENT_CURRENCY_MISMATCH', 'PAYMENT_ORDER_MISMATCH'].includes(e.code)) {
        await PaymentService.flagReconciliation(payment._id, e.message, { razorpayPaymentId });
      }
      throw e;
    }

    // 7. Link the gateway payment (unique) and atomically flip to PAID exactly once
    await PaymentService.bindGatewayPayment(payment, razorpayPaymentId, razorpaySignature);
    const paid = await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $in: ['PENDING', 'FAILED'] } },
      { $set: { status: 'PAID', paidAt: new Date(), failureReason: '' } },
      { new: true }
    );
    if (!paid) {
      const current = await Payment.findById(payment._id);
      if (current?.status === 'PAID' && current.gatewayPaymentId === razorpayPaymentId) {
        return {
          success: true,
          alreadyProcessed: true,
          message: 'Payment has already been successfully verified and processed.',
          order: await Order.findById(order._id),
          payment: current
        };
      }
      throw fail('Payment could not be finalised. Please contact support.', 409, 'PAYMENT_STATE_CONFLICT');
    }

    // 8. Order becomes PAID only now
    await Order.updateOne(
      { _id: order._id, 'payment.status': { $in: ['PENDING', 'FAILED', 'AUTHORIZED'] } },
      { $set: { 'payment.status': 'PAID', 'payment.transactionId': razorpayPaymentId } }
    );
    await Order.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'CONFIRMED' } });
    await PaymentService.audit(payment._id, 'PAYMENT_VERIFIED', userId, { orderId: String(order._id), razorpayPaymentId });

    // Shiprocket is NOT pushed on payment — admin pushes on "Ready for Dispatch".

    // 9. Clear customer's cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], subtotal: 0, discount: 0, total: 0 } }
    );

    return {
      success: true,
      message: 'Payment verified and captured successfully',
      payment: paid,
      order: await Order.findById(order._id)
    };
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------

  /**
   * Handle Razorpay Webhooks. Signature is ALWAYS verified over the raw body (fails closed when no
   * secret is configured). Every state change is a guarded atomic update, so duplicate / concurrent /
   * out-of-order deliveries cannot create duplicate payments, orders, refunds or ledger entries.
   */
  static async handleWebhookEvent({ rawBody, signature, eventPayload, eventId = null }) {
    if (!env.RAZORPAY.WEBHOOK_SECRET) {
      throw fail('Webhook secret not configured on server', 503);
    }
    const isValid = verifyWebhookSignature({
      rawBody,
      signature,
      webhookSecret: env.RAZORPAY.WEBHOOK_SECRET
    });
    if (!isValid) throw fail('Invalid webhook signature', 400);

    const event = eventPayload?.event;
    const payload = eventPayload?.payload;
    if (!event || !payload) return { received: true, ignored: true };

    switch (event) {
      case 'payment.captured':
        await PaymentService.onPaymentCaptured(payload.payment?.entity, eventId);
        break;
      case 'payment.failed':
        await PaymentService.onPaymentFailed(payload.payment?.entity, eventId);
        break;
      case 'refund.processed':
        await PaymentService.onRefundProcessed(payload.refund?.entity, eventId);
        break;
      case 'refund.failed':
        await PaymentService.onRefundFailed(payload.refund?.entity, eventId);
        break;
      default:
        // Ignore unhandled events safely
        break;
    }

    return { received: true, event };
  }

  static async onPaymentCaptured(entity, eventId) {
    if (!entity?.id || !entity.order_id) return;

    const payment = await Payment.findOne({ gatewayOrderId: entity.order_id });
    if (!payment) {
      console.warn('[Webhook] payment.captured for unknown gateway order — ignored');
      return;
    }

    // Never trust even a signed event blindly: it must match what we asked the customer to pay
    const problems = [];
    if (String(entity.currency || 'INR').toUpperCase() !== String(payment.currency || 'INR').toUpperCase()) problems.push('currency');
    if (Number(entity.amount) !== toPaise(payment.amount)) problems.push('amount');
    if (entity.status && entity.status !== 'captured') problems.push('status');
    if (problems.length) {
      await PaymentService.flagReconciliation(
        payment._id,
        `Gateway reported a payment that does not match what was requested (${problems.join(', ')})`,
        { razorpayPaymentId: entity.id, skipIfResolved: true }
      );
      await PaymentService.audit(payment._id, 'WEBHOOK_CAPTURE_REJECTED', 'WEBHOOK', { problems, eventId });
      return;
    }

    // A second, different payment against an already-settled session = customer paid twice → flag
    if (payment.gatewayPaymentId && payment.gatewayPaymentId !== entity.id) {
      // Replay of an extra payment we already recorded: nothing new to report
      if ((payment.metadata?.duplicatePaymentIds || []).includes(entity.id)) return;
      await Payment.updateOne({ _id: payment._id }, { $addToSet: { 'metadata.duplicatePaymentIds': entity.id } });
      await PaymentService.flagReconciliation(
        payment._id,
        `Customer paid twice: a second payment (${entity.id}) arrived for an already-paid checkout. The extra payment needs to be refunded.`,
        { razorpayPaymentId: entity.id }
      );
      await PaymentService.audit(payment._id, 'WEBHOOK_DUPLICATE_PAYMENT', 'WEBHOOK', { razorpayPaymentId: entity.id, eventId });
      return;
    }

    let claimed;
    try {
      claimed = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          status: { $in: ['PENDING', 'FAILED'] },
          $or: [{ gatewayPaymentId: '' }, { gatewayPaymentId: null }, { gatewayPaymentId: entity.id }]
        },
        {
          $set: {
            status: 'PAID',
            gatewayPaymentId: entity.id,
            transactionId: entity.id,
            paidAt: entity.created_at ? new Date(entity.created_at * 1000) : new Date(),
            failureReason: '',
            'metadata.webhookCaptured': true
          }
        },
        { new: true }
      );
    } catch (e) {
      if (e?.code === 11000) {
        await PaymentService.flagReconciliation(
          payment._id,
          'The gateway payment id on this event is already linked to another payment record.',
          { razorpayPaymentId: entity.id }
        );
        await PaymentService.audit(payment._id, 'WEBHOOK_PAYMENT_ALREADY_USED', 'WEBHOOK', { razorpayPaymentId: entity.id, eventId });
        return;
      }
      throw e;
    }

    // Already PAID (customer verify call or an earlier delivery of this event): nothing to do
    if (!claimed) return;

    await PaymentService.audit(claimed._id, 'PAYMENT_CAPTURED_WEBHOOK', 'WEBHOOK', { razorpayPaymentId: entity.id, eventId });

    if (claimed.order) {
      const updated = await Order.findOneAndUpdate(
        { _id: claimed.order, 'payment.status': { $in: ['PENDING', 'FAILED', 'AUTHORIZED'] } },
        { $set: { 'payment.status': 'PAID', 'payment.transactionId': entity.id } },
        { new: true }
      );
      const orderDoc = updated || (await Order.findById(claimed.order));
      // Paid for an order that was cancelled in the meantime → money must go back
      if (orderDoc?.status === 'CANCELLED') {
        await PaymentService.refundForCancelledOrder(orderDoc).catch((e) =>
          console.error('[Webhook] refund for cancelled order failed:', e.message)
        );
      }
    } else if (claimed.metadata?.checkoutIntent?.addressId) {
      // Prepaid-before-order: customer paid but closed the tab before /verify — create the order now
      try {
        await PaymentService.fulfilPrepaidIntent(claimed, { razorpayPaymentId: entity.id, actor: 'WEBHOOK' });
      } catch (fulfillErr) {
        console.error('[Webhook] payment.captured order fulfillment failed:', fulfillErr.message);
      }
    }
  }

  static async onPaymentFailed(entity, eventId) {
    if (!entity?.order_id) return;
    // Only PENDING sessions can fail; a PAID payment is never downgraded by a (late / replayed) failure event
    const payment = await Payment.findOneAndUpdate(
      { gatewayOrderId: entity.order_id, status: 'PENDING' },
      { $set: { status: 'FAILED', failureReason: entity.error_description || 'Payment failed at gateway' } },
      { new: true }
    );
    if (!payment) return;
    await PaymentService.audit(payment._id, 'PAYMENT_FAILED_WEBHOOK', 'WEBHOOK', { eventId });
    if (payment.order) {
      await Order.updateOne(
        { _id: payment.order, 'payment.status': 'PENDING' },
        { $set: { 'payment.status': 'FAILED' } }
      );
    }
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
        // Wallet money already collected is not due on delivery
        amount: Math.max(0, order.pricing.total - (order.pricing.walletApplied || 0)),
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

  // ---------------------------------------------------------------------------
  // Refund engine
  //
  //   refundedAmount       = money the gateway CONFIRMED as refunded (sum of PROCESSED rows)
  //   refundPendingAmount  = money reserved by refunds still in flight (sum of PENDING rows)
  //   invariant: refundedAmount + refundPendingAmount <= amount   (enforced inside the reserving update)
  //
  // Every transition is a single guarded atomic update, so concurrent requests and repeated webhook
  // deliveries can never double-count or over-refund. (No multi-document transaction is needed:
  // each payment's refund state lives in ONE document.)
  // ---------------------------------------------------------------------------

  static get REFUNDABLE_STATUSES() {
    return ['PAID', 'PARTIALLY_REFUNDED', 'REFUND_PENDING'];
  }

  /** Re-derive payment.status (and the order's payment status) from the refund counters, atomically. */
  static async syncRefundState(paymentId) {
    const updated = await Payment.findOneAndUpdate(
      { _id: paymentId, status: { $in: [...PaymentService.REFUNDABLE_STATUSES, 'REFUNDED'] } },
      [
        {
          $set: {
            status: {
              $switch: {
                branches: [
                  {
                    case: { $gte: [{ $ifNull: ['$refundedAmount', 0] }, { $subtract: ['$amount', 0.005] }] },
                    then: 'REFUNDED'
                  },
                  { case: { $gt: [{ $ifNull: ['$refundedAmount', 0] }, 0] }, then: 'PARTIALLY_REFUNDED' },
                  { case: { $gt: [{ $ifNull: ['$refundPendingAmount', 0] }, 0.0001] }, then: 'REFUND_PENDING' }
                ],
                default: 'PAID'
              }
            }
          }
        }
      ],
      { new: true }
    );
    if (updated?.order) {
      await Order.updateOne({ _id: updated.order }, { $set: { 'payment.status': updated.status } });
    }
    if (updated?.status === 'REFUNDED' && updated.metadata?.refundRequired === true) {
      await Payment.updateOne({ _id: updated._id }, { $set: { 'metadata.refundRequired': false } });
    }
    return updated;
  }

  /** PENDING -> PROCESSED, exactly once (the filter requires the row to still be PENDING). */
  static async markRefundProcessed(paymentId, row, gatewayRefundId = '') {
    const res = await Payment.findOneAndUpdate(
      { _id: paymentId, refunds: { $elemMatch: { _id: row._id, status: 'PENDING' } } },
      {
        $set: {
          'refunds.$.status': 'PROCESSED',
          'refunds.$.refundId': gatewayRefundId || row.refundId || '',
          'refunds.$.processedAt': new Date()
        },
        $inc: { refundPendingAmount: -row.amount, refundedAmount: row.amount }
      },
      { new: true }
    );
    return Boolean(res);
  }

  /** PENDING -> FAILED, exactly once; releases the reserved amount. */
  static async markRefundFailed(paymentId, row, reason = '') {
    const res = await Payment.findOneAndUpdate(
      { _id: paymentId, refunds: { $elemMatch: { _id: row._id, status: 'PENDING' } } },
      {
        $set: {
          'refunds.$.status': 'FAILED',
          'refunds.$.failureReason': String(reason).slice(0, 300)
        },
        $inc: { refundPendingAmount: -row.amount }
      },
      { new: true }
    );
    return Boolean(res);
  }

  /**
   * Core refund routine used by admin refunds and by cancellation of paid orders.
   *  - validates the payment and the refundable balance,
   *  - atomically reserves the amount (so concurrent / duplicate requests cannot over-refund),
   *  - calls the gateway (online) or records the manual refund,
   *  - never reports a gateway refund as completed until the gateway says so.
   */
  static async executeRefund({ paymentId, amount, reason, requestKey, actor, initiatedBy = undefined }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw fail('Payment record not found', 404);

    // Idempotent replay: this exact request was already recorded (double click / network retry / racing request).
    // Answered before any balance check, because the first request may already have reserved the whole balance.
    const alreadyRecorded = payment.refunds.find((r) => r.requestKey && r.requestKey === requestKey);
    if (alreadyRecorded) return { payment, refund: alreadyRecorded, duplicate: true };

    if (!PaymentService.REFUNDABLE_STATUSES.includes(payment.status)) {
      throw fail(`Cannot refund payment in status ${payment.status}. Payment must be PAID.`, 400);
    }

    const isGateway = payment.gateway === 'RAZORPAY';
    if (isGateway) {
      if (!payment.gatewayPaymentId) throw fail('This payment has no captured gateway payment to refund.', 400);
      if (!isRazorpayConfigured()) throw fail('Payment gateway credentials not configured to process online refund.', 503);
    }

    const remaining = round2(payment.amount - (payment.refundedAmount || 0) - (payment.refundPendingAmount || 0));
    const refundAmount = amount === undefined || amount === null ? remaining : round2(Number(amount));
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      throw fail(remaining <= 0 ? 'Nothing left to refund for this payment.' : 'Refund amount must be greater than zero.', 400);
    }
    if (refundAmount > remaining + MONEY_EPS) {
      throw fail(`Refund amount exceeds max refundable balance of ₹${remaining}.`, 400, 'REFUND_EXCEEDS_BALANCE');
    }

    // Atomic reservation. Also rejects: the same request key twice, and an identical refund still in flight.
    const reserved = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        status: { $in: PaymentService.REFUNDABLE_STATUSES },
        'refunds.requestKey': { $ne: requestKey },
        refunds: { $not: { $elemMatch: { status: 'PENDING', amount: refundAmount } } },
        $expr: {
          $lte: [
            {
              $add: [
                { $ifNull: ['$refundedAmount', 0] },
                { $ifNull: ['$refundPendingAmount', 0] },
                refundAmount
              ]
            },
            { $add: ['$amount', MONEY_EPS] }
          ]
        }
      },
      {
        $inc: { refundPendingAmount: refundAmount },
        $push: {
          refunds: {
            requestKey,
            amount: refundAmount,
            status: 'PENDING',
            reason: String(reason || '').slice(0, 300),
            ...(initiatedBy ? { initiatedBy } : {})
          }
        }
      },
      { new: true }
    );

    if (!reserved) {
      const current = await Payment.findById(paymentId);
      const sameRequest = current?.refunds?.find((r) => r.requestKey === requestKey);
      if (sameRequest) {
        // Idempotent replay of the very same request: return what already happened
        return { payment: current, refund: sameRequest, duplicate: true };
      }
      if (current?.refunds?.some((r) => r.status === 'PENDING' && Math.abs(r.amount - refundAmount) < MONEY_EPS)) {
        throw fail('An identical refund is already in progress for this payment.', 409, 'REFUND_IN_PROGRESS');
      }
      throw fail(
        'Refund amount exceeds the remaining refundable balance (another refund may be in progress).',
        409,
        'REFUND_BALANCE_EXCEEDED'
      );
    }

    const row = reserved.refunds.find((r) => r.requestKey === requestKey);
    await PaymentService.audit(paymentId, 'REFUND_INITIATED', actor, { amount: refundAmount, requestKey, reason });

    if (isGateway) {
      let gatewayRefund;
      try {
        gatewayRefund = await getRazorpayInstance().payments.refund(payment.gatewayPaymentId, {
          amount: toPaise(refundAmount),
          speed: 'normal',
          receipt: String(requestKey).slice(0, 40),
          notes: { requestKey: String(requestKey).slice(0, 100), reason: String(reason || '').slice(0, 200) }
        });
      } catch (refundErr) {
        const message = refundErr?.error?.description || refundErr.message;
        await PaymentService.markRefundFailed(paymentId, row, message);
        await PaymentService.syncRefundState(paymentId);
        await PaymentService.audit(paymentId, 'REFUND_GATEWAY_REJECTED', actor, { requestKey, message });
        throw fail(`Gateway refund failed: ${message}`, 502, 'GATEWAY_REFUND_FAILED');
      }

      // Remember the gateway's refund id; only mark PROCESSED if the gateway already says so
      await Payment.updateOne(
        { _id: paymentId, 'refunds._id': row._id },
        { $set: { 'refunds.$.refundId': gatewayRefund?.id || '' } }
      );
      if (gatewayRefund?.status === 'processed') {
        await PaymentService.markRefundProcessed(paymentId, row, gatewayRefund.id);
        await PaymentService.audit(paymentId, 'REFUND_PROCESSED', actor, { refundId: gatewayRefund.id });
      }
    } else {
      // Manual / COD ledger refund — completed immediately
      await PaymentService.markRefundProcessed(paymentId, row, `RFND_MANUAL_${row._id}`);
      await PaymentService.audit(paymentId, 'REFUND_PROCESSED', actor, { manual: true });
    }

    await PaymentService.syncRefundState(paymentId);
    const fresh = await Payment.findById(paymentId);
    return { payment: fresh, refund: fresh.refunds.find((r) => r.requestKey === requestKey), duplicate: false };
  }

  /**
   * Initiate a refund (Admin).
   * Optional `idempotencyKey` makes a retried request (double click, network retry) harmless.
   */
  static async initiateRefund(adminUserId, paymentId, { amount, reason = 'Customer request', idempotencyKey = null } = {}) {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) throw fail('Invalid payment id', 400);
    // <= 40 chars: it is also sent to Razorpay as the refund `receipt` (40 char limit) used to match webhooks
    const requestKey = String(idempotencyKey || `admin:${crypto.randomBytes(8).toString('hex')}`).slice(0, 40);
    const result = await PaymentService.executeRefund({
      paymentId,
      amount,
      reason,
      requestKey,
      actor: `ADMIN:${adminUserId}`,
      initiatedBy: adminUserId
    });
    return result.payment;
  }

  /**
   * Cancelling an order whose online payment was captured must start the refund workflow.
   * - COD / unpaid / wallet-only orders have no captured gateway payment => nothing to refund.
   * - One refund per cancelled order (request key), so retries and double cancels cannot duplicate it.
   * - Never throws: a gateway failure flags the payment `refundRequired` for an admin to retry.
   */
  static async refundForCancelledOrder(order) {
    if (!order?._id) return null;

    const payment = await Payment.findOne({
      order: order._id,
      gateway: 'RAZORPAY',
      status: { $in: PaymentService.REFUNDABLE_STATUSES },
      gatewayPaymentId: { $gt: '' }
    });
    if (!payment) return null;

    const remaining = round2(payment.amount - (payment.refundedAmount || 0) - (payment.refundPendingAmount || 0));
    if (remaining <= 0) return null;

    try {
      const result = await PaymentService.executeRefund({
        paymentId: payment._id,
        amount: remaining,
        reason: `Order #${order.orderNumber} cancelled`,
        requestKey: `cancel:${order._id}`,
        actor: 'SYSTEM:ORDER_CANCELLATION'
      });
      await Payment.updateOne({ _id: payment._id }, { $set: { 'metadata.refundRequired': false } });
      return result;
    } catch (e) {
      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            'metadata.refundRequired': true,
            'metadata.refundRequiredAt': new Date(),
            'metadata.refundError': String(e.message).slice(0, 300)
          }
        }
      );
      await PaymentService.audit(payment._id, 'CANCEL_REFUND_FAILED', 'SYSTEM:ORDER_CANCELLATION', {
        code: e.code || null,
        message: e.message
      });
      console.error(`[Refund] Could not start refund for cancelled order ${order.orderNumber}: ${e.message}`);
      return { error: e.message };
    }
  }

  /** Locate our refund row for a gateway refund entity (by gateway id, or by our request key). */
  static findRefundRow(payment, entity) {
    const requestKey = entity?.notes?.requestKey || entity?.receipt || '';
    return (
      payment.refunds.find((r) => r.refundId && r.refundId === entity.id) ||
      (requestKey ? payment.refunds.find((r) => r.requestKey === requestKey) : undefined)
    );
  }

  static async onRefundProcessed(entity, eventId) {
    if (!entity?.id || !entity.payment_id) return;
    const payment = await Payment.findOne({ gatewayPaymentId: entity.payment_id });
    if (!payment) return;

    const amount = round2(Number(entity.amount || 0) / 100);
    const row = PaymentService.findRefundRow(payment, entity);

    if (row) {
      if (row.status === 'PROCESSED') return; // duplicate delivery — already counted exactly once
      if (row.status === 'PENDING') {
        await PaymentService.markRefundProcessed(payment._id, row, entity.id);
      } else if (row.status === 'FAILED') {
        // We recorded a failure (e.g. network timeout) but the gateway actually refunded: revive, within the cap
        const revived = await Payment.findOneAndUpdate(
          {
            _id: payment._id,
            refunds: { $elemMatch: { _id: row._id, status: 'FAILED' } },
            $expr: {
              $lte: [
                { $add: [{ $ifNull: ['$refundedAmount', 0] }, { $ifNull: ['$refundPendingAmount', 0] }, row.amount] },
                { $add: ['$amount', MONEY_EPS] }
              ]
            }
          },
          {
            $set: {
              'refunds.$.status': 'PROCESSED',
              'refunds.$.refundId': entity.id,
              'refunds.$.processedAt': new Date(),
              'refunds.$.failureReason': ''
            },
            $inc: { refundedAmount: row.amount }
          },
          { new: true }
        );
        if (!revived) {
          await PaymentService.flagReconciliation(
            payment._id,
            `Gateway confirmed a refund (${entity.id}) that could not be applied: it would exceed the amount captured.`
          );
        }
      }
    } else {
      // Refund created outside our system (e.g. Razorpay dashboard): record it ONCE, within the cap
      const recorded = await Payment.findOneAndUpdate(
        {
          _id: payment._id,
          'refunds.refundId': { $ne: entity.id },
          $expr: {
            $lte: [
              { $add: [{ $ifNull: ['$refundedAmount', 0] }, { $ifNull: ['$refundPendingAmount', 0] }, amount] },
              { $add: ['$amount', MONEY_EPS] }
            ]
          }
        },
        {
          $push: {
            refunds: {
              refundId: entity.id,
              amount,
              status: 'PROCESSED',
              reason: 'Refund processed at gateway (not initiated from Auriva)',
              processedAt: new Date()
            }
          },
          $inc: { refundedAmount: amount }
        },
        { new: true }
      );
      if (!recorded) {
        const again = await Payment.findById(payment._id);
        if (!again.refunds.some((r) => r.refundId === entity.id)) {
          await PaymentService.flagReconciliation(
            payment._id,
            `Gateway reports a refund (${entity.id}) of ₹${amount} made outside Auriva that would exceed the amount captured. Check the Razorpay dashboard.`
          );
        }
      }
    }

    await PaymentService.syncRefundState(payment._id);
    await PaymentService.audit(payment._id, 'REFUND_PROCESSED_WEBHOOK', 'WEBHOOK', { refundId: entity.id, eventId });
  }

  static async onRefundFailed(entity, eventId) {
    if (!entity?.id || !entity.payment_id) return;
    const payment = await Payment.findOne({ gatewayPaymentId: entity.payment_id });
    if (!payment) return;

    const row = PaymentService.findRefundRow(payment, entity);
    if (!row) return; // a failed refund we never recorded changes no balances
    if (row.status !== 'PENDING') return; // PROCESSED stays processed; FAILED already released

    const released = await PaymentService.markRefundFailed(
      payment._id,
      row,
      entity.error_description || 'Refund failed at gateway'
    );
    if (released) {
      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            'metadata.refundRequired': true,
            'metadata.refundRequiredAt': new Date(),
            'metadata.refundError': String(entity.error_description || 'Refund failed at gateway').slice(0, 300)
          }
        }
      );
      await PaymentService.syncRefundState(payment._id);
      await PaymentService.audit(payment._id, 'REFUND_FAILED_WEBHOOK', 'WEBHOOK', { refundId: entity.id, eventId });
    }
  }

  // ---------------------------------------------------------------------------
  // Admin: payment list, reconciliation and refund-retry management
  // ---------------------------------------------------------------------------

  static get ADMIN_VIEWS() {
    return ['all', 'needs_reconciliation', 'reconciled', 'failed', 'refund_required'];
  }

  /** Mongo filter for one of the admin screen's views */
  static adminViewFilter(view) {
    switch (view) {
      case 'needs_reconciliation':
        return { 'metadata.needsReconciliation': true };
      case 'reconciled':
        return { 'metadata.reconciledAt': { $exists: true, $ne: null }, 'metadata.needsReconciliation': { $ne: true } };
      case 'failed':
        return { status: 'FAILED' };
      case 'refund_required':
        return { 'metadata.refundRequired': true };
      default:
        return {};
    }
  }

  /** Add the derived reconciliation / refund-retry facts the admin screen needs. Read-only. */
  static serializeForAdmin(p) {
    const meta = p.metadata || {};
    const refunds = Array.isArray(p.refunds) ? p.refunds : [];
    const refunded = round2(p.refundedAmount || 0);
    const pending = round2(p.refundPendingAmount || 0);
    const remaining = Math.max(0, round2((p.amount || 0) - refunded - pending));
    const failedRows = refunds.filter((r) => r.status === 'FAILED');
    const lastFailed = failedRows[failedRows.length - 1];
    const inProgress = pending > 0 || refunds.some((r) => r.status === 'PENDING');
    const flagged = meta.needsReconciliation === true;
    const refundRequired = meta.refundRequired === true;

    return {
      ...p,
      razorpayPaymentId: p.gatewayPaymentId || meta.reconciliationPaymentId || '',
      reconciliation: {
        needsReconciliation: flagged,
        status: flagged ? 'OPEN' : meta.reconciledAt ? 'RESOLVED' : 'NONE',
        reason: meta.reconciliationReason || meta.fulfillmentError || (flagged ? 'Flagged for review' : ''),
        openedAt: meta.reconciliationOpenedAt || null,
        reconciledAt: meta.reconciledAt || null,
        reconciledBy: meta.reconciledBy || null,
        note: meta.reconciliationNote || ''
      },
      refundRetry: {
        required: refundRequired,
        canRetry: refundRequired && remaining > 0 && !inProgress,
        inProgress,
        retryAmount: lastFailed ? Math.min(round2(lastFailed.amount), remaining) : remaining,
        remainingRefundable: remaining,
        failureReason: (lastFailed && lastFailed.failureReason) || meta.refundError || '',
        requiredAt: meta.refundRequiredAt || null,
        lastRetriedAt: meta.refundRetriedAt || null,
        lastRetriedBy: meta.refundRetriedBy || null
      }
    };
  }

  /**
   * Get payments for the Admin screen with filtering and pagination.
   * `view`: all | needs_reconciliation | reconciled | failed | refund_required
   */
  static async getAllPaymentsAdmin(query = {}) {
    const { page = 1, limit = 20, status, method, gateway, search, view = 'all' } = query;

    const viewKey = String(view || 'all').toLowerCase();
    if (!PaymentService.ADMIN_VIEWS.includes(viewKey)) {
      throw fail(`Unknown view "${view}". Use one of: ${PaymentService.ADMIN_VIEWS.join(', ')}.`, 400);
    }

    const filter = { ...PaymentService.adminViewFilter(viewKey) };
    if (status && status !== 'ALL') {
      // an explicit status narrows the view (the "failed" view already fixes status = FAILED)
      if (filter.status && filter.status !== status) filter.status = { $in: [] };
      else filter.status = status;
    }
    if (method && method !== 'ALL') filter.paymentMethod = method;
    if (gateway && gateway !== 'ALL') filter.gateway = gateway;

    if (search && String(search).trim()) {
      // escape: the search box is plain text, never a regular expression
      const term = String(search).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { transactionId: { $regex: term, $options: 'i' } },
        { gatewayOrderId: { $regex: term, $options: 'i' } },
        { gatewayPaymentId: { $regex: term, $options: 'i' } },
        { 'metadata.reconciliationPaymentId': { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [payments, totalCount] = await Promise.all([
      Payment.find(filter)
        .select('-gatewaySignature -auditTrail')
        .populate('user', 'name phone email')
        .populate('order', 'orderNumber status pricing')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(filter)
    ]);

    // Financial KPI stats (whole collection, independent of the current filter)
    const [statsAgg, needsReconciliationCount, refundRequiredCount, reconciledCount] = await Promise.all([
      Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }]),
      Payment.countDocuments(PaymentService.adminViewFilter('needs_reconciliation')),
      Payment.countDocuments(PaymentService.adminViewFilter('refund_required')),
      Payment.countDocuments(PaymentService.adminViewFilter('reconciled'))
    ]);

    const stats = {
      total: totalCount,
      paidAmount: 0,
      pendingCount: 0,
      paidCount: 0,
      failedCount: 0,
      refundedCount: 0,
      needsReconciliationCount,
      refundRequiredCount,
      reconciledCount
    };
    statsAgg.forEach((s) => {
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
      payments: payments.map((p) => PaymentService.serializeForAdmin(p)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount
      },
      stats,
      view: viewKey
    };
  }

  /**
   * Get single Payment record by ID (Admin) — includes the audit trail, never the gateway signature.
   */
  static async getPaymentByIdAdmin(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw fail('Invalid payment id', 400);
    const payment = await Payment.findById(id)
      .select('-gatewaySignature')
      .populate('user', 'name phone email')
      .populate('order')
      .populate('refunds.initiatedBy', 'name email')
      .lean();
    if (!payment) throw fail('Payment record not found', 404);
    return PaymentService.serializeForAdmin(payment);
  }

  /**
   * Admin closes a reconciliation item after resolving it (e.g. refunding the customer in Razorpay,
   * or creating the order by hand). It records WHO and WHY and changes ONLY the reconciliation marker —
   * never the payment/refund status or any amount. Safe to click twice (second call → 409).
   */
  static async markReconciled(adminId, paymentId, note) {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) throw fail('Invalid payment id', 400);
    const cleanNote = String(note || '').trim();
    if (cleanNote.length < 5) throw fail('Please add a short note (at least 5 characters) explaining how this was resolved.', 400);
    if (cleanNote.length > 500) throw fail('The note is too long (max 500 characters).', 400);

    const actor = `ADMIN:${adminId}`;
    const now = new Date();
    const updated = await Payment.findOneAndUpdate(
      { _id: paymentId, 'metadata.needsReconciliation': true },
      {
        $set: {
          'metadata.needsReconciliation': false,
          'metadata.reconciledAt': now,
          'metadata.reconciledBy': actor,
          'metadata.reconciliationNote': cleanNote
        },
        $push: {
          auditTrail: {
            $each: [{ action: 'RECONCILIATION_RESOLVED', actor, at: now, meta: { note: cleanNote } }],
            $slice: -200
          }
        }
      },
      { new: true }
    );

    if (!updated) {
      const exists = await Payment.exists({ _id: paymentId });
      if (!exists) throw fail('Payment record not found', 404);
      throw fail('This payment is not waiting for reconciliation (it may already be resolved).', 409, 'NOT_FLAGGED');
    }
    return PaymentService.getPaymentByIdAdmin(paymentId);
  }

  /**
   * Admin retries a refund that failed (or could not be started when an order was cancelled).
   * Reuses the one refund engine (atomic reservation + idempotency); status changes only when the
   * gateway confirms (webhook / gateway response), never because this endpoint was called.
   */
  static async retryRefund(adminId, paymentId, { idempotencyKey = null } = {}) {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) throw fail('Invalid payment id', 400);
    const payment = await Payment.findById(paymentId);
    if (!payment) throw fail('Payment record not found', 404);

    const actor = `ADMIN:${adminId}`;
    if (payment.metadata?.refundRequired !== true) {
      throw fail('This payment is not waiting for a refund retry.', 409, 'REFUND_NOT_REQUIRED');
    }
    if ((payment.refundPendingAmount || 0) > 0 || payment.refunds.some((r) => r.status === 'PENDING')) {
      throw fail('A refund is already in progress for this payment. Wait for the gateway to confirm it.', 409, 'REFUND_IN_PROGRESS');
    }

    const remaining = round2(payment.amount - (payment.refundedAmount || 0) - (payment.refundPendingAmount || 0));
    if (remaining <= 0) {
      await Payment.updateOne({ _id: payment._id }, { $set: { 'metadata.refundRequired': false } });
      await PaymentService.audit(payment._id, 'REFUND_REQUIRED_CLEARED_NOTHING_LEFT', actor, {});
      throw fail('There is nothing left to refund for this payment.', 409, 'NOTHING_TO_REFUND');
    }

    const failedRows = payment.refunds.filter((r) => r.status === 'FAILED');
    const lastFailed = failedRows[failedRows.length - 1];
    const amount = lastFailed ? Math.min(round2(lastFailed.amount), remaining) : remaining;

    // Deterministic key: two simultaneous clicks compute the same key, so only one refund can be created.
    // (<= 40 chars: it is also the Razorpay refund receipt.)
    const requestKey = String(idempotencyKey || `retry:${String(payment._id).slice(-10)}:${failedRows.length}`).slice(0, 40);

    let result;
    try {
      result = await PaymentService.executeRefund({
        paymentId: payment._id,
        amount,
        reason: lastFailed ? `Retry of failed refund${lastFailed.failureReason ? ` (${lastFailed.failureReason})` : ''}` : 'Retry of refund that could not be started',
        requestKey,
        actor,
        initiatedBy: adminId
      });
    } catch (e) {
      await Payment.updateOne(
        { _id: payment._id },
        { $set: { 'metadata.refundError': String(e.message).slice(0, 300), 'metadata.refundRetriedAt': new Date(), 'metadata.refundRetriedBy': actor } }
      );
      await PaymentService.audit(payment._id, 'REFUND_RETRY_FAILED', actor, { amount, requestKey, code: e.code || null, message: e.message });
      throw e;
    }

    if (result.duplicate) {
      if (result.refund?.status === 'FAILED') {
        throw fail('That retry attempt already failed. Please retry again.', 409, 'RETRY_ALREADY_FAILED');
      }
      return { payment: await PaymentService.getPaymentByIdAdmin(payment._id), duplicate: true };
    }

    // The gateway accepted the request. The payment status stays REFUND_PENDING until the gateway confirms.
    await Payment.updateOne(
      { _id: payment._id },
      { $set: { 'metadata.refundRequired': false, 'metadata.refundRetriedAt': new Date(), 'metadata.refundRetriedBy': actor, 'metadata.refundError': '' } }
    );
    await PaymentService.audit(payment._id, 'REFUND_RETRY_REQUESTED', actor, { amount, requestKey });
    return { payment: await PaymentService.getPaymentByIdAdmin(payment._id), duplicate: false };
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
