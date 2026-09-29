import { Router } from 'express';
import shiprocketController from '../controllers/shiprocketController.js';

const router = Router();

/**
 * Shiprocket tracking webhook (public POST, secured by x-api-key token).
 *
 * IMPORTANT: Shiprocket rejects webhook URLs containing keywords like
 * "shiprocket", "sr", "kartrocket", "kr". Prefer /courier-updates on the dashboard.
 *
 * @route POST /api/v1/webhooks/courier-updates
 * @route POST /api/webhooks/courier-updates
 */
router.post('/courier-updates', shiprocketController.webhook);
router.post('/shipping-status', shiprocketController.webhook);
router.post('/courier', shiprocketController.webhook); // short alias

// Legacy alias (local tests only — avoid putting "shiprocket" in the Shiprocket URL field)
router.post('/shiprocket', shiprocketController.webhook);

export default router;
