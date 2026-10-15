import { Router } from 'express';
import adminAuthController from '../controllers/adminAuthController.js';
import {
  validateAdminLogin,
  validateAdminProfileUpdate,
  validateAdminChangePassword,
  validateAdminForgotPassword,
  validateAdminVerifyResetToken,
  validateAdminResetPassword
} from '../validations/adminAuthValidation.js';
import {
  adminLoginLimiter,
  adminForgotPasswordLimiter,
  adminResetPasswordLimiter
} from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/admin/login
 * @desc    Authenticate admin with email & password
 * @access  Public (Rate-limited)
 */
router.post('/login', adminLoginLimiter, validateAdminLogin, adminAuthController.login);

/**
 * @route   POST /api/v1/auth/admin/forgot-password
 * @desc    Send password reset link to ADMIN_RECOVERY_EMAIL for mapped admin
 * @access  Public (Rate-limited)
 */
router.post(
  '/forgot-password',
  adminForgotPasswordLimiter,
  validateAdminForgotPassword,
  adminAuthController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/admin/verify-reset-token
 * @desc    Check whether a password reset token is still valid
 * @access  Public (Rate-limited)
 */
router.post(
  '/verify-reset-token',
  adminResetPasswordLimiter,
  validateAdminVerifyResetToken,
  adminAuthController.verifyResetToken
);

/**
 * @route   POST /api/v1/auth/admin/reset-password
 * @desc    Set a new admin password using a one-time reset token
 * @access  Public (Rate-limited)
 */
router.post(
  '/reset-password',
  adminResetPasswordLimiter,
  validateAdminResetPassword,
  adminAuthController.resetPassword
);

/**
 * @route   GET /api/v1/auth/admin/profile
 * @desc    Get current admin profile & permissions
 * @access  Protected (Admin Only)
 */
router.get('/profile', authMiddleware, requireAdmin, adminAuthController.getProfile);

/**
 * @route   PATCH|PUT /api/v1/auth/admin/profile
 * @desc    Update current admin name, email, phone
 * @access  Protected (Admin Only)
 */
router.patch('/profile', authMiddleware, requireAdmin, validateAdminProfileUpdate, adminAuthController.updateProfile);
router.put('/profile', authMiddleware, requireAdmin, validateAdminProfileUpdate, adminAuthController.updateProfile);

/**
 * @route   POST /api/v1/auth/admin/change-password
 * @desc    Change admin login password
 * @access  Protected (Admin Only)
 */
router.post(
  '/change-password',
  authMiddleware,
  requireAdmin,
  validateAdminChangePassword,
  adminAuthController.changePassword
);

export default router;
