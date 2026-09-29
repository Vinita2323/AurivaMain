import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import settingsService from './settingsService.js';
import shiprocketClient from './shiprocketClient.js';
import env from '../config/env.js';
import { updateOrderTimeline } from './orderService.js';

/**
 * Parse pack label like "150g" / "300 g" / "0.5kg" into kilograms.
 * Returns null if unparseable (caller must treat as missing).
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
 * Resolve package weight/dimensions for an order item + product doc.
 * Throws with clear admin-facing message when data is missing.
 */
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
    missing.push(`weight (set product.shippingWeightKg or pack weight like "150g", or SHIPROCKET_DEFAULT_WEIGHT_KG)`);
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
  if (!order.shiprocket) {
    order.shiprocket = {};
  }
  if (!Array.isArray(order.shiprocket.processedWebhookIds)) {
    order.shiprocket.processedWebhookIds = [];
  }
  return order.shiprocket;
}

/**
 * Map Shiprocket shipment status strings → Auriva order status enum.
 */
export function mapShiprocketStatusToOrderStatus(srStatus) {
  if (!srStatus) return null;
  const s = String(srStatus).trim().toUpperCase().replace(/[_-]+/g, ' ');

  if (s.includes('DELIVERED') && !s.includes('RTO') && !s.includes('RETURN')) return 'DELIVERED';
  if (s.includes('OUT FOR DELIVERY') || s.includes('OFD')) return 'OUT_FOR_DELIVERY';
  if (
    s.includes('IN TRANSIT') ||
    s.includes('SHIPPED') ||
    s.includes('PICKED UP') ||
    s.includes('PICKUP') ||
    s.includes('IN TRANSIT') ||
    s.includes('REACHED') ||
    s.includes('DISPATCHED')
  ) {
    return 'SHIPPED';
  }
  if (s.includes('PACKED') || s.includes('READY TO SHIP') || s.includes('LABEL')) return 'PACKED';
  if (s.includes('CANCEL')) return 'CANCELLED';
  if (s.includes('RTO') || s.includes('RETURN')) {
    // Fine-grained RTO/return stays on shiprocket.status; order moves to CANCELLED when RTO completed
    if (s.includes('DELIVERED') || s.includes('COMPLETED') || s === 'RETURNED') return 'CANCELLED';
    return null;
  }
  if (s.includes('NEW') || s.includes('CREATED') || s.includes('PROCESSING')) return 'PROCESSING';
  return null;
}

class ShiprocketFulfillmentService {
  isReady() {
    return shiprocketClient.isConfigured();
  }

  /**
   * Build pickup context from Settings warehouse (Profile page) first, then env.
   * Never uses the customer's shipping address.
   */
  async getPickupContext(overrideLocationName) {
    const settings = await settingsService.getSettings();
    return {
      // Shiprocket dashboard nickname (must match a registered pickup location)
      pickupLocationName:
        overrideLocationName ||
        env.SHIPROCKET.PICKUP_LOCATION ||
        'Primary',
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
   * Create Shiprocket order + shipment from existing MongoDB order.
   * Idempotent when shiprocket.orderId / shipmentId already exist.
   */
  async createShipmentForOrder(orderId, options = {}) {
    if (!this.isReady()) {
      const err = new Error('Shiprocket credentials are not configured on the server.');
      err.statusCode = 503;
      throw err;
    }

    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);

    if (sr.orderId && sr.shipmentId && !options.force) {
      return {
        alreadyExists: true,
        message: 'Shiprocket shipment already exists for this order.',
        order,
        shiprocket: sr
      };
    }

    if (order.status === 'CANCELLED') {
      const err = new Error('Cannot create Shiprocket shipment for a cancelled order.');
      err.statusCode = 400;
      throw err;
    }

    const addr = order.shippingAddress;
    if (!addr?.postalCode || !addr?.addressLine1 || !addr?.city || !addr?.state || !addr?.phoneNumber) {
      const err = new Error(
        'Invalid customer shipping address on order. Required: addressLine1, city, state, postalCode, phoneNumber.'
      );
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
      const err = new Error(`Invalid customer phone "${addr.phoneNumber}". Need a 10-digit mobile number.`);
      err.statusCode = 400;
      throw err;
    }

    const isCod = String(order.payment?.method || '').toUpperCase() === 'COD';
    const paymentMethod = isCod ? 'COD' : 'Prepaid';
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
      billing_email: options.customerEmail || 'care@aurivafoods.com',
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
      payment_method: paymentMethod,
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
          result?.message || 'Shiprocket did not return order_id/shipment_id. Check pickup location name and payload.'
        );
        err.statusCode = 502;
        err.shiprocket = result;
        throw err;
      }

      sr.orderId = srOrderId;
      sr.shipmentId = shipmentId;
      sr.status = String(status);
      sr.channelOrderId = String(order.orderNumber);
      sr.pickupLocation = pickup.pickupLocationName;
      sr.errorMessage = '';
      sr.lastUpdatedAt = new Date();
      sr.lastSyncedAt = new Date();
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
    const w = weight || Number(order.shiprocket?.weight) || env.SHIPROCKET.DEFAULT_WEIGHT_KG || 0.5;

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
      // Prefer recommended courier from serviceability
      try {
        const svc = await this.checkServiceabilityForOrder(orderId);
        const recommended =
          svc.couriers?.find((c) => c.recommended_by) ||
          svc.couriers?.[0];
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
      response?.awb_code ||
      response?.awb ||
      result?.awb_code ||
      '';
    const courierName =
      response?.courier_name ||
      response?.courier_company ||
      result?.courier_name ||
      '';
    const cId =
      response?.courier_company_id ||
      response?.courier_id ||
      selectedCourierId ||
      null;

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
    sr.status = response?.status || sr.status || 'AWB_GENERATED';
    sr.trackingUrl =
      response?.tracking_url ||
      `https://shiprocket.co/tracking/${sr.awbCode}`;
    sr.lastUpdatedAt = new Date();
    sr.errorMessage = '';

    // Mirror into existing dispatch fields used by customer UI
    order.courierName = sr.courierName || order.courierName;
    order.awbNumber = sr.awbCode;
    if (['CONFIRMED', 'PACKED', 'PROCESSING'].includes(order.status)) {
      order.status = 'PACKED';
      try {
        const settings = await settingsService.getSettings();
        updateOrderTimeline(
          order,
          'PACKED',
          settings.warehouseName || 'Warehouse',
          `AWB ${sr.awbCode} assigned via Shiprocket (${sr.courierName || 'courier'})`
        );
      } catch (_) { /* timeline helper optional */ }
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

    const result = await shiprocketClient.generatePickup([sr.shipmentId]);
    sr.pickupScheduled = true;
    sr.status = result?.pickup_status || sr.status || 'PICKUP_SCHEDULED';
    sr.lastUpdatedAt = new Date();
    sr.errorMessage = '';

    if (['CONFIRMED', 'PACKED', 'PROCESSING'].includes(order.status)) {
      order.status = 'SHIPPED';
      order.dispatchedAt = order.dispatchedAt || new Date();
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
      } catch (_) { /* ignore */ }
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
      (Array.isArray(result?.not_created) ? '' : '') ||
      sr.labelUrl;

    if (labelUrl) {
      sr.labelUrl = labelUrl;
    }
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

  async trackShipment(orderId) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.awbCode && !sr.shipmentId) {
      const err = new Error('No AWB/shipment to track for this order.');
      err.statusCode = 400;
      throw err;
    }

    let raw = null;
    if (sr.awbCode) {
      raw = await shiprocketClient.trackByAwb(sr.awbCode);
    }

    const trackingData = raw?.tracking_data || raw?.data || raw;
    const currentStatus =
      trackingData?.shipment_status ||
      trackingData?.track_status ||
      trackingData?.shipment_track?.[0]?.current_status ||
      sr.status;

    if (currentStatus) {
      sr.status = String(currentStatus);
      sr.lastSyncedAt = new Date();
      sr.lastUpdatedAt = new Date();
      order.markModified('shiprocket');
      await order.save();
    }

    return {
      orderNumber: order.orderNumber,
      awbCode: sr.awbCode,
      courierName: sr.courierName,
      status: sr.status,
      trackingUrl: sr.trackingUrl,
      tracking: trackingData,
      raw
    };
  }

  async cancelShipment(orderId) {
    const order = await loadOrder(orderId);
    const sr = ensureShiprocketSubdoc(order);
    if (!sr.awbCode && !sr.orderId) {
      const err = new Error('No Shiprocket shipment/AWB to cancel.');
      err.statusCode = 400;
      throw err;
    }

    let raw = null;
    if (sr.awbCode) {
      raw = await shiprocketClient.cancelShipment([sr.awbCode]);
    } else if (sr.orderId) {
      raw = await shiprocketClient.cancelOrderByIds([sr.orderId]);
    }

    sr.status = 'CANCELLED';
    sr.lastUpdatedAt = new Date();
    sr.errorMessage = '';
    order.markModified('shiprocket');
    await order.save();

    return { message: 'Shiprocket cancellation requested.', order, shiprocket: sr, raw };
  }

  /**
   * Full happy-path: create → AWB → pickup → label (best-effort after create).
   */
  async fulfillOrder(orderId, options = {}) {
    const created = await this.createShipmentForOrder(orderId, options);
    let awb = null;
    let pickup = null;
    let label = null;

    try {
      awb = await this.assignCourierAndGenerateAwb(orderId, { courierId: options.courierId });
    } catch (e) {
      console.warn('[Shiprocket] AWB step failed:', e.message);
      return { created, awbError: e.message, order: created.order };
    }

    try {
      pickup = await this.schedulePickup(orderId);
    } catch (e) {
      console.warn('[Shiprocket] Pickup step failed:', e.message);
    }

    try {
      label = await this.generateLabel(orderId);
    } catch (e) {
      console.warn('[Shiprocket] Label step failed:', e.message);
    }

    const order = await loadOrder(orderId);
    return { created, awb, pickup, label, order };
  }

  /**
   * Fire-and-forget helper used after payment / COD place.
   */
  async tryAutoCreate(orderId) {
    if (!env.SHIPROCKET.AUTO_CREATE || !this.isReady()) return null;
    try {
      return await this.createShipmentForOrder(orderId);
    } catch (err) {
      console.warn('[Shiprocket] Auto-create skipped/failed:', err.message);
      return { error: err.message };
    }
  }

  /**
   * Process Shiprocket webhook payload and update MongoDB order.
   */
  async handleWebhook(payload = {}, { webhookId } = {}) {
    const awb =
      payload.awb ||
      payload.awb_code ||
      payload.awb_number ||
      payload?.current_status_payload?.awb ||
      '';
    const shipmentId = String(
      payload.shipment_id || payload.shipmentId || payload?.sr_order_id || ''
    );
    const channelOrderId = String(
      payload.order_id ||
        payload.channel_order_id ||
        payload.order_ids?.[0] ||
        ''
    );
    const currentStatus =
      payload.current_status ||
      payload.shipment_status ||
      payload.status ||
      payload?.current_status_payload?.current_status ||
      '';

    const eventKey =
      webhookId ||
      payload.sr_order_id ||
      `${awb || shipmentId || channelOrderId}:${currentStatus}:${payload.current_timestamp || payload.timestamp || Date.now()}`;

    let order = null;
    if (awb) {
      order = await Order.findOne({
        $or: [{ 'shiprocket.awbCode': String(awb) }, { awbNumber: String(awb) }]
      });
    }
    if (!order && shipmentId) {
      order = await Order.findOne({ 'shiprocket.shipmentId': shipmentId });
    }
    if (!order && channelOrderId) {
      order = await Order.findOne({
        $or: [
          { orderNumber: channelOrderId },
          { 'shiprocket.orderId': channelOrderId },
          { 'shiprocket.channelOrderId': channelOrderId }
        ]
      });
    }

    if (!order) {
      console.warn('[Shiprocket Webhook] No matching order for payload keys', {
        awb: awb ? '[present]' : '',
        shipmentId,
        channelOrderId,
        currentStatus
      });
      return { matched: false, message: 'No matching order found' };
    }

    const sr = ensureShiprocketSubdoc(order);
    if (sr.processedWebhookIds.includes(String(eventKey))) {
      return { matched: true, duplicate: true, orderNumber: order.orderNumber };
    }

    // Cap stored webhook ids
    sr.processedWebhookIds = [...sr.processedWebhookIds, String(eventKey)].slice(-50);
    if (awb) sr.awbCode = String(awb);
    if (shipmentId) sr.shipmentId = shipmentId;
    if (currentStatus) sr.status = String(currentStatus);
    if (payload.status_code != null) sr.statusCode = Number(payload.status_code);
    if (payload.courier_name) sr.courierName = String(payload.courier_name);
    sr.lastSyncedAt = new Date();
    sr.lastUpdatedAt = new Date();

    if (sr.awbCode && !order.awbNumber) order.awbNumber = sr.awbCode;
    if (sr.courierName && !order.courierName) order.courierName = sr.courierName;

    const mapped = mapShiprocketStatusToOrderStatus(currentStatus);
    if (mapped && mapped !== order.status) {
      const allowedFrom = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PACKED', 'PROCESSING', 'SHIPPED', 'CANCELLED'],
        PACKED: ['SHIPPED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
        PROCESSING: ['PACKED', 'SHIPPED', 'CANCELLED'],
        SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
        OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
        DELIVERED: [],
        CANCELLED: []
      };
      const canMove =
        mapped === order.status ||
        (allowedFrom[order.status] || []).includes(mapped) ||
        // Allow forward jumps that Shiprocket may skip
        (order.status === 'CONFIRMED' && ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(mapped)) ||
        (order.status === 'PACKED' && ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(mapped)) ||
        (order.status === 'PROCESSING' && ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(mapped)) ||
        (order.status === 'SHIPPED' && ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(mapped));

      if (canMove) {
        const prev = order.status;
        order.status = mapped;
        if (mapped === 'SHIPPED' || mapped === 'OUT_FOR_DELIVERY') {
          order.delivery.status = mapped === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'In Transit';
          order.dispatchedAt = order.dispatchedAt || new Date();
        }
        if (mapped === 'DELIVERED') {
          order.delivery.status = 'Delivered';
          if (order.payment?.method === 'COD' && order.payment.status !== 'PAID') {
            order.payment.status = 'PAID';
          }
        }
        if (mapped === 'CANCELLED' && prev !== 'CANCELLED') {
          order.cancelledBy = 'SYSTEM';
          order.cancelReason = order.cancelReason || `Shiprocket: ${currentStatus}`;
          order.cancelledAt = new Date();
        }
        try {
          updateOrderTimeline(order, mapped, 'Shiprocket', `Webhook: ${currentStatus}`);
        } catch (_) { /* ignore */ }
      } else {
        console.warn(
          `[Shiprocket Webhook] Status "${currentStatus}" → ${mapped} not applied from ${order.status} (transition blocked). Stored on shiprocket.status only.`
        );
      }
    } else if (currentStatus) {
      console.log(
        `[Shiprocket Webhook] Unmapped/noop status "${currentStatus}" stored on order ${order.orderNumber}`
      );
    }

    order.markModified('shiprocket');
    await order.save();

    return {
      matched: true,
      duplicate: false,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      shiprocketStatus: sr.status
    };
  }
}

export const shiprocketFulfillmentService = new ShiprocketFulfillmentService();
export default shiprocketFulfillmentService;
