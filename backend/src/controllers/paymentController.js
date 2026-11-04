import PaymentService from '../services/paymentService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Customer-facing payment payloads must not expose the internal audit trail.
 */
const forCustomer = (payment) => {
  if (!payment) return payment;
  const obj = typeof payment.toObject === 'function' ? payment.toObject() : { ...payment };
  delete obj.auditTrail;
  return obj;
};

/**
 * Public: Get current payment gateway configuration
 */
export const getConfig = (req, res) => {
  try {
    const config = PaymentService.getPaymentConfig();
    return sendSuccess(res, 'Payment configuration retrieved', config);
  } catch (error) {
    return sendError(res, error.message, null, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Customer: Create a Razorpay Order for an existing Order
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const result = await PaymentService.createPaymentOrder(req.user._id, req.body);
    return sendSuccess(
      res,
      'Razorpay order created successfully',
      result,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, { code: error.code, isConfigured: error.isConfigured }, error.statusCode);
    }
    next(error);
  }
};

/**
 * Customer: Verify Razorpay Payment Signature
 */
export const verifyPayment = async (req, res, next) => {
  try {
    // Prepaid-before-order flow: no Auriva orderId yet
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result =
      !orderId && razorpayOrderId
        ? await PaymentService.verifyAndPlacePrepaidOrder(req.user._id, {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
          })
        : await PaymentService.verifyPayment(req.user._id, req.body);

    return sendSuccess(
      res,
      result.message || 'Payment verified successfully',
      { ...result, payment: forCustomer(result.payment) },
      HTTP_STATUS.OK
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

/**
 * Customer: Start prepaid checkout (Razorpay only — order created after pay)
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const result = await PaymentService.createCheckoutSession(req.user._id, req.body);
    return sendSuccess(
      res,
      'Checkout payment session created',
      result,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, { code: error.code, isConfigured: error.isConfigured }, error.statusCode);
    }
    next(error);
  }
};

/**
 * Public/Gateway: Ingest Razorpay Webhooks
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'];

    const result = await PaymentService.handleWebhookEvent({
      rawBody,
      signature,
      eventPayload: req.body,
      eventId: req.headers['x-razorpay-event-id'] || null
    });

    return res.status(HTTP_STATUS.OK).json({ status: 'ok', ...result });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

/**
 * Customer: Get payment details for an order
 */
export const getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await PaymentService.getPaymentByOrderId(req.user._id, req.params.orderId);
    return sendSuccess(res, 'Payment retrieved successfully', { payment: forCustomer(payment) });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

/**
 * Admin: Get all payments with filters and pagination
 */
export const getAllPaymentsAdmin = async (req, res, next) => {
  try {
    const result = await PaymentService.getAllPaymentsAdmin(req.query);
    return sendSuccess(res, 'Payments retrieved successfully', result, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

/**
 * Admin: Get single payment transaction details
 */
export const getPaymentByIdAdmin = async (req, res, next) => {
  try {
    const payment = await PaymentService.getPaymentByIdAdmin(req.params.id);
    return sendSuccess(res, 'Payment transaction retrieved', { payment });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};

/**
 * Admin: mark a flagged payment as reconciled (note required; changes only the reconciliation marker)
 */
export const reconcilePaymentAdmin = async (req, res, next) => {
  try {
    const payment = await PaymentService.markReconciled(req.user._id, req.params.id, req.body?.note);
    return sendSuccess(res, 'Payment marked as reconciled', { payment });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, { code: error.code }, error.statusCode);
    }
    next(error);
  }
};

/**
 * Admin: retry a failed refund (uses the same atomic, idempotent refund engine)
 */
export const retryRefundAdmin = async (req, res, next) => {
  try {
    const result = await PaymentService.retryRefund(req.user._id, req.params.id, {
      idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey || null
    });
    return sendSuccess(
      res,
      result.duplicate ? 'Refund retry already submitted' : 'Refund retry submitted. Status updates when the gateway confirms.',
      { payment: result.payment, duplicate: result.duplicate }
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, { code: error.code }, error.statusCode);
    }
    next(error);
  }
};

/**
 * Admin: Initiate payment refund
 */
export const initiateRefundAdmin = async (req, res, next) => {
  try {
    // An `Idempotency-Key` header (or body field) makes a retried / double-clicked request harmless
    const payment = await PaymentService.initiateRefund(req.user._id, req.params.id, {
      ...(req.body || {}),
      idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey || null
    });
    return sendSuccess(res, 'Refund initiated successfully', { payment });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};
