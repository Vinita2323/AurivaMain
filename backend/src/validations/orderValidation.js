import mongoose from 'mongoose';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

export const validatePlaceOrder = (req, res, next) => {
  const { addressId, paymentMethod, couponCode, idempotencyKey } = req.body;
  const errors = [];

  if (!addressId) {
    errors.push({ field: 'addressId', message: 'Delivery address ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(addressId)) {
    errors.push({ field: 'addressId', message: 'Invalid delivery address ID format' });
  }

  if (paymentMethod !== undefined) {
    let normalized = String(paymentMethod).toUpperCase().trim();
    if (normalized.includes('COD') || normalized.includes('CASH') || normalized.includes('DELIVERY')) normalized = 'COD';
    else if (normalized.includes('UPI') || normalized.includes('GPAY') || normalized.includes('PHONEPE') || normalized.includes('PAYTM')) normalized = 'UPI';
    else if (normalized.includes('CARD') || normalized.includes('CREDIT') || normalized.includes('DEBIT')) normalized = 'CARD';
    else if (normalized.includes('NET') || normalized.includes('BANK')) normalized = 'NETBANKING';

    const validMethods = ['COD', 'UPI', 'CARD', 'NETBANKING'];
    if (!validMethods.includes(normalized)) {
      errors.push({
        field: 'paymentMethod',
        message: `Payment method must be one of: ${validMethods.join(', ')}`
      });
    } else {
      req.body.paymentMethod = normalized;
    }
  }

  if (couponCode !== undefined && couponCode !== null && typeof couponCode !== 'string') {
    errors.push({ field: 'couponCode', message: 'Coupon code must be a string' });
  }

  if (idempotencyKey !== undefined && idempotencyKey !== null && typeof idempotencyKey !== 'string') {
    errors.push({ field: 'idempotencyKey', message: 'Idempotency key must be a string' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for order placement',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateOrderId = (req, res, next) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !id.trim()) {
    return sendError(
      res,
      'Order ID or order number is required',
      { field: 'id', reason: 'REQUIRED' },
      HTTP_STATUS.BAD_REQUEST
    );
  }
  next();
};

export const validateUpdateOrderStatus = (req, res, next) => {
  const { status, note } = req.body;
  const errors = [];

  if (!status || typeof status !== 'string' || !status.trim()) {
    errors.push({ field: 'status', message: 'Order status is required' });
  }

  if (note !== undefined && typeof note !== 'string') {
    errors.push({ field: 'note', message: 'Status note must be a string' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for order status update',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateDispatchOrder = (req, res, next) => {
  const { courierName, awbNumber, rider, deliveryNotes } = req.body;
  const errors = [];

  if (courierName !== undefined && typeof courierName !== 'string') {
    errors.push({ field: 'courierName', message: 'Courier name must be a string' });
  }

  if (awbNumber !== undefined && typeof awbNumber !== 'string') {
    errors.push({ field: 'awbNumber', message: 'AWB tracking number must be a string' });
  }

  if (deliveryNotes !== undefined && typeof deliveryNotes !== 'string') {
    errors.push({ field: 'deliveryNotes', message: 'Delivery notes must be a string' });
  }

  if (rider !== undefined && (typeof rider !== 'object' || rider === null)) {
    errors.push({ field: 'rider', message: 'Rider details must be an object' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for order dispatch',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateCancelOrder = (req, res, next) => {
  const reason = req.body.reason || req.body.cancelReason;

  if (reason !== undefined && typeof reason !== 'string') {
    return sendError(
      res,
      'Cancellation reason must be a string',
      { field: 'reason', message: 'Cancellation reason must be a string' },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export default {
  validatePlaceOrder,
  validateOrderId,
  validateUpdateOrderStatus,
  validateDispatchOrder,
  validateCancelOrder
};

