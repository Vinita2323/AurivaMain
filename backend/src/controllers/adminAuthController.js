import adminAuthService from '../services/adminAuthService.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Controller for Admin Email + Password Authentication
 */
class AdminAuthController {
  /**
   * Admin login with email & password
   * POST /api/v1/auth/admin/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await adminAuthService.loginAdmin({ email, password });
      return sendSuccess(res, 'Admin authentication successful', {
        token: result.token,
        admin: result.admin
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Fetch authenticated admin profile
   * GET /api/v1/auth/admin/profile (Protected)
   */
  async getProfile(req, res, next) {
    try {
      const admin = await adminAuthService.getAdminProfile(req.user._id);
      return sendSuccess(res, 'Admin profile retrieved successfully', { admin });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Update authenticated admin profile
   * PATCH /api/v1/auth/admin/profile (Protected)
   */
  async updateProfile(req, res, next) {
    try {
      const admin = await adminAuthService.updateAdminProfile(req.user._id, {
        name: req.body?.name,
        email: req.body?.email,
        phone: req.body?.phone
      });
      return sendSuccess(res, 'Admin profile updated successfully', { admin });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Change authenticated admin password
   * POST /api/v1/auth/admin/change-password (Protected)
   */
  async changePassword(req, res, next) {
    try {
      const result = await adminAuthService.changeAdminPassword(req.user._id, {
        currentPassword: req.body?.currentPassword,
        newPassword: req.body?.newPassword
      });
      return sendSuccess(res, result.message || 'Password updated successfully', {});
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const adminAuthController = new AdminAuthController();
export default adminAuthController;
