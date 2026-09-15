import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';

const router = Router();

/**
 * @route   GET /api/v1/settings
 * @desc    Get public store configuration and business rules
 * @access  Public
 */
router.get('/', settingsController.getPublicSettings);

export default router;
