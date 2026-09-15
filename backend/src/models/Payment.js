import mongoose from 'mongoose';

const refundItemSchema = new mongoose.Schema(
  {
    refundId: {
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
      required: [true, 'Order reference is required'],
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
    gatewayOrderId: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    gatewayPaymentId: {
      type: String,
      trim: true,
      default: '',
      index: true
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
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative']
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

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
