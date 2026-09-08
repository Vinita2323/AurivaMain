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
        return ret;
      }
    }
  }
);

// Ensure sparse unique index so users without emails do not collide
userSchema.index({ email: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
export default User;
