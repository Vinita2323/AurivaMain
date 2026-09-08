import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required for OTP'],
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: [true, 'OTP hash is required']
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    resendCount: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Automatic MongoDB TTL cleanup after expiry
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast lookup of active phone OTPs
otpSchema.index({ phone: 1, expiresAt: 1 });

export const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
