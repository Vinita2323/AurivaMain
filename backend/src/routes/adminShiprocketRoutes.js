import { Router } from 'express';
import shiprocketController from '../controllers/shiprocketController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { validateOrderId } from '../validations/orderValidation.js';

const router = Router();

router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/shiprocket/status
 * @desc    Whether Shiprocket credentials are configured (no secrets returned)
 */
router.get('/status', shiprocketController.getConfigStatus);

/**
 * Order-scoped Shiprocket actions
 * Mounted at /api/v1/admin/orders/:id/shiprocket/*
 * AND /api/v1/admin/shiprocket/orders/:id/*
 */
router.post('/orders/:id/create', validateOrderId, shiprocketController.createShipment);
router.post('/orders/:id/fulfill', validateOrderId, shiprocketController.fulfill);
router.get('/orders/:id/serviceability', validateOrderId, shiprocketController.serviceability);
router.post('/orders/:id/awb', validateOrderId, shiprocketController.assignAwb);
router.post('/orders/:id/pickup', validateOrderId, shiprocketController.schedulePickup);
router.post('/orders/:id/label', validateOrderId, shiprocketController.generateLabel);
router.post('/orders/:id/invoice', validateOrderId, shiprocketController.generateInvoice);
router.post('/orders/:id/manifest', validateOrderId, shiprocketController.generateManifest);
router.get('/orders/:id/track', validateOrderId, shiprocketController.track);
router.post('/orders/:id/cancel', validateOrderId, shiprocketController.cancelShipment);

export default router;
