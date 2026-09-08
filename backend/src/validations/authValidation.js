import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

/**
 * Validate User Registration payload
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required and cannot be empty' });
  }

  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for registration', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

/**
 * Validate Login payload
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for login', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

/**
 * Validate Verify OTP payload
 */
export const validateVerifyOtp = (req, res, next) => {
  const { email, otp } = req.body;
  const errors = [];

  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!otp || typeof otp !== 'string' || otp.trim().length < 4) {
    errors.push({ field: 'otp', message: 'Valid OTP is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for OTP verification', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

/**
 * Validate Forgot Password payload
 */
export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for forgot password request', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

/**
 * Validate Reset Password payload
 */
export const validateResetPassword = (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  const errors = [];

  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!otp || typeof otp !== 'string' || otp.trim().length < 4) {
    errors.push({ field: 'otp', message: 'Valid OTP is required' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters long' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for password reset', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

export default {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword
};
