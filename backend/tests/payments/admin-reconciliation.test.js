import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  boot, shutdown, resetDb, call, gateway,
  makeCustomer, makeAdmin, makeProduct, addToCart, startSession, verifySession, completePrepaidPurchase,
  sendWebhook, capturedEvent, failedEvent, refundProcessedEvent, refundFailedEvent, assertRefundLedger,
  Order, Payment, Cart
} from '../helpers/harness.js';

before(async () => { await boot(); });
after(async () => { await shutdown(); });
beforeEach(async () => { await resetDb(); });

// ------------------------------------------------------------------ helpers
const list = (admin, qs = '') => call('GET', `/api/v1/admin/payments${qs}`, { token: admin.token });
const detail = (admin, id) => call('GET', `/api/v1/admin/payments/${id}`, { token: admin.token });
const reconcile = (admin, id, note = 'Refunded in Razorpay dashboard') =>
  call('POST', `/api/v1/admin/payments/${id}/reconcile`, { token: admin.token, body: { note } });
const retry = (admin, id, headers = {}) =>
  call('POST', `/api/v1/admin/payments/${id}/refund/retry`, { token: admin.token, body: {}, headers });
const ids = (res) => res.body.data.payments.map((p) => String(p._id));

/** C-03 style: customer paid for a small cart, then enlarged it → payment is captured but no order can be made */
async function flaggedMismatch() {
  const customer = await makeCustomer();
  const small = await makeProduct({ price: 100, stock: 10 });
  const big = await makeProduct({ price: 1000, stock: 10 });
  await addToCart(customer, small, 1);
  const session = await startSession(customer);
  const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
  await addToCart(customer, big, 3);
  const res = await verifySession(customer, session, gp);
  assert.equal(res.status, 409);
  const payment = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
  assert.equal(payment.metadata.needsReconciliation, true);
  return { customer, small, big, session, gp, payment };
}

/** A paid online order whose cancellation refund was rejected by the gateway → refundRequired */
async function refundRequiredPayment({ price = 200 } = {}) {
  const customer = await makeCustomer();
  const admin = await makeAdmin();
  const { order, payment } = await completePrepaidPurchase(customer, await makeProduct({ price, stock: 20 }), 1);
  gateway.failNextRefund = true;
  const res = await call('POST', `/api/v1/orders/${order._id}/cancel`, { token: customer.token, body: { reason: 'test' } });
  assert.equal(res.status, 200);
  const fresh = await Payment.findById(payment._id);
  assert.equal(fresh.metadata.refundRequired, true);
  return { customer, admin, order, payment: fresh };
}

const lastGatewayRefund = () => [...gateway.refunds_.values()].at(-1);

// ------------------------------------------------------------------ authorization
describe('Admin authorization on the new endpoints', () => {
  it('customers and anonymous callers cannot list, view, reconcile or retry (and nothing changes)', async () => {
    const { customer, payment } = await refundRequiredPayment();
    const flagged = await flaggedMismatch();
    const before = JSON.stringify(await Payment.find({}).lean());

    for (const [method, path, body] of [
      ['GET', '/api/v1/admin/payments?view=needs_reconciliation'],
      ['GET', '/api/v1/admin/payments?view=refund_required'],
      ['GET', `/api/v1/admin/payments/${payment._id}`],
      ['POST', `/api/v1/admin/payments/${flagged.payment._id}/reconcile`, { note: 'I am a customer' }],
      ['POST', `/api/v1/admin/payments/${payment._id}/refund/retry`, {}]
    ]) {
      const asCustomer = await call(method, path, { token: customer.token, body });
      assert.equal(asCustomer.status, 403, `${method} ${path} as customer`);
      const anon = await call(method, path, { body });
      assert.equal(anon.status, 401, `${method} ${path} anonymous`);
    }
    assert.equal(gateway.calls.paymentsRefund, 1, 'only the original failed cancellation attempt, no new gateway call');
    assert.equal(JSON.stringify(await Payment.find({}).lean()), before, 'database untouched');
  });

  it('there is no route that edits payment or refund status directly', async () => {
    const admin = await makeAdmin();
    const { payment } = await refundRequiredPayment();
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      for (const path of [`/api/v1/admin/payments/${payment._id}`, `/api/v1/admin/payments/${payment._id}/status`]) {
        const res = await call(method, path, { token: admin.token, body: { status: 'REFUNDED', refundedAmount: 9999 } });
        assert.equal(res.status, 404, `${method} ${path}`);
      }
    }
    const reconcileTry = await call('POST', `/api/v1/admin/payments/${payment._id}/reconcile`, {
      token: admin.token, body: { note: 'trying to smuggle a status', status: 'REFUNDED', refundedAmount: 9999 }
    });
    assert.equal(reconcileTry.status, 409); // not flagged for reconciliation
    const p = await Payment.findById(payment._id);
    assert.equal(p.status, 'PAID');
    assert.equal(p.refundedAmount, 0);
  });
});

// ------------------------------------------------------------------ list + filters
describe('Reconciliation visibility and filters', () => {
  async function scenario() {
    const admin = await makeAdmin();
    // 1) needs reconciliation
    const flagged = await flaggedMismatch();
    // 2) healthy paid order
    const healthy = await completePrepaidPurchase(await makeCustomer(), await makeProduct({ price: 300, stock: 10 }), 1);
    // 3) failed payment
    const fc = await makeCustomer();
    await addToCart(fc, await makeProduct({ stock: 10 }), 1);
    const failedSession = await startSession(fc);
    await sendWebhook(failedEvent({ id: 'pay_failed_1', order_id: failedSession.razorpayOrderId, error_description: 'card declined' }));
    const failedPayment = await Payment.findOne({ gatewayOrderId: failedSession.razorpayOrderId });
    // 4) refund required
    const refundReq = await refundRequiredPayment();
    // 5) successfully reconciled (admin resolved a second flagged payment)
    const resolved = await flaggedMismatch();
    assert.equal((await reconcile(admin, resolved.payment._id, 'Customer refunded manually in Razorpay')).status, 200);
    return { admin, flagged, healthy, failedPayment, refundReq, resolved };
  }

  it('every view returns exactly its payments, and the counters match', async () => {
    const { admin, flagged, healthy, failedPayment, refundReq, resolved } = await scenario();
    const S = (p) => String(p._id);

    const all = await list(admin, '?limit=100');
    assert.equal(all.status, 200);
    assert.equal(all.body.data.pagination.totalItems, 5);

    const needs = await list(admin, '?view=needs_reconciliation');
    assert.deepEqual(ids(needs), [S(flagged.payment)]);

    const recon = await list(admin, '?view=reconciled');
    assert.deepEqual(ids(recon), [S(resolved.payment)]);

    const failed = await list(admin, '?view=failed');
    assert.deepEqual(ids(failed), [S(failedPayment)]);

    const rr = await list(admin, '?view=refund_required');
    assert.deepEqual(ids(rr), [S(refundReq.payment)]);

    const { stats } = all.body.data;
    assert.equal(stats.needsReconciliationCount, 1);
    assert.equal(stats.reconciledCount, 1);
    assert.equal(stats.refundRequiredCount, 1);
    assert.equal(stats.failedCount, 1);
    // counters do not depend on the selected view
    assert.equal(needs.body.data.stats.refundRequiredCount, 1);
    assert.ok(healthy.payment);
  });

  it('each row carries the requested fields', async () => {
    const { admin, flagged } = await scenario();
    const row = (await list(admin, '?view=needs_reconciliation')).body.data.payments[0];
    assert.equal(String(row._id), String(flagged.payment._id));                    // Payment ID
    assert.equal(row.razorpayPaymentId, flagged.gp.id);                            // Razorpay payment id (even though never linked)
    assert.equal(row.gatewayOrderId, flagged.session.razorpayOrderId);             // Razorpay order id
    assert.equal(row.user.name, 'Test Customer');                                   // Customer
    assert.ok(row.user.phone);
    assert.equal(row.amount, flagged.payment.amount);                               // Paid amount
    assert.equal(row.status, 'PAID');                                               // Payment status (money was captured, no order exists)
    assert.match(row.reconciliation.reason, /order could not be created.*does not match the amount paid/i); // Reconciliation reason
    assert.ok(row.createdAt);                                                       // Created date
    assert.equal(row.reconciliation.status, 'OPEN');                                // Reconciliation status
    assert.ok(row.reconciliation.openedAt);
  });

  it('list never exposes the gateway signature or the audit trail; detail has the trail but still no signature', async () => {
    const { admin, healthy } = await scenario();
    const listed = await list(admin, '?limit=100');
    for (const p of listed.body.data.payments) {
      assert.equal(p.gatewaySignature, undefined);
      assert.equal(p.auditTrail, undefined);
    }
    const d = await detail(admin, healthy.payment._id);
    assert.equal(d.status, 200);
    assert.equal(d.body.data.payment.gatewaySignature, undefined);
    assert.ok(Array.isArray(d.body.data.payment.auditTrail) && d.body.data.payment.auditTrail.length > 0);
    assert.equal(d.body.data.payment.razorpayPaymentId, healthy.gp.id);
  });

  it('views combine with search / status / pagination; bad input is handled (no 500)', async () => {
    const { admin, flagged, refundReq } = await scenario();
    const byPayId = await list(admin, `?view=needs_reconciliation&search=${flagged.gp.id}`);
    assert.deepEqual(ids(byPayId), [String(flagged.payment._id)]);
    const none = await list(admin, '?view=needs_reconciliation&search=zzz_nothing');
    assert.equal(none.body.data.payments.length, 0);
    const conflicting = await list(admin, '?view=failed&status=PAID');
    assert.equal(conflicting.body.data.payments.length, 0);
    const refundByStatus = await list(admin, '?view=refund_required&status=PAID');
    assert.deepEqual(ids(refundByStatus), [String(refundReq.payment._id)]);

    const paged = await list(admin, '?limit=2&page=2');
    assert.equal(paged.status, 200);
    assert.equal(paged.body.data.payments.length, 2);
    assert.equal(paged.body.data.pagination.totalPages, 3);

    for (const q of ['?search=(', '?search=[', '?search=.*', '?search=\\', '?page=abc&limit=-5']) {
      const r = await list(admin, q);
      assert.ok(r.status < 500, `${q} -> ${r.status}`);
    }
    const badView = await list(admin, '?view=everything');
    assert.equal(badView.status, 400);
  });
});

// ------------------------------------------------------------------ failed payments
describe('Failed payment reconciliation', () => {
  it('a failed gateway payment appears under "Failed payments" with its reason; a later successful capture moves it to PAID', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    const p = await makeProduct({ stock: 10 });
    await addToCart(c, p, 1);
    const session = await startSession(c);

    await sendWebhook(failedEvent({ id: 'pay_f', order_id: session.razorpayOrderId, error_description: 'insufficient funds' }));
    let rows = (await list(admin, '?view=failed')).body.data.payments;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'FAILED');
    assert.equal(rows[0].failureReason, 'insufficient funds');
    assert.equal((await list(admin, '?view=needs_reconciliation')).body.data.payments.length, 0, 'a plain decline is not a reconciliation case');

    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const v = await verifySession(c, session, gp);
    assert.equal(v.status, 200);
    assert.equal((await list(admin, '?view=failed')).body.data.payments.length, 0);
    assert.equal(await Order.countDocuments({ user: c.id }), 1);
    assert.equal((await Payment.findOne({ gatewayOrderId: session.razorpayOrderId })).status, 'PAID');
  });

  it('a failed payment that was ALSO flagged (amount mismatch after a decline) shows in both views', async () => {
    const admin = await makeAdmin();
    const { payment, gp } = await flaggedMismatch();
    await Payment.updateOne({ _id: payment._id }, { $set: { status: 'FAILED' } });
    assert.equal((await list(admin, '?view=failed')).body.data.payments.length, 1);
    assert.equal((await list(admin, '?view=needs_reconciliation')).body.data.payments.length, 1);
    assert.ok(gp.id);
  });
});

// ------------------------------------------------------------------ successful reconciliation
describe('Successful reconciliation', () => {
  it('admin closes a flagged payment: marker + who/when/why recorded; status, amounts and refunds untouched', async () => {
    const admin = await makeAdmin();
    const { payment } = await flaggedMismatch();
    const before = await Payment.findById(payment._id).lean();

    const res = await reconcile(admin, payment._id, 'Refunded ₹100 from the Razorpay dashboard');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.payment.reconciliation.status, 'RESOLVED');

    const after = await Payment.findById(payment._id).lean();
    assert.equal(after.metadata.needsReconciliation, false);
    assert.ok(after.metadata.reconciledAt);
    assert.equal(after.metadata.reconciledBy, `ADMIN:${admin.id}`);
    assert.equal(after.metadata.reconciliationNote, 'Refunded ₹100 from the Razorpay dashboard');
    // nothing financial changed
    for (const k of ['status', 'amount', 'refundedAmount', 'refundPendingAmount', 'gatewayPaymentId', 'order', 'currency']) {
      assert.deepEqual(after[k], before[k], k);
    }
    assert.deepEqual(after.refunds, before.refunds);
    // audit: admin id + timestamp
    const entry = after.auditTrail.at(-1);
    assert.equal(entry.action, 'RECONCILIATION_RESOLVED');
    assert.equal(entry.actor, `ADMIN:${admin.id}`);
    assert.ok(entry.at instanceof Date);
    assert.equal(entry.meta.note, 'Refunded ₹100 from the Razorpay dashboard');
    // views
    assert.equal((await list(admin, '?view=needs_reconciliation')).body.data.payments.length, 0);
    assert.equal((await list(admin, '?view=reconciled')).body.data.payments.length, 1);
  });

  it('requires a note; refuses unflagged / unknown / malformed ids; is idempotent under double-clicks', async () => {
    const admin = await makeAdmin();
    const { payment } = await flaggedMismatch();
    assert.equal((await reconcile(admin, payment._id, '')).status, 400);
    assert.equal((await reconcile(admin, payment._id, 'ok')).status, 400);
    assert.equal((await reconcile(admin, payment._id, 'x'.repeat(501))).status, 400);
    assert.equal((await Payment.findById(payment._id)).metadata.needsReconciliation, true);

    const results = await Promise.all(Array.from({ length: 6 }, () => reconcile(admin, payment._id, 'Resolved by support')));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.ok(results.filter((r) => r.status !== 200).every((r) => r.status === 409));
    const p = await Payment.findById(payment._id);
    assert.equal(p.auditTrail.filter((a) => a.action === 'RECONCILIATION_RESOLVED').length, 1);

    assert.equal((await reconcile(admin, payment._id)).status, 409);
    assert.equal((await reconcile(admin, '64b64b64b64b64b64b64b64b')).status, 404);
    assert.equal((await reconcile(admin, 'not-an-id')).status, 400);
    const healthy = await completePrepaidPurchase(await makeCustomer(), await makeProduct({ stock: 5 }), 1);
    assert.equal((await reconcile(admin, healthy.payment._id)).status, 409);
  });

  it('system auto-resolves when the customer fixes the cart and verification then succeeds', async () => {
    const admin = await makeAdmin();
    const { customer, session, gp, big, payment } = await flaggedMismatch();
    // customer removes the extra items so the cart again matches what was paid
    await Cart.updateOne({ user: customer.id }, { $pull: { items: { product: big._id } } });
    const ok = await verifySession(customer, session, gp);
    assert.equal(ok.status, 200);

    const p = await Payment.findById(payment._id);
    assert.equal(p.status, 'PAID');
    assert.ok(p.order);
    assert.equal(p.metadata.needsReconciliation, false);
    assert.equal(p.metadata.reconciledBy, 'SYSTEM');
    assert.ok(p.metadata.reconciledAt);
    assert.equal((await list(admin, '?view=needs_reconciliation')).body.data.payments.length, 0);
    assert.equal((await list(admin, '?view=reconciled')).body.data.payments.length, 1);
    assert.equal(await Order.countDocuments({ user: customer.id }), 1);
  });

  it('payment received but order creation failed → flagged with a reason, then auto-resolved on retry', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    const p = await makeProduct({ price: 100, stock: 1 });
    await addToCart(c, p, 1);
    const session = await startSession(c);
    const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    await (await import('../helpers/harness.js')).Product.updateOne({ _id: p._id }, { $set: { stockCount: 0, inStock: false } }); // sold out meanwhile
    const bad = await verifySession(c, session, gp);
    assert.ok(bad.status >= 400);
    const row = (await list(admin, '?view=needs_reconciliation')).body.data.payments[0];
    assert.equal(row.status, 'PAID');
    assert.match(row.reconciliation.reason, /order could not be created/i);
    assert.equal(row.razorpayPaymentId, gp.id);

    await (await import('../helpers/harness.js')).Product.updateOne({ _id: p._id }, { $set: { stockCount: 5, inStock: true } }); // restocked
    const fixed = await verifySession(c, session, gp);
    assert.equal(fixed.status, 200);
    assert.equal((await list(admin, '?view=needs_reconciliation')).body.data.payments.length, 0);
    assert.equal((await list(admin, '?view=reconciled')).body.data.payments.length, 1);
    assert.equal(await Order.countDocuments({ user: c.id }), 1);
  });
});

// ------------------------------------------------------------------ refund visibility + retry
describe('Failed refund visibility', () => {
  it('a payment whose cancellation refund failed is listed with the original payment, the amount and the failure reason', async () => {
    const { admin, payment, order } = await refundRequiredPayment({ price: 400 });
    const rows = (await list(admin, '?view=refund_required')).body.data.payments;
    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(String(row._id), String(payment._id));
    assert.equal(row.razorpayPaymentId, payment.gatewayPaymentId);
    assert.equal(row.gatewayOrderId, payment.gatewayOrderId);
    assert.equal(row.amount, payment.amount);
    assert.equal(String(row.order._id), String(order._id));
    assert.equal(row.refundRetry.required, true);
    assert.equal(row.refundRetry.canRetry, true);
    assert.equal(row.refundRetry.retryAmount, payment.amount);
    assert.match(row.refundRetry.failureReason, /Refund rejected by gateway/);
    assert.ok(row.refundRetry.requiredAt);
  });

  it('a refund.failed webhook puts the payment on the list too (and a replay does not duplicate anything)', async () => {
    const admin = await makeAdmin();
    const customer = await makeCustomer();
    const { order, payment } = await completePrepaidPurchase(customer, await makeProduct({ price: 250, stock: 10 }), 1);
    await call('POST', `/api/v1/orders/${order._id}/cancel`, { token: customer.token, body: {} });
    const sent = lastGatewayRefund();
    const ev = refundFailedEvent({ ...sent, status: 'failed', error_description: 'bank account closed' });
    await sendWebhook(ev);
    await sendWebhook(ev);
    const rows = (await list(admin, '?view=refund_required')).body.data.payments;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].refundRetry.failureReason, 'bank account closed');
    assert.equal(rows[0].refunds.length, 1);
    assert.ok((await assertRefundLedger(payment._id)).consistent);
  });
});

describe('Refund retry', () => {
  it('retry creates ONE refund for the failed amount; status stays REFUND_PENDING until the gateway confirms; audit has admin + time', async () => {
    const { admin, payment, order } = await refundRequiredPayment({ price: 300 });
    assert.equal(gateway.calls.paymentsRefund, 1); // the failed original attempt
    const res = await retry(admin, payment._id);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.duplicate, false);
    assert.equal(gateway.calls.paymentsRefund, 2);

    const sent = lastGatewayRefund();
    assert.equal(sent.amount, Math.round(payment.amount * 100));
    assert.equal(sent.payment_id, payment.gatewayPaymentId);

    let { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.status, 'REFUND_PENDING', 'not REFUNDED merely because we asked');
    assert.equal(p.refundedAmount, 0);
    assert.equal(p.refundPendingAmount, payment.amount);
    assert.equal(p.metadata.refundRequired, false);
    assert.deepEqual(p.refunds.map((r) => r.status), ['FAILED', 'PENDING']);
    assert.equal((await Order.findById(order._id)).payment.status, 'REFUND_PENDING');

    const entry = p.auditTrail.find((a) => a.action === 'REFUND_RETRY_REQUESTED');
    assert.equal(entry.actor, `ADMIN:${admin.id}`);
    assert.ok(entry.at instanceof Date);
    assert.equal(p.metadata.refundRetriedBy, `ADMIN:${admin.id}`);
    assert.ok(p.auditTrail.some((a) => a.action === 'REFUND_INITIATED' && a.actor === `ADMIN:${admin.id}`));

    // only the verified gateway confirmation completes it
    await sendWebhook(refundProcessedEvent({ ...sent, status: 'processed' }));
    ({ p, consistent } = await assertRefundLedger(payment._id));
    assert.ok(consistent);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(p.refundedAmount, payment.amount);
    assert.equal((await Order.findById(order._id)).payment.status, 'REFUNDED');
    assert.equal((await list(admin, '?view=refund_required')).body.data.payments.length, 0);
  });

  it('a retry the gateway rejects again keeps the payment on the list and can be retried once more', async () => {
    const { admin, payment } = await refundRequiredPayment();
    gateway.failNextRefund = true;
    const bad = await retry(admin, payment._id);
    assert.equal(bad.status, 502);
    let p = await Payment.findById(payment._id);
    assert.equal(p.metadata.refundRequired, true);
    assert.equal(p.refundPendingAmount, 0);
    assert.deepEqual(p.refunds.map((r) => r.status), ['FAILED', 'FAILED']);
    assert.ok(p.auditTrail.some((a) => a.action === 'REFUND_RETRY_FAILED' && a.actor === `ADMIN:${admin.id}`));
    assert.equal((await list(admin, '?view=refund_required')).body.data.payments.length, 1);

    gateway.refundStatus = 'processed';
    const ok = await retry(admin, payment._id);
    assert.equal(ok.status, 200);
    const { p: final, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(final.status, 'REFUNDED');
    assert.equal(final.metadata.refundRequired, false);
    assert.equal(final.refundedAmount, payment.amount);
  });

  it('retries only the failed amount of a partially refunded payment and never exceeds the captured amount', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    const { payment } = await completePrepaidPurchase(c, await makeProduct({ price: 400, stock: 10 }), 1); // 460
    gateway.refundStatus = 'processed';
    assert.equal((await call('POST', `/api/v1/admin/payments/${payment._id}/refund`, { token: admin.token, body: { amount: 100 } })).status, 200);
    gateway.failNextRefund = true;
    assert.equal((await call('POST', `/api/v1/admin/payments/${payment._id}/refund`, { token: admin.token, body: { amount: 150 } })).status, 502);
    await Payment.updateOne({ _id: payment._id }, { $set: { 'metadata.refundRequired': true, 'metadata.refundError': 'rejected' } });

    const row = (await list(admin, '?view=refund_required')).body.data.payments[0];
    assert.equal(row.refundRetry.retryAmount, 150);
    assert.equal((await retry(admin, payment._id)).status, 200);
    assert.equal(lastGatewayRefund().amount, 15000);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refundedAmount, 250);
    assert.ok(p.refundedAmount + p.refundPendingAmount <= p.amount);
  });

  it('DUPLICATE retries: simultaneous clicks create exactly one gateway refund', async () => {
    const { admin, payment } = await refundRequiredPayment();
    gateway.refundDelayMs = 60;
    const callsBefore = gateway.calls.paymentsRefund;
    const results = await Promise.all(Array.from({ length: 8 }, () => retry(admin, payment._id)));
    assert.ok(results.every((r) => [200, 409].includes(r.status)), results.map((r) => r.status).join());
    assert.equal(results.filter((r) => r.status === 200 && r.body.data.duplicate === false).length, 1);
    assert.equal(gateway.calls.paymentsRefund - callsBefore, 1);
    const { p, consistent } = await assertRefundLedger(payment._id);
    assert.ok(consistent);
    assert.equal(p.refunds.filter((r) => r.status === 'PENDING').length, 1);
    assert.equal(p.refundPendingAmount, payment.amount);
  });

  it('DUPLICATE retries: sequential repeats, idempotency-key replays, in-flight refunds and non-flagged payments are all refused/no-ops', async () => {
    const { admin, payment } = await refundRequiredPayment();
    const callsBefore = gateway.calls.paymentsRefund;
    assert.equal((await retry(admin, payment._id, { 'Idempotency-Key': 'ui-click-1' })).status, 200);
    // same key again (double submit / network retry) → harmless
    const replay = await retry(admin, payment._id, { 'Idempotency-Key': 'ui-click-1' });
    assert.ok([200, 409].includes(replay.status));
    // flag cleared after acceptance → second retry refused
    const second = await retry(admin, payment._id);
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, 'REFUND_NOT_REQUIRED');
    // even if the flag is raised again while the refund is still in flight, no second refund starts
    await Payment.updateOne({ _id: payment._id }, { $set: { 'metadata.refundRequired': true } });
    const inflight = await retry(admin, payment._id);
    assert.equal(inflight.status, 409);
    assert.equal(inflight.body.error.code, 'REFUND_IN_PROGRESS');
    assert.equal(gateway.calls.paymentsRefund - callsBefore, 1);

    // not flagged at all
    const other = await completePrepaidPurchase(await makeCustomer(), await makeProduct({ stock: 5 }), 1);
    assert.equal((await retry(admin, other.payment._id)).status, 409);
    assert.equal((await retry(admin, 'not-an-id')).status, 400);
    assert.equal((await retry(admin, '64b64b64b64b64b64b64b64b')).status, 404);
    assert.ok((await assertRefundLedger(payment._id)).consistent);
  });

  it('if the money was already refunded by other means, the stale flag is cleared and no gateway call is made', async () => {
    const { admin, payment } = await refundRequiredPayment();
    await Payment.updateOne({ _id: payment._id }, { $set: { refundedAmount: payment.amount, status: 'REFUNDED' } });
    const callsBefore = gateway.calls.paymentsRefund;
    const res = await retry(admin, payment._id);
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'NOTHING_TO_REFUND');
    assert.equal(gateway.calls.paymentsRefund, callsBefore);
    assert.equal((await Payment.findById(payment._id)).metadata.refundRequired, false);
  });

  it('a normal admin refund that completes the payment also clears a stale refund-required flag', async () => {
    const { admin, payment } = await refundRequiredPayment();
    gateway.refundStatus = 'processed';
    assert.equal((await call('POST', `/api/v1/admin/payments/${payment._id}/refund`, { token: admin.token, body: {} })).status, 200);
    const p = await Payment.findById(payment._id);
    assert.equal(p.status, 'REFUNDED');
    assert.equal(p.metadata.refundRequired, false);
  });
});

// ------------------------------------------------------------------ webhook replay
describe('Webhook replay does not disturb reconciliation state', () => {
  it('replaying captured / refund events after resolution changes nothing', async () => {
    const admin = await makeAdmin();
    const { admin: a2, payment } = await refundRequiredPayment({ price: 350 });
    assert.equal((await retry(a2, payment._id)).status, 200);
    const sent = lastGatewayRefund();
    const processed = refundProcessedEvent({ ...sent, status: 'processed' });
    const captured = capturedEvent({ id: payment.gatewayPaymentId, order_id: payment.gatewayOrderId, amount: Math.round(payment.amount * 100), currency: 'INR' });
    await sendWebhook(processed);
    const snapshot = JSON.stringify(await Payment.findById(payment._id).lean());
    for (let i = 0; i < 3; i++) {
      assert.equal((await sendWebhook(processed)).status, 200);
      assert.equal((await sendWebhook(captured)).status, 200);
    }
    assert.equal(JSON.stringify(await Payment.findById(payment._id).lean()), snapshot, 'byte-for-byte unchanged');
    // the ORIGINAL failure event arriving late must not re-open the retry list
    await sendWebhook(refundFailedEvent({ ...sent, id: 'rfnd_old_failed', status: 'failed', receipt: `cancel:${payment.order}`, notes: { requestKey: `cancel:${payment.order}` } }));
    assert.equal((await list(admin, '?view=refund_required')).body.data.payments.length, 0);
    assert.ok((await assertRefundLedger(payment._id)).consistent);
  });

  it('a replayed "customer paid twice" event is recorded once, and does not re-open an item an admin closed', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    const { payment, session } = await completePrepaidPurchase(c, await makeProduct({ price: 150, stock: 10 }), 1);
    const second = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
    const dup = capturedEvent({ id: second.id, order_id: session.razorpayOrderId, amount: session.amount, currency: 'INR' });
    await sendWebhook(dup);
    let row = (await list(admin, '?view=needs_reconciliation')).body.data.payments[0];
    assert.equal(String(row._id), String(payment._id));
    assert.match(row.reconciliation.reason, /paid twice/i);
    assert.equal(row.razorpayPaymentId, payment.gatewayPaymentId); // the settled payment stays the linked one

    assert.equal((await reconcile(admin, payment._id, 'Extra payment refunded in dashboard')).status, 200);
    await sendWebhook(dup);
    await sendWebhook(dup);
    const p = await Payment.findById(payment._id);
    assert.equal(p.metadata.needsReconciliation, false, 'replay must not re-open a resolved item');
    assert.deepEqual(p.metadata.duplicatePaymentIds, [second.id]);
    assert.equal((await list(admin, '?view=needs_reconciliation')).body.data.payments.length, 0);
    assert.equal(await Order.countDocuments({ user: c.id }), 1);
  });

  it('a replayed mismatching capture event does not re-open an item an admin already reconciled', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    await addToCart(c, await makeProduct({ price: 200, stock: 10 }), 1);
    const session = await startSession(c);
    const bad = capturedEvent({ id: 'pay_wrong_amt', order_id: session.razorpayOrderId, amount: 100, currency: 'INR' });
    await sendWebhook(bad);
    const flagged = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
    assert.equal(flagged.metadata.needsReconciliation, true);
    assert.equal(flagged.metadata.reconciliationPaymentId, 'pay_wrong_amt');
    assert.equal((await reconcile(admin, flagged._id, 'Refunded the ₹1 payment manually')).status, 200);
    await sendWebhook(bad);
    assert.equal((await Payment.findById(flagged._id)).metadata.needsReconciliation, false);
    assert.equal(await Order.countDocuments({ user: c.id }), 0);
  });
});

// ------------------------------------------------------------------ persistence + preservation
describe('Persistence and preservation of existing records', () => {
  it('everything written is persisted in MongoDB and readable through fresh queries', async () => {
    const admin = await makeAdmin();
    const { payment } = await flaggedMismatch();
    await reconcile(admin, payment._id, 'Verified in Razorpay: refunded');
    const raw = await Payment.collection.findOne({ _id: payment._id });
    assert.equal(raw.metadata.needsReconciliation, false);
    assert.equal(raw.metadata.reconciledBy, `ADMIN:${admin.id}`);
    assert.ok(raw.metadata.reconciledAt instanceof Date);
    assert.equal(raw.auditTrail.at(-1).action, 'RECONCILIATION_RESOLVED');
    const viaApi = (await detail(admin, payment._id)).body.data.payment;
    assert.equal(viaApi.reconciliation.status, 'RESOLVED');
    assert.equal(viaApi.reconciliation.note, 'Verified in Razorpay: refunded');
  });

  it('legacy payments created before this change (no new fields) still list correctly and are never modified by reading', async () => {
    const admin = await makeAdmin();
    const c = await makeCustomer();
    // shaped like a record written by the pre-Phase-1 code
    const legacy = await Payment.collection.insertOne({
      user: c.user._id, gateway: 'RAZORPAY', gatewayOrderId: 'order_legacy', gatewayPaymentId: 'pay_legacy',
      amount: 500, currency: 'INR', status: 'PAID', paymentMethod: 'UPI', refunds: [], refundedAmount: 0,
      metadata: {}, createdAt: new Date(), updatedAt: new Date()
    });
    const before = JSON.stringify(await Payment.collection.findOne({ _id: legacy.insertedId }));
    const rows = (await list(admin, '?limit=50')).body.data.payments;
    const row = rows.find((r) => r.gatewayPaymentId === 'pay_legacy');
    assert.ok(row);
    assert.equal(row.reconciliation.status, 'NONE');
    assert.equal(row.refundRetry.required, false);
    assert.equal(row.refundRetry.remainingRefundable, 500);
    await detail(admin, legacy.insertedId);
    assert.equal(JSON.stringify(await Payment.collection.findOne({ _id: legacy.insertedId })), before);
    // and a record flagged by the earlier Phase 1 code (flag but no reason/timestamp) still shows with a sensible reason
    await Payment.collection.updateOne({ _id: legacy.insertedId }, { $set: { 'metadata.needsReconciliation': true } });
    const flaggedRow = (await list(admin, '?view=needs_reconciliation')).body.data.payments[0];
    assert.equal(flaggedRow.reconciliation.reason, 'Flagged for review');
    assert.equal((await reconcile(admin, legacy.insertedId, 'Checked manually, all fine')).status, 200);
  });
});
