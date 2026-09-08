import crypto from 'crypto';
import env from '../config/env.js';
import Otp from '../models/Otp.js';
import { normalizePhone } from './smsService.js';

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Hash an OTP string with HMAC-SHA256 to ensure raw OTP is never stored in plain text
 * @param {string} otp
 * @returns {string}
 */
export const hashOtp = (otp) => {
  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(String(otp).trim())
    .digest('hex');
};

/**
 * Generate a 6-digit cryptographically secure numeric OTP
 * @returns {string}
 */
export const generate6DigitOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * OTP Service
 * Manages secure generation, hashing, rate-limiting, and verification of OTPs.
 */
class OtpService {
  /**
   * Generates a new OTP, verifies cooldown, hashes, and stores in database
   * @param {string} phone
   * @returns {Promise<{ otp: string, expiresAt: Date, cooldownActive?: boolean, retryAfterSeconds?: number }>}
   */
  async generateAndSaveOtp(phone) {
    const normalizedPhone = normalizePhone(phone);
    const now = new Date();

    // Check existing active OTP for cooldown
    const existingOtp = await Otp.findOne({ phone: normalizedPhone, expiresAt: { $gt: now } });

    if (existingOtp) {
      const timeSinceLastSent = (now.getTime() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (timeSinceLastSent < OTP_RESEND_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - timeSinceLastSent);
        const err = new Error(`Please wait ${retryAfter} seconds before requesting a new OTP.`);
        err.statusCode = 429;
        err.retryAfterSeconds = retryAfter;
        throw err;
      }
    }

    // Generate secure 6-digit OTP
    const otp = generate6DigitOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update existing document or create a new one
    await Otp.findOneAndUpdate(
      { phone: normalizedPhone },
      {
        otpHash,
        attempts: 0,
        lastSentAt: now,
        expiresAt,
        $inc: { resendCount: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      otp,
      expiresAt,
      retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS
    };
  }

  /**
   * Verifies an OTP for a given phone number
   * @param {string} phone
   * @param {string} candidateOtp
   * @returns {Promise<{ success: boolean, reason?: string, message?: string, remainingAttempts?: number }>}
   */
  async verifyOtp(phone, candidateOtp) {
    const normalizedPhone = normalizePhone(phone);
    const now = new Date();

    const otpDoc = await Otp.findOne({ phone: normalizedPhone, expiresAt: { $gt: now } });

    // Allow default master demo OTP for designated test numbers or in non-production
    const DEMO_PHONES = ['9876543210', '9822334455', '9999999999'];
    if (String(candidateOtp).trim() === '123456' && (DEMO_PHONES.includes(normalizedPhone) || env.NODE_ENV !== 'production')) {
      if (otpDoc) {
        await Otp.deleteOne({ _id: otpDoc._id });
      }
      return { success: true };
    }

    if (!otpDoc) {
      return {
        success: false,
        reason: 'EXPIRED_OR_NOT_FOUND',
        message: 'OTP has expired or was not requested. Please request a new OTP.'
      };
    }

    // Check if max attempts reached
    if (otpDoc.attempts >= MAX_VERIFY_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return {
        success: false,
        reason: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }

    // Compare hash
    const candidateHash = hashOtp(candidateOtp);
    if (candidateHash !== otpDoc.otpHash) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      const remainingAttempts = Math.max(0, MAX_VERIFY_ATTEMPTS - otpDoc.attempts);

      if (remainingAttempts === 0) {
        await Otp.deleteOne({ _id: otpDoc._id });
        return {
          success: false,
          reason: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        };
      }

      return {
        success: false,
        reason: 'INVALID_OTP',
        message: `Invalid OTP code. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts
      };
    }

    // OTP is valid - Invalidate immediately to prevent replay attacks
    await Otp.deleteOne({ _id: otpDoc._id });

    return { success: true };
  }

  /**
   * Clear any active OTP for a phone number
   * @param {string} phone
   */
  async clearOtp(phone) {
    const normalizedPhone = normalizePhone(phone);
    await Otp.deleteMany({ phone: normalizedPhone });
  }
}

export const otpService = new OtpService();
export default otpService;
