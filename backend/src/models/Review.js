import mongoose from 'mongoose';

const adminReplySchema = new mongoose.Schema(
  {
    reply: {
      type: String,
      trim: true,
      default: null
    },
    repliedAt: {
      type: Date,
      default: null
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Delivered order reference is required'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Review title cannot exceed 120 characters'],
      default: ''
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [2000, 'Review comment cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    verifiedPurchase: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      default: false,
      index: true
    },
    adminReply: {
      type: adminReplySchema,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : ret.id;
        // Frontend compatibility aliases
        ret.content = ret.comment;
        ret.verified = ret.verifiedPurchase;
        if (ret.adminReply && typeof ret.adminReply === 'object') {
          ret.adminReplyText = ret.adminReply.reply || null;
        }
        return ret;
      }
    }
  }
);

// Enforce unique review per user per delivered order per product
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
