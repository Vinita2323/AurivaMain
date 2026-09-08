import crypto from 'crypto';

/**
 * Generate a secure numeric OTP
 * @param {number} length - Number of digits (default: 6)
 * @returns {string} - OTP string
 */
export const generateOtp = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

/**
 * Calculate OTP expiry timestamp
 * @param {number} minutes - Expiry duration in minutes (default: 10)
 * @returns {Date} - Expiration date object
 */
export const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export default {
  generateOtp,
  getOtpExpiry
};
