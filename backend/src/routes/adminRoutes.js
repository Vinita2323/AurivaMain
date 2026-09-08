import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import adminBestsellerRoutes from './adminBestsellerRoutes.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { adminLoginLimiter } from '../middleware/rateLimiter.js';
import { validateAdminLogin, validateUserStatusUpdate } from '../validations/adminValidation.js';

const router = Router();

// Public Admin Login Route (Rate-limited)
router.post('/login', adminLoginLimiter, validateAdminLogin, adminController.login);

// Sub-router for Bestsellers Management (has its own authMiddleware & requireAdmin)
router.use('/bestsellers', adminBestsellerRoutes);

// Protected Admin Routes (Require Auth + ADMIN Role)
router.use(authMiddleware, requireAdmin);

router.get('/profile', adminController.getProfile);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', validateUserStatusUpdate, adminController.updateUserStatus);

export default router;
