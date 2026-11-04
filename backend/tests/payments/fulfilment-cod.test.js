import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  boot, shutdown, resetDb, call, gateway,
  makeCustomer, makeAdmin, makeProduct, addToCart, completePrepaidPurchase,
  Order, Payment
} from '../helpers/harness.js';

before(async () => { await boot(); });
after(async () => { await shutdown(); });
beforeEach(async () => { await resetDb(); });

const setStatus = (admin, order, status) =>
  call('PATCH', `/api/v1/admin/orders/${order._id}/status`, { token: admin.token, body: { status } });
const walk = async (admin, order, steps) => {
  let last;
  for (const s of steps) last = await setStatus(admin, order, s);
  return last;
};

async function unpaidOnlineOrder() {
  const c = await makeCustomer();
  const admin = await makeAdmin();
  await addToCart(c, await makeProduct({ price: 300 }), 1);
  const order = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;
  return { c, admin, order };
}

async function codOrder({ useWallet = false, walletCredit = 0 } = {}) {
  const c = await makeCustomer();
  const admin = await makeAdmin();
  if (walletCredit) {
    await call('POST', `/api/v1/admin/wallets/${c.id}/adjust`, { token: admin.token, body: { type: 'CREDIT', amount: walletCredit, note: 'test credit' } });
  }
  await addToCart(c, await makeProduct({ price: 300 }), 1);
  const order = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'COD', useWallet } })).body.data.order;
  return { c, admin, order };
}

describe('H-01  unpaid online orders cannot be shipped or delivered', () => {
  it('can be accepted and packed, but NOT shipped / out for delivery (status + payment unchanged)', async () => {
    const { admin, order } = await unpaidOnlineOrder();
    assert.equal((await walk(admin, order, ['ACCEPTED', 'PACKED'])).status, 200);
    const ship = await setStatus(admin, order, 'SHIPPED');
    assert.equal(ship.status, 400);
    assert.match(ship.body.message, /payment/i);
    const db = await Order.findById(order._id);
    assert.equal(db.status, 'PACKED');
    assert.equal(db.payment.status, 'PENDING');
    assert.equal(db.dispatchedAt, null);
  });

  it('dispatch endpoint is blocked as well', async () => {
    const { admin, order } = await unpaidOnlineOrder();
    const res = await call('PATCH', `/api/v1/admin/orders/${order._id}/dispatch`, {
      token: admin.token,
      body: { courierName: 'Test Courier', awbNumber: 'AWB1' }
    });
    assert.equal(res.status, 400);
    const db = await Order.findById(order._id);
    assert.notEqual(db.status, 'SHIPPED');
    assert.equal(db.awbNumber, '');
    assert.equal(db.payment.status, 'PENDING');
  });

  it('DELIVERED can never turn an unpaid online order into PAID', async () => {
    const { admin, order } = await unpaidOnlineOrder();
    await Order.updateOne({ _id: order._id }, { $set: { status: 'SHIPPED' } }); // e.g. legacy/inconsistent data
    const res = await setStatus(admin, order, 'DELIVERED');
    assert.equal(res.status, 400);
    const db = await Order.findById(order._id);
    assert.equal(db.status, 'SHIPPED');
    assert.equal(db.payment.status, 'PENDING');
    assert.equal(await Payment.countDocuments({ order: order._id, status: 'PAID' }), 0);
  });

  it('cancelling such an order is still allowed (existing rule preserved)', async () => {
    const { admin, order } = await unpaidOnlineOrder();
    assert.equal((await setStatus(admin, order, 'CANCELLED')).status, 200);
    assert.equal((await Order.findById(order._id)).status, 'CANCELLED');
  });

  it('becomes shippable only after verified payment (retry-payment flow)', async () => {
    const { c, admin, order } = await unpaidOnlineOrder();
    const { sign } = await import('../helpers/harness.js');
    const rz = (await call('POST', '/api/v1/payments/create-order', { token: c.token, body: { orderId: order._id } })).body.data;
    assert.equal((await walk(admin, order, ['ACCEPTED', 'PACKED'])).status, 200);
    assert.equal((await setStatus(admin, order, 'SHIPPED')).status, 400);

    const gp = gateway.simulatePayment({ orderId: rz.razorpayOrderId, amount: rz.amount });
    const ok = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { orderId: order._id, razorpayOrderId: rz.razorpayOrderId, razorpayPaymentId: gp.id, razorpaySignature: sign(rz.razorpayOrderId, gp.id) }
    });
    assert.equal(ok.status, 200);
    assert.equal((await setStatus(admin, order, 'SHIPPED')).status, 200);
    assert.equal((await Order.findById(order._id)).status, 'SHIPPED');
  });
});

describe('Paid online orders keep the normal workflow', () => {
  it('full lifecycle to DELIVERED; payment stays PAID and the gateway ledger row is not rewritten', async () => {
    const c = await makeCustomer();
    const admin = await makeAdmin();
    const { order, payment } = await completePrepaidPurchase(c, await makeProduct({ price: 300 }), 1);
    const res = await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']);
    assert.equal(res.status, 200);
    const db = await Order.findById(order._id);
    assert.equal(db.status, 'DELIVERED');
    assert.equal(db.payment.status, 'PAID');
    const pay = await Payment.findById(payment._id);
    assert.equal(pay.status, 'PAID');
    assert.equal(pay.gateway, 'RAZORPAY');
    assert.equal(String(pay.paidAt), String(payment.paidAt));
  });

  it('dispatch endpoint works for a paid online order', async () => {
    const c = await makeCustomer();
    const admin = await makeAdmin();
    const { order } = await completePrepaidPurchase(c, await makeProduct(), 1);
    const res = await call('PATCH', `/api/v1/admin/orders/${order._id}/dispatch`, { token: admin.token, body: { courierName: 'Test Courier', awbNumber: 'AWB9' } });
    assert.equal(res.status, 200);
    assert.equal((await Order.findById(order._id)).status, 'SHIPPED');
  });
});

describe('Cash on Delivery keeps its existing workflow', () => {
  it('COD can be shipped before payment, and delivery collects the cash (order + COD ledger become PAID)', async () => {
    const { admin, order } = await codOrder();
    const ledgerBefore = await Payment.findOne({ order: order._id });
    assert.equal(ledgerBefore.gateway, 'COD');
    assert.equal(ledgerBefore.status, 'PENDING');

    assert.equal((await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'])).status, 200);
    assert.equal((await Order.findById(order._id)).payment.status, 'PENDING', 'cash not collected yet');
    assert.equal((await setStatus(admin, order, 'DELIVERED')).status, 200);

    const db = await Order.findById(order._id);
    assert.equal(db.status, 'DELIVERED');
    assert.equal(db.payment.status, 'PAID');
    const ledger = await Payment.findOne({ order: order._id });
    assert.equal(ledger.status, 'PAID');
    assert.ok(ledger.paidAt);
  });

  it('COD dispatch endpoint works', async () => {
    const { admin, order } = await codOrder();
    const res = await call('PATCH', `/api/v1/admin/orders/${order._id}/dispatch`, { token: admin.token, body: { courierName: 'Test Courier', awbNumber: 'AWB2' } });
    assert.equal(res.status, 200);
    assert.equal((await Order.findById(order._id)).status, 'SHIPPED');
  });

  it('COD with partial wallet payment follows the COD flow', async () => {
    const { admin, order } = await codOrder({ useWallet: true, walletCredit: 100 });
    assert.equal(order.payment.method, 'COD');
    assert.ok(order.pricing.walletApplied > 0 && order.pricing.walletApplied < order.pricing.total);
    assert.equal((await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'])).status, 200);
    assert.equal((await Order.findById(order._id)).payment.status, 'PAID');
  });

  it('fully wallet-paid order (method WALLET, PAID) can ship', async () => {
    const { admin, order } = await codOrder({ useWallet: true, walletCredit: 5000 });
    assert.equal(order.payment.method, 'WALLET');
    assert.equal(order.payment.status, 'PAID');
    assert.equal((await walk(admin, order, ['ACCEPTED', 'PACKED', 'SHIPPED'])).status, 200);
  });
});

describe('assertPaymentAllowsFulfilment (rule matrix)', async () => {
  const { assertPaymentAllowsFulfilment } = await import('../../src/services/orderService.js').then((m) => ({ assertPaymentAllowsFulfilment: m.assertPaymentAllowsFulfilment }));
  const o = (method, status) => ({ orderNumber: 'T1', payment: { method, status } });
  it('allows', () => {
    for (const [m, s] of [['COD', 'PENDING'], ['COD', 'PAID'], ['UPI', 'PAID'], ['CARD', 'PAID'], ['NETBANKING', 'PAID'], ['WALLET', 'PAID'], ['UPI', 'PARTIALLY_REFUNDED']]) {
      assert.doesNotThrow(() => assertPaymentAllowsFulfilment(o(m, s)), `${m}/${s}`);
    }
  });
  it('blocks', () => {
    for (const [m, s] of [['UPI', 'PENDING'], ['UPI', 'FAILED'], ['CARD', 'AUTHORIZED'], ['NETBANKING', 'PENDING'], ['UPI', 'REFUNDED'], ['UPI', 'REFUND_PENDING'], ['WALLET', 'PENDING']]) {
      assert.throws(() => assertPaymentAllowsFulfilment(o(m, s)), (e) => e.statusCode === 400 && e.code === 'PAYMENT_NOT_RECEIVED', `${m}/${s}`);
    }
  });
});
