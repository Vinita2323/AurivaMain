import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { validateRefundRequest } from '../validations/paymentValidation.js';

const router = Router();

// Protect all admin payment routes with JWT auth & Admin role
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/payments
 * @desc    Get all payment records with filters (status, method, gateway) and KPI stats
 * @access  Protected (Admin Only)
 */
router.get('/', paymentController.getAllPaymentsAdmin);

/**
 * @route   GET /api/v1/admin/payments/:id
 * @desc    Get complete payment transaction details including breakdown and refunds
 * @access  Protected (Admin Only)
 */
router.get('/:id', paymentController.getPaymentByIdAdmin);

/**
 * @route   POST /api/v1/admin/payments/:id/refund
 * @desc    Initiate payment refund (partial or full)
 * @access  Protected (Admin Only)
 */
router.post('/:id/refund', validateRefundRequest, paymentController.initiateRefundAdmin);

export default router;
