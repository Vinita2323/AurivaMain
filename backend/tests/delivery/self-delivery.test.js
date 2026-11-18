import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  boot, shutdown, resetDb, call,
  makeCustomer, makeAdmin, makeProduct, addToCart, completePrepaidPurchase,
  Address, Order, Wallet
} from '../helpers/harness.js';
import Settings from '../../src/models/Settings.js';
import settingsService from '../../src/services/settingsService.js';
import shiprocketService from '../../src/services/shiprocketFulfillmentService.js';
import { __setGeocoderForTests, classifyDelivery } from '../../src/services/deliveryMethodService.js';

// ---- deterministic geography (no OpenStreetMap calls). Warehouse default pincode is 131001 (Sonipat).
const PLACES = {
  '131001': { lat: 28.99, lon: 77.02 },   // warehouse
  '131002': { lat: 29.0, lon: 77.03 },    // ~1.5 km away
  '131027': { lat: 29.12, lon: 77.1 },    // ~16 km away
  '110001': { lat: 28.63, lon: 77.22 },   // Delhi, ~42 km away
  '560001': { lat: 12.97, lon: 77.59 }    // far away
};
const fakeGeocoder = async ({ pincode }) => {
  if (PLACES[pincode]) return { ...PLACES[pincode], basis: 'pincode' };
  if (pincode === '700001') return { lat: 28.995, lon: 77.025, basis: 'city' };        // coarse city-centre fallback next to the warehouse
  if (pincode === '700002') return { lat: 0, lon: 0, basis: 'pincode' };               // invalid "null island"
  if (pincode === '700003') throw new Error('geocoder down');
  return null;                                                                          // unknown pincode
};

// ---- Shiprocket spy: counts shipment creations and pretends credentials exist
let created = [];
const realCreate = shiprocketService.constructor.prototype.createShipmentForOrder;
const originalIsReady = shiprocketService.isReady;
const originalCreate = shiprocketService.createShipmentForOrder;

before(async () => {
  await boot();
  __setGeocoderForTests(fakeGeocoder);
});
after(async () => {
  __setGeocoderForTests(null);
  shiprocketService.isReady = originalIsReady;
  shiprocketService.createShipmentForOrder = originalCreate;
  await shutdown();
});
beforeEach(async () => {
  await resetDb();
  settingsService.clearCache();
  created = [];
  shiprocketService.isReady = () => true;
  shiprocketService.createShipmentForOrder = async (id) => {
    created.push(String(id));
    return { alreadyExists: false, shiprocket: {} };
  };
});

// ---------------------------------------------------------------- helpers
async function configure(patch) {
  await settingsService.getSettings();
  await Settings.updateOne({ configKey: 'default_store_settings' }, { $set: patch }, { upsert: true });
  settingsService.clearCache();
}
const enableSelf = (extra = {}) =>
  configure({ selfDelivery: { enabled: true, pincodes: ['452001'], maxRadiusKm: 0, deliveryCharge: 25, freeDeliveryThreshold: null, ...extra } });

async function addressWithPin(customer, pin, extra = {}) {
  const a = await Address.create({
    user: customer.user._id, fullName: 'Test Customer', phoneNumber: customer.user.phone, addressLine1: '5 Other Street',
    city: 'Somewhere', state: 'Some State', postalCode: pin, addressType: 'home', ...extra
  });
  return String(a._id);
}
const quote = async (pincode, { paymentMethod = 'COD', subtotal = 200 } = {}) =>
  (await call('GET', `/api/v1/shipping/quote?pincode=${pincode}&paymentMethod=${paymentMethod}&subtotal=${subtotal}`)).body.data.quote;

async function placeOrderTo(pin, { cod = true, price = 200, extra = {}, paymentMethod = 'COD' } = {}) {
  const c = await makeCustomer({ cod });
  const addressId = pin ? await addressWithPin(c, pin) : c.addressId;
  await addToCart(c, await makeProduct({ price, stock: 30 }), 1);
  const res = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId, paymentMethod, ...extra } });
  assert.equal(res.status, 201, res.text);
  return { c, admin: await makeAdmin(), res, order: await Order.findById(res.body.data.order._id), addressId };
}
const setStatus = (admin, order, status) => call('PATCH', `/api/v1/admin/orders/${order._id}/status`, { token: admin.token, body: { status } });
const walk = async (admin, order, steps) => { let last; for (const s of steps) last = await setStatus(admin, order, s); return last; };
const override = (admin, order, deliveryMethod, reason = 'customer asked for courier') =>
  call('PATCH', `/api/v1/admin/orders/${order._id}/delivery-method`, { token: admin.token, body: { deliveryMethod, reason } });

// ================================================================ 1-5 classification
describe('1-5  delivery method detection', () => {
  it('1  pincode in the local list -> SELF (stored on the order with source AUTO / PINCODE)', async () => {
    await enableSelf();
    const q = await quote('452001');
    assert.equal(q.deliveryMethod, 'SELF');
    const { order } = await placeOrderTo(null);            // default test address is 452001
    assert.equal(order.deliveryMethod, 'SELF');
    assert.equal(order.deliveryMethodSource, 'AUTO');
    assert.equal(order.deliveryMethodMatchedBy, 'PINCODE');
    assert.equal(order.delivery.type, 'Local Delivery');
  });

  it('2  customer inside the radius (pincode NOT listed) -> SELF by DISTANCE', async () => {
    await enableSelf({ pincodes: [], maxRadiusKm: 10 });
    const { order } = await placeOrderTo('131002');
    assert.equal(order.deliveryMethod, 'SELF');
    assert.equal(order.deliveryMethodMatchedBy, 'DISTANCE');
    assert.ok(order.deliveryMethodDistanceKm > 0 && order.deliveryMethodDistanceKm <= 10);
  });

  it('2b configured warehouse coordinates are used when present', async () => {
    await configure({ warehouseLatitude: 29.12, warehouseLongitude: 77.1 });   // warehouse moved next to 131027
    await enableSelf({ pincodes: [], maxRadiusKm: 5 });
    assert.equal((await quote('131027')).deliveryMethod, 'SELF');
    assert.equal((await quote('131002')).deliveryMethod, 'SHIPROCKET');
  });

  it('3  outside the radius -> SHIPROCKET', async () => {
    await enableSelf({ pincodes: [], maxRadiusKm: 10 });
    for (const pin of ['131027', '110001', '560001']) {
      assert.equal((await quote(pin)).deliveryMethod, 'SHIPROCKET', pin);
    }
    const { order } = await placeOrderTo('110001');
    assert.equal(order.deliveryMethod, 'SHIPROCKET');
    assert.equal(order.deliveryMethodSource, 'AUTO');
  });

  it('4  non-matching pincode and outside the radius -> SHIPROCKET (and radius 0 means distance matching is off)', async () => {
    await enableSelf({ pincodes: ['452001'], maxRadiusKm: 10 });
    assert.equal((await quote('110001')).deliveryMethod, 'SHIPROCKET');
    await enableSelf({ pincodes: ['452001'], maxRadiusKm: 0 });
    assert.equal((await quote('131002')).deliveryMethod, 'SHIPROCKET');
  });

  it('5  invalid / missing / coarse data never creates a false local match', async () => {
    await enableSelf({ pincodes: [], maxRadiusKm: 50 });
    const cases = {
      'short pincode': '1310',
      'letters': 'ABCDEF',
      'leading zero': '012345',
      'unknown pincode (no coordinates)': '999999',
      'city-centre fallback only': '700001',
      'null-island coordinates': '700002',
      'geocoder throws': '700003'
    };
    for (const [label, pin] of Object.entries(cases)) {
      assert.equal((await classifyDelivery({ pincode: pin })).method, 'SHIPROCKET', label);
    }
    assert.equal((await classifyDelivery({ pincode: '' })).method, 'SHIPROCKET');
    assert.equal((await classifyDelivery({})).method, 'SHIPROCKET');
  });

  it('5b a missing / invalid warehouse location means "unknown" -> SHIPROCKET', async () => {
    await configure({ warehousePincode: '999999' });
    await enableSelf({ pincodes: [], maxRadiusKm: 50 });
    const r = await classifyDelivery({ pincode: '131002' });
    assert.equal(r.method, 'SHIPROCKET');
    assert.equal(r.reason, 'WAREHOUSE_LOCATION_UNKNOWN');
  });

  it('5c customer-supplied address coordinates are NEVER trusted (fake lat/lng near the warehouse)', async () => {
    await enableSelf({ pincodes: [], maxRadiusKm: 10 });
    const c = await makeCustomer({ cod: true });
    const addressId = await addressWithPin(c, '560001', { latitude: 28.99, longitude: 77.02 });
    await addToCart(c, await makeProduct({ price: 200 }), 1);
    const res = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId, paymentMethod: 'COD' } });
    assert.equal(res.status, 201);
    assert.equal((await Order.findById(res.body.data.order._id)).deliveryMethod, 'SHIPROCKET');
  });

  it('5d self delivery switched off (the default) -> SHIPROCKET even for a listed pincode', async () => {
    await configure({ selfDelivery: { enabled: false, pincodes: ['452001'], maxRadiusKm: 10, deliveryCharge: 25 } });
    assert.equal((await quote('452001')).deliveryMethod, 'SHIPROCKET');
    const fresh = await classifyDelivery({ pincode: '452001' });
    assert.equal(fresh.reason, 'SELF_DELIVERY_DISABLED');
  });

  it('city name alone never classifies an order', async () => {
    await enableSelf({ pincodes: [], maxRadiusKm: 0 });
    const c = await makeCustomer({ cod: true });
    const addressId = await addressWithPin(c, '110001', { city: 'Sonipat' });   // same CITY NAME as the warehouse
    await addToCart(c, await makeProduct({ price: 200 }), 1);
    const res = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId, paymentMethod: 'COD' } });
    assert.equal((await Order.findById(res.body.data.order._id)).deliveryMethod, 'SHIPROCKET');
  });
});

// ================================================================ 6-7 delivery charges
describe('6-7  delivery charges', () => {
  it('6  SELF uses the local delivery charge for prepaid and COD alike, and no Shiprocket quote', async () => {
    await enableSelf({ deliveryCharge: 25 });
    for (const paymentMethod of ['COD', 'UPI']) {
      const q = await quote('452001', { paymentMethod, subtotal: 200 });
      assert.equal(q.deliveryMethod, 'SELF');
      assert.equal(q.deliveryFee, 25);
      assert.equal(q.source, 'local');
      assert.equal(q.pickupPincode, null, 'warehouse details are not exposed to customers');
      assert.equal(q.selected.courier, 'Local delivery');
    }
    const { order } = await placeOrderTo(null, { price: 200 });
    assert.equal(order.pricing.deliveryFee, 25);
    assert.equal(order.pricing.total, 200 + 25 + Math.round((200 * 5) / 100));   // price + local fee + 5% GST
  });

  it('6b free above the LOCAL threshold; falls back to the store threshold when none is set', async () => {
    await enableSelf({ deliveryCharge: 25, freeDeliveryThreshold: 150 });
    assert.equal((await quote('452001', { subtotal: 149 })).deliveryFee, 25);
    assert.equal((await quote('452001', { subtotal: 150 })).deliveryFee, 0);
    assert.equal((await quote('452001', { subtotal: 150 })).freeDeliveryApplied, true);
    await enableSelf({ deliveryCharge: 25, freeDeliveryThreshold: null });          // store threshold is 499
    assert.equal((await quote('452001', { subtotal: 498 })).deliveryFee, 25);
    assert.equal((await quote('452001', { subtotal: 499 })).deliveryFee, 0);
  });

  it('6c the fee cannot be influenced by the client (extra body fields are ignored)', async () => {
    await enableSelf({ deliveryCharge: 25 });
    const { order } = await placeOrderTo(null, { extra: { deliveryFee: 0, deliveryMethod: 'SELF', shippingFee: 0, pricing: { deliveryFee: 0 }, deliveryCharge: 0 } });
    assert.equal(order.pricing.deliveryFee, 25);
    const far = await placeOrderTo('110001', { extra: { deliveryMethod: 'SELF', deliveryFee: 0 } });
    assert.equal(far.order.deliveryMethod, 'SHIPROCKET');
    assert.notEqual(far.order.pricing.deliveryFee, 25);
  });

  it('6d the checkout summary uses the local fee for a SELF default address', async () => {
    await enableSelf({ deliveryCharge: 25 });
    const c = await makeCustomer({ cod: true });
    await addToCart(c, await makeProduct({ price: 200 }), 1);
    const res = await call('GET', '/api/v1/checkout/summary', { token: c.token });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.data.shippingQuote.deliveryMethod, 'SELF');
    assert.equal(res.body.data.onlineDeliveryFee, 25);
  });

  it('7  SHIPROCKET orders keep using the existing quote path (store flat fees when live quotes are off)', async () => {
    await enableSelf({ deliveryCharge: 25 });
    const q = await quote('110001', { paymentMethod: 'COD', subtotal: 200 });
    assert.equal(q.deliveryMethod, 'SHIPROCKET');
    assert.equal(q.source, 'settings');
    assert.equal(q.deliveryFee, 60);                                   // existing COD flat fee
    assert.equal((await quote('110001', { paymentMethod: 'UPI', subtotal: 200 })).deliveryFee, 40);   // existing prepaid flat fee
    const { order } = await placeOrderTo('110001', { price: 200 });
    assert.equal(order.pricing.deliveryFee, 60);
  });

  it('7b Shiprocket switched off in Settings -> flat store fees for every Shiprocket order', async () => {
    await configure({ shiprocketEnabled: false });
    const q = await quote('110001', { paymentMethod: 'UPI', subtotal: 200 });
    assert.equal(q.source, 'settings');
    assert.equal(q.deliveryFee, 40);
  });
});

// ================================================================ 8-11, 17 Shiprocket triggers
describe('8-11, 17  Shiprocket creation respects the delivery method', () => {
  const readyForDispatch = (admin, order) => walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED']);
  const manualDispatch = (admin, order) =>
    call('PATCH', `/api/v1/admin/orders/${order._id}/dispatch`, { token: admin.token, body: { courierName: 'Local run', awbNumber: 'L-1' } });

  it('8  SELF + Ready for Dispatch -> no Shiprocket shipment; status still advances', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    const res = await readyForDispatch(admin, order);
    assert.equal(res.status, 200);
    assert.equal((await Order.findById(order._id)).status, 'SHIPPED');
    assert.deepEqual(created, []);
  });

  it('9  SELF + Manual Dispatch -> no Shiprocket shipment; dispatch details are kept', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    const res = await manualDispatch(admin, order);
    assert.equal(res.status, 200);
    const db = await Order.findById(order._id);
    assert.equal(db.status, 'SHIPPED');
    assert.ok(db.dispatchedAt);
    assert.equal(db.courierName, 'Local run');
    assert.equal(db.shiprocket?.orderId || '', '');
    assert.deepEqual(created, []);
  });

  it('10  SHIPROCKET + Ready for Dispatch -> the existing automatic shipment creation still runs (exactly once)', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo('110001');
    assert.equal((await readyForDispatch(admin, order)).status, 200);
    assert.deepEqual(created, [String(order._id)]);
  });

  it('11  SHIPROCKET + Manual Dispatch -> the existing shipment creation still runs', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo('110001');
    assert.equal((await manualDispatch(admin, order)).status, 200);
    assert.deepEqual(created, [String(order._id)]);
  });

  it('10b a legacy order (no deliveryMethod at all) is Shiprocket-managed exactly as before', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);                          // SELF order...
    await Order.collection.updateOne({ _id: order._id }, { $unset: { deliveryMethod: '', deliveryMethodSource: '', deliveryMethodMatchedBy: '' } });   // ...made to look historical
    assert.equal((await readyForDispatch(admin, order)).status, 200);
    assert.deepEqual(created, [String(order._id)]);
  });

  it('17  repeated status updates / dispatch calls never create a second shipment for SELF, and never bypass the guard', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    await readyForDispatch(admin, order);
    await manualDispatch(admin, order);
    await manualDispatch(admin, order);
    await setStatus(admin, order, 'OUT_FOR_DELIVERY');
    assert.deepEqual(created, []);
  });

  it('8b the REAL createShipmentForOrder refuses a SELF order before touching Shiprocket (guard is central)', async () => {
    await enableSelf();
    const { order } = await placeOrderTo(null);
    let apiCalled = false;
    const sc = (await import('../../src/services/shiprocketClient.js')).default;
    const orig = sc.createAdhocOrder;
    sc.createAdhocOrder = async () => { apiCalled = true; return {}; };
    try {
      await assert.rejects(realCreate.call(shiprocketService, order._id), (err) => err.statusCode === 409 && err.code === 'SELF_DELIVERY_ORDER');
      await assert.rejects(realCreate.call(shiprocketService, order._id, { force: true }), (err) => err.code === 'SELF_DELIVERY_ORDER');
    } finally {
      sc.createAdhocOrder = orig;
    }
    assert.equal(apiCalled, false);
  });

  it('8c the manual admin Shiprocket routes (create / fulfill) answer 409 for a SELF order, nothing is created', async () => {
    await enableSelf();
    shiprocketService.createShipmentForOrder = realCreate;                      // use the real method for this test
    const { admin, order } = await placeOrderTo(null);
    for (const path of ['create', 'fulfill']) {
      const res = await call('POST', `/api/v1/admin/shiprocket/orders/${order._id}/${path}`, { token: admin.token, body: {} });
      assert.equal(res.status, 409, path);
      assert.equal(res.body.error?.code, 'SELF_DELIVERY_ORDER');
    }
    assert.equal((await Order.findById(order._id)).shiprocket?.orderId || '', '');
  });

  it('11b the manual Shiprocket route is NOT blocked for a Shiprocket order (reaches the existing logic)', async () => {
    shiprocketService.createShipmentForOrder = realCreate;
    shiprocketService.isReady = () => false;                                    // existing behaviour: 503 when not configured
    const { admin, order } = await placeOrderTo('110001');
    const res = await call('POST', `/api/v1/admin/shiprocket/orders/${order._id}/create`, { token: admin.token, body: {} });
    assert.equal(res.status, 503);
  });

  it('Shiprocket switched off in Settings stops shipment creation for every order; auto-create off stops only the automatic push', async () => {
    const { admin, order } = await placeOrderTo('110001');
    await configure({ shiprocketAutoCreate: false });
    await readyForDispatch(admin, order);
    assert.deepEqual(created, [], 'auto push is off');

    const second = await placeOrderTo('110001');
    shiprocketService.createShipmentForOrder = realCreate;
    shiprocketService.isReady = () => false;
    const manual = await call('POST', `/api/v1/admin/shiprocket/orders/${second.order._id}/create`, { token: admin.token, body: {} });
    assert.equal(manual.status, 503, 'manual creation is still allowed when only auto-create is off');

    await configure({ shiprocketEnabled: false, shiprocketAutoCreate: true });
    const off = await call('POST', `/api/v1/admin/shiprocket/orders/${second.order._id}/create`, { token: admin.token, body: {} });
    assert.equal(off.status, 409);
    assert.equal(off.body.error?.code, 'SHIPROCKET_DISABLED');
  });
});

// ================================================================ 12 admin override
describe('12  admin override of the delivery method', () => {
  it('SELF -> SHIPROCKET: audited (who / why / previous / new / when), the order is then shipped normally', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    const res = await override(admin, order, 'SHIPROCKET', 'bulky parcel, use courier');
    assert.equal(res.status, 200);
    const db = await Order.findById(order._id).lean();
    assert.equal(db.deliveryMethod, 'SHIPROCKET');
    assert.equal(db.deliveryMethodSource, 'ADMIN');
    assert.equal(String(db.deliveryMethodUpdatedBy), admin.id);
    assert.equal(db.deliveryMethodReason, 'bulky parcel, use courier');
    assert.ok(db.deliveryMethodUpdatedAt);
    assert.equal(db.deliveryMethodHistory.length, 1);
    assert.deepEqual([db.deliveryMethodHistory[0].from, db.deliveryMethodHistory[0].to, String(db.deliveryMethodHistory[0].by)], ['SELF', 'SHIPROCKET', admin.id]);
    assert.equal(db.pricing.deliveryFee, 25, 'charges already agreed with the customer are not changed');
    await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED']);
    assert.deepEqual(created, [String(order._id)]);
  });

  it('SHIPROCKET -> SELF while no shipment exists: allowed, and no shipment is created afterwards', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo('110001');
    assert.equal((await override(admin, order, 'SELF', 'we will hand-deliver')).status, 200);
    await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED']);
    assert.deepEqual(created, []);
  });

  it('SHIPROCKET -> SELF is REFUSED (409, nothing changed) once a Shiprocket shipment exists', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo('110001');
    await Order.updateOne({ _id: order._id }, { $set: { 'shiprocket.orderId': 'SR-1', 'shiprocket.shipmentId': 'SH-1' } });
    const res = await override(admin, order, 'SELF');
    assert.equal(res.status, 409);
    assert.equal(res.body.error?.code, 'SHIPMENT_EXISTS');
    const db = await Order.findById(order._id).lean();
    assert.equal(db.deliveryMethod, 'SHIPROCKET');
    assert.equal(db.shiprocket.shipmentId, 'SH-1');
    assert.equal((db.deliveryMethodHistory || []).length, 0);
  });

  it('a reason is required; same method / invalid method / delivered / cancelled orders are rejected without any change', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    for (const body of [{ deliveryMethod: 'SHIPROCKET' }, { deliveryMethod: 'SHIPROCKET', reason: 'ab' }, { deliveryMethod: 'DRONE', reason: 'valid reason' }, { reason: 'valid reason' }]) {
      const r = await call('PATCH', `/api/v1/admin/orders/${order._id}/delivery-method`, { token: admin.token, body });
      assert.equal(r.status, 400, JSON.stringify(body));
    }
    assert.equal((await override(admin, order, 'SELF')).status, 409);
    assert.equal((await Order.findById(order._id)).deliveryMethod, 'SELF');

    await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']);
    assert.equal((await override(admin, order, 'SHIPROCKET')).status, 400);
    const other = await placeOrderTo(null);
    await call('PATCH', `/api/v1/admin/orders/${other.order._id}/cancel`, { token: other.admin.token, body: { reason: 'test cancel' } });
    assert.equal((await override(other.admin, other.order, 'SHIPROCKET')).status, 400);
  });

  it('only an admin can override: customers (even the order owner) and anonymous callers are rejected', async () => {
    await enableSelf();
    const { c, order } = await placeOrderTo(null);
    const body = { deliveryMethod: 'SHIPROCKET', reason: 'try to change my own' };
    assert.equal((await call('PATCH', `/api/v1/admin/orders/${order._id}/delivery-method`, { token: c.token, body })).status, 403);
    assert.equal((await call('PATCH', `/api/v1/admin/orders/${order._id}/delivery-method`, { body })).status, 401);
    assert.equal((await Order.findById(order._id)).deliveryMethod, 'SELF');
  });

  it('concurrent identical overrides: exactly one applies and one history row is written', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    const results = await Promise.all([1, 2, 3].map(() => override(admin, order, 'SHIPROCKET')));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.equal((await Order.findById(order._id)).deliveryMethodHistory.length, 1);
  });

  it('the delivery method never changes silently: settings changes and status updates do not re-classify an existing order', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    await configure({ selfDelivery: { enabled: false, pincodes: [], maxRadiusKm: 0, deliveryCharge: 99 } });
    await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED']);
    const db = await Order.findById(order._id);
    assert.equal(db.deliveryMethod, 'SELF');
    assert.equal(db.deliveryMethodSource, 'AUTO');
    assert.deepEqual(created, []);
  });
});

// ================================================================ admin list / settings
describe('admin order list filter and delivery settings', () => {
  it('filter by delivery method; legacy orders count as SHIPROCKET', async () => {
    await enableSelf();
    const a = await placeOrderTo(null);                       // SELF
    const b = await placeOrderTo('110001');                   // SHIPROCKET
    const legacy = await placeOrderTo(null);
    await Order.collection.updateOne({ _id: legacy.order._id }, { $unset: { deliveryMethod: '' } });
    const ids = async (qs) => (await call('GET', `/api/v1/admin/orders?limit=50${qs}`, { token: a.admin.token })).body.data.orders.map((o) => String(o._id));
    assert.deepEqual(await ids('&deliveryMethod=SELF'), [String(a.order._id)]);
    assert.deepEqual((await ids('&deliveryMethod=SHIPROCKET')).sort(), [String(b.order._id), String(legacy.order._id)].sort());
    assert.equal((await ids('')).length, 3);
    const listed = (await call('GET', '/api/v1/admin/orders?deliveryMethod=SELF', { token: a.admin.token })).body.data.orders[0];
    assert.equal(listed.deliveryMethod, 'SELF');
  });

  it('settings: saved in MongoDB, validated, de-duplicated; invalid values rejected; customers cannot read or write them', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    const ok = await call('PUT', '/api/v1/admin/settings', {
      token: admin.token,
      body: {
        warehouseLatitude: 22.7196, warehouseLongitude: 75.8577,
        shiprocketEnabled: true, shiprocketAutoCreate: false,
        selfDelivery: { enabled: true, pincodes: ['452001', '452001', ' 452002 ', '452010'], maxRadiusKm: 10, deliveryCharge: 30, freeDeliveryThreshold: 300 }
      }
    });
    assert.equal(ok.status, 200, ok.text);
    const db = await Settings.findOne({ configKey: 'default_store_settings' }).lean();
    assert.deepEqual(db.selfDelivery.pincodes, ['452001', '452002', '452010']);
    assert.equal(db.selfDelivery.maxRadiusKm, 10);
    assert.equal(db.selfDelivery.deliveryCharge, 30);
    assert.equal(db.selfDelivery.freeDeliveryThreshold, 300);
    assert.equal(db.warehouseLatitude, 22.7196);
    assert.equal(db.shiprocketAutoCreate, false);

    const bad = [
      { selfDelivery: { pincodes: ['12345'] } },
      { selfDelivery: { pincodes: ['abcdef'] } },
      { selfDelivery: { maxRadiusKm: -1 } },
      { selfDelivery: { deliveryCharge: 'free' } },
      { selfDelivery: { enabled: 'yes' } },
      { warehouseLatitude: 123 },
      { warehouseLongitude: 'x' },
      { shiprocketEnabled: 'no' }
    ];
    for (const body of bad) {
      const r = await call('PUT', '/api/v1/admin/settings', { token: admin.token, body });
      assert.equal(r.status, 422, JSON.stringify(body));
    }
    assert.equal((await call('PUT', '/api/v1/admin/settings', { token: c.token, body: { selfDelivery: { enabled: false } } })).status, 403);
    const pub = await call('GET', '/api/v1/settings');
    assert.equal(pub.status, 200);
    assert.equal(JSON.stringify(pub.body).includes('selfDelivery'), false, 'public settings must not expose delivery configuration');
    assert.equal(JSON.stringify(pub.body).includes('warehouseLatitude'), false);
  });

  it('a partial settings update keeps the rest of the self-delivery block', async () => {
    const admin = await makeAdmin();
    await call('PUT', '/api/v1/admin/settings', { token: admin.token, body: { selfDelivery: { enabled: true, pincodes: ['452001'], maxRadiusKm: 8, deliveryCharge: 20 } } });
    await call('PUT', '/api/v1/admin/settings', { token: admin.token, body: { selfDelivery: { deliveryCharge: 35 } } });
    const sd = (await Settings.findOne({ configKey: 'default_store_settings' }).lean()).selfDelivery;
    assert.deepEqual([sd.enabled, sd.pincodes, sd.maxRadiusKm, sd.deliveryCharge], [true, ['452001'], 8, 35]);
  });
});

// ================================================================ 13-16 compatibility
describe('13-16  history, tracking, payments and status flow keep working', () => {
  it('13  an order with no deliveryMethod field loads, lists, tracks and advances exactly as before', async () => {
    const { c, admin, order } = await placeOrderTo('110001');
    await Order.collection.updateOne({ _id: order._id }, { $unset: { deliveryMethod: '', deliveryMethodSource: '', deliveryMethodMatchedBy: '', deliveryMethodUpdatedAt: '', deliveryMethodReason: '' } });
    assert.equal((await call('GET', `/api/v1/orders/${order._id}`, { token: c.token })).status, 200);
    assert.equal((await call('GET', `/api/v1/admin/orders/${order._id}`, { token: admin.token })).status, 200);
    assert.equal((await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'])).status, 200);
    assert.equal((await Order.findById(order._id)).status, 'DELIVERED');
  });

  it('14  customer tracking works for both methods; admin-only classification details are not exposed', async () => {
    await enableSelf();
    const self = await placeOrderTo(null);
    const ship = await placeOrderTo('110001');
    await override(self.admin, self.order, 'SELF', 'noop').catch(() => {});   // (same method -> 409, ignored)
    for (const [label, o, expected] of [['self', self, 'SELF'], ['shiprocket', ship, 'SHIPROCKET']]) {
      const res = await call('GET', `/api/v1/orders/${o.order._id}`, { token: o.c.token });
      assert.equal(res.status, 200, label);
      const body = res.body.data.order;
      assert.equal(body.deliveryMethod, expected);
      assert.ok(Array.isArray(body.timeline) && body.timeline.length > 0);
      for (const hidden of ['deliveryMethodReason', 'deliveryMethodHistory', 'deliveryMethodUpdatedBy', 'deliveryMethodSource', 'deliveryMethodMatchedBy', 'deliveryMethodDistanceKm']) {
        assert.equal(hidden in body, false, `${label}: ${hidden} must not be sent to customers`);
      }
      const list = (await call('GET', '/api/v1/orders', { token: o.c.token })).body.data.orders[0];
      assert.equal('deliveryMethodReason' in list, false);
      assert.equal(res.body.data.order.shiprocket !== undefined, true, 'existing tracking data is unchanged');
    }
    const adminView = (await call('GET', `/api/v1/admin/orders/${self.order._id}`, { token: self.admin.token })).body.data.order;
    assert.equal(adminView.deliveryMethodSource, 'AUTO');
    assert.equal(adminView.deliveryMethodMatchedBy, 'PINCODE');
  });

  it('14b the place-order response carries deliveryMethod but no admin-only details', async () => {
    await enableSelf();
    const { res } = await placeOrderTo(null);
    assert.equal(res.body.data.order.deliveryMethod, 'SELF');
    assert.equal('deliveryMethodReason' in res.body.data.order, false);
  });

  it('15  COD, online (prepaid, full Razorpay flow) and wallet orders all work for a SELF address, with the local fee', async () => {
    await enableSelf({ deliveryCharge: 25 });
    // COD
    const cod = await placeOrderTo(null);
    assert.equal(cod.order.payment.method, 'COD');
    assert.equal(cod.order.deliveryMethod, 'SELF');
    // Online: the amount the customer pays (session) must equal the order total (no PAID_AMOUNT_MISMATCH)
    const c = await makeCustomer({ cod: false });
    const { order, payment } = await completePrepaidPurchase(c, await makeProduct({ price: 200 }), 1);
    assert.equal(order.deliveryMethod, 'SELF');
    assert.equal(order.payment.status, 'PAID');
    assert.equal(order.pricing.deliveryFee, 25);
    assert.equal(payment.amount, order.pricing.total);
    // Wallet covering everything
    const w = await makeCustomer({ cod: false });
    const admin = await makeAdmin();
    await call('POST', `/api/v1/admin/wallets/${w.id}/adjust`, { token: admin.token, body: { type: 'CREDIT', amount: 5000, note: 'credit' } });
    await addToCart(w, await makeProduct({ price: 200 }), 1);
    const res = await call('POST', '/api/v1/orders', { token: w.token, body: { addressId: w.addressId, paymentMethod: 'COD', useWallet: true } });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.order.payment.method, 'WALLET');
    assert.equal((await Order.findById(res.body.data.order._id)).deliveryMethod, 'SELF');
    assert.ok((await Wallet.findOne({ user: w.user._id })).balance < 5000);
  });

  it('15b online payments for a SHIPROCKET address are unchanged', async () => {
    await enableSelf();
    const c = await makeCustomer({ cod: false });
    const addr = await addressWithPin(c, '110001');
    await Address.updateMany({ user: c.user._id }, { isDefault: false });
    await Address.updateOne({ _id: addr }, { isDefault: true });
    c.addressId = addr;
    const { order, payment } = await completePrepaidPurchase(c, await makeProduct({ price: 200 }), 1);
    assert.equal(order.deliveryMethod, 'SHIPROCKET');
    assert.equal(order.pricing.deliveryFee, 40);
    assert.equal(payment.amount, order.pricing.total);
  });

  it('16  the existing status workflow is unchanged for SELF orders (valid steps work, invalid ones are still refused, COD paid on delivery)', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    assert.equal((await setStatus(admin, order, 'DELIVERED')).status, 400);   // CONFIRMED -> DELIVERED is not an allowed step...
    const db0 = await Order.findById(order._id);
    assert.equal(db0.status, 'CONFIRMED', '...so the order must not have moved');
    for (const [s, expected] of [['ACCEPTED', 'ACCEPTED'], ['PACKED', 'PACKED'], ['SHIPPED', 'SHIPPED'], ['OUT_FOR_DELIVERY', 'OUT_FOR_DELIVERY'], ['DELIVERED', 'DELIVERED']]) {
      assert.equal((await setStatus(admin, order, s)).status, 200, s);
      assert.equal((await Order.findById(order._id)).status, expected);
    }
    const done = await Order.findById(order._id);
    assert.equal(done.payment.status, 'PAID');
    assert.equal(done.deliveryMethod, 'SELF');
    assert.equal((await setStatus(admin, order, 'ACCEPTED')).status, 400);   // terminal
  });

  it('SELF orders can be cancelled through the existing flow (stock restored)', async () => {
    await enableSelf();
    const { admin, order } = await placeOrderTo(null);
    const res = await call('PATCH', `/api/v1/admin/orders/${order._id}/cancel`, { token: admin.token, body: { reason: 'out of area today' } });
    assert.equal(res.status, 200);
    assert.equal((await Order.findById(order._id)).status, 'CANCELLED');
  });
});
