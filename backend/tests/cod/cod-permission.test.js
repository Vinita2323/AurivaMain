import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  boot, shutdown, resetDb, call,
  makeCustomer, makeAdmin, makeProduct, addToCart, completePrepaidPurchase,
  User, Order, Product, Wallet, mongoose
} from '../helpers/harness.js';
import CodPermissionAudit from '../../src/models/CodPermissionAudit.js';

before(async () => { await boot(); });
after(async () => { await shutdown(); });
beforeEach(async () => { await resetDb(); });

const MSG = 'Cash on Delivery is not available for your account. Please select another payment method.';
const placeCod = (c, extra = {}) =>
  call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'COD', ...extra } });
const setCod = (admin, customerId, enabled, reason = 'reviewed order history') =>
  call('PATCH', `/api/v1/admin/cod-permissions/${customerId}`, { token: admin.token, body: { enabled, reason } });
const credit = (admin, c, amount) =>
  call('POST', `/api/v1/admin/wallets/${c.id}/adjust`, { token: admin.token, body: { type: 'CREDIT', amount, note: 'test credit' } });
const balance = async (c) => (await Wallet.findOne({ user: c.user._id }))?.balance ?? 0;

async function newCustomerWithCart({ cod = false, price = 300 } = {}) {
  const c = await makeCustomer({ cod });
  const product = await makeProduct({ price, stock: 20 });
  await addToCart(c, product, 1);
  return { c, product };
}

describe('1-2  COD is OFF by default (new and pre-existing customers)', () => {
  it('a new customer has COD disabled and the customer-facing profile exposes only {isEnabled:false}', async () => {
    const c = await makeCustomer({ cod: false });
    const db = await User.findById(c.id).lean();
    assert.equal(db.codAccess.isEnabled, false);
    const res = await call('GET', '/api/v1/auth/user/profile', { token: c.token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.user.codAccess, { isEnabled: false });
  });

  it('a customer created BEFORE the field existed (no codAccess in MongoDB) is treated as disabled', async () => {
    const { c } = await newCustomerWithCart();
    await User.collection.updateOne({ _id: c.user._id }, { $unset: { codAccess: '' } });
    assert.equal((await User.collection.findOne({ _id: c.user._id })).codAccess, undefined);
    const res = await placeCod(c);
    assert.equal(res.status, 403);
    const profile = await call('GET', '/api/v1/auth/user/profile', { token: c.token });
    assert.equal(profile.body.data.user.codAccess.isEnabled, false);
  });
});

describe('5  backend rejects COD for a customer without permission (direct API calls)', () => {
  it('403 with the exact message, and NOTHING is created or consumed', async () => {
    const { c, product } = await newCustomerWithCart();
    const res = await placeCod(c);
    assert.equal(res.status, 403);
    assert.equal(res.body.message, MSG);
    assert.equal(await Order.countDocuments({ user: c.user._id }), 0);
    assert.equal((await Product.findById(product._id)).stockCount, 20);
    const cart = await call('GET', '/api/v1/cart', { token: c.token });
    assert.equal(cart.status, 200);
    assert.equal(JSON.stringify(cart.body).includes(String(product._id)), true, 'cart must be left intact');
  });

  it('a missing / garbage paymentMethod cannot be used to slip in a COD order', async () => {
    const { c } = await newCustomerWithCart();
    const noMethod = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId } });
    assert.equal(noMethod.status, 403);
    for (const paymentMethod of ['cod', 'Cash', 'cash_on_delivery']) {
      const r = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod } });
      assert.notEqual(r.status, 201, `paymentMethod=${paymentMethod}`);
    }
    assert.equal(await Order.countDocuments({ user: c.user._id }), 0);
  });

  it('values sent by the frontend are never trusted (codAccess / trustedPayment / paymentStatus / header tricks)', async () => {
    const { c } = await newCustomerWithCart();
    const res = await placeCod(c, {
      codAccess: { isEnabled: true },
      codEnabled: true,
      isCodEnabled: true,
      trustedPayment: true,
      paymentStatus: 'PAID',
      expectedTotal: 1
    });
    assert.equal(res.status, 403);
    assert.equal(await Order.countDocuments({ user: c.user._id }), 0);
  });

  it('delivery-slot / delivery-type variants (standard and express payloads) are all gated the same way', async () => {
    const { c } = await newCustomerWithCart();
    for (const deliverySlot of [{}, { type: 'standard' }, { type: 'instant', slot: 'now' }]) {
      const r = await placeCod(c, { deliverySlot });
      assert.equal(r.status, 403, JSON.stringify(deliverySlot));
    }
  });

  it('an unauthenticated request cannot place any order', async () => {
    const res = await call('POST', '/api/v1/orders', { body: { addressId: 'x', paymentMethod: 'COD' } });
    assert.equal(res.status, 401);
  });
});

describe('3-4  admin enables / disables COD', () => {
  it('enable -> customer sees COD enabled and can place a COD order; disable -> blocked again; old COD order untouched', async () => {
    const admin = await makeAdmin();
    const { c, product } = await newCustomerWithCart();

    assert.equal((await placeCod(c)).status, 403);

    const en = await setCod(admin, c.id, true, 'good history, 5 delivered orders');
    assert.equal(en.status, 200);
    assert.equal(en.body.data.customer.codAccess.isEnabled, true);
    const profile = await call('GET', '/api/v1/auth/user/profile', { token: c.token });
    assert.deepEqual(profile.body.data.user.codAccess, { isEnabled: true });

    const ok = await placeCod(c);
    assert.equal(ok.status, 201);
    assert.equal(ok.body.data.order.payment.method, 'COD');
    assert.equal((await Product.findById(product._id)).stockCount, 19);
    const placedId = ok.body.data.order._id;

    const dis = await setCod(admin, c.id, false, 'refused two deliveries');
    assert.equal(dis.status, 200);
    assert.deepEqual((await call('GET', '/api/v1/auth/user/profile', { token: c.token })).body.data.user.codAccess, { isEnabled: false });

    await addToCart(c, product, 1);
    const blocked = await placeCod(c);
    assert.equal(blocked.status, 403);

    // 11. the COD order placed while permission was on is unaffected by the revocation
    const old = await Order.findById(placedId);
    assert.equal(old.payment.method, 'COD');
    assert.equal(old.status, 'CONFIRMED');
    const mine = await call('GET', `/api/v1/orders/${placedId}`, { token: c.token });
    assert.equal(mine.status, 200);
  });

  it('6  enabled customer can place a COD order (permission read from the DB each time)', async () => {
    const admin = await makeAdmin();
    const { c } = await newCustomerWithCart();
    await setCod(admin, c.id, true);
    assert.equal((await placeCod(c)).status, 201);
  });

  it('DB state: enabledBy / enabledAt / reason on enable, disabledAt / reason on disable', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer({ cod: false });
    await setCod(admin, c.id, true, 'trusted buyer');
    let u = await User.findById(c.id).lean();
    assert.equal(String(u.codAccess.enabledBy), admin.id);
    assert.ok(u.codAccess.enabledAt);
    assert.equal(u.codAccess.reason, 'trusted buyer');
    await setCod(admin, c.id, false, 'misuse');
    u = await User.findById(c.id).lean();
    assert.equal(u.codAccess.isEnabled, false);
    assert.ok(u.codAccess.disabledAt);
    assert.equal(u.codAccess.reason, 'misuse');
  });
});

describe('7-10  other payment methods are unaffected for a COD-disabled customer', () => {
  it('7  online payment: order via the prepaid checkout flow still works', async () => {
    const c = await makeCustomer({ cod: false });
    const { order, payment } = await completePrepaidPurchase(c, await makeProduct({ price: 250 }), 1);
    assert.equal(order.payment.status, 'PAID');
    assert.notEqual(order.payment.method, 'COD');
    assert.equal(payment.status === 'CAPTURED' || payment.status === 'PAID' || Boolean(payment.status), true);
  });

  it('7b online method on POST /orders is not blocked (pending until paid)', async () => {
    const { c } = await newCustomerWithCart();
    const res = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.order.payment.method, 'UPI');
  });

  it('8  wallet covering the WHOLE order works without COD permission (paid from wallet, no cash)', async () => {
    const admin = await makeAdmin();
    const { c } = await newCustomerWithCart({ price: 300 });
    await credit(admin, c, 5000);
    const res = await placeCod(c, { useWallet: true });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.order.payment.method, 'WALLET');
    assert.equal(res.body.data.order.payment.status, 'PAID');
    assert.ok((await balance(c)) < 5000);
  });

  it('8b wallet covering only PART of the order is a cash order: blocked, and wallet / stock are rolled back', async () => {
    const admin = await makeAdmin();
    const { c, product } = await newCustomerWithCart({ price: 300 });
    await credit(admin, c, 50);
    const res = await placeCod(c, { useWallet: true });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, MSG);
    assert.equal(await balance(c), 50);
    assert.equal((await Product.findById(product._id)).stockCount, 20);
    assert.equal(await Order.countDocuments({ user: c.user._id }), 0);
  });

  it('8c with COD enabled, a partial wallet + cash on delivery still works', async () => {
    const admin = await makeAdmin();
    const { c } = await newCustomerWithCart({ price: 300 });
    await credit(admin, c, 50);
    await setCod(admin, c.id, true);
    const res = await placeCod(c, { useWallet: true });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.order.payment.method, 'COD');
    assert.equal(await balance(c), 0);
  });
});

describe('7  idempotency: a retried request with the same key is not re-evaluated into a duplicate', () => {
  it('same idempotencyKey returns the same order after COD was later revoked (no second order)', async () => {
    const admin = await makeAdmin();
    const { c } = await newCustomerWithCart();
    await setCod(admin, c.id, true);
    const key = 'idem-cod-1';
    const first = await placeCod(c, { idempotencyKey: key });
    assert.equal(first.status, 201);
    await setCod(admin, c.id, false, 'revoked');
    const again = await placeCod(c, { idempotencyKey: key });
    assert.equal(again.status, 201);
    assert.equal(again.body.data.order._id, first.body.data.order._id);
    assert.equal(await Order.countDocuments({ user: c.user._id }), 1);
  });
});

describe('12  audit logging', () => {
  it('every enable / disable writes customer, admin, previous, new, reason and timestamp', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer({ cod: false });
    await setCod(admin, c.id, true, 'reason one');
    await setCod(admin, c.id, false, 'reason two');
    const rows = await CodPermissionAudit.find({ customer: c.user._id }).sort({ createdAt: 1 }).lean();
    assert.equal(rows.length, 2);
    assert.equal(String(rows[0].customer), c.id);
    assert.equal(String(rows[0].admin), admin.id);
    assert.equal(rows[0].adminEmail, admin.admin.email);
    assert.deepEqual([rows[0].action, rows[0].previousEnabled, rows[0].newEnabled, rows[0].reason], ['ENABLE', false, true, 'reason one']);
    assert.deepEqual([rows[1].action, rows[1].previousEnabled, rows[1].newEnabled, rows[1].reason], ['DISABLE', true, false, 'reason two']);
    assert.ok(rows[0].createdAt instanceof Date);
    const detail = await call('GET', `/api/v1/admin/cod-permissions/${c.id}`, { token: admin.token });
    assert.equal(detail.body.data.auditTrail.length, 2);
    assert.equal(detail.body.data.auditTrail[0].reason, 'reason two');
  });

  it('a reason is required; missing/short/non-boolean input changes nothing and writes no audit row', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer({ cod: false });
    for (const body of [{ enabled: true }, { enabled: true, reason: '  ' }, { enabled: true, reason: 'ab' }, { enabled: 'true', reason: 'valid reason' }, { reason: 'valid reason' }, { enabled: true, reason: 'x'.repeat(501) }]) {
      const r = await call('PATCH', `/api/v1/admin/cod-permissions/${c.id}`, { token: admin.token, body });
      assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60));
    }
    assert.equal((await User.findById(c.id).lean()).codAccess.isEnabled, false);
    assert.equal(await CodPermissionAudit.countDocuments(), 0);
  });

  it('setting the state it already has is a 409 and writes no audit row', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer({ cod: false });
    assert.equal((await setCod(admin, c.id, false)).status, 409);
    await setCod(admin, c.id, true);
    assert.equal((await setCod(admin, c.id, true)).status, 409);
    assert.equal(await CodPermissionAudit.countDocuments({ customer: c.user._id }), 1);
  });

  it('two concurrent identical enables: exactly one succeeds and exactly one audit row exists', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer({ cod: false });
    const results = await Promise.all([setCod(admin, c.id, true), setCod(admin, c.id, true), setCod(admin, c.id, true)]);
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.equal(await CodPermissionAudit.countDocuments({ customer: c.user._id }), 1);
  });

  it('unknown / invalid / admin ids are 404', async () => {
    const admin = await makeAdmin();
    assert.equal((await setCod(admin, new mongoose.Types.ObjectId().toString(), true)).status, 404);
    assert.equal((await setCod(admin, 'not-an-id', true)).status, 404);
    assert.equal((await setCod(admin, admin.id, true)).status, 404);
  });
});

describe('13  customers cannot change COD permission', () => {
  it('admin COD endpoints reject customer tokens and anonymous calls', async () => {
    const c = await makeCustomer({ cod: false });
    const other = await makeCustomer({ cod: false });
    assert.equal((await call('PATCH', `/api/v1/admin/cod-permissions/${c.id}`, { token: c.token, body: { enabled: true, reason: 'self grant' } })).status, 403);
    assert.equal((await call('GET', '/api/v1/admin/cod-permissions', { token: c.token })).status, 403);
    assert.equal((await call('GET', `/api/v1/admin/cod-permissions/${other.id}`, { token: c.token })).status, 403);
    assert.equal((await call('PATCH', `/api/v1/admin/cod-permissions/${c.id}`, { body: { enabled: true, reason: 'x y z' } })).status, 401);
    assert.equal((await User.findById(c.id).lean()).codAccess.isEnabled, false);
  });

  it('profile update endpoints ignore codAccess in the body (mass-assignment)', async () => {
    const { c } = await newCustomerWithCart();
    const payload = { name: 'Renamed', codAccess: { isEnabled: true, enabledAt: new Date(), reason: 'hacked' }, 'codAccess.isEnabled': true };
    for (const [method, url] of [['PATCH', '/api/v1/auth/user/profile'], ['PATCH', '/api/v1/users/profile'], ['PUT', '/api/v1/users/profile']]) {
      await call(method, url, { token: c.token, body: payload });
      const db = await User.findById(c.id).lean();
      assert.equal(db.codAccess.isEnabled, false, `${method} ${url}`);
      assert.notEqual(db.codAccess.reason, 'hacked');
    }
    assert.equal((await placeCod(c)).status, 403);
  });
});

describe('admin list / details: statistics, filters, pagination', () => {
  const mkOrder = (c, overrides = {}) => {
    const n = Math.random().toString(36).slice(2, 8).toUpperCase();
    return Order.collection.insertOne({
      orderNumber: `AV-T${n}`,
      user: c.user._id,
      items: [],
      shippingAddress: {},
      pricing: { subtotal: 100, total: 100 },
      payment: { method: 'COD', status: 'PENDING' },
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    });
  };

  async function seedHistory() {
    const trusted = await makeCustomer({ cod: false });   // 4 delivered (2 COD), 1 cancelled  -> eligible
    for (let i = 0; i < 2; i++) await mkOrder(trusted, { status: 'DELIVERED', payment: { method: 'COD', status: 'PAID' } });
    for (let i = 0; i < 2; i++) await mkOrder(trusted, { status: 'DELIVERED', payment: { method: 'UPI', status: 'PAID' } });
    await mkOrder(trusted, { status: 'CANCELLED', cancelReason: 'Changed my mind', cancelledBy: 'CUSTOMER' });
    const risky = await makeCustomer({ cod: false });     // 1 delivered, 1 cancelled, 2 refused (isRto + reason)
    await mkOrder(risky, { status: 'DELIVERED' });
    await mkOrder(risky, { status: 'CANCELLED', cancelReason: 'ordered by mistake' });
    await mkOrder(risky, { status: 'CANCELLED', cancelReason: 'Customer refused to accept the parcel', cancelledBy: 'ADMIN' });
    await mkOrder(risky, { status: 'SHIPPED', shiprocket: { isRto: true } });
    const fresh = await makeCustomer({ cod: false });     // no orders
    const enabled = await makeCustomer({ cod: true });
    return { trusted, risky, fresh, enabled };
  }

  it('counts are exact and never double-count (refused is separate from cancelled and from delivered)', async () => {
    const admin = await makeAdmin();
    const { trusted, risky, fresh } = await seedHistory();
    const list = await call('GET', '/api/v1/admin/cod-permissions?limit=50', { token: admin.token });
    assert.equal(list.status, 200);
    const by = Object.fromEntries(list.body.data.customers.map((x) => [x.id, x]));
    assert.deepEqual(by[trusted.id].stats, { totalOrders: 5, deliveredOrders: 4, cancelledOrders: 1, refusedOrders: 0, codOrders: 3, codDeliveredOrders: 2 });
    assert.deepEqual(by[risky.id].stats, { totalOrders: 4, deliveredOrders: 1, cancelledOrders: 1, refusedOrders: 2, codOrders: 4, codDeliveredOrders: 1 });
    assert.deepEqual(by[fresh.id].stats, { totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0, refusedOrders: 0, codOrders: 0, codDeliveredOrders: 0 });
    for (const x of Object.values(by)) {
      const s = x.stats;
      assert.ok(s.deliveredOrders + s.cancelledOrders + s.refusedOrders <= s.totalOrders);
    }
    assert.equal(by[trusted.id].eligibleForReview, true);
    assert.equal(by[risky.id].eligibleForReview, false);
    assert.equal(by[fresh.id].eligibleForReview, false);
    assert.equal(by[trusted.id].codStatus, 'DISABLED');
  });

  it('search by name / mobile, COD status filter, and the three recommendation filters', async () => {
    const admin = await makeAdmin();
    const { trusted, risky, enabled } = await seedHistory();
    const ids = async (qs) => (await call('GET', `/api/v1/admin/cod-permissions?limit=50&${qs}`, { token: admin.token })).body.data.customers.map((x) => x.id);

    assert.deepEqual(await ids(`search=${trusted.user.phone}`), [trusted.id]);
    await User.updateOne({ _id: risky.user._id }, { name: 'Zed Refuser' });
    assert.deepEqual(await ids('search=refuser'), [risky.id]);
    assert.deepEqual(await ids('codStatus=enabled'), [enabled.id]);
    assert.ok(!(await ids('codStatus=disabled')).includes(enabled.id));

    assert.deepEqual((await ids('filter=delivered')).sort(), [trusted.id, risky.id].sort());
    assert.deepEqual(await ids('filter=high_cancellation'), [risky.id]);
    assert.deepEqual(await ids('filter=eligible'), [trusted.id]);
    assert.deepEqual(await ids('filter=eligible&codStatus=enabled'), []);
  });

  it('pagination, and only real customers are listed (admins / deleted accounts are not)', async () => {
    const admin = await makeAdmin();
    for (let i = 0; i < 7; i++) await makeCustomer({ cod: false });
    const gone = await makeCustomer({ cod: false });
    await User.updateOne({ _id: gone.user._id }, { deletedAt: new Date() });
    const p1 = await call('GET', '/api/v1/admin/cod-permissions?limit=3&page=1', { token: admin.token });
    const p3 = await call('GET', '/api/v1/admin/cod-permissions?limit=3&page=3', { token: admin.token });
    assert.equal(p1.body.data.pagination.total, 7);
    assert.equal(p1.body.data.pagination.totalPages, 3);
    assert.equal(p1.body.data.customers.length, 3);
    assert.equal(p3.body.data.customers.length, 1);
  });

  it('details endpoint returns stats, order history (newest first) and the audit trail', async () => {
    const admin = await makeAdmin();
    const { risky } = await seedHistory();
    await setCod(admin, risky.id, true, 'second chance');
    const res = await call('GET', `/api/v1/admin/cod-permissions/${risky.id}`, { token: admin.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.recentOrders.length, 4);
    assert.equal(res.body.data.customer.stats.refusedOrders, 2);
    assert.equal(res.body.data.customer.codAccess.reason, 'second chance');
    assert.equal(res.body.data.auditTrail[0].action, 'ENABLE');
  });
});
