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

/**
 * @route   POST /api/v1/admin/payments/:id/refund/retry
 * @desc    Retry a failed refund (same atomic / idempotent engine as a normal refund)
 * @access  Protected (Admin Only)
 */
router.post('/:id/refund/retry', paymentController.retryRefundAdmin);

/**
 * @route   POST /api/v1/admin/payments/:id/reconcile
 * @desc    Mark a flagged payment as reconciled (note required). Never edits payment/refund status.
 * @access  Protected (Admin Only)
 */
router.post('/:id/reconcile', paymentController.reconcilePaymentAdmin);

export default router;
