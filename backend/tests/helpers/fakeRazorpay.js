import crypto from 'crypto';

/**
 * In-memory stand-in for the Razorpay SDK client. No network access, no real money.
 * Tests drive "what the gateway says" through simulatePayment() and the failure switches.
 */
export function createFakeRazorpay() {
  let seq = 0;
  const next = (p) => `${p}_${String(++seq).padStart(6, '0')}${crypto.randomBytes(2).toString('hex')}`;

  const fake = {
    orders_: new Map(),
    payments_: new Map(),
    refunds_: new Map(),
    calls: { ordersCreate: 0, paymentsFetch: 0, paymentsCapture: 0, paymentsRefund: 0 },
    // behaviour switches
    refundStatus: 'pending', // 'pending' | 'processed'
    failNextRefund: false,
    failNextFetch: false,
    refundDelayMs: 0,

    orders: {
      create: async ({ amount, currency = 'INR', receipt, notes }) => {
        fake.calls.ordersCreate += 1;
        const order = { id: next('order'), entity: 'order', amount, currency, receipt, notes, status: 'created' };
        fake.orders_.set(order.id, order);
        return order;
      }
    },

    payments: {
      fetch: async (id) => {
        fake.calls.paymentsFetch += 1;
        if (fake.failNextFetch) {
          fake.failNextFetch = false;
          throw { error: { description: 'gateway unavailable' } };
        }
        const p = fake.payments_.get(id);
        if (!p) throw { error: { description: 'The id provided does not exist' } };
        return { ...p };
      },
      capture: async (id, amount, currency) => {
        fake.calls.paymentsCapture += 1;
        const p = fake.payments_.get(id);
        if (!p || p.status !== 'authorized' || p.amount !== amount) throw { error: { description: 'cannot capture' } };
        p.status = 'captured';
        return { ...p };
      },
      refund: async (paymentId, opts) => {
        fake.calls.paymentsRefund += 1;
        if (fake.refundDelayMs) await new Promise((r) => setTimeout(r, fake.refundDelayMs));
        if (fake.failNextRefund) {
          fake.failNextRefund = false;
          throw { error: { description: 'Refund rejected by gateway' } };
        }
        const p = fake.payments_.get(paymentId);
        if (!p) throw { error: { description: 'payment not found' } };
        const refund = {
          id: next('rfnd'),
          entity: 'refund',
          payment_id: paymentId,
          amount: opts.amount,
          currency: p.currency,
          receipt: opts.receipt || null,
          notes: opts.notes || {},
          status: fake.refundStatus
        };
        fake.refunds_.set(refund.id, refund);
        return { ...refund };
      }
    },

    /** Create a payment on the fake gateway (what Razorpay Checkout would produce). */
    simulatePayment({ orderId, amount, currency = 'INR', status = 'captured' }) {
      const entity = { id: next('pay'), entity: 'payment', order_id: orderId, amount, currency, status, created_at: Math.floor(Date.now() / 1000) };
      fake.payments_.set(entity.id, entity);
      return entity;
    },

    reset() {
      fake.orders_.clear();
      fake.payments_.clear();
      fake.refunds_.clear();
      fake.refundStatus = 'pending';
      fake.failNextRefund = false;
      fake.failNextFetch = false;
      fake.refundDelayMs = 0;
      Object.keys(fake.calls).forEach((k) => (fake.calls[k] = 0));
    }
  };
  return fake;
}
