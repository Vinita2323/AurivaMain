import PaymentService from '../services/paymentService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

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
    const result = await PaymentService.verifyPayment(req.user._id, req.body);
    return sendSuccess(
      res,
      result.message || 'Payment verified successfully',
      result,
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
 * Public/Gateway: Ingest Razorpay Webhooks
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'];

    const result = await PaymentService.handleWebhookEvent({
      rawBody,
      signature,
      eventPayload: req.body
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
    return sendSuccess(res, 'Payment retrieved successfully', { payment });
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
 * Admin: Initiate payment refund
 */
export const initiateRefundAdmin = async (req, res, next) => {
  try {
    const payment = await PaymentService.initiateRefund(req.user._id, req.params.id, req.body);
    return sendSuccess(res, 'Refund initiated successfully', { payment });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, null, error.statusCode);
    }
    next(error);
  }
};
