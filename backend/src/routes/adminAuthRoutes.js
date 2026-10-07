import { Router } from 'express';
import adminAuthController from '../controllers/adminAuthController.js';
import {
  validateAdminLogin,
  validateAdminProfileUpdate,
  validateAdminChangePassword
} from '../validations/adminAuthValidation.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';
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
