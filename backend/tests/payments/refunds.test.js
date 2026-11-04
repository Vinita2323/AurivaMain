import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  boot, shutdown, resetDb, call, gateway,
  makeCustomer, makeAdmin, makeProduct, addToCart, completePrepaidPurchase,
  sendWebhook, refundProcessedEvent, refundFailedEvent, capturedEvent, assertRefundLedger, startSession,
  Order, Payment, Product, Wallet, WalletTransaction
} from '../helpers/harness.js';

before(async () => { await boot(); });
after(async () => { await shutdown(); });
beforeEach(async () => { await resetDb(); });

const refund = (admin, paymentId, body = {}, headers = {}) =>
  call('POST', `/api/v1/admin/payments/${paymentId}/refund`, { token: admin.token, body, headers });

/** A captured, fully paid online order + the admin who may refund it */
async function paidOrder({ price = 200, qty = 1 } = {}) {
  const customer = await makeCustomer();
  const admin = await makeAdmin();
  const product = await makeProduct({ price, stock: 50 });
  const purchase = await completePrepaidPurchase(customer, product, qty);
  return { customer, admin, product, ...purchase };
}

/** Deliver a refund.processed webhook for the newest refund the (fake) gateway created */
async function gatewayConfirmsRefund(payment, refundEntity) {
  return sendWebhook(refundProcessedEvent({ ...refundEntity, status: 'processed' }));
}
const lastGatewayRefund = () => [...gateway.refunds_.values()].at(-1);

describe('C-04 / C-05  admin refunds', () => {
  it('full refund: reserved as PENDING, only REFUNDED after the gateway confirms (never assumed)', async () => {
    const { admin, payment, order } = await paidOrder();
    const res = await refund(admin, payment._id);
    assert.equal(res.status, 200);
    assert.equal(gateway.calls.paymentsRefund, 1);

    let { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.status, 'REFUND_PENDING');
    assert.equal(p.refundedAmount, 0);
    assert.equal(p.refundPendingAmount, payment.amount);
    assert.equal(p.refunds.length, 1);
    assert.equal(p.refunds[0].status, 'PENDING');
    assert.match(p.refunds[0].refundId, /^rfnd_/);
    assert.equal((await Order.findById(order._id)).payment.status, 'REFUND_PENDING');

    // the gateway sent the exact amount in paise, with our request key as receipt
    const sent = lastGatewayRefund();
    assert.equal(sent.amount, Math.round(payment.amount * 100));
    assert.equal(sent.receipt, p.refunds[0].requestKey);

    assert.equal((await gatewayConfirmsRefund(payment, sent)).status, 200);
    ({ p, consistent } = await assertRefundLedger(payment._id));
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(p.refundedAmount, payment.amount);
    assert.equal(p.refundPendingAmount, 0);
    assert.equal(p.refunds[0].status, 'PROCESSED');
    assert.equal((await Order.findById(order._id)).payment.status, 'REFUNDED');
    assert.ok(p.auditTrail.some((a) => a.action === 'REFUND_INITIATED'));
  });

  it('gateway that processes instantly → REFUNDED immediately', async () => {
    const { admin, payment } = await paidOrder();
    gateway.refundStatus = 'processed';
    assert.equal((await refund(admin, payment._id)).status, 200);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(p.refundedAmount, payment.amount);
  });

  it('partial refunds accumulate; the total can never exceed the captured amount', async () => {
    const { admin, payment } = await paidOrder(); // total 250
    gateway.refundStatus = 'processed';
    assert.equal((await refund(admin, payment._id, { amount: 100 })).status, 200);
    let { p } = await assertRefundLedger(payment._id);
    assert.equal(p.status, 'PARTIALLY_REFUNDED');
    assert.equal(p.refundedAmount, 100);

    assert.equal((await refund(admin, payment._id, { amount: 100 })).status, 200);
    const tooMuch = await refund(admin, payment._id, { amount: 100 }); // only 50 left
    assert.equal(tooMuch.status, 400);
    assert.match(tooMuch.body.message, /exceeds/i);
    assert.equal((await refund(admin, payment._id, { amount: 50 })).status, 200);

    const final = await assertRefundLedger(payment._id);
    assert.ok(final.consistent);
    assert.equal(final.p.status, 'REFUNDED');
    assert.equal(final.p.refundedAmount, payment.amount);
    assert.equal(final.p.refunds.length, 3);
    assert.equal(gateway.calls.paymentsRefund, 3);
    // nothing left to refund
    assert.equal((await refund(admin, payment._id)).status, 400);
  });

  it('same Idempotency-Key twice → one gateway refund, same result', async () => {
    const { admin, payment } = await paidOrder();
    const h = { 'Idempotency-Key': 'click-1' };
    const a = await refund(admin, payment._id, { amount: 80 }, h);
    const b = await refund(admin, payment._id, { amount: 80 }, h);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(gateway.calls.paymentsRefund, 1);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.length, 1);
    assert.equal(p.refundPendingAmount, 80);
  });

  it('identical refund while one is still in flight → 409 (accidental double click)', async () => {
    const { admin, payment } = await paidOrder();
    assert.equal((await refund(admin, payment._id, { amount: 60 })).status, 200);
    const dup = await refund(admin, payment._id, { amount: 60 });
    assert.equal(dup.status, 409);
    assert.equal(gateway.calls.paymentsRefund, 1);
  });

  it('CONCURRENT full-refund requests: exactly one succeeds, one gateway call, ledger consistent', async () => {
    const { admin, payment } = await paidOrder();
    gateway.refundDelayMs = 60; // widen the race window
    const results = await Promise.all(Array.from({ length: 8 }, () => refund(admin, payment._id)));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.ok(results.filter((r) => r.status !== 200).every((r) => [400, 409].includes(r.status)));
    assert.equal(gateway.calls.paymentsRefund, 1);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.length, 1);
    assert.equal(p.refundPendingAmount, payment.amount);
  });

  it('CONCURRENT partial refunds can never reserve more than the payment amount', async () => {
    const { admin, payment } = await paidOrder(); // 250
    gateway.refundDelayMs = 40;
    const amounts = [100, 101, 102, 103, 104, 105];
    const results = await Promise.all(amounts.map((amount) => refund(admin, payment._id, { amount })));
    const ok = results.filter((r) => r.status === 200).length;
    assert.ok(ok >= 1 && ok <= 2, `at most two of these can fit in 250 (got ${ok})`);
    assert.equal(gateway.calls.paymentsRefund, ok);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.ok(p.refundedAmount + p.refundPendingAmount <= payment.amount);
  });

  it('rejects: over-amount, zero/negative/non-numeric, unknown + malformed id, non-admin', async () => {
    const { admin, customer, payment } = await paidOrder();
    assert.equal((await refund(admin, payment._id, { amount: payment.amount + 1 })).status, 400);
    assert.ok([400, 422].includes((await refund(admin, payment._id, { amount: 0 })).status));
    assert.ok([400, 422].includes((await refund(admin, payment._id, { amount: -5 })).status));
    assert.ok([400, 422].includes((await refund(admin, payment._id, { amount: '50' })).status));
    assert.equal((await refund(admin, '64b64b64b64b64b64b64b64b')).status, 404);
    assert.equal((await refund(admin, 'not-an-id')).status, 400);
    const asCustomer = await call('POST', `/api/v1/admin/payments/${payment._id}/refund`, { token: customer.token, body: {} });
    assert.equal(asCustomer.status, 403);
    assert.equal((await call('POST', `/api/v1/admin/payments/${payment._id}/refund`, { body: {} })).status, 401);
    assert.equal(gateway.calls.paymentsRefund, 0);
    assert.equal((await Payment.findById(payment._id)).refunds.length, 0);
  });

  it('refund against an unpaid / failed / not-yet-captured payment is rejected', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    await addToCart(c, await makeProduct());
    const session = await startSession(c); // PENDING session
    const pending = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.equal((await refund(admin, pending._id)).status, 400);
    pending.status = 'FAILED';
    await pending.save();
    assert.equal((await refund(admin, pending._id)).status, 400);
    assert.equal(gateway.calls.paymentsRefund, 0);
    assert.equal((await Payment.findById(pending._id)).refunds.length, 0);
  });

  it('gateway rejects the refund → 502, reservation released, retry works', async () => {
    const { admin, payment } = await paidOrder();
    gateway.failNextRefund = true;
    const res = await refund(admin, payment._id);
    assert.equal(res.status, 502);
    let { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.status, 'PAID');
    assert.equal(p.refundPendingAmount, 0);
    assert.equal(p.refunds[0].status, 'FAILED');

    gateway.refundStatus = 'processed';
    assert.equal((await refund(admin, payment._id)).status, 200);
    ({ p, consistent } = await assertRefundLedger(payment._id));
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(p.refundedAmount, payment.amount);
  });

  it('manual (COD ledger) payment: refunded once, no gateway call, concurrency-safe', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    const cod = await Payment.create({ user: c.id, gateway: 'COD', paymentMethod: 'COD', amount: 100, status: 'PAID' });
    const results = await Promise.all(Array.from({ length: 5 }, () => refund(admin, cod._id, { amount: 100 })));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.equal(gateway.calls.paymentsRefund, 0);
    const { p, consistent } = await assertRefundLedger(cod._id);
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(p.refundedAmount, 100);
    assert.equal(p.refunds.length, 1);
  });
});

describe('C-04  refund webhooks', () => {
  it('duplicate refund.processed deliveries are counted exactly once', async () => {
    const { admin, payment } = await paidOrder();
    await refund(admin, payment._id, { amount: 100 });
    const entity = lastGatewayRefund();
    for (let i = 0; i < 4; i++) assert.equal((await gatewayConfirmsRefund(payment, entity)).status, 200);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refundedAmount, 100);
    assert.equal(p.refunds.length, 1);
    assert.equal(p.status, 'PARTIALLY_REFUNDED');
  });

  it('webhook that arrives BEFORE the API response was stored is matched by our request key', async () => {
    const { payment } = await paidOrder();
    await Payment.updateOne(
      { _id: payment._id },
      { $push: { refunds: { requestKey: 'race-key-1', amount: 70, status: 'PENDING', reason: 'race' } }, $inc: { refundPendingAmount: 70 } }
    );
    const res = await sendWebhook(refundProcessedEvent({ id: 'rfnd_early', payment_id: payment.gatewayPaymentId, amount: 7000, receipt: 'race-key-1', notes: { requestKey: 'race-key-1' } }));
    assert.equal(res.status, 200);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.length, 1, 'must not create a second row');
    assert.equal(p.refunds[0].refundId, 'rfnd_early');
    assert.equal(p.refundedAmount, 70);
    assert.equal(p.refundPendingAmount, 0);
  });

  it('refund created outside Auriva (gateway dashboard) is recorded once, within the cap', async () => {
    const { payment } = await paidOrder(); // 250
    const ev = refundProcessedEvent({ id: 'rfnd_dash_1', payment_id: payment.gatewayPaymentId, amount: 10000 });
    await sendWebhook(ev);
    await sendWebhook(ev); // replay
    let { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.length, 1);
    assert.equal(p.refundedAmount, 100);
    assert.equal(p.status, 'PARTIALLY_REFUNDED');

    // an external refund that would push the total over the captured amount is NOT recorded
    await sendWebhook(refundProcessedEvent({ id: 'rfnd_dash_2', payment_id: payment.gatewayPaymentId, amount: 99900 }));
    ({ p, consistent } = await assertRefundLedger(payment._id));
    assert.ok(consistent);
    assert.equal(p.refunds.length, 1);
    assert.equal(p.metadata.needsReconciliation, true);
  });

  it('unknown / invalid refund and payment ids are ignored safely', async () => {
    const { payment } = await paidOrder();
    assert.equal((await sendWebhook(refundProcessedEvent({ id: 'rfnd_x', payment_id: 'pay_unknown', amount: 100 }))).status, 200);
    assert.equal((await sendWebhook(refundFailedEvent({ id: 'rfnd_y', payment_id: 'pay_unknown', amount: 100 }))).status, 200);
    assert.equal((await sendWebhook(refundFailedEvent({ id: 'rfnd_unknown', payment_id: payment.gatewayPaymentId, amount: 100 }))).status, 200);
    assert.equal((await sendWebhook(refundProcessedEvent({ payment_id: payment.gatewayPaymentId }))).status, 200); // no id
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.length, 0);
    assert.equal(p.status, 'PAID');
  });

  it('refund webhooks require a valid signature', async () => {
    const { admin, payment } = await paidOrder();
    await refund(admin, payment._id, { amount: 100 });
    const ev = refundProcessedEvent({ ...lastGatewayRefund(), status: 'processed' });
    assert.equal((await sendWebhook(ev, { omitSignature: true })).status, 400);
    assert.equal((await sendWebhook(ev, { signature: 'forged' })).status, 400);
    const { p } = await assertRefundLedger(payment._id);
    assert.equal(p.refundedAmount, 0);
    assert.equal(p.refunds[0].status, 'PENDING');
  });

  it('refund.failed releases the reserved amount exactly once, flags the payment, and a retry succeeds', async () => {
    const { admin, payment } = await paidOrder();
    await refund(admin, payment._id);
    const entity = lastGatewayRefund();
    const failed = refundFailedEvent({ ...entity, status: 'failed', error_description: 'bank rejected' });
    await sendWebhook(failed);
    await sendWebhook(failed); // duplicate delivery
    let { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds[0].status, 'FAILED');
    assert.equal(p.refundPendingAmount, 0);
    assert.equal(p.refundedAmount, 0);
    assert.equal(p.status, 'PAID');
    assert.equal(p.metadata.refundRequired, true);

    gateway.refundStatus = 'processed';
    assert.equal((await refund(admin, payment._id)).status, 200);
    ({ p, consistent } = await assertRefundLedger(payment._id));
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(p.refundedAmount, payment.amount);
  });

  it('a late refund.failed can never undo a PROCESSED refund', async () => {
    const { admin, payment } = await paidOrder();
    gateway.refundStatus = 'processed';
    await refund(admin, payment._id, { amount: 100 });
    await sendWebhook(refundFailedEvent({ ...lastGatewayRefund(), status: 'failed' }));
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds[0].status, 'PROCESSED');
    assert.equal(p.refundedAmount, 100);
  });

  it('gateway refunded although our call timed out (row FAILED) → revived by the webhook, within the cap', async () => {
    const { payment } = await paidOrder();
    await Payment.updateOne({ _id: payment._id }, { $push: { refunds: { requestKey: 'timeout-key', amount: 90, status: 'FAILED', reason: 'timeout' } } });
    await sendWebhook(refundProcessedEvent({ id: 'rfnd_late', payment_id: payment.gatewayPaymentId, amount: 9000, notes: { requestKey: 'timeout-key' } }));
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.length, 1);
    assert.equal(p.refunds[0].status, 'PROCESSED');
    assert.equal(p.refundedAmount, 90);
  });
});

describe('H-02  cancelling a paid online order starts the refund workflow', () => {
  const cancelAsCustomer = (c, order) => call('POST', `/api/v1/orders/${order._id}/cancel`, { token: c.token, body: { reason: 'changed mind' } });

  it('customer cancel → order CANCELLED, stock restored, ONE refund of the full captured amount (PENDING until confirmed)', async () => {
    const { customer, product, payment, order } = await paidOrder({ qty: 2 });
    assert.equal((await Product.findById(product._id)).stockCount, 48);
    const res = await cancelAsCustomer(customer, order);
    assert.equal(res.status, 200);

    assert.equal((await Order.findById(order._id)).status, 'CANCELLED');
    assert.equal((await Product.findById(product._id)).stockCount, 50);
    assert.equal(gateway.calls.paymentsRefund, 1);
    const sent = lastGatewayRefund();
    assert.equal(sent.amount, Math.round(payment.amount * 100));
    assert.equal(sent.receipt, `cancel:${order._id}`);

    let { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.status, 'REFUND_PENDING');
    assert.equal(p.refunds[0].requestKey, `cancel:${order._id}`);
    assert.equal(p.refundPendingAmount, payment.amount);

    await gatewayConfirmsRefund(payment, sent);
    ({ p, consistent } = await assertRefundLedger(payment._id));
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
    assert.equal((await Order.findById(order._id)).payment.status, 'REFUNDED');
  });

  it('cancelling twice or from two places at once never creates a second refund', async () => {
    const { customer, admin, payment, order } = await paidOrder();
    gateway.refundDelayMs = 40;
    const [a, b, c2] = await Promise.all([
      cancelAsCustomer(customer, order),
      call('PATCH', `/api/v1/admin/orders/${order._id}/cancel`, { token: admin.token, body: { reason: 'admin' } }),
      cancelAsCustomer(customer, order)
    ]);
    assert.equal([a, b, c2].filter((r) => r.status === 200).length, 1);
    assert.equal((await cancelAsCustomer(customer, order)).status, 400);
    assert.equal(gateway.calls.paymentsRefund, 1);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.length, 1);
  });

  it('if the gateway fails, the order is still cancelled and the payment is flagged for an admin to retry', async () => {
    const { customer, admin, payment, order } = await paidOrder();
    gateway.failNextRefund = true;
    const res = await cancelAsCustomer(customer, order);
    assert.equal(res.status, 200);
    assert.equal((await Order.findById(order._id)).status, 'CANCELLED');
    let { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.status, 'PAID');
    assert.equal(p.metadata.refundRequired, true);
    assert.equal(p.refundPendingAmount, 0);

    gateway.refundStatus = 'processed';
    assert.equal((await refund(admin, payment._id)).status, 200);
    ({ p, consistent } = await assertRefundLedger(payment._id));
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
  });

  it('only the REMAINING balance is refunded when part was already refunded', async () => {
    const { customer, admin, payment, order } = await paidOrder(); // 250
    gateway.refundStatus = 'processed';
    await refund(admin, payment._id, { amount: 100 });
    assert.equal((await cancelAsCustomer(customer, order)).status, 200);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refundedAmount, payment.amount);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(lastGatewayRefund().amount, Math.round((payment.amount - 100) * 100));
  });

  it('COD order cancellation: no gateway refund, stock restored, COD ledger untouched', async () => {
    const c = await makeCustomer();
    const product = await makeProduct({ stock: 10 });
    await addToCart(c, product, 2);
    const placed = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'COD' } });
    const order = placed.body.data.order;
    assert.equal((await cancelAsCustomer(c, order)).status, 200);
    assert.equal(gateway.calls.paymentsRefund, 0);
    assert.equal((await Product.findById(product._id)).stockCount, 10);
    const ledger = await Payment.findOne({ order: order._id });
    assert.equal(ledger.gateway, 'COD');
    assert.equal(ledger.refunds.length, 0);
    assert.notEqual(ledger.status, 'REFUNDED');
  });

  it('unpaid online order cancellation: no refund (nothing was captured)', async () => {
    const c = await makeCustomer();
    await addToCart(c, await makeProduct(), 1);
    const order = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;
    assert.equal((await cancelAsCustomer(c, order)).status, 200);
    assert.equal(gateway.calls.paymentsRefund, 0);
    assert.equal((await Order.findById(order._id)).payment.status, 'PENDING');
  });

  it('payment captured AFTER the order was cancelled is refunded automatically (once)', async () => {
    const c = await makeCustomer();
    await addToCart(c, await makeProduct({ price: 300 }), 1);
    const order = (await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'UPI' } })).body.data.order;
    const rz = (await call('POST', '/api/v1/payments/create-order', { token: c.token, body: { orderId: order._id } })).body.data;
    assert.equal((await cancelAsCustomer(c, order)).status, 200);
    assert.equal(gateway.calls.paymentsRefund, 0);

    const gp = gateway.simulatePayment({ orderId: rz.razorpayOrderId, amount: rz.amount });
    const ev = capturedEvent({ id: gp.id, order_id: rz.razorpayOrderId, amount: rz.amount, currency: 'INR' });
    await sendWebhook(ev);
    await sendWebhook(ev);
    assert.equal(gateway.calls.paymentsRefund, 1);
    const pay = await Payment.findOne({ gatewayOrderId: rz.razorpayOrderId });
    assert.equal(pay.status, 'REFUND_PENDING');
    assert.equal(pay.refunds.length, 1);
  });

  it('wallet-funded COD order: wallet refunded exactly once, no gateway refund, wallet == ledger', async () => {
    const c = await makeCustomer();
    const admin = await makeAdmin();
    const credit = await call('POST', `/api/v1/admin/wallets/${c.id}/adjust`, { token: admin.token, body: { type: 'CREDIT', amount: 500, note: 'test credit' } });
    assert.equal(credit.status, 200);
    await addToCart(c, await makeProduct({ price: 100 }), 1);
    const placed = await call('POST', '/api/v1/orders', { token: c.token, body: { addressId: c.addressId, paymentMethod: 'COD', useWallet: true } });
    const order = placed.body.data.order;
    const used = order.pricing.walletApplied;
    assert.ok(used > 0);
    await Promise.all([cancelAsCustomer(c, order), cancelAsCustomer(c, order), cancelAsCustomer(c, order)]);
    assert.equal(gateway.calls.paymentsRefund, 0);
    const wallet = await Wallet.findOne({ user: c.id });
    assert.equal(wallet.balance, 500);
    const txns = await WalletTransaction.find({ user: c.id }).lean();
    const net = txns.reduce((s, t) => s + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);
    assert.equal(Math.round(net * 100) / 100, wallet.balance, 'wallet balance must equal its transaction history');
    assert.equal(txns.filter((t) => t.source === 'ORDER_REFUND').length, 1);
  });
});
