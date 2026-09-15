import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

export const ALLOWED_SETTINGS_FIELDS = [
  'gstRate',
  'standardDeliveryFee',
  'freeDeliveryThreshold',
  'lowStockThreshold',
  'warehouseName',
  'warehouseAddress',
  'warehouseCity',
  'warehouseState',
  'warehousePincode',
  'warehousePhone',
  'hubAddress',
  'storeName',
  'storeEmail',
  'supportEmail',
  'storePhone',
  'supportPhone',
  'currency',
  'storeAddress',
  'timezone'
];

/**
 * Validate Admin Settings Update payload
 */
export const validateUpdateSettings = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    return sendError(
      res,
      'Settings update payload must be a non-empty object',
      { field: 'body', reason: 'EMPTY_PAYLOAD' },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  // Check for unauthorized / unapproved fields
  const submittedKeys = Object.keys(body);
  const unknownFields = submittedKeys.filter(key => !ALLOWED_SETTINGS_FIELDS.includes(key));
  if (unknownFields.length > 0) {
    return sendError(
      res,
      `Unapproved fields in settings update: ${unknownFields.join(', ')}`,
      { unknownFields, allowedFields: ALLOWED_SETTINGS_FIELDS },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  // 1. GST Rate validation
  if (body.gstRate !== undefined) {
    const gst = Number(body.gstRate);
    if (isNaN(gst) || gst < 0 || gst > 100) {
      errors.push({ field: 'gstRate', message: 'GST rate must be a valid number between 0 and 100' });
    }
  }

  // 2. Standard Delivery Fee validation
  if (body.standardDeliveryFee !== undefined) {
    const fee = Number(body.standardDeliveryFee);
    if (isNaN(fee) || fee < 0) {
      errors.push({ field: 'standardDeliveryFee', message: 'Standard delivery fee must be a non-negative number' });
    }
  }

  // 3. Free Delivery Threshold validation
  if (body.freeDeliveryThreshold !== undefined) {
    const threshold = Number(body.freeDeliveryThreshold);
    if (isNaN(threshold) || threshold < 0) {
      errors.push({ field: 'freeDeliveryThreshold', message: 'Free delivery threshold must be a non-negative number' });
    }
  }

  // 4. Low Stock Threshold validation
  if (body.lowStockThreshold !== undefined) {
    const lowStock = Number(body.lowStockThreshold);
    if (isNaN(lowStock) || lowStock < 0) {
      errors.push({ field: 'lowStockThreshold', message: 'Low stock threshold must be a non-negative number' });
    }
  }

  // 5. Email validations
  if (body.storeEmail !== undefined && body.storeEmail !== '') {
    if (!emailRegex.test(String(body.storeEmail).trim())) {
      errors.push({ field: 'storeEmail', message: 'Store email must be a valid email address' });
    }
  }

  if (body.supportEmail !== undefined && body.supportEmail !== '') {
    if (!emailRegex.test(String(body.supportEmail).trim())) {
      errors.push({ field: 'supportEmail', message: 'Support email must be a valid email address' });
    }
  }

  // 6. Pincode validation
  if (body.warehousePincode !== undefined && body.warehousePincode !== '') {
    if (!pincodeRegex.test(String(body.warehousePincode).trim())) {
      errors.push({ field: 'warehousePincode', message: 'Warehouse pincode must be a valid 6-digit Indian PIN code' });
    }
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for store settings update',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export default {
  ALLOWED_SETTINGS_FIELDS,
  validateUpdateSettings
};
