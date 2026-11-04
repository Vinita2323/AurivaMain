import mongoose from 'mongoose';

const refundItemSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      trim: true,
      default: ''
    },
    // Our own idempotency key for this refund request (sent to Razorpay as `receipt`);
    // lets webhooks that arrive before the API response still be matched to the right row
    requestKey: {
      type: String,
      trim: true,
      default: ''
    },
    processedAt: {
      type: Date
    },
    failureReason: {
      type: String,
      trim: true,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Refund amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING'
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const financialBreakdownSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
      default: null,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'COD', 'MANUAL'],
      default: 'RAZORPAY'
    },
    // Uniqueness of non-empty gateway ids is enforced by the partial unique indexes declared below
    gatewayOrderId: {
      type: String,
      trim: true,
      default: ''
    },
    gatewayPaymentId: {
      type: String,
      trim: true,
      default: ''
    },
    gatewaySignature: {
      type: String,
      trim: true,
      default: ''
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'CARD', 'NETBANKING', 'WALLET'],
      default: 'UPI'
    },
    status: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    failureReason: {
      type: String,
      trim: true,
      default: ''
    },
    paidAt: {
      type: Date
    },
    refunds: [refundItemSchema],
    // Money the gateway has CONFIRMED as refunded (sum of PROCESSED refunds)
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative']
    },
    // Money reserved by refund requests that are still in flight (sum of PENDING refunds)
    refundPendingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Pending refund amount cannot be negative']
    },
    // Append-only trail of sensitive financial actions (never stores secrets or signatures)
    auditTrail: {
      type: [
        new mongoose.Schema(
          {
            action: { type: String, required: true },
            actor: { type: String, default: 'SYSTEM' },
            at: { type: Date, default: Date.now },
            meta: { type: mongoose.Schema.Types.Mixed, default: {} }
          },
          { _id: false }
        )
      ],
      default: []
    },
    financialBreakdown: {
      type: financialBreakdownSchema,
      default: () => ({})
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user payments and status filtering
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

// One Razorpay payment can belong to exactly one Payment record (blocks reuse across orders/sessions),
// and one Razorpay order maps to exactly one Payment record. Empty strings are excluded.
paymentSchema.index(
  { gatewayPaymentId: 1 },
  {
    name: 'uniq_gatewayPaymentId',
    unique: true,
    partialFilterExpression: { gatewayPaymentId: { $type: 'string', $gt: '' } }
  }
);
paymentSchema.index(
  { gatewayOrderId: 1 },
  {
    name: 'uniq_gatewayOrderId',
    unique: true,
    partialFilterExpression: { gatewayOrderId: { $type: 'string', $gt: '' } }
  }
);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
