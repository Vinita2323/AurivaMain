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
}

export const adminAuthController = new AdminAuthController();
export default adminAuthController;
