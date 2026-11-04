/**
 * Phase 1 payment-security data migration.
 *
 *   node scripts/migrate_phase1_payments.js            # DRY RUN (read-only) — default
 *   node scripts/migrate_phase1_payments.js --apply    # writes changes (back up the database first)
 *
 * What it does
 *   1. Reports duplicate non-empty gatewayPaymentId / gatewayOrderId values. These MUST be resolved by a
 *      human before the new unique indexes can be built (the old code allowed one payment to "pay" several
 *      orders). The script never deletes or edits those records.
 *   2. Recomputes refundedAmount (= sum of PROCESSED refunds) and the new refundPendingAmount
 *      (= sum of PENDING refunds) from each payment's refund rows, and re-derives payment.status
 *      for payments that have refunds. The previous code counted PENDING refunds inside refundedAmount
 *      and could count a refund twice when its webhook arrived.
 *   3. With --apply and no duplicates, builds the Payment indexes.
 *
 * It does not touch Orders, Wallets or any other collection.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import Payment from '../src/models/Payment.js';

const APPLY = process.argv.includes('--apply');
const round2 = (n) => Math.round(Number(n) * 100) / 100;

const host = (() => {
  try {
    return new URL(env.MONGO_URI).host;
  } catch {
    return 'unknown';
  }
})();

console.log(`\nPhase 1 payments migration — ${APPLY ? 'APPLY (writes enabled)' : 'DRY RUN (read-only)'}`);
console.log(`Database host: ${host}  (credentials are never printed)\n`);

await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

try {
  // ---- 1. duplicates --------------------------------------------------------------------------
  let blocked = false;
  for (const field of ['gatewayPaymentId', 'gatewayOrderId']) {
    const dups = await Payment.aggregate([
      { $match: { [field]: { $type: 'string', $gt: '' } } },
      { $group: { _id: `$${field}`, ids: { $push: '$_id' }, orders: { $push: '$order' }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } }
    ]);
    if (dups.length) {
      blocked = true;
      console.log(`⚠  ${dups.length} duplicate ${field} value(s) — review and fix manually BEFORE building the unique index:`);
      for (const d of dups) {
        console.log(`   ${field}=${d._id}  used by ${d.n} payment records: ${d.ids.join(', ')}`);
      }
    } else {
      console.log(`✓ No duplicate ${field} values.`);
    }
  }

  // ---- 2. refund counters ---------------------------------------------------------------------
  const withRefunds = await Payment.find({ 'refunds.0': { $exists: true } });
  let changed = 0;
  let overRefunded = 0;
  for (const p of withRefunds) {
    const processed = round2(p.refunds.filter((r) => r.status === 'PROCESSED').reduce((s, r) => s + r.amount, 0));
    const pending = round2(p.refunds.filter((r) => r.status === 'PENDING').reduce((s, r) => s + r.amount, 0));
    let status = p.status;
    if (['PAID', 'PARTIALLY_REFUNDED', 'REFUND_PENDING', 'REFUNDED'].includes(p.status)) {
      if (processed >= p.amount - 0.005) status = 'REFUNDED';
      else if (processed > 0) status = 'PARTIALLY_REFUNDED';
      else if (pending > 0) status = 'REFUND_PENDING';
      else status = 'PAID';
    }
    if (processed + pending > p.amount + 0.005) {
      overRefunded += 1;
      console.log(`⚠  Payment ${p._id}: refund rows total ₹${processed + pending} but captured amount is ₹${p.amount} — needs manual review with Razorpay.`);
    }
    const differs =
      round2(p.refundedAmount || 0) !== processed ||
      round2(p.refundPendingAmount || 0) !== pending ||
      p.status !== status;
    if (differs) {
      changed += 1;
      console.log(
        `  ${p._id}: refundedAmount ${p.refundedAmount || 0}→${processed}, pending ${p.refundPendingAmount || 0}→${pending}, status ${p.status}→${status}`
      );
      if (APPLY) {
        await Payment.updateOne(
          { _id: p._id },
          { $set: { refundedAmount: processed, refundPendingAmount: pending, status }, $push: { auditTrail: { action: 'MIGRATION_PHASE1_REFUND_COUNTERS', actor: 'SYSTEM:MIGRATION', at: new Date(), meta: {} } } }
        );
      }
    }
  }
  console.log(`\nPayments with refunds: ${withRefunds.length}; need correction: ${changed}; over-refunded: ${overRefunded}`);

  // ---- 3. indexes -----------------------------------------------------------------------------
  if (APPLY) {
    if (blocked) {
      console.log('\n✗ Indexes NOT built: resolve the duplicate ids above, then re-run with --apply.');
    } else {
      await Payment.createIndexes();
      console.log('\n✓ Payment indexes built (unique gatewayPaymentId / gatewayOrderId).');
    }
  } else {
    console.log('\nDry run only — nothing was written. Re-run with --apply after taking a database backup.');
  }
} finally {
  await mongoose.disconnect();
}
