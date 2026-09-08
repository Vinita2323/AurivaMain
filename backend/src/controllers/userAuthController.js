import userAuthService from '../services/userAuthService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Controller for User Phone + OTP Authentication
 */
class UserAuthController {
  /**
   * Request OTP code to user's mobile number
   * POST /api/v1/auth/user/send-otp
   */
  async sendOtp(req, res, next) {
    try {
      const result = await userAuthService.requestOtp(req.body.phone);
      return sendSuccess(res, result.message, {
        phone: result.phone,
        isNewUser: result.isNewUser,
        retryAfterSeconds: result.retryAfterSeconds
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { reason: error.reason, retryAfterSeconds: error.retryAfterSeconds }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Verify OTP and log in / auto-register user
   * POST /api/v1/auth/user/verify-otp
   */
  async verifyOtp(req, res, next) {
    try {
      const result = await userAuthService.verifyOtpAndLogin(req.body.phone, req.body.otp);
      return sendSuccess(res, 'Authentication successful', {
        token: result.token,
        user: result.user,
        isNewUser: result.isNewUser
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(
          res,
          error.message,
          { reason: error.reason, remainingAttempts: error.remainingAttempts },
          error.statusCode
        );
      }
      next(error);
    }
  }

  /**
   * Fetch authenticated user's profile
   * GET /api/v1/auth/user/profile (Protected)
   */
  async getProfile(req, res, next) {
    try {
      const user = await userAuthService.getUserProfile(req.user._id);
      return sendSuccess(res, 'Profile retrieved successfully', { user });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Update authenticated user's profile
   * PATCH /api/v1/auth/user/profile (Protected)
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userAuthService.updateUserProfile(req.user._id, req.body);
      return sendSuccess(res, 'Profile updated successfully', { user });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const userAuthController = new UserAuthController();
export default userAuthController;
