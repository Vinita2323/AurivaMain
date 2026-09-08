import authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Handle User Registration
 * POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const result = await authService.registerUser({ name, email, password, phone });

    return sendSuccess(
      res,
      'User registered successfully. Please verify your OTP to complete verification.',
      result,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle User Login
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return sendSuccess(res, 'Login successful', result, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle OTP Verification
 * POST /api/v1/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOtp({ email, otp });

    return sendSuccess(res, 'OTP verified successfully. Account is active.', result, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle OTP Resend
 * POST /api/v1/auth/resend-otp
 */
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOtp(email);

    return sendSuccess(res, result.message, result, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Forgot Password Request
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    return sendSuccess(res, result.message, result, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Reset Password Request
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword({ email, otp, newPassword });

    return sendSuccess(res, result.message, null, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword
};
