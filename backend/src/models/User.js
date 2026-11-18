import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';
import { ACCOUNT_STATUS } from '../constants/status.js';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please enter a valid email address'
      ],
      default: undefined
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    avatar: {
      type: String,
      default: ''
    },
    addresses: [addressSchema],
    // FCM Push Notification Tokens (Web & Mobile)
    fcmTokens: {
      type: [String],
      default: []
    },
    fcmTokenMobile: {
      type: [String],
      default: []
    },
    // Cash on Delivery permission. OFF for everyone until an admin grants it.
    // Only `isEnabled === true` counts, so customers created before this field existed are also OFF.
    // Never writable from customer-facing endpoints; changes go through codPermissionService (audited).
    codAccess: {
      isEnabled: { type: Boolean, default: false },
      enabledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
      enabledAt: { type: Date, default: null },
      disabledAt: { type: Date, default: null },
      reason: { type: String, trim: true, default: '', maxlength: 500 }
    },
    // Set when the customer deletes their own account (personal data is erased, order history is kept)
    deletedAt: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        // Customers only learn whether COD is on; the admin's internal reason / admin id stay private.
        if (ret.codAccess) ret.codAccess = { isEnabled: ret.codAccess.isEnabled === true };
        return ret;
      }
    }
  }
);

// Ensure sparse unique index so users without emails do not collide
userSchema.index({ email: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
export default User;
