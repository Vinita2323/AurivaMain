import mongoose from 'mongoose';

/**
 * Format timestamp into human-readable relative time
 * (e.g., "Just now", "10m ago", "2h ago", "Yesterday", "3d ago")
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return 'Just now';
  const now = new Date();
  const date = new Date(dateInput);
  const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const notificationSchema = new mongoose.Schema(
  {
    // Specific recipient user/admin (null indicates role-wide broadcast, e.g. for all Admins)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true
    },

    // Strict role partition: USER or ADMIN
    recipientRole: {
      type: String,
      enum: {
        values: ['USER', 'ADMIN'],
        message: 'recipientRole must be either USER or ADMIN'
      },
      required: [true, 'recipientRole is required'],
      index: true
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },

    type: {
      type: String,
      enum: [
        'ORDER_PLACED',
        'ORDER_CONFIRMED',
        'ORDER_PACKED',
        'ORDER_SHIPPED',
        'ORDER_OUT_FOR_DELIVERY',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED',
        'LOW_STOCK',
        'REVIEW_RECEIVED',
        'SYSTEM'
      ],
      default: 'SYSTEM',
      index: true
    },

    // Related entity ID (e.g., Order ObjectId, Product ObjectId)
    relatedId: {
      type: String,
      default: null,
      trim: true
    },

    // Frontend routing URL (e.g., "/admin/orders", "/admin/inventory", "/orders/AV12345")
    link: {
      type: String,
      default: '',
      trim: true
    },

    read: {
      type: Boolean,
      default: false,
      index: true
    },

    readAt: {
      type: Date,
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        // Frontend compatibility aliases
        ret.description = ret.message;
        ret.time = formatRelativeTime(ret.createdAt);
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for optimal retrieval speed and role isolation
notificationSchema.index({ recipientRole: 1, recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, read: 1, 'metadata.productId': 1 });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
