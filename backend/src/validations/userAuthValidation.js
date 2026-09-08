import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import { normalizePhone } from '../services/smsService.js';

/**
 * Validate phone number for OTP dispatch
 */
export const validateSendOtp = (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return sendError(
      res,
      'Mobile number is required.',
      { field: 'phone', reason: 'REQUIRED' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const normalized = normalizePhone(phone);
  if (!/^\d{10}$/.test(normalized)) {
    return sendError(
      res,
      'Please enter a valid 10-digit mobile number.',
      { field: 'phone', reason: 'INVALID_FORMAT' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  req.body.phone = normalized;
  next();
};

/**
 * Validate phone and OTP for verification
 */
export const validateVerifyOtp = (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone) {
    return sendError(
      res,
      'Mobile number is required.',
      { field: 'phone', reason: 'REQUIRED' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const normalized = normalizePhone(phone);
  if (!/^\d{10}$/.test(normalized)) {
    return sendError(
      res,
      'Please enter a valid 10-digit mobile number.',
      { field: 'phone', reason: 'INVALID_FORMAT' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!otp || String(otp).trim().length !== 6 || !/^\d{6}$/.test(String(otp).trim())) {
    return sendError(
      res,
      'Please enter a valid 6-digit OTP code.',
      { field: 'otp', reason: 'INVALID_FORMAT' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  req.body.phone = normalized;
  req.body.otp = String(otp).trim();
  next();
};

/**
 * Validate user profile updates
 */
export const validateUpdateProfile = (req, res, next) => {
  const { name, email } = req.body;

  if (name !== undefined && typeof name !== 'string') {
    return sendError(
      res,
      'Name must be a string.',
      { field: 'name', reason: 'INVALID_TYPE' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(String(email).trim())) {
      return sendError(
        res,
        'Please enter a valid email address.',
        { field: 'email', reason: 'INVALID_FORMAT' },
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  next();
};

export default {
  validateSendOtp,
  validateVerifyOtp,
  validateUpdateProfile
};
