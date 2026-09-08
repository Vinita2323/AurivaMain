import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Creates an in-memory sliding window rate limiter
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max allowed requests per window
 * @param {string} options.message - Error message when rate limit exceeded
 * @param {function} [options.keyGenerator] - Custom key generator function (e.g. based on req.body.phone or req.ip)
 */
export const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 5,
  message = 'Too many requests. Please slow down and try again later.',
  keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'global'
}) => {
  const store = new Map();

  // Periodic cleanup of expired records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(key, record);
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      return sendError(
        res,
        message,
        {
          reason: 'RATE_LIMIT_EXCEEDED',
          retryAfterSeconds
        },
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }

    next();
  };
};

/**
 * OTP Request Rate Limiter (Max 5 requests per 10 minutes per IP/Phone)
 */
export const otpRequestLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please wait a few minutes before requesting another OTP.',
  keyGenerator: (req) => {
    const phone = req.body?.phone ? String(req.body.phone).trim() : '';
    const ip = req.ip || 'ip';
    return `otp-req-${ip}-${phone}`;
  }
});

/**
 * OTP Verification Rate Limiter (Max 10 verify attempts per 10 minutes)
 */
export const otpVerifyLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many verification attempts. Please wait before trying again.',
  keyGenerator: (req) => {
    const phone = req.body?.phone ? String(req.body.phone).trim() : '';
    const ip = req.ip || 'ip';
    return `otp-ver-${ip}-${phone}`;
  }
});

/**
 * Admin Login Rate Limiter (Max 10 login attempts per 15 minutes)
 */
export const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : '';
    const ip = req.ip || 'ip';
    return `admin-login-${ip}-${email}`;
  }
});

export default {
  createRateLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  adminLoginLimiter
};
