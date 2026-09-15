import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      default: ''
    },
    weight: {
      type: String,
      default: '150g'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    oldPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
);

const shippingAddressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true, default: 'Madhya Pradesh' },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: 'India' },
    addressType: { type: String, trim: true, default: 'home' }
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null },
    deliveryFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponDetails: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
      code: { type: String, default: null },
      discountType: { type: String, enum: ['PERCENTAGE', 'FIXED', null], default: null },
      discountValue: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 }
    }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['COD', 'UPI', 'CARD', 'NETBANKING'],
      default: 'COD'
    },
    status: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'],
      default: 'PENDING'
    },
    transactionId: { type: String, default: '' },
    upiApp: { type: String, default: '' }
  },
  { _id: false }
);

const timelineStepSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    time: { type: String, required: true },
    done: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'System' },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Rohan Kumar' },
    phone: { type: String, default: '+91 9811122334' },
    rating: { type: Number, default: 4.9 },
    vehicle: { type: String, default: 'MP09-AB-1234' },
    eta: { type: String, default: '25 mins' },
    distance: { type: String, default: '2.5 km away' },
    lat: { type: Number, default: 22.7196 },
    lng: { type: Number, default: 75.8577 }
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    type: { type: String, default: 'Standard Express Courier' },
    slot: {
      date: { type: String, default: '' },
      timeSlot: { type: String, default: '' }
    },
    status: { type: String, default: 'In Transit' },
    estimatedDelivery: { type: Date }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: [val => val.length > 0, 'Order must contain at least one item']
    },
    shippingAddress: {
      type: shippingAddressSnapshotSchema,
      required: [true, 'Shipping address snapshot is required']
    },
    pricing: {
      type: pricingSchema,
      required: true
    },
    payment: {
      type: paymentSchema,
      default: () => ({})
    },
    delivery: {
      type: deliverySchema,
      default: () => ({})
    },
    courierName: {
      type: String,
      trim: true,
      default: ''
    },
    awbNumber: {
      type: String,
      trim: true,
      default: ''
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: ''
    },
    dispatchedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PACKED',
        'PROCESSING',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
      ],
      default: 'CONFIRMED',
      index: true
    },
    cancelReason: {
      type: String,
      default: ''
    },
    cancelledBy: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SYSTEM', null],
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    isStockRestored: {
      type: Boolean,
      default: false
    },
    timeline: [timelineStepSchema],
    rider: {
      type: riderSchema,
      default: () => ({})
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      default: undefined
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
export default Order;
