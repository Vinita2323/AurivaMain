import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
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
      min: [1, 'Quantity must be at least 1'],
      default: 1
    }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    guestId: {
      type: String
    },
    items: [cartItemSchema],
    appliedCoupon: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
      code: { type: String, default: null },
      discountType: { type: String, enum: ['PERCENTAGE', 'FIXED', null], default: null },
      discountValue: { type: Number, default: 0 },
      minOrderValue: { type: Number, default: 0 },
      maxDiscount: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      description: { type: String, default: '' },
      discountPercent: { type: Number, default: 0 },
      flatDiscount: { type: Number, default: 0 }
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

// Indexes to ensure uniqueness per user or guestId without null collision
cartSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);
cartSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } }
);

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
