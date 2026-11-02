import mongoose from 'mongoose';

/** Immutable ledger line for every wallet balance change. */
const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    balanceAfter: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: ['ADMIN_CREDIT', 'ADMIN_DEBIT', 'ORDER_PAYMENT', 'ORDER_REFUND'],
      required: true
    },
    reason: { type: String, trim: true, default: '', maxlength: 300 },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNumber: { type: String, default: '' },
    createdBy: { type: String, default: 'System' },
    // Set only for order-linked lines (e.g. "ORDER_REFUND:<orderId>") so a refund can never be applied twice
    dedupeKey: { type: String, index: { unique: true, sparse: true } }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;
