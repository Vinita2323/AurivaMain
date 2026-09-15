import mongoose from 'mongoose';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

export const validateCreatePaymentOrder = (req, res, next) => {
  const { orderId } = req.body;
  const errors = [];

  if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
    errors.push({ field: 'orderId', message: 'Order ID or order number is required to initiate payment' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for payment order creation',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateVerifyPayment = (req, res, next) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const errors = [];

  if (!orderId) {
    errors.push({ field: 'orderId', message: 'Order ID is required' });
  }

  if (!razorpayOrderId || typeof razorpayOrderId !== 'string' || !razorpayOrderId.trim()) {
    errors.push({ field: 'razorpayOrderId', message: 'Razorpay Order ID (razorpay_order_id) is required' });
  }

  if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string' || !razorpayPaymentId.trim()) {
    errors.push({ field: 'razorpayPaymentId', message: 'Razorpay Payment ID (razorpay_payment_id) is required' });
  }

  if (!razorpaySignature || typeof razorpaySignature !== 'string' || !razorpaySignature.trim()) {
    errors.push({ field: 'razorpaySignature', message: 'Razorpay Signature (razorpay_signature) is required' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for payment verification',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateRefundRequest = (req, res, next) => {
  const { amount, reason } = req.body;
  const errors = [];

  if (amount !== undefined) {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.push({ field: 'amount', message: 'Refund amount must be a positive number' });
    }
  }

  if (reason !== undefined && typeof reason !== 'string') {
    errors.push({ field: 'reason', message: 'Refund reason must be a string' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for refund request',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};
