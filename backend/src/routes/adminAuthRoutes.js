import { Router } from 'express';
import adminAuthController from '../controllers/adminAuthController.js';
import { validateAdminLogin } from '../validations/adminAuthValidation.js';
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

export default router;
