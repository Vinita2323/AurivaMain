import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    discountType: {
      type: String,
      enum: {
        values: ['PERCENTAGE', 'FIXED'],
        message: 'Discount type must be either PERCENTAGE or FIXED'
      },
      required: [true, 'Discount type is required'],
      uppercase: true
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0.01, 'Discount value must be greater than zero']
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order value cannot be negative']
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Maximum discount cannot be negative']
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: [0, 'Usage limit cannot be negative']
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Status must be ACTIVE or INACTIVE'
      },
      default: 'ACTIVE',
      index: true
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
couponSchema.index({ status: 1, startDate: 1, endDate: 1 });

// Pre-save hook: Normalize code and validate dates/values
couponSchema.pre('save', function (next) {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }

  if (this.discountType === 'PERCENTAGE' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }

  if (this.endDate && this.startDate && new Date(this.endDate) <= new Date(this.startDate)) {
    return next(new Error('End date must be strictly after start date'));
  }

  next();
});

export const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
