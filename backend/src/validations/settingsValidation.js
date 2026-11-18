import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

export const ALLOWED_SETTINGS_FIELDS = [
  'gstRate',
  'standardDeliveryFee',
  'codDeliveryFee',
  'freeDeliveryThreshold',
  'lowStockThreshold',
  'warehouseName',
  'warehouseAddress',
  'warehouseCity',
  'warehouseState',
  'warehousePincode',
  'warehousePhone',
  'hubAddress',
  'warehouseLatitude',
  'warehouseLongitude',
  'shiprocketEnabled',
  'shiprocketAutoCreate',
  'selfDelivery',
  'storeName',
  'storeEmail',
  'supportEmail',
  'storePhone',
  'supportPhone',
  'currency',
  'storeAddress',
  'timezone',
  'helpSupport'
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

  // Ignore unknown keys (e.g. _id, configKey, createdAt from client form state)
  // Keep only allowed fields on the request body for downstream update
  const sanitizedBody = {};
  for (const key of ALLOWED_SETTINGS_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      sanitizedBody[key] = body[key];
    }
  }
  if (Object.keys(sanitizedBody).length === 0) {
    return sendError(
      res,
      'No valid settings fields provided to update',
      { allowedFields: ALLOWED_SETTINGS_FIELDS },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }
  req.body = sanitizedBody;

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

  if (body.codDeliveryFee !== undefined) {
    const fee = Number(body.codDeliveryFee);
    if (isNaN(fee) || fee < 0) {
      errors.push({ field: 'codDeliveryFee', message: 'COD delivery fee must be a non-negative number' });
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

  if (body.helpSupport !== undefined) {
    if (!body.helpSupport || typeof body.helpSupport !== 'object' || Array.isArray(body.helpSupport)) {
      errors.push({ field: 'helpSupport', message: 'Help & Support must be an object' });
    } else {
      const hs = body.helpSupport;
      if (hs.email !== undefined && hs.email !== '' && !emailRegex.test(String(hs.email).trim())) {
        errors.push({ field: 'helpSupport.email', message: 'Help & Support email must be a valid email address' });
      }
      if (hs.faqs !== undefined) {
        if (!Array.isArray(hs.faqs)) {
          errors.push({ field: 'helpSupport.faqs', message: 'FAQs must be an array' });
        } else if (hs.faqs.length > 20) {
          errors.push({ field: 'helpSupport.faqs', message: 'Maximum 20 FAQs allowed' });
        } else {
          hs.faqs.forEach((f, i) => {
            if (!f || typeof f !== 'object' || !String(f.q || '').trim() || !String(f.a || '').trim()) {
              errors.push({
                field: `helpSupport.faqs[${i}]`,
                message: 'Each FAQ needs a non-empty question and answer'
              });
            }
          });
        }
      }
    }
  }

  // 5b. Delivery method configuration (self delivery / Shiprocket switches / warehouse coordinates)
  for (const key of ['shiprocketEnabled', 'shiprocketAutoCreate']) {
    if (body[key] !== undefined && typeof body[key] !== 'boolean') {
      errors.push({ field: key, message: `${key} must be true or false` });
    }
  }
  const coordRule = [['warehouseLatitude', -90, 90], ['warehouseLongitude', -180, 180]];
  for (const [key, min, max] of coordRule) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < min || n > max) {
        errors.push({ field: key, message: `${key} must be a number between ${min} and ${max}` });
      }
    }
  }
  if (body.selfDelivery !== undefined) {
    const sd = body.selfDelivery;
    if (!sd || typeof sd !== 'object' || Array.isArray(sd)) {
      errors.push({ field: 'selfDelivery', message: 'selfDelivery must be an object' });
    } else {
      if (sd.enabled !== undefined && typeof sd.enabled !== 'boolean') {
        errors.push({ field: 'selfDelivery.enabled', message: 'enabled must be true or false' });
      }
      if (sd.pincodes !== undefined) {
        if (!Array.isArray(sd.pincodes) || sd.pincodes.length > 500) {
          errors.push({ field: 'selfDelivery.pincodes', message: 'pincodes must be a list of at most 500 entries' });
        } else {
          const bad = sd.pincodes.filter((p) => !pincodeRegex.test(String(p ?? '').trim()));
          if (bad.length) {
            errors.push({ field: 'selfDelivery.pincodes', message: `Invalid 6-digit pincode(s): ${bad.slice(0, 5).join(', ')}` });
          }
        }
      }
      const numericRules = [['maxRadiusKm', 0, 500], ['deliveryCharge', 0, 100000], ['freeDeliveryThreshold', 0, 10000000]];
      for (const [key, min, max] of numericRules) {
        const v = sd[key];
        if (v === undefined || (key === 'freeDeliveryThreshold' && (v === null || v === ''))) continue;
        const n = Number(v);
        if (!Number.isFinite(n) || n < min || n > max) {
          errors.push({ field: `selfDelivery.${key}`, message: `${key} must be a number between ${min} and ${max}` });
        }
      }
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
