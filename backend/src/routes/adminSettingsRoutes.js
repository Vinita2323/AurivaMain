import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { validateUpdateSettings } from '../validations/settingsValidation.js';

const router = Router();

// Protect all admin settings routes with Admin authentication
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Retrieve all store configuration and business rules
 * @access  Private (Admin)
 */
router.get('/', settingsController.getAdminSettings);

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Update store configuration and business rules
 * @access  Private (Admin)
 */
router.put('/', validateUpdateSettings, settingsController.updateAdminSettings);

export default router;
