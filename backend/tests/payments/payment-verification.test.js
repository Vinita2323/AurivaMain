import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  boot, shutdown, resetDb, call, gateway, env,
  makeCustomer, makeAdmin, makeProduct, addToCart, startSession, verifySession, completePrepaidPurchase,
  sign, hmac, sendWebhook, capturedEvent, failedEvent,
  Order, Payment, Product, Cart
} from '../helpers/harness.js';

before(async () => { await boot(); });
after(async () => { await shutdown(); });
beforeEach(async () => { await resetDb(); });

const ordersOf = (c) => Order.countDocuments({ user: c.id });

describe('C-01  customer cannot mark an order PAID', () => {
  it('ignores paymentStatus / paymentDetails sent with POST /orders (DB: order stays PENDING, no transaction id)', async () => {
    const c = await makeCustomer();
    const p = await makeProduct();
    await addToCart(c, p, 1);
    const res = await call('POST', '/api/v1/orders', {
      token: c.token,
      body: { addressId: c.addressId, paymentMethod: 'UPI', paymentStatus: 'PAID', paymentDetails: { transactionId: 'FAKE_TXN', upiApp: 'x' }, trustedPayment: true, expectedTotal: 1 }
    });
    assert.equal(res.status, 201);
    const order = await Order.findById(res.body.data.order._id).lean();
    assert.equal(order.payment.status, 'PENDING');
    assert.equal(order.payment.transactionId, '');
    assert.equal(order.payment.upiApp, '');
    assert.equal(await Payment.countDocuments({}), 0, 'no Payment record may be marked paid');
  });

  it('customer cannot call admin endpoints to change payment/order state', async () => {
    const c = await makeCustomer();
    const p = await makeProduct();
    await addToCart(c, p);
    const o = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } });
    const id = o.body.data.order._id;
    assert.equal((await call('PATCH', `/api/v1/admin/orders/${id}/status`, { token: c.token, body: { status: 'SHIPPED' } })).status, 403);
    assert.equal((await call('POST', `/api/v1/admin/payments/${id}/refund`, { token: c.token, body: {} })).status, 403);
    assert.equal((await Order.findById(id)).payment.status, 'PENDING');
  });

  it('verify without a real gateway payment is rejected and creates no order', async () => {
    const c = await makeCustomer();
    await addToCart(c, await makeProduct());
    const session = await startSession(c);
    const res = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { razorpayOrderId: session.razorpayOrderId, razorpayPaymentId: 'pay_doesnotexist', razorpaySignature: sign(session.razorpayOrderId, 'pay_doesnotexist') }
    });
    assert.ok(res.status >= 400 && res.status < 600);
    assert.equal(await ordersOf(c), 0);
    assert.equal((await Payment.findOne({ gatewayOrderId: session.razorpayOrderId })).status, 'PENDING');
  });
});

describe('Payment verification — success and idempotency', () => {
  it('successful verification: order PAID, payment linked to the order, stock deducted, cart cleared (DB verified)', async () => {
    const c = await makeCustomer();
    const p = await makeProduct({ price: 200, stock: 10 });
    const { session, gp, order, payment, res } = await completePrepaidPurchase(c, p, 2);

    assert.equal(order.payment.status, 'PAID');
    assert.equal(order.payment.transactionId, gp.id);
    assert.equal(String(payment.order), String(order._id));
    assert.equal(payment.status, 'PAID');
    assert.equal(payment.gatewayPaymentId, gp.id);
    assert.equal(payment.amount, order.pricing.total);
    assert.equal(session.amount, Math.round(order.pricing.total * 100));
    assert.equal((await Product.findById(p._id)).stockCount, 8);
    assert.equal((await Cart.findOne({ user: c.id })).items.length, 0);
    assert.ok(payment.auditTrail.some((a) => a.action === 'PAYMENT_VERIFIED_ORDER_PLACED'));
    assert.ok(!JSON.stringify(payment.auditTrail).includes(env.RAZORPAY.KEY_SECRET), 'audit trail must not contain secrets');
    // the internal audit trail is never sent to customers
    const mine = await call('GET', `/api/v1/payments/order/${order._id}`, { token: c.token });
    assert.equal(mine.status, 200);
    assert.equal(mine.body.data.payment.auditTrail, undefined);
    assert.equal(res.body.data.payment.auditTrail, undefined);
  });

  it('repeated verification is idempotent: one order, stock deducted once', async () => {
    const c = await makeCustomer();
    const p = await makeProduct({ stock: 10 });
    const { session, gp } = await completePrepaidPurchase(c, p, 1);
    const again = await verifySession(c, session, gp);
    assert.equal(again.status, 200);
    assert.equal(again.body.data.alreadyProcessed, true);
    assert.equal(await ordersOf(c), 1);
    assert.equal((await Product.findById(p._id)).stockCount, 9);
  });

  it('simultaneous verification requests create exactly one order', async () => {
    const c = await makeCustomer();
    const p = await makeProduct({ stock: 10 });
    await addToCart(c, p, 1);
    const session = await startSession(c);
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const results = await Promise.all(Array.from({ length: 6 }, () => verifySession(c, session, gp)));
    assert.ok(results.some((r) => r.status === 200), 'at least one request succeeds');
    assert.equal(await ordersOf(c), 1);
    assert.equal((await Product.findById(p._id)).stockCount, 9);
    const payment = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.equal(payment.status, 'PAID');
    assert.equal(await Payment.countDocuments({ gatewayPaymentId: gp.id }), 1);
  });

  it('verify + webhook racing create exactly one order and one paid record', async () => {
    const c = await makeCustomer();
    const p = await makeProduct({ stock: 10 });
    await addToCart(c, p, 1);
    const session = await startSession(c);
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const hook = capturedEvent({ id: gp.id, order_id: session.razorpayOrderId, amount: session.amount, currency: 'INR' });
    const [a, b, d] = await Promise.all([verifySession(c, session, gp), sendWebhook(hook), sendWebhook(hook)]);
    assert.equal(b.status, 200); assert.equal(d.status, 200);
    assert.ok([200, 409].includes(a.status));
    assert.equal(await ordersOf(c), 1);
    assert.equal((await Product.findById(p._id)).stockCount, 9);
    assert.equal((await Order.findOne({ user: c.id })).payment.status, 'PAID');
  });
});

describe('Payment verification — rejection cases (no order, no PAID state, DB untouched)', () => {
  async function setup(price = 200) {
    const c = await makeCustomer();
    const p = await makeProduct({ price, stock: 10 });
    await addToCart(c, p, 1);
    const session = await startSession(c);
    return { c, p, session };
  }
  const untouched = async (c, p, session) => {
    assert.equal(await ordersOf(c), 0, 'no order may exist');
    assert.equal((await Product.findById(p._id)).stockCount, 10, 'stock untouched');
    const pay = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.notEqual(pay.status, 'PAID');
    assert.equal(pay.order, null);
    return pay;
  };

  it('invalid signature', async () => {
    const { c, p, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const res = await verifySession(c, session, gp, { razorpaySignature: 'deadbeef'.repeat(8) });
    assert.equal(res.status, 400);
    const pay = await untouched(c, p, session);
    assert.equal(pay.status, 'PENDING', 'a forged signature must not alter the session');
    assert.ok(pay.auditTrail.some((a) => a.action === 'VERIFY_REJECTED_BAD_SIGNATURE'));
  });

  it('missing payment id / signature / order id', async () => {
    const { c, p, session } = await setup();
    for (const body of [
      { razorpayOrderId: session.razorpayOrderId, razorpaySignature: 'x' },
      { razorpayOrderId: session.razorpayOrderId, razorpayPaymentId: 'pay_x' },
      { razorpayPaymentId: 'pay_x', razorpaySignature: 'x' }
    ]) {
      const res = await call('POST', '/api/v1/payments/verify', { token: c.token, body });
      assert.ok([400, 422].includes(res.status), 'validator rejects with ' + res.status);
    }
    await untouched(c, p, session);
  });

  it('incorrect Razorpay order id (no such session)', async () => {
    const { c, p, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: 'order_unknown', amount: session.amount });
    const res = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { razorpayOrderId: 'order_unknown', razorpayPaymentId: gp.id, razorpaySignature: sign('order_unknown', gp.id) }
    });
    assert.equal(res.status, 404);
    await untouched(c, p, session);
  });

  it("another customer's session cannot be verified", async () => {
    const { c, p, session } = await setup();
    const attacker = await makeCustomer();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const res = await verifySession(attacker, session, gp);
    assert.equal(res.status, 404);
    assert.equal(await ordersOf(attacker), 0);
    await untouched(c, p, session);
  });

  it('underpayment (paid less than payable) is rejected and flagged for reconciliation', async () => {
    const { c, p, session } = await setup(500);
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount - 100 });
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 400);
    assert.match(res.body.message, /does not match the payable amount/);
    const pay = await untouched(c, p, session);
    assert.equal(pay.metadata.needsReconciliation, true);
  });

  it('overpayment is rejected too (exact amount required)', async () => {
    const { c, p, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount + 5000 });
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 400);
    await untouched(c, p, session);
  });

  it('currency mismatch is rejected', async () => {
    const { c, p, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount, currency: 'USD' });
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 400);
    assert.match(res.body.message, /currency/i);
    await untouched(c, p, session);
  });

  it('gateway payment belongs to a DIFFERENT razorpay order (payment reuse across sessions)', async () => {
    const c = await makeCustomer();
    const cheap = await makeProduct({ price: 50, stock: 10 });
    const big = await makeProduct({ price: 900, stock: 10 });
    await addToCart(c, cheap, 1);
    const cheapSession = await startSession(c);
    const cheapPay = gateway.simulatePayment({ orderId: cheapSession.razorpayOrderId, amount: cheapSession.amount });

    await Cart.deleteMany({ user: c.id });
    await addToCart(c, big, 1);
    const bigSession = await startSession(c);

    // Attacker presents the CHEAP payment (validly signed for the cheap order) against the BIG session
    const res = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { razorpayOrderId: bigSession.razorpayOrderId, razorpayPaymentId: cheapPay.id, razorpaySignature: sign(bigSession.razorpayOrderId, cheapPay.id) }
    });
    assert.equal(res.status, 400);
    assert.equal(await ordersOf(c), 0);
    assert.equal((await Payment.findOne({ gatewayOrderId: bigSession.razorpayOrderId })).status, 'PENDING');
  });

  it('pending / unconfirmed payment is not treated as paid', async () => {
    const { c, p, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount, status: 'created' });
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 409);
    await untouched(c, p, session);
  });

  it('failed payment is rejected (402)', async () => {
    const { c, p, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount, status: 'failed' });
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 402);
    await untouched(c, p, session);
  });

  it('authorized payment is captured server-side for the exact amount, then accepted', async () => {
    const { c, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount, status: 'authorized' });
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 200);
    assert.equal(gateway.calls.paymentsCapture, 1);
    assert.equal(await ordersOf(c), 1);
  });

  it('gateway outage during confirmation fails safely (no order)', async () => {
    const { c, p, session } = await setup();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    gateway.failNextFetch = true;
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 502);
    await untouched(c, p, session);
    // customer can simply retry
    const retry = await verifySession(c, session, gp);
    assert.equal(retry.status, 200);
    assert.equal(await ordersOf(c), 1);
  });

  it('C-03: cart changed after the session was priced → paid amount no longer matches → no PAID order', async () => {
    const c = await makeCustomer();
    const small = await makeProduct({ price: 100, stock: 10 });
    const big = await makeProduct({ price: 1000, stock: 10 });
    await addToCart(c, small, 1);
    const session = await startSession(c);
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    await addToCart(c, big, 3); // attacker enlarges the cart AFTER payment was priced
    const res = await verifySession(c, session, gp);
    assert.equal(res.status, 409);
    assert.equal(await ordersOf(c), 0);
    assert.equal((await Product.findById(big._id)).stockCount, 10);
    assert.equal((await Product.findById(small._id)).stockCount, 10);
    const pay = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.equal(pay.metadata.needsReconciliation, true, 'money was captured: must be flagged for an admin');
    assert.equal(pay.order, null);
  });
});

describe('C-02  one payment can only ever pay one order', () => {
  it('database-level: two Payment records cannot share a gatewayPaymentId (unique index)', async () => {
    const c = await makeCustomer();
    await Payment.create({ user: c.id, gateway: 'RAZORPAY', gatewayOrderId: 'order_A', gatewayPaymentId: 'pay_SAME', amount: 10, status: 'PAID' });
    await assert.rejects(
      Payment.create({ user: c.id, gateway: 'RAZORPAY', gatewayOrderId: 'order_B', gatewayPaymentId: 'pay_SAME', amount: 10, status: 'PAID' }),
      (e) => e.code === 11000
    );
    // empty ids (sessions not yet paid) must still be allowed to coexist
    await Payment.create({ user: c.id, gateway: 'RAZORPAY', gatewayOrderId: 'order_C', amount: 10 });
    await Payment.create({ user: c.id, gateway: 'RAZORPAY', gatewayOrderId: 'order_D', amount: 10 });
    await Payment.create({ user: c.id, gateway: 'COD', amount: 10 });
    await Payment.create({ user: c.id, gateway: 'COD', amount: 10 });
  });

  it('existing-order flow: a cheap payment cannot be replayed to pay an expensive order', async () => {
    const c = await makeCustomer();
    const cheap = await makeProduct({ price: 50, stock: 10 });
    const big = await makeProduct({ price: 900, stock: 10 });

    // two unpaid online orders created the legacy way (POST /orders then create-order)
    await addToCart(c, cheap, 1);
    const cheapOrder = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;
    await addToCart(c, big, 1);
    const bigOrder = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;

    const cheapRzp = (await call('POST', '/api/v1/payments/create-order', { token: c.token, body: { orderId: cheapOrder._id } })).body.data;
    const cheapPay = gateway.simulatePayment({ orderId: cheapRzp.razorpayOrderId, amount: cheapRzp.amount });

    // legitimate payment of the cheap order works
    const ok = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { orderId: cheapOrder._id, razorpayOrderId: cheapRzp.razorpayOrderId, razorpayPaymentId: cheapPay.id, razorpaySignature: sign(cheapRzp.razorpayOrderId, cheapPay.id) }
    });
    assert.equal(ok.status, 200);
    assert.equal((await Order.findById(cheapOrder._id)).payment.status, 'PAID');

    // replay the SAME (validly signed) payment against the expensive order
    const replay = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { orderId: bigOrder._id, razorpayOrderId: cheapRzp.razorpayOrderId, razorpayPaymentId: cheapPay.id, razorpaySignature: sign(cheapRzp.razorpayOrderId, cheapPay.id) }
    });
    assert.equal(replay.status, 400);
    assert.equal((await Order.findById(bigOrder._id)).payment.status, 'PENDING');
    assert.equal(await Payment.countDocuments({ gatewayPaymentId: cheapPay.id }), 1);
    assert.equal(await Payment.countDocuments({ order: bigOrder._id, status: 'PAID' }), 0);
  });

  it('existing-order flow: a fabricated signature pair with no session is rejected and writes nothing', async () => {
    const c = await makeCustomer();
    await addToCart(c, await makeProduct({ price: 400 }), 1);
    const order = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;
    const before = await Payment.countDocuments({});
    const res = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { orderId: order._id, razorpayOrderId: 'order_FAKE', razorpayPaymentId: 'pay_FAKE', razorpaySignature: sign('order_FAKE', 'pay_FAKE') }
    });
    assert.equal(res.status, 400);
    assert.equal(await Payment.countDocuments({}), before, 'must not upsert junk Payment rows');
    assert.equal((await Order.findById(order._id)).payment.status, 'PENDING');
  });

  it('existing-order flow: underpayment against the order total is rejected', async () => {
    const c = await makeCustomer();
    await addToCart(c, await makeProduct({ price: 400 }), 1);
    const order = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;
    const rz = (await call('POST', '/api/v1/payments/create-order', { token: c.token, body: { orderId: order._id } })).body.data;
    const gp = gateway.simulatePayment({ orderId: rz.razorpayOrderId, amount: rz.amount - 1 });
    const res = await call('POST', '/api/v1/payments/verify', {
      token: c.token,
      body: { orderId: order._id, razorpayOrderId: rz.razorpayOrderId, razorpayPaymentId: gp.id, razorpaySignature: sign(rz.razorpayOrderId, gp.id) }
    });
    assert.equal(res.status, 400);
    assert.equal((await Order.findById(order._id)).payment.status, 'PENDING');
  });

  it('existing-order flow: another customer cannot verify against my order', async () => {
    const c = await makeCustomer();
    const other = await makeCustomer();
    await addToCart(c, await makeProduct({ price: 300 }), 1);
    const order = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;
    const rz = (await call('POST', '/api/v1/payments/create-order', { token: c.token, body: { orderId: order._id } })).body.data;
    const gp = gateway.simulatePayment({ orderId: rz.razorpayOrderId, amount: rz.amount });
    const res = await call('POST', '/api/v1/payments/verify', {
      token: other.token,
      body: { orderId: order._id, razorpayOrderId: rz.razorpayOrderId, razorpayPaymentId: gp.id, razorpaySignature: sign(rz.razorpayOrderId, gp.id) }
    });
    assert.equal(res.status, 403);
    assert.equal((await Order.findById(order._id)).payment.status, 'PENDING');
  });
});

describe('Razorpay webhook — payment events', () => {
  async function pending() {
    const c = await makeCustomer();
    const p = await makeProduct({ stock: 10 });
    await addToCart(c, p, 1);
    const session = await startSession(c);
    return { c, p, session };
  }

  it('rejects missing and wrong signatures (nothing changes)', async () => {
    const { c, session } = await pending();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const ev = capturedEvent({ id: gp.id, order_id: session.razorpayOrderId, amount: session.amount, currency: 'INR' });
    assert.equal((await sendWebhook(ev, { omitSignature: true })).status, 400);
    assert.equal((await sendWebhook(ev, { signature: 'nope' })).status, 400);
    assert.equal((await sendWebhook(ev, { secret: 'a_different_secret' })).status, 400);
    assert.equal(await ordersOf(c), 0);
    assert.equal((await Payment.findOne({ gatewayOrderId: session.razorpayOrderId })).status, 'PENDING');
  });

  it('fails closed when the webhook secret is not configured', async () => {
    const { session } = await pending();
    env.RAZORPAY.WEBHOOK_SECRET = '';
    const res = await sendWebhook(capturedEvent({ id: 'pay_x', order_id: session.razorpayOrderId, amount: 1, currency: 'INR' }));
    assert.equal(res.status, 503);
  });

  it('valid payment.captured creates the order once; duplicate deliveries change nothing', async () => {
    const { c, p, session } = await pending();
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const ev = capturedEvent({ id: gp.id, order_id: session.razorpayOrderId, amount: session.amount, currency: 'INR' });
    for (let i = 0; i < 4; i++) assert.equal((await sendWebhook(ev)).status, 200);
    assert.equal(await ordersOf(c), 1);
    assert.equal((await Product.findById(p._id)).stockCount, 9);
    const pay = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.equal(pay.status, 'PAID');
    assert.equal(pay.gatewayPaymentId, gp.id);
    assert.ok(pay.order);
    // and the customer's later verify call is a harmless replay
    const v = await verifySession(c, session, gp);
    assert.equal(v.status, 200);
    assert.equal(await ordersOf(c), 1);
  });

  it('captured event whose amount/currency differs from the session is NOT accepted', async () => {
    const { c, session } = await pending();
    const bad = capturedEvent({ id: 'pay_low', order_id: session.razorpayOrderId, amount: 100, currency: 'INR' });
    assert.equal((await sendWebhook(bad)).status, 200);
    const bad2 = capturedEvent({ id: 'pay_usd', order_id: session.razorpayOrderId, amount: session.amount, currency: 'USD' });
    assert.equal((await sendWebhook(bad2)).status, 200);
    const pay = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.equal(pay.status, 'PENDING');
    assert.equal(pay.metadata.needsReconciliation, true);
    assert.equal(await ordersOf(c), 0);
  });

  it('a second, different payment for an already-paid session is flagged, not applied', async () => {
    const { c, session } = await pending();
    const first = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    await sendWebhook(capturedEvent({ id: first.id, order_id: session.razorpayOrderId, amount: session.amount, currency: 'INR' }));
    const second = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    await sendWebhook(capturedEvent({ id: second.id, order_id: session.razorpayOrderId, amount: session.amount, currency: 'INR' }));
    const pay = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.equal(pay.gatewayPaymentId, first.id);
    assert.deepEqual(pay.metadata.duplicatePaymentIds, [second.id]);
    assert.equal(await ordersOf(c), 1);
  });

  it('unknown gateway order is ignored safely', async () => {
    const res = await sendWebhook(capturedEvent({ id: 'pay_zzz', order_id: 'order_zzz', amount: 100, currency: 'INR' }));
    assert.equal(res.status, 200);
    assert.equal(await Payment.countDocuments({}), 0);
  });

  it('payment.failed marks a PENDING session FAILED, never downgrades PAID, and a later capture still succeeds', async () => {
    const { c, session } = await pending();
    const fail = failedEvent({ id: 'pay_f', order_id: session.razorpayOrderId, error_description: 'declined' });
    await sendWebhook(fail);
    assert.equal((await Payment.findOne({ gatewayOrderId: session.razorpayOrderId })).status, 'FAILED');

    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    await sendWebhook(capturedEvent({ id: gp.id, order_id: session.razorpayOrderId, amount: session.amount, currency: 'INR' }));
    assert.equal((await Payment.findOne({ gatewayOrderId: session.razorpayOrderId })).status, 'PAID');
    assert.equal(await ordersOf(c), 1);

    await sendWebhook(fail); // late / replayed failure
    assert.equal((await Payment.findOne({ gatewayOrderId: session.razorpayOrderId })).status, 'PAID');
    assert.equal((await Order.findOne({ user: c.id })).payment.status, 'PAID');
  });

  it('a failed verify leaves the customer able to pay again', async () => {
    const { c, session } = await pending();
    const bad = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount, status: 'failed' });
    assert.equal((await verifySession(c, session, bad)).status, 402);
    const good = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    assert.equal((await verifySession(c, session, good)).status, 200);
    assert.equal(await ordersOf(c), 1);
  });
});
