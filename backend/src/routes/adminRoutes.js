import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import adminBestsellerRoutes from './adminBestsellerRoutes.js';
import adminCategoryRoutes from './adminCategoryRoutes.js';
import adminOrderRoutes from './adminOrderRoutes.js';
import adminSettingsRoutes from './adminSettingsRoutes.js';
import adminReviewRoutes from './adminReviewRoutes.js';
import adminPaymentRoutes from './adminPaymentRoutes.js';
import adminCouponRoutes from './adminCouponRoutes.js';
import adminNotificationRoutes from './adminNotificationRoutes.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';
import { validateAdminLogin, validateUserStatusUpdate } from '../validations/adminValidation.js';

const router = Router();

// Public Admin Login Route (Rate-limited)
router.post('/login', adminLoginLimiter, validateAdminLogin, adminController.login);

// Sub-routers for Management (each has authMiddleware & requireAdmin)
router.use('/bestsellers', adminBestsellerRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/settings', adminSettingsRoutes);
router.use('/reviews', adminReviewRoutes);
router.use('/payments', adminPaymentRoutes);
router.use('/coupons', adminCouponRoutes);
router.use('/notifications', adminNotificationRoutes);


// Protected Admin Routes (Require Auth + ADMIN Role)
router.use(authMiddleware, requireAdmin);

router.get('/profile', adminController.getProfile);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', validateUserStatusUpdate, adminController.updateUserStatus);

export default router;
