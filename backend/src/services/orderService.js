import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import Payment from '../models/Payment.js';
import Coupon from '../models/Coupon.js';
import PaymentService from './paymentService.js';
import settingsService from './settingsService.js';
import couponService from './couponService.js';

/**
 * Generate a customer-facing human-readable order number
 * Format: AV-XXXXX
 */
const generateOrderNumber = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `AV${randomNum}`;
};

/**
 * Get comprehensive checkout summary for an authenticated user
 * Validates cart against live DB product catalog and returns accurate pricing
 */
export const getCheckoutSummary = async (userId) => {
  // 1. Fetch user's cart
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.items || cart.items.length === 0) {
    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      deliveryFee: 0,
      tax: 0,
      total: 0,
      appliedCoupon: null,
      savedAddresses: addresses,
      defaultAddressId: addresses.find(a => a.isDefault)?._id || addresses[0]?._id || null,
      deliverySlots: [
        { id: 'standard', label: 'Standard Express Courier (1-3 Days)', fee: 0 }
      ]
    };
  }

  // 2. Fetch live products from DB
  const productIds = cart.items.map(item => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  let subtotal = 0;
  const validatedItems = [];
  const stockWarnings = [];

  for (const item of cart.items) {
    const liveProduct = productMap.get(item.product.toString());

    if (!liveProduct) {
      stockWarnings.push(`Product "${item.name}" is no longer available.`);
      continue;
    }

    if (liveProduct.status !== 'ACTIVE') {
      stockWarnings.push(`Product "${liveProduct.name}" is currently unavailable.`);
      continue;
    }

    // Determine price for matching weight option if present, else base product price
    let effectivePrice = liveProduct.price;
    let effectiveOldPrice = liveProduct.oldPrice || 0;

    if (liveProduct.weightOptions && liveProduct.weightOptions.length > 0) {
      const matchedOption = liveProduct.weightOptions.find(o => o.weight === item.weight);
      if (matchedOption) {
        effectivePrice = matchedOption.price;
        effectiveOldPrice = matchedOption.oldPrice || 0;
      }
    }

    const availableStock = liveProduct.stockCount ?? 0;
    const isOutOfStock = !liveProduct.inStock || availableStock < item.qty;

    if (isOutOfStock) {
      stockWarnings.push(
        `Insufficient stock for "${liveProduct.name}" (${item.weight}). Available: ${availableStock}, in cart: ${item.qty}`
      );
    }

    const itemSubtotal = effectivePrice * item.qty;
    subtotal += itemSubtotal;

    validatedItems.push({
      id: item._id,
      productId: liveProduct._id,
      name: liveProduct.name,
      image: liveProduct.image || item.image,
      weight: item.weight,
      price: effectivePrice,
      oldPrice: effectiveOldPrice,
      qty: item.qty,
      subtotal: itemSubtotal,
      inStock: !isOutOfStock,
      availableStock
    });
  }

  // 3. Calculate discounts, delivery fee, taxes
  let discount = 0;
  let appliedCouponData = null;
  const coupon = cart.appliedCoupon;
  if (coupon && coupon.code) {
    try {
      const validation = await couponService.validateCoupon({
        code: coupon.code,
        subtotal
      });
      discount = validation.discount;
      appliedCouponData = {
        couponId: validation.coupon.id,
        code: validation.coupon.code,
        discountType: validation.coupon.discountType,
        discountValue: validation.coupon.discountValue,
        minOrderValue: validation.coupon.minOrderValue,
        maxDiscount: validation.coupon.maxDiscount,
        discountAmount: validation.discount,
        description: validation.coupon.description || '',
        discountPercent: validation.coupon.discountType === 'PERCENTAGE' ? validation.coupon.discountValue : 0,
        flatDiscount: validation.coupon.discountType === 'FIXED' ? validation.discount : 0
      };
    } catch (couponErr) {
      discount = 0;
      appliedCouponData = null;
    }
  }

  const settings = await settingsService.getSettings();
  const taxableAmount = Math.max(0, subtotal - discount);
  const freeThreshold = typeof settings.freeDeliveryThreshold === 'number' ? settings.freeDeliveryThreshold : 499;
  const standardFee = typeof settings.standardDeliveryFee === 'number' ? settings.standardDeliveryFee : 40;
  const gstRate = typeof settings.gstRate === 'number' ? settings.gstRate : 5;

  const deliveryFee = subtotal === 0 || subtotal >= freeThreshold ? 0 : standardFee;
  const tax = Math.round((taxableAmount * gstRate) / 100);
  const total = taxableAmount + deliveryFee + tax;

  // 4. Fetch user's saved addresses
  const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
  const defaultAddressId = addresses.find(a => a.isDefault)?._id || addresses[0]?._id || null;

  return {
    items: validatedItems,
    subtotal,
    discount,
    deliveryFee,
    tax,
    total,
    appliedCoupon: appliedCouponData,
    stockWarnings,
    savedAddresses: addresses,
    defaultAddressId,
    deliverySlots: [
      { id: 'standard', label: 'Standard Express Courier (1-3 Days)', fee: deliveryFee }
    ]
  };
};

/**
 * Place a new Order with atomic inventory updates and snapshot storage
 */
export const placeOrder = async (userId, payload) => {
  const {
    addressId,
    paymentMethod = 'COD',
    paymentDetails = {},
    deliverySlot = {},
    couponCode = null,
    idempotencyKey = null
  } = payload;

  // 1. Idempotency Check
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey, user: userId });
    if (existingOrder) {
      return existingOrder;
    }
  }

  // 2. Validate Address
  if (!addressId) {
    const err = new Error('Delivery address is required to place an order');
    err.statusCode = 400;
    throw err;
  }

  const selectedAddress = await Address.findOne({ _id: addressId, user: userId });
  if (!selectedAddress) {
    const err = new Error('Selected delivery address was not found or does not belong to your account');
    err.statusCode = 400;
    throw err;
  }

  // 3. Fetch user's cart
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.items || cart.items.length === 0) {
    const err = new Error('Your cart is empty. Please add items before placing an order.');
    err.statusCode = 400;
    throw err;
  }

  // 4. Fetch live products from DB and validate
  const productIds = cart.items.map(item => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const liveProduct = productMap.get(item.product.toString());

    if (!liveProduct) {
      const err = new Error(`Item "${item.name}" is no longer available in our store.`);
      err.statusCode = 400;
      throw err;
    }

    if (liveProduct.status !== 'ACTIVE') {
      const err = new Error(`Product "${liveProduct.name}" is currently inactive.`);
      err.statusCode = 400;
      throw err;
    }

    if (!liveProduct.inStock || (liveProduct.stockCount !== undefined && liveProduct.stockCount < item.qty)) {
      const err = new Error(
        `Insufficient stock for "${liveProduct.name}". Available: ${liveProduct.stockCount ?? 0}, Requested: ${item.qty}`
      );
      err.statusCode = 400;
      throw err;
    }

    let unitPrice = liveProduct.price;
    let unitOldPrice = liveProduct.oldPrice || 0;

    if (liveProduct.weightOptions && liveProduct.weightOptions.length > 0) {
      const matchedOption = liveProduct.weightOptions.find(o => o.weight === item.weight);
      if (matchedOption) {
        unitPrice = matchedOption.price;
        unitOldPrice = matchedOption.oldPrice || 0;
      }
    }

    const itemSubtotal = unitPrice * item.qty;
    subtotal += itemSubtotal;

    // Snapshot item record
    orderItems.push({
      product: liveProduct._id,
      name: liveProduct.name,
      image: liveProduct.image || item.image,
      weight: item.weight,
      price: unitPrice,
      oldPrice: unitOldPrice,
      qty: item.qty,
      subtotal: itemSubtotal
    });
  }

  // 5. Calculate final pricing authoritatively
  let discount = 0;
  let couponDetailsSnapshot = null;
  const rawCouponCode = couponCode || cart.appliedCoupon?.code;
  const activeCouponCode = rawCouponCode ? String(rawCouponCode).trim().toUpperCase() : null;

  if (activeCouponCode) {
    const validation = await couponService.validateCoupon({
      code: activeCouponCode,
      subtotal
    });
    discount = validation.discount;
    couponDetailsSnapshot = {
      couponId: validation.coupon.id,
      code: validation.coupon.code,
      discountType: validation.coupon.discountType,
      discountValue: validation.coupon.discountValue,
      discountAmount: discount
    };
  }

  const settings = await settingsService.getSettings();
  const taxableAmount = Math.max(0, subtotal - discount);
  const freeThreshold = typeof settings.freeDeliveryThreshold === 'number' ? settings.freeDeliveryThreshold : 499;
  const standardFee = typeof settings.standardDeliveryFee === 'number' ? settings.standardDeliveryFee : 40;
  const gstRate = typeof settings.gstRate === 'number' ? settings.gstRate : 5;

  const deliveryFee = subtotal === 0 || subtotal >= freeThreshold ? 0 : standardFee;
  const tax = Math.round((taxableAmount * gstRate) / 100);
  const total = taxableAmount + deliveryFee + tax;

  // 6. Address Snapshot
  const addressSnapshot = {
    fullName: selectedAddress.fullName,
    phoneNumber: selectedAddress.phoneNumber,
    addressLine1: selectedAddress.addressLine1,
    addressLine2: selectedAddress.addressLine2 || '',
    landmark: selectedAddress.landmark || '',
    city: selectedAddress.city,
    state: selectedAddress.state,
    postalCode: selectedAddress.postalCode,
    country: selectedAddress.country || 'India',
    addressType: selectedAddress.addressType || 'home'
  };

  // 7. Atomic Inventory Deduction & Coupon Consumption
  const deductedItems = [];
  let couponIncrementedId = null;

  try {
    for (const item of orderItems) {
      const updateResult = await Product.updateOne(
        {
          _id: item.product,
          inStock: true,
          stockCount: { $gte: item.qty }
        },
        {
          $inc: { stockCount: -item.qty }
        }
      );

      if (updateResult.modifiedCount === 0) {
        const currentProduct = await Product.findById(item.product);
        const err = new Error(
          `Unable to reserve stock for "${item.name}". Available: ${currentProduct?.stockCount ?? 0}, Requested: ${item.qty}`
        );
        err.statusCode = 400;
        throw err;
      }

      deductedItems.push({ productId: item.product, qty: item.qty });

      const freshProd = await Product.findById(item.product);
      if (freshProd && freshProd.stockCount <= 0) {
        await Product.updateOne({ _id: item.product }, { $set: { inStock: false } });
      }
    }

    // Atomically claim coupon slot if applicable
    if (couponDetailsSnapshot && couponDetailsSnapshot.couponId) {
      await couponService.incrementCouponUsage(couponDetailsSnapshot.couponId);
      couponIncrementedId = couponDetailsSnapshot.couponId;
    }

    // 8. Order Number & Status Setup
    const orderNumber = generateOrderNumber();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const normalizedPaymentMethod = ['UPI', 'CARD', 'NETBANKING'].includes(String(paymentMethod).toUpperCase())
      ? String(paymentMethod).toUpperCase()
      : 'COD';

    const initialPaymentStatus = 'PENDING';

    const timeline = [
      { status: 'Order Received', time: `${timeStr}, ${dateStr}`, done: true, current: false },
      { status: 'Packed', time: 'Just now', done: true, current: false },
      { status: 'Ready for Dispatch', time: 'In process', done: true, current: false },
      { status: 'Out for Delivery', time: 'Live', done: true, current: true },
      { status: 'Delivered', time: 'Estimated in 25 mins', done: false, current: false }
    ];

    const order = new Order({
      orderNumber,
      user: userId,
      items: orderItems,
      shippingAddress: addressSnapshot,
      pricing: {
        subtotal,
        discount,
        couponCode: activeCouponCode || null,
        deliveryFee,
        tax,
        total,
        couponDetails: couponDetailsSnapshot
      },
      payment: {
        method: normalizedPaymentMethod,
        status: initialPaymentStatus,
        transactionId: paymentDetails.transactionId || '',
        upiApp: paymentDetails.upiApp || ''
      },
      delivery: {
        type: 'Standard Express Courier',
        slot: {
          date: deliverySlot.date || dateStr,
          timeSlot: deliverySlot.timeSlot || 'Standard Delivery (1-3 Days)'
        },
        status: 'In Transit',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      status: 'CONFIRMED',
      timeline,
      rider: {
        name: 'Rohan Kumar',
        phone: '+91 9811122334',
        rating: 4.9,
        vehicle: 'MP09-AB-1234',
        eta: '25 mins',
        distance: '2.5 km away',
        lat: 22.7196,
        lng: 75.8577
      },
      ...(idempotencyKey ? { idempotencyKey: String(idempotencyKey).trim() } : {})
    });

    const savedOrder = await order.save();

    // Record COD in payment ledger
    if (normalizedPaymentMethod === 'COD') {
      await PaymentService.recordCodPayment(savedOrder, userId).catch(err => {
        console.warn('Could not record COD payment in ledger:', err.message);
      });
    }

    // 9. Clear purchased items from Cart in DB
    cart.items = [];
    cart.appliedCoupon = {
      couponId: null,
      code: null,
      discountType: null,
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      discountAmount: 0,
      description: '',
      discountPercent: 0,
      flatDiscount: 0
    };
    await cart.save();

    return savedOrder;
  } catch (error) {
    // Rollback coupon usage if it was incremented
    if (couponIncrementedId) {
      await Coupon.updateOne({ _id: couponIncrementedId }, { $inc: { usedCount: -1 } }).catch(() => {});
    }

    // Rollback any deducted inventory
    for (const deducted of deductedItems) {
      await Product.updateOne(
        { _id: deducted.productId },
        {
          $inc: { stockCount: deducted.qty },
          $set: { inStock: true }
        }
      ).catch(revertErr => console.error('Inventory rollback failure:', revertErr));
    }
    throw error;
  }
};

/**
 * Retrieve a specific order by ID or orderNumber for a user
 */
export const getOrderById = async (userId, orderIdOrNumber, isAdmin = false) => {
  const query = mongoose.Types.ObjectId.isValid(orderIdOrNumber)
    ? { _id: orderIdOrNumber }
    : { orderNumber: orderIdOrNumber };

  if (!isAdmin) {
    query.user = userId;
  }

  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }
  return order;
};

/**
 * Retrieve all orders for an authenticated user
 */
export const getUserOrders = async (userId) => {
  return await Order.find({ user: userId }).sort({ createdAt: -1 });
};

/**
 * Status lifecycle transitions matrix
 */
export const ALLOWED_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [], // Terminal
  CANCELLED: []  // Terminal
};

/**
 * Normalizes input status string to valid Order enum value
 */
export const normalizeStatus = (statusStr) => {
  if (!statusStr || typeof statusStr !== 'string') return '';
  const clean = statusStr.trim();
  const upper = clean.toUpperCase().replace(/\s+/g, '_');

  const mapping = {
    'ORDER_RECEIVED': 'CONFIRMED',
    'CONFIRMED': 'CONFIRMED',
    'PACKED': 'PACKED',
    'PROCESSING': 'PACKED',
    'READY_FOR_DISPATCH': 'SHIPPED',
    'DISPATCHED': 'SHIPPED',
    'SHIPPED': 'SHIPPED',
    'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
    'DELIVERED': 'DELIVERED',
    'COMPLETED': 'DELIVERED',
    'CANCELLED': 'CANCELLED',
    'CANCELED': 'CANCELLED'
  };

  return mapping[upper] || upper;
};

/**
 * Helper to generate or update timeline entries
 */
const updateOrderTimeline = (order, newStatus, updatedBy = 'System', note = '') => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const standardSteps = [
    { key: 'CONFIRMED', label: 'Order Received' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'SHIPPED', label: 'Ready for Dispatch' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const statusOrder = ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const targetIndex = statusOrder.indexOf(newStatus);

  if (newStatus === 'CANCELLED') {
    // Mark any active step as not current and append Cancellation step
    if (order.timeline && order.timeline.length > 0) {
      order.timeline.forEach(step => { step.current = false; });
    }
    order.timeline.push({
      status: 'Cancelled',
      time: `${timeStr}, ${dateStr}`,
      done: true,
      current: true,
      timestamp: now,
      updatedBy,
      note: note || 'Order cancelled'
    });
    return;
  }

  if (targetIndex !== -1) {
    order.timeline = standardSteps.map((step, idx) => {
      const isDone = idx <= targetIndex;
      const isCurrent = idx === targetIndex;
      const existing = order.timeline ? order.timeline.find(t => t.status === step.label || t.status === step.key) : null;
      return {
        status: step.label,
        time: existing && existing.done ? existing.time : isDone ? `${timeStr}, ${dateStr}` : step.label,
        done: isDone,
        current: isCurrent,
        timestamp: isCurrent ? now : existing?.timestamp || now,
        updatedBy: isCurrent ? updatedBy : existing?.updatedBy || 'System',
        note: isCurrent ? note : existing?.note || ''
      };
    });
  } else {
    order.timeline.push({
      status: newStatus,
      time: `${timeStr}, ${dateStr}`,
      done: true,
      current: true,
      timestamp: now,
      updatedBy,
      note
    });
  }
};

/**
 * Retrieve all orders for admin with pagination, filtering, and search
 */
export const getAllOrdersAdmin = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    status = null,
    search = null,
    fromDate = null,
    toDate = null,
    sortBy = 'createdAt:desc'
  } = filters;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  // Status Filter
  if (status && status !== 'all' && status !== 'All') {
    const normalized = normalizeStatus(status);
    if (normalized) {
      query.status = normalized;
    }
  }

  // Search by Order Number, Customer Name, Phone, or City
  if (search && String(search).trim()) {
    const q = String(search).trim();
    const regex = new RegExp(q, 'i');
    query.$or = [
      { orderNumber: regex },
      { 'shippingAddress.fullName': regex },
      { 'shippingAddress.phoneNumber': regex },
      { 'shippingAddress.city': regex }
    ];
  }

  // Date Range Filtering
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) {
      query.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sortBy) {
    const [field, dir] = String(sortBy).split(':');
    sortOption = { [field]: dir === 'asc' ? 1 : -1 };
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email phone')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Admin: Update order fulfillment status with lifecycle validation and timeline tracking
 */
export const updateOrderStatusAdmin = async (orderId, newStatusRaw, { updatedBy = 'Admin', note = '' } = {}) => {
  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId }
    : { orderNumber: orderId };

  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error(`Order "${orderId}" not found`);
    err.statusCode = 404;
    throw err;
  }

  const newStatus = normalizeStatus(newStatusRaw);
  const currentStatus = order.status;

  // If already at target status, return cleanly (idempotent)
  if (currentStatus === newStatus) {
    return order;
  }

  // Validate allowed status transitions
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    const err = new Error(
      `Invalid order status transition from "${currentStatus}" to "${newStatus}". Allowed next transitions: [${allowed.join(', ') || 'None (Terminal status)'}]`
    );
    err.statusCode = 400;
    throw err;
  }

  // If transitioning to CANCELLED, delegate to atomic cancelOrder to restore inventory safely
  if (newStatus === 'CANCELLED') {
    return await cancelOrder(orderId, {
      cancelledBy: 'ADMIN',
      cancelReason: note || 'Cancelled by administrator',
      isAdmin: true
    });
  }

  order.status = newStatus;

  if (newStatus === 'DELIVERED') {
    order.delivery.status = 'Delivered';
    order.payment.status = 'PAID';
    await Payment.findOneAndUpdate(
      { order: order._id },
      { $set: { status: 'PAID', paidAt: new Date() } }
    ).catch(() => {});
  } else if (newStatus === 'OUT_FOR_DELIVERY') {
    order.delivery.status = 'Out for Delivery';
  } else if (newStatus === 'SHIPPED') {
    order.delivery.status = 'In Transit';
    if (!order.dispatchedAt) {
      order.dispatchedAt = new Date();
    }
  }

  updateOrderTimeline(order, newStatus, updatedBy, note);
  return await order.save();
};

/**
 * Admin: Dispatch order with courier, AWB, and delivery partner tracking
 */
export const dispatchOrderAdmin = async (orderId, dispatchPayload = {}) => {
  const {
    courierName = '',
    awbNumber = '',
    rider = null,
    deliveryNotes = '',
    dispatchDate = null
  } = dispatchPayload;

  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId }
    : { orderNumber: orderId };

  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error(`Order "${orderId}" not found`);
    err.statusCode = 404;
    throw err;
  }

  if (order.status === 'CANCELLED') {
    const err = new Error('Cannot dispatch an order that has been cancelled.');
    err.statusCode = 400;
    throw err;
  }

  if (order.status === 'DELIVERED') {
    const err = new Error('Cannot update dispatch details for an order that is already delivered.');
    err.statusCode = 400;
    throw err;
  }

  if (courierName) order.courierName = courierName.trim();
  if (awbNumber) order.awbNumber = awbNumber.trim();
  if (deliveryNotes) order.deliveryNotes = deliveryNotes.trim();
  order.dispatchedAt = dispatchDate ? new Date(dispatchDate) : new Date();
  order.delivery.status = 'In Transit';

  if (rider && typeof rider === 'object') {
    order.rider = {
      name: rider.name || order.rider?.name || 'Rohan Kumar',
      phone: rider.phone || order.rider?.phone || '+91 9811122334',
      rating: rider.rating || order.rider?.rating || 4.9,
      vehicle: rider.vehicle || order.rider?.vehicle || 'MP09-AB-1234',
      eta: rider.eta || order.rider?.eta || '25 mins',
      distance: rider.distance || order.rider?.distance || '2.5 km away',
      lat: rider.lat || order.rider?.lat || 22.7196,
      lng: rider.lng || order.rider?.lng || 75.8577
    };
  }

  // Advance status to SHIPPED if currently CONFIRMED or PACKED
  if (['CONFIRMED', 'PACKED', 'PROCESSING'].includes(order.status)) {
    order.status = 'SHIPPED';
  }

  const settings = await settingsService.getSettings();
  const hubName = settings.warehouseName || 'AURIVÁ Central Fulfillment Hub';
  const noteMsg = `Dispatched via ${order.courierName || 'Standard Express'}${order.awbNumber ? ` (AWB: ${order.awbNumber})` : ''}`;
  updateOrderTimeline(order, 'SHIPPED', hubName, noteMsg);

  return await order.save();
};

/**
 * Cancel Order with Atomic Inventory Stock Restoration & Anti-Duplicate Guards
 */
export const cancelOrder = async (orderId, options = {}) => {
  const {
    cancelledBy = 'CUSTOMER',
    cancelReason = '',
    userId = null,
    isAdmin = false
  } = options;

  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId }
    : { orderNumber: orderId };

  if (!isAdmin && userId) {
    query.user = userId;
  }

  // 1. Fetch Order and verify existence and eligibility
  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error('Order not found or you do not have permission to access it.');
    err.statusCode = 404;
    throw err;
  }

  if (order.status === 'CANCELLED') {
    const err = new Error('This order is already cancelled.');
    err.statusCode = 400;
    throw err;
  }

  if (order.status === 'DELIVERED') {
    const err = new Error('Delivered orders cannot be cancelled.');
    err.statusCode = 400;
    throw err;
  }

  // Customer cancellation rules: customer can only cancel if status is CONFIRMED or PACKED
  if (!isAdmin) {
    if (!['CONFIRMED', 'PACKED', 'PROCESSING', 'PENDING'].includes(order.status)) {
      const err = new Error(
        `Order cannot be cancelled because it is already in "${order.status}" status. Please reach out to customer support.`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // 2. Atomic state transition lock
  // Only transitions if status is NOT CANCELLED and isStockRestored is false.
  const lockedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      status: { $nin: ['CANCELLED', 'DELIVERED'] },
      isStockRestored: false
    },
    {
      $set: {
        status: 'CANCELLED',
        cancelledBy: (cancelledBy || 'CUSTOMER').toUpperCase(),
        cancelledAt: new Date(),
        cancelReason: cancelReason || (isAdmin ? 'Cancelled by administrator' : 'Customer requested cancellation'),
        isStockRestored: true
      }
    },
    { new: true }
  );

  if (!lockedOrder) {
    const err = new Error('Order is already cancelled or could not be locked for cancellation.');
    err.statusCode = 400;
    throw err;
  }

  // 3. Atomically restore inventory stock for each ordered item
  const restoredItems = [];
  for (const item of lockedOrder.items) {
    if (item.product) {
      try {
        await Product.updateOne(
          { _id: item.product },
          {
            $inc: { stockCount: item.qty },
            $set: { inStock: true }
          }
        );
        restoredItems.push({ product: item.product, qty: item.qty });
      } catch (restockErr) {
        console.error(`[Stock Restoration Error] Product ${item.product}:`, restockErr.message);
      }
    }
  }

  // 4. Update timeline with persistent Cancellation step
  updateOrderTimeline(
    lockedOrder,
    'CANCELLED',
    isAdmin ? 'Admin' : 'Customer',
    cancelReason || (isAdmin ? 'Cancelled by administrator' : 'Customer requested cancellation')
  );

  await lockedOrder.save();
  return lockedOrder;
};

export default {
  getCheckoutSummary,
  placeOrder,
  getOrderById,
  getUserOrders,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  dispatchOrderAdmin,
  cancelOrder,
  ALLOWED_TRANSITIONS,
  normalizeStatus
};

