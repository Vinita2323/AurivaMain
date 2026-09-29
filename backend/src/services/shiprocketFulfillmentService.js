import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import settingsService from './settingsService.js';
import shiprocketClient from './shiprocketClient.js';
import env from '../config/env.js';
import { updateOrderTimeline, ALLOWED_TRANSITIONS } from './orderService.js';

/**
 * Parse pack label like "150g" / "300 g" / "0.5kg" into kilograms.
 */
export function parseWeightToKg(weightLabel) {
  if (weightLabel == null || weightLabel === '') return null;
  if (typeof weightLabel === 'number' && Number.isFinite(weightLabel) && weightLabel > 0) {
    return weightLabel;
  }
  const s = String(weightLabel).trim().toLowerCase().replace(/\s+/g, '');
  const m = s.match(/^([\d.]+)(kg|g|gm|grams?)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = (m[2] || 'g').toLowerCase();
  if (unit.startsWith('kg')) return n;
  return n / 1000;
}

function splitName(fullName = '') {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'Customer', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function sanitizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

/**
 * Shiprocket shipment / tracking statuses → Auriva order status.
 * Covers forward, OFD, delivered, cancel, and RTO/return edge cases.
 * @see https://apidocs.shiprocket.in/
 */
export function mapShiprocketStatusToOrderStatus(srStatus, statusCode = null) {
  if (!srStatus && statusCode == null) return null;
  const s = String(srStatus || '').trim().toUpperCase().replace(/[_-]+/g, ' ');

  // Terminal / cancel
  if (
    s.includes('CANCEL') ||
    s.includes('CANCELED') ||
    s === 'LOST' ||
    s.includes('DESTROYED') ||
    s.includes('DISPOSED')
  ) {
    return 'CANCELLED';
  }

  // RTO / returns — only mark cancelled when return cycle completes
  if (s.includes('RTO') || s.includes('RETURN')) {
    if (
      s.includes('DELIVERED') ||
      s.includes('COMPLETED') ||
      s === 'RETURNED' ||
      s.includes('RTO DELIVERED') ||
      s.includes('RTO ACK')
    ) {
      return 'CANCELLED';
    }
    // Intermediate RTO: keep shiprocket.status only
    return null;
  }

  if (s.includes('DELIVERED') && !s.includes('UNDELIVERED')) return 'DELIVERED';
  if (s.includes('OUT FOR DELIVERY') || s.includes('OFD') || s === 'OUTFORDELIVERY') {
    return 'OUT_FOR_DELIVERY';
  }
  if (
    s.includes('IN TRANSIT') ||
    s.includes('SHIPPED') ||
    s.includes('PICKED UP') ||
    s.includes('PICKUP COMPLETE') ||
    s.includes('DISPATCHED') ||
    s.includes('REACHED') ||
    s.includes('CONNECTED') ||
    s.includes('MANIFEST') ||
    s.includes('UNDELIVERED') ||
    s.includes('NDR') ||
    s.includes('EXCEPTION')
  ) {
    return 'SHIPPED';
  }
  if (
    s.includes('PICKUP SCHEDULED') ||
    s.includes('PICKUP GENERATED') ||
    s.includes('PICKUP PENDING') ||
    s.includes('AWB ASSIGNED') ||
    s.includes('AWB_GENERATED') ||
    s.includes('LABEL GENERATED') ||
    s.includes('READY TO SHIP') ||
    s.includes('PACKED') ||
    s.includes('INVOICED')
  ) {
    return 'PACKED';
  }
  if (s.includes('NEW') || s.includes('CREATED') || s.includes('PROCESSING') || s.includes('PENDING')) {
    return 'PROCESSING';
  }

  // Numeric status_code fallback (Shiprocket webhook / track IDs)
  if (statusCode != null) {
    const codeMap = {
      1: 'PROCESSING',
      2: 'PACKED',
      3: 'PACKED',
      4: 'SHIPPED',
      5: 'CANCELLED',
      6: 'SHIPPED',
      7: 'DELIVERED',
      8: 'PROCESSING',
      9: 'CANCELLED',
      10: 'OUT_FOR_DELIVERY',
      12: 'SHIPPED',
      13: 'OUT_FOR_DELIVERY',
      14: 'DELIVERED',
      15: 'CANCELLED',
      16: 'CANCELLED',
      17: 'SHIPPED',
      18: 'SHIPPED',
      19: 'OUT_FOR_DELIVERY',
      20: 'SHIPPED',
      21: 'OUT_FOR_DELIVERY',
      22: 'DELIVERED',
      38: 'CANCELLED',
      39: 'CANCELLED',
      40: 'CANCELLED',
      41: 'CANCELLED',
      42: 'CANCELLED',
      46: 'SHIPPED',
      47: 'CANCELLED'
    };
    return codeMap[Number(statusCode)] || null;
  }

  return null;
}

export function canTransitionOrderStatus(from, to) {
  if (!from || !to || from === to) return from === to;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (allowed.includes(to)) return true;
  // Shiprocket often skips intermediate warehouse steps
  const forwardJumps = {
    PENDING: ['CONFIRMED', 'PACKED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    CONFIRMED: ['PACKED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    PACKED: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    PROCESSING: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED']
  };
  return (forwardJumps[from] || []).includes(to);
}

export function resolvePackageMetrics(orderItem, product, defaults) {
  const name = orderItem.name || product?.name || 'Product';
  const sku =
    (product?.sku && String(product.sku).trim()) ||
    `SKU-${(product?._id || orderItem.product || 'ITEM').toString().slice(-8).toUpperCase()}`;

  let weightKg = null;
  if (product?.shippingWeightKg != null && Number(product.shippingWeightKg) > 0) {
    weightKg = Number(product.shippingWeightKg);
  } else {
    weightKg = parseWeightToKg(orderItem.weight) || parseWeightToKg(product?.weight);
  }
  if (weightKg == null && defaults.weightKg != null && defaults.weightKg > 0) {
    weightKg = defaults.weightKg;
  }

  const length =
    (product?.lengthCm != null && Number(product.lengthCm) > 0 && Number(product.lengthCm)) ||
    defaults.lengthCm ||
    null;
  const breadth =
    (product?.breadthCm != null && Number(product.breadthCm) > 0 && Number(product.breadthCm)) ||
    defaults.breadthCm ||
    null;
  const height =
    (product?.heightCm != null && Number(product.heightCm) > 0 && Number(product.heightCm)) ||
    defaults.heightCm ||
    null;

  const missing = [];
  if (weightKg == null || weightKg <= 0) {
    missing.push(
      `weight (set product.shippingWeightKg or pack weight like "150g", or SHIPROCKET_DEFAULT_WEIGHT_KG)`
    );
  }
  if (length == null) missing.push(`lengthCm (product or SHIPROCKET_DEFAULT_LENGTH_CM)`);
  if (breadth == null) missing.push(`breadthCm (product or SHIPROCKET_DEFAULT_BREADTH_CM)`);
  if (height == null) missing.push(`heightCm (product or SHIPROCKET_DEFAULT_HEIGHT_CM)`);

  if (missing.length > 0) {
    const err = new Error(
      `Cannot create Shiprocket shipment for "${name}": missing ${missing.join('; ')}.`
    );
    err.statusCode = 400;
    throw err;
  }

  return {
    sku,
    name,
    units: Number(orderItem.qty) || 1,
    selling_price: Number(orderItem.price) || 0,
    weightKg,
    length,
    breadth,
    height
  };
}

async function loadOrder(orderId) {
  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId }
    : { orderNumber: orderId };
  const order = await Order.findOne(query);
  if (!order) {
    const err = new Error(`Order "${orderId}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return order;
}

function ensureShiprocketSubdoc(order) {
  if (!order.shiprocket) order.shiprocket = {};
  if (!Array.isArray(order.shiprocket.processedWebhookIds)) {
    order.shiprocket.processedWebhookIds = [];
  }
  return order.shiprocket;
}

/**
 * Apply a Shiprocket status string/code onto an Auriva order (shared by track + webhook).
 */
export async function applyShiprocketStatusToOrder(order, {
  statusText,
  statusCode = null,
  awb = null,
  courierName = null,
  shipmentId = null,
  srOrderId = null,
  etd = null,
  source = 'Shiprocket'
} = {}) {
  const sr = ensureShiprocketSubdoc(order);

  if (awb) {
    sr.awbCode = String(awb);
    order.awbNumber = String(awb);
    if (!sr.trackingUrl) {
      sr.trackingUrl = `https://shiprocket.co/tracking/${sr.awbCode}`;
    }
  }
  if (courierName) {
    sr.courierName = String(courierName);
    order.courierName = String(courierName);
  }
  if (shipmentId) sr.shipmentId = String(shipmentId);
  if (srOrderId) sr.orderId = String(srOrderId);
  if (statusText) sr.status = String(statusText);
  if (statusCode != null && statusCode !== '') sr.statusCode = Number(statusCode);
  if (etd) {
    const d = new Date(etd);
    if (!Number.isNaN(d.getTime())) {
      order.delivery = order.delivery || {};
      order.delivery.estimatedDelivery = d;
    }
  }

  const mapped = mapShiprocketStatusToOrderStatus(statusText, statusCode);
  const isRto =
    /RTO|RETURN/i.test(String(statusText || '')) ||
    [15, 16, 38, 39, 40, 41, 42].includes(Number(statusCode));
  sr.isRto = Boolean(isRto);

  if (mapped && mapped !== order.status && canTransitionOrderStatus(order.status, mapped)) {
    const prev = order.status;
    order.status = mapped;
    if (mapped === 'SHIPPED' || mapped === 'OUT_FOR_DELIVERY') {
      order.delivery = order.delivery || {};
      order.delivery.status = mapped === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'In Transit';
      order.dispatchedAt = order.dispatchedAt || new Date();
    }
    if (mapped === 'DELIVERED') {
      order.delivery = order.delivery || {};
      order.delivery.status = 'Delivered';
      if (order.payment?.method === 'COD' && order.payment.status !== 'PAID') {
        order.payment.status = 'PAID';
      }
    }
    if (mapped === 'CANCELLED' && prev !== 'CANCELLED') {
      order.cancelledBy = 'SYSTEM';
      order.cancelReason = order.cancelReason || `${source}: ${statusText || statusCode}`;
      order.cancelledAt = new Date();
    }
    try {
      updateOrderTimeline(order, mapped, source, `${statusText || statusCode || mapped}`);
    } catch (_) {
      /* ignore */
    }
  }

  sr.lastSyncedAt = new Date();
  sr.lastUpdatedAt = new Date();
  order.markModified('shiprocket');
  return { mapped, shiprocket: sr };
}

class ShiprocketFulfillmentService {
  isReady() {
    return shiprocketClient.isConfigured();
  }

  getAutoFulfillLevel() {
    const level = String(env.SHIPROCKET.AUTO_FULFILL || 'create').toLowerCase().trim();
    if (['full', 'awb', 'create'].includes(level)) return level;
    return 'create';
  }

  async getPickupContext(overrideLocationName) {
    const settings = await settingsService.getSettings();
    return {
      pickupLocationName:
        overrideLocationName || env.SHIPROCKET.PICKUP_LOCATION || 'Primary',
      contactPerson:
        settings.warehouseName ||
        env.SHIPROCKET.PICKUP_CONTACT_PERSON ||
        settings.storeName ||
        'Auriva Warehouse',
      phone: sanitizePhone(
        settings.warehousePhone || env.SHIPROCKET.PICKUP_PHONE || settings.storePhone
      ),
      address: settings.warehouseAddress || env.SHIPROCKET.PICKUP_ADDRESS || '',
      city: settings.warehouseCity || env.SHIPROCKET.PICKUP_CITY || '',
      state: settings.warehouseState || env.SHIPROCKET.PICKUP_STATE || '',
      pincode: settings.warehousePincode || env.SHIPROCKET.PICKUP_PINCODE || '',
      country: env.SHIPROCKET.PICKUP_COUNTRY || 'India',
      gstin: env.SHIPROCKET.GSTIN || ''
    };
  }

  /**
   * Create Shiprocket order + shipment (POST /orders/create/adhoc).
   */
  async createShipmentForOrder(orderId, options = {}) {
    if (!this.isReady()) {
      const err = new Error('Shiprocket credentials are not configured on the server.');
      err.statusCode = 503;
      throw err;
    }

    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);

    if (order.status === 'CANCELLED') {
      const err = new Error('Cannot create Shiprocket shipment for a cancelled order.');
      err.statusCode = 400;
      throw err;
    }

    if (sr.orderId && sr.shipmentId && !options.force) {
      return {
        alreadyExists: true,
        message: 'Shiprocket shipment already exists for this order.',
        order,
        shiprocket: sr
      };
    }

    const addr = order.shippingAddress;
    if (!addr?.postalCode || !addr?.addressLine1 || !addr?.city || !addr?.state || !addr?.phoneNumber) {
      const err = new Error(
        'Invalid customer shipping address on order. Required: addressLine1, city, state, postalCode, phoneNumber.'
      );
      err.statusCode = 400;
      throw err;
    }

    if (!order.items?.length) {
      const err = new Error('Order has no line items — cannot create Shiprocket shipment.');
      err.statusCode = 400;
      throw err;
    }

    const defaults = {
      weightKg: env.SHIPROCKET.DEFAULT_WEIGHT_KG,
      lengthCm: env.SHIPROCKET.DEFAULT_LENGTH_CM,
      breadthCm: env.SHIPROCKET.DEFAULT_BREADTH_CM,
      heightCm: env.SHIPROCKET.DEFAULT_HEIGHT_CM
    };

    const productIds = order.items.map((i) => i.product).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const packageLines = [];
    for (const item of order.items) {
      const product = productMap.get(item.product?.toString?.() || String(item.product));
      packageLines.push(resolvePackageMetrics(item, product, defaults));
    }

    const totalWeight = packageLines.reduce((sum, line) => sum + line.weightKg * line.units, 0);
    const maxLength = Math.max(...packageLines.map((l) => l.length));
    const maxBreadth = Math.max(...packageLines.map((l) => l.breadth));
    const totalHeight = packageLines.reduce((sum, l) => sum + l.height * l.units, 0);

    const pickup = await this.getPickupContext(options.pickupLocation || sr.pickupLocation);
    const { first, last } = splitName(addr.fullName);
    const phone = sanitizePhone(addr.phoneNumber);
    if (phone.length !== 10) {
      const err = new Error(
        `Invalid customer phone "${addr.phoneNumber}". Need a 10-digit mobile number.`
      );
      err.statusCode = 400;
      throw err;
    }

    const isCod = String(order.payment?.method || '').toUpperCase() === 'COD';

    // Edge case: refuse create when pincode is not serviceable (COD-aware)
    if (!options.skipServiceabilityCheck) {
      try {
        const svc = await shiprocketClient.checkServiceability({
          pickupPostcode: pickup.pincode,
          deliveryPostcode: String(addr.postalCode).trim(),
          weight: Number(totalWeight.toFixed(3)) || env.SHIPROCKET.DEFAULT_WEIGHT_KG || 0.5,
          cod: isCod ? 1 : 0
        });
        const available = Boolean(svc?.data?.available_courier_companies?.length);
        if (!available) {
          const err = new Error(
            `Delivery pincode ${addr.postalCode} is not serviceable from pickup ${pickup.pincode}${isCod ? ' for COD' : ''}.`
          );
          err.statusCode = 400;
          err.shiprocket = svc;
          throw err;
        }
      } catch (e) {
        if (e.statusCode === 400) throw e;
        console.warn('[Shiprocket] Pre-create serviceability check skipped:', e.message);
      }
    }

    let customerEmail = options.customerEmail || '';
    if (!customerEmail && order.user) {
      try {
        const user = await User.findById(order.user).select('email').lean();
        customerEmail = user?.email || '';
      } catch (_) {
        /* ignore */
      }
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      customerEmail = 'care@aurivafoods.com';
    }

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' ')
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

    const payload = {
      order_id: String(order.orderNumber),
      order_date: orderDate,
      pickup_location: pickup.pickupLocationName,
      comment: options.comment || `Auriva order ${order.orderNumber}`,
      billing_customer_name: first,
      billing_last_name: last || first,
      billing_address: addr.addressLine1,
      billing_address_2: [addr.addressLine2, addr.landmark].filter(Boolean).join(', '),
      billing_city: addr.city,
      billing_pincode: String(addr.postalCode).trim(),
      billing_state: addr.state,
      billing_country: addr.country || 'India',
      billing_email: customerEmail,
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: packageLines.map((line) => ({
        name: line.name,
        sku: line.sku,
        units: line.units,
        selling_price: line.selling_price,
        discount: 0,
        tax: 0,
        hsn: 0
      })),
      payment_method: isCod ? 'COD' : 'Prepaid',
      shipping_charges: Number(order.pricing?.deliveryFee || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: Number(order.pricing?.discount || 0),
      sub_total: Number(order.pricing?.subtotal || order.pricing?.total || 0),
      length: Math.ceil(maxLength),
      breadth: Math.ceil(maxBreadth),
      height: Math.max(1, Math.ceil(totalHeight)),
      weight: Number(totalWeight.toFixed(3))
    };

    if (isCod) {
      payload.cod_amount = Number(order.pricing?.total || 0);
    }

    try {
      const result = await shiprocketClient.createAdhocOrder(payload);
      const srOrderId = String(result?.order_id || result?.payload?.order_id || '');
      const shipmentId = String(result?.shipment_id || result?.payload?.shipment_id || '');
      const status = result?.status || result?.payload?.status || 'NEW';

      if (!srOrderId && !shipmentId) {
        const err = new Error(
          result?.message ||
            'Shiprocket did not return order_id/shipment_id. Check pickup location nickname and payload.'
        );
        err.statusCode = 502;
        err.shiprocket = result;
        throw err;
      }

      sr.orderId = srOrderId;
      sr.shipmentId = shipmentId;
      sr.status = String(status);
      sr.statusCode = result?.status_code != null ? Number(result.status_code) : 1;
      sr.channelOrderId = String(order.orderNumber);
      sr.pickupLocation = pickup.pickupLocationName;
      sr.weightKg = Number(totalWeight.toFixed(3));
      sr.lengthCm = Math.ceil(maxLength);
      sr.breadthCm = Math.ceil(maxBreadth);
      sr.heightCm = Math.max(1, Math.ceil(totalHeight));
      sr.errorMessage = '';
      sr.lastUpdatedAt = new Date();
      sr.lastSyncedAt = new Date();

      if (canTransitionOrderStatus(order.status, 'PROCESSING') && order.status === 'CONFIRMED') {
        order.status = 'PROCESSING';
        try {
          updateOrderTimeline(order, 'PROCESSING', 'Shiprocket', `Created SR order ${srOrderId}`);
        } catch (_) {
          /* ignore */
        }
      }

      order.markModified('shiprocket');
      await order.save();

      console.log(
        `[Shiprocket] Created order for ${order.orderNumber}: srOrder=${srOrderId} shipment=${shipmentId}`
      );

      return {
        alreadyExists: false,
        message: 'Shiprocket order/shipment created successfully.',
        order,
        shiprocket: sr,
        raw: result
      };
    } catch (error) {
      sr.errorMessage = error.message || 'Shiprocket create failed';
      sr.lastUpdatedAt = new Date();
      order.markModified('shiprocket');
      await order.save().catch(() => {});
      throw error;
    }
  }

  async checkServiceabilityForOrder(orderId, { weight } = {}) {
    const order = await loadOrder(orderId);
    const pickup = await this.getPickupContext(order.shiprocket?.pickupLocation);
    const deliveryPostcode = order.shippingAddress?.postalCode;
    if (!deliveryPostcode) {
      const err = new Error('Order is missing customer pincode for serviceability check.');
      err.statusCode = 400;
      throw err;
    }
    if (!pickup.pincode) {
      const err = new Error(
        'Warehouse/pickup pincode missing. Set SHIPROCKET_PICKUP_PINCODE or Settings.warehousePincode.'
      );
      err.statusCode = 400;
      throw err;
    }

    const isCod = String(order.payment?.method || '').toUpperCase() === 'COD' ? 1 : 0;
    const w =
      weight ||
      Number(order.shiprocket?.weightKg) ||
      env.SHIPROCKET.DEFAULT_WEIGHT_KG ||
      0.5;

    const data = await shiprocketClient.checkServiceability({
      pickupPostcode: pickup.pincode,
      deliveryPostcode,
      weight: w,
      cod: isCod
    });

    return {
      orderId: order._id,
      orderNumber: order.orderNumber,
      pickupPostcode: pickup.pincode,
      deliveryPostcode,
      available: Boolean(data?.data?.available_courier_companies?.length),
      couriers: data?.data?.available_courier_companies || [],
      raw: data
    };
  }

  async assignCourierAndGenerateAwb(orderId, { courierId } = {}) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.shipmentId) {
      const err = new Error('No Shiprocket shipmentId on this order. Create shipment first.');
      err.statusCode = 400;
      throw err;
    }
    if (sr.awbCode && !courierId) {
      return {
        alreadyExists: true,
        message: 'AWB already generated for this shipment.',
        order,
        shiprocket: sr
      };
    }

    let selectedCourierId = courierId;
    if (selectedCourierId == null) {
      try {
        const svc = await this.checkServiceabilityForOrder(orderId);
        const recommended =
          svc.couriers?.find((c) => c.recommended_by) || svc.couriers?.[0];
        if (recommended?.courier_company_id) {
          selectedCourierId = recommended.courier_company_id;
        }
      } catch (e) {
        console.warn('[Shiprocket] Serviceability before AWB skipped:', e.message);
      }
    }

    const result = await shiprocketClient.assignAwb({
      shipmentId: sr.shipmentId,
      courierId: selectedCourierId
    });

    const response = result?.response?.data || result?.response || result?.data || result;
    const awb =
      response?.awb_code || response?.awb || result?.awb_code || '';
    const courierName =
      response?.courier_name || response?.courier_company || result?.courier_name || '';
    const cId =
      response?.courier_company_id || response?.courier_id || selectedCourierId || null;

    if (!awb) {
      const err = new Error(
        result?.message ||
          response?.message ||
          'AWB generation failed. Courier may be unavailable for this pincode.'
      );
      err.statusCode = 502;
      err.shiprocket = result;
      throw err;
    }

    sr.awbCode = String(awb);
    sr.courierName = String(courierName || sr.courierName || '');
    sr.courierId = cId != null ? Number(cId) : sr.courierId;
    sr.status = response?.status || sr.status || 'AWB_ASSIGNED';
    sr.trackingUrl =
      response?.tracking_url || `https://shiprocket.co/tracking/${sr.awbCode}`;
    sr.lastUpdatedAt = new Date();
    sr.errorMessage = '';

    order.courierName = sr.courierName || order.courierName;
    order.awbNumber = sr.awbCode;

    if (canTransitionOrderStatus(order.status, 'PACKED')) {
      order.status = 'PACKED';
      try {
        const settings = await settingsService.getSettings();
        updateOrderTimeline(
          order,
          'PACKED',
          settings.warehouseName || 'Warehouse',
          `AWB ${sr.awbCode} assigned via Shiprocket (${sr.courierName || 'courier'})`
        );
      } catch (_) {
        /* ignore */
      }
    }

    order.markModified('shiprocket');
    await order.save();

    return { message: 'AWB generated successfully.', order, shiprocket: sr, raw: result };
  }

  async schedulePickup(orderId) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.shipmentId) {
      const err = new Error('No Shiprocket shipmentId. Create shipment first.');
      err.statusCode = 400;
      throw err;
    }
    if (!sr.awbCode) {
      const err = new Error('Generate AWB before scheduling pickup.');
      err.statusCode = 400;
      throw err;
    }
    if (sr.pickupScheduled) {
      return {
        alreadyExists: true,
        message: 'Pickup already scheduled for this shipment.',
        order,
        shiprocket: sr
      };
    }

    const result = await shiprocketClient.generatePickup([sr.shipmentId]);
    sr.pickupScheduled = true;
    sr.status = result?.pickup_status || sr.status || 'PICKUP_SCHEDULED';
    sr.lastUpdatedAt = new Date();
    sr.errorMessage = '';

    if (canTransitionOrderStatus(order.status, 'SHIPPED')) {
      order.status = 'SHIPPED';
      order.dispatchedAt = order.dispatchedAt || new Date();
      order.delivery = order.delivery || {};
      order.delivery.status = 'In Transit';
      order.courierName = sr.courierName || order.courierName;
      order.awbNumber = sr.awbCode || order.awbNumber;
      try {
        const settings = await settingsService.getSettings();
        updateOrderTimeline(
          order,
          'SHIPPED',
          settings.warehouseName || 'Warehouse',
          `Pickup scheduled via Shiprocket (AWB: ${sr.awbCode})`
        );
      } catch (_) {
        /* ignore */
      }
    }

    order.markModified('shiprocket');
    await order.save();

    return { message: 'Pickup scheduled successfully.', order, shiprocket: sr, raw: result };
  }

  async generateLabel(orderId) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.shipmentId) {
      const err = new Error('No Shiprocket shipmentId. Create shipment first.');
      err.statusCode = 400;
      throw err;
    }

    const result = await shiprocketClient.generateLabel([sr.shipmentId]);
    const labelUrl =
      result?.label_url ||
      result?.label_download?.label ||
      result?.payload?.label_url ||
      '';

    if (labelUrl) sr.labelUrl = labelUrl;
    sr.lastUpdatedAt = new Date();
    order.markModified('shiprocket');
    await order.save();

    return {
      message: labelUrl ? 'Shipping label generated.' : 'Label request processed.',
      order,
      shiprocket: sr,
      labelUrl: sr.labelUrl,
      raw: result
    };
  }

  async generateInvoice(orderId) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    // Shiprocket print/invoice expects Shiprocket order ids
    const srOrderId = sr.orderId;
    if (!srOrderId && !sr.shipmentId) {
      const err = new Error('Create Shiprocket shipment before generating invoice.');
      err.statusCode = 400;
      throw err;
    }

    const idForInvoice = srOrderId || sr.shipmentId;
    const result = await shiprocketClient.generateInvoice([idForInvoice]);
    const invoiceUrl =
      result?.invoice_url ||
      result?.invoice_download?.invoice ||
      result?.payload?.invoice_url ||
      (Array.isArray(result?.invoices) ? result.invoices[0] : '') ||
      '';

    if (invoiceUrl) sr.invoiceUrl = invoiceUrl;
    sr.lastUpdatedAt = new Date();
    order.markModified('shiprocket');
    await order.save();

    return {
      message: invoiceUrl ? 'Shiprocket invoice generated.' : 'Invoice request processed.',
      order,
      shiprocket: sr,
      invoiceUrl: sr.invoiceUrl,
      raw: result
    };
  }

  async generateManifest(orderId) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.shipmentId) {
      const err = new Error('Create Shiprocket shipment before generating manifest.');
      err.statusCode = 400;
      throw err;
    }

    const result = await shiprocketClient.generateManifest([sr.shipmentId]);
    const manifestUrl =
      result?.manifest_url ||
      result?.manifest_url_link ||
      result?.payload?.manifest_url ||
      '';

    if (manifestUrl) sr.manifestUrl = manifestUrl;
    sr.lastUpdatedAt = new Date();
    order.markModified('shiprocket');
    await order.save();

    return {
      message: manifestUrl ? 'Manifest generated.' : 'Manifest request processed.',
      order,
      shiprocket: sr,
      manifestUrl: sr.manifestUrl,
      raw: result
    };
  }

  /**
   * Poll Shiprocket track APIs and apply status mapping to Auriva order.
   */
  async trackShipment(orderId) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.awbCode && !sr.shipmentId && !sr.orderId) {
      const err = new Error('No AWB/shipment to track for this order.');
      err.statusCode = 400;
      throw err;
    }

    let raw = null;
    if (sr.awbCode) {
      raw = await shiprocketClient.trackByAwb(sr.awbCode);
    } else if (sr.shipmentId) {
      raw = await shiprocketClient.trackByShipmentId(sr.shipmentId);
    }

    const trackingData = raw?.tracking_data || raw?.data || raw;
    const shipmentTrack = trackingData?.shipment_track?.[0] || {};
    const currentStatus =
      trackingData?.shipment_status ||
      trackingData?.track_status ||
      shipmentTrack?.current_status ||
      trackingData?.current_status ||
      sr.status;
    const statusCode =
      trackingData?.shipment_status_id ||
      trackingData?.track_status_code ||
      shipmentTrack?.sr_status ||
      sr.statusCode;
    const etd = trackingData?.etd || shipmentTrack?.etd || null;
    const awb = trackingData?.awb_code || shipmentTrack?.awb_code || sr.awbCode;
    const courier =
      trackingData?.courier_name || shipmentTrack?.courier_name || sr.courierName;

    await applyShiprocketStatusToOrder(order, {
      statusText: currentStatus,
      statusCode,
      awb,
      courierName: courier,
      etd,
      source: 'Shiprocket Track'
    });
    await order.save();

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      awbCode: sr.awbCode,
      courierName: sr.courierName,
      status: sr.status,
      statusCode: sr.statusCode,
      trackingUrl: sr.trackingUrl,
      isRto: sr.isRto,
      tracking: trackingData,
      raw
    };
  }

  async cancelShipment(orderId, { cancelAurivaOrder = false } = {}) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.awbCode && !sr.orderId) {
      const err = new Error('No Shiprocket shipment/AWB to cancel.');
      err.statusCode = 400;
      throw err;
    }

    if (String(sr.status).toUpperCase().includes('CANCEL')) {
      return {
        alreadyExists: true,
        message: 'Shiprocket shipment already cancelled.',
        order,
        shiprocket: sr
      };
    }

    let raw = null;
    try {
      if (sr.awbCode) {
        raw = await shiprocketClient.cancelShipment([sr.awbCode]);
      } else if (sr.orderId) {
        raw = await shiprocketClient.cancelOrderByIds([sr.orderId]);
      }
    } catch (e) {
      // Edge: already cancelled on SR side
      if (!/already|cancel/i.test(e.message || '')) throw e;
      raw = { message: e.message };
    }

    sr.status = 'CANCELLED';
    sr.lastUpdatedAt = new Date();
    sr.errorMessage = '';
    order.markModified('shiprocket');
    await order.save();

    if (cancelAurivaOrder && order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
      try {
        const { cancelOrder } = await import('./orderService.js');
        await cancelOrder(order._id, {
          cancelledBy: 'ADMIN',
          cancelReason: 'Cancelled with Shiprocket shipment',
          isAdmin: true
        });
      } catch (e) {
        console.warn('[Shiprocket] Auriva order cancel after SR cancel note:', e.message);
      }
    }

    return { message: 'Shiprocket cancellation requested.', order, shiprocket: sr, raw };
  }

  /**
   * Best-effort cancel on Shiprocket when Auriva order is cancelled.
   */
  async tryCancelForOrder(orderId) {
    if (!this.isReady()) return null;
    try {
      const order = await loadOrder(orderId);
      const sr = ensureShiprocketSubdoc(order);
      if (!sr.orderId && !sr.awbCode) return null;
      if (String(sr.status).toUpperCase().includes('CANCEL')) return null;
      return await this.cancelShipment(orderId, { cancelAurivaOrder: false });
    } catch (e) {
      console.warn('[Shiprocket] tryCancelForOrder note:', e.message);
      return { error: e.message };
    }
  }

  /**
   * Full happy-path: create → AWB → pickup → label → invoice (best-effort).
   */
  async fulfillOrder(orderId, options = {}) {
    const created = await this.createShipmentForOrder(orderId, options);
    const steps = { created, awb: null, pickup: null, label: null, invoice: null, errors: [] };

    try {
      steps.awb = await this.assignCourierAndGenerateAwb(orderId, {
        courierId: options.courierId
      });
    } catch (e) {
      console.warn('[Shiprocket] AWB step failed:', e.message);
      steps.errors.push({ step: 'awb', message: e.message });
      steps.order = (await loadOrder(orderId));
      return steps;
    }

    try {
      steps.pickup = await this.schedulePickup(orderId);
    } catch (e) {
      console.warn('[Shiprocket] Pickup step failed:', e.message);
      steps.errors.push({ step: 'pickup', message: e.message });
    }

    try {
      steps.label = await this.generateLabel(orderId);
    } catch (e) {
      console.warn('[Shiprocket] Label step failed:', e.message);
      steps.errors.push({ step: 'label', message: e.message });
    }

    try {
      steps.invoice = await this.generateInvoice(orderId);
    } catch (e) {
      console.warn('[Shiprocket] Invoice step failed:', e.message);
      steps.errors.push({ step: 'invoice', message: e.message });
    }

    steps.order = await loadOrder(orderId);
    return steps;
  }

  /**
   * Auto pipeline after COD / prepaid confirm.
   * SHIPROCKET_AUTO_FULFILL: create | awb | full
   */
  async tryAutoCreate(orderId) {
    if (!env.SHIPROCKET.AUTO_CREATE) {
      console.warn('[Shiprocket] AUTO_CREATE is disabled — skipping');
      return null;
    }

    if (!this.isReady()) {
      const msg =
        'Shiprocket credentials missing on server. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in production env.';
      console.warn(`[Shiprocket] ${msg}`);
      try {
        const order = await loadOrder(orderId);
        const sr = ensureShiprocketSubdoc(order);
        if (!sr.orderId) {
          sr.errorMessage = msg;
          sr.lastUpdatedAt = new Date();
          order.markModified('shiprocket');
          await order.save();
        }
      } catch {
        /* ignore */
      }
      return { error: msg };
    }

    const level = this.getAutoFulfillLevel();
    try {
      if (level === 'full') {
        const result = await this.fulfillOrder(orderId);
        if (result.errors?.length) {
          console.warn('[Shiprocket] Auto-fulfill partial errors:', result.errors);
        }
        return result;
      }

      const created = await this.createShipmentForOrder(orderId);
      if (level === 'awb' && !created.alreadyExists) {
        try {
          const awb = await this.assignCourierAndGenerateAwb(orderId);
          return { ...created, awb };
        } catch (e) {
          console.warn('[Shiprocket] Auto AWB failed (order still created):', e.message);
          return { ...created, awbError: e.message };
        }
      }

      console.log(
        `[Shiprocket] Auto-create OK for ${orderId}: order=${created.shiprocket?.orderId} shipment=${created.shiprocket?.shipmentId}`
      );
      return created;
    } catch (err) {
      console.warn('[Shiprocket] Auto-create skipped/failed:', err.message);
      return { error: err.message };
    }
  }

  /**
   * Process Shiprocket tracking webhook (Settings → API → Webhooks).
   * @see https://apidocs.shiprocket.in/
   */
  async handleWebhook(payload = {}, { webhookId } = {}) {
    const awb =
      payload.awb ||
      payload.awb_code ||
      payload.awb_number ||
      payload?.current_status_payload?.awb ||
      '';

    // shipment_id vs sr_order_id are DIFFERENT — never confuse them
    const shipmentId = String(payload.shipment_id || payload.shipmentId || '');
    const srOrderId = String(payload.sr_order_id || payload.shiprocket_order_id || '');
    const channelOrderId = String(
      payload.channel_order_id ||
        payload.order_id ||
        payload.order_ids?.[0] ||
        ''
    );

    const currentStatus =
      payload.current_status ||
      payload.shipment_status ||
      payload.status ||
      payload?.current_status_payload?.current_status ||
      '';
    const statusCode =
      payload.current_status_id ??
      payload.shipment_status_id ??
      payload.status_code ??
      null;

    const eventKey = [
      webhookId,
      awb,
      shipmentId || srOrderId,
      currentStatus,
      statusCode,
      payload.current_timestamp || payload.timestamp || ''
    ]
      .filter(Boolean)
      .join(':');

    let order = null;
    if (awb) {
      order = await Order.findOne({
        $or: [{ 'shiprocket.awbCode': String(awb) }, { awbNumber: String(awb) }]
      });
    }
    if (!order && shipmentId) {
      order = await Order.findOne({ 'shiprocket.shipmentId': shipmentId });
    }
    if (!order && srOrderId) {
      order = await Order.findOne({ 'shiprocket.orderId': srOrderId });
    }
    if (!order && channelOrderId) {
      // channel_order_id is our orderNumber (AV#####), NOT Shiprocket's numeric id
      order = await Order.findOne({
        $or: [
          { orderNumber: channelOrderId },
          { 'shiprocket.channelOrderId': channelOrderId }
        ]
      });
    }

    if (!order) {
      console.warn('[Shiprocket Webhook] No matching order', {
        awb: awb ? '[present]' : '',
        shipmentId,
        srOrderId,
        channelOrderId,
        currentStatus
      });
      return { matched: false, message: 'No matching order found' };
    }

    const sr = ensureShiprocketSubdoc(order);
    if (eventKey && sr.processedWebhookIds.includes(String(eventKey))) {
      return { matched: true, duplicate: true, orderNumber: order.orderNumber };
    }
    if (eventKey) {
      sr.processedWebhookIds = [...sr.processedWebhookIds, String(eventKey)].slice(-80);
    }

    await applyShiprocketStatusToOrder(order, {
      statusText: currentStatus,
      statusCode,
      awb: awb || null,
      courierName: payload.courier_name || null,
      shipmentId: shipmentId || null,
      srOrderId: srOrderId || null,
      etd: payload.etd || null,
      source: 'Shiprocket Webhook'
    });

    if (payload.pickup_scheduled_date && !sr.pickupScheduled) {
      sr.pickupScheduled = true;
    }

    order.markModified('shiprocket');
    await order.save();

    return {
      matched: true,
      duplicate: false,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      shiprocketStatus: sr.status,
      isRto: sr.isRto
    };
  }
}

export const shiprocketFulfillmentService = new ShiprocketFulfillmentService();
export default shiprocketFulfillmentService;
