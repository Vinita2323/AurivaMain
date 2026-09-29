import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';
import {
  validateCreatePaymentOrder,
  validateCreateCheckoutSession,
  validateVerifyPayment
} from '../validations/paymentValidation.js';

const router = Router();

// Public: Get payment gateway configuration (e.g. keyId, isConfigured)
router.get('/config', paymentController.getConfig);

// Public / Gateway: Razorpay Webhook Ingestion
router.post('/webhook', paymentController.handleWebhook);

// Protected Customer Routes
router.use(authMiddleware);

// POST /api/v1/payments/checkout-session — Razorpay first, Auriva order after pay (prepaid only)
router.post(
  '/checkout-session',
  requireUser,
  validateCreateCheckoutSession,
  paymentController.createCheckoutSession
);

// POST /api/v1/payments/create-order - Create Razorpay order for an EXISTING order (retry unpaid)
router.post(
  '/create-order',
  requireUser,
  validateCreatePaymentOrder,
  paymentController.createPaymentOrder
);

// POST /api/v1/payments/verify - Cryptographically verify payment signature
router.post(
  '/verify',
  requireUser,
  validateVerifyPayment,
  paymentController.verifyPayment
);

// GET /api/v1/payments/order/:orderId - Fetch payment details for customer's order
router.get(
  '/order/:orderId',
  requireUser,
  paymentController.getPaymentByOrder
);

export default router;
