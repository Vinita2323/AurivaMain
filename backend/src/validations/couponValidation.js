import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

export const validateCreateCoupon = (req, res, next) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderValue,
    maxDiscount,
    startDate,
    endDate,
    usageLimit,
    status
  } = req.body;

  const errors = [];

  // Code validation
  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push({ field: 'code', message: 'Coupon code is required' });
  }

  // Type validation
  if (!discountType || typeof discountType !== 'string') {
    errors.push({ field: 'discountType', message: 'Discount type is required (PERCENTAGE or FIXED)' });
  } else {
    const normalizedType = discountType.trim().toUpperCase();
    if (!['PERCENTAGE', 'FIXED'].includes(normalizedType)) {
      errors.push({ field: 'discountType', message: 'Discount type must be PERCENTAGE or FIXED' });
    } else {
      req.body.discountType = normalizedType;
    }
  }

  // Value validation
  const numVal = Number(discountValue);
  if (discountValue === undefined || discountValue === null || isNaN(numVal) || numVal <= 0) {
    errors.push({ field: 'discountValue', message: 'Discount value must be a positive number greater than zero' });
  } else if (req.body.discountType === 'PERCENTAGE' && numVal > 100) {
    errors.push({ field: 'discountValue', message: 'Percentage discount cannot exceed 100%' });
  }

  // Minimum Order Value
  if (minOrderValue !== undefined && minOrderValue !== null) {
    const numMin = Number(minOrderValue);
    if (isNaN(numMin) || numMin < 0) {
      errors.push({ field: 'minOrderValue', message: 'Minimum order value cannot be negative' });
    }
  }

  // Max Discount
  if (maxDiscount !== undefined && maxDiscount !== null) {
    const numMax = Number(maxDiscount);
    if (isNaN(numMax) || numMax < 0) {
      errors.push({ field: 'maxDiscount', message: 'Maximum discount cap cannot be negative' });
    }
  }

  // Date validation
  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push({ field: 'startDate', message: 'Invalid start date format' });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push({ field: 'endDate', message: 'Invalid end date format' });
  }

  if (startDate && endDate && !isNaN(Date.parse(startDate)) && !isNaN(Date.parse(endDate))) {
    if (new Date(endDate) <= new Date(startDate)) {
      errors.push({ field: 'endDate', message: 'End date must be strictly after start date' });
    }
  }

  // Usage limit
  if (usageLimit !== undefined && usageLimit !== null) {
    const numLimit = Number(usageLimit);
    if (isNaN(numLimit) || numLimit < 0) {
      errors.push({ field: 'usageLimit', message: 'Usage limit cannot be negative' });
    }
  }

  // Status
  if (status !== undefined && status !== null) {
    const normalizedStatus = String(status).trim().toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
      errors.push({ field: 'status', message: 'Status must be ACTIVE or INACTIVE' });
    } else {
      req.body.status = normalizedStatus;
    }
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for coupon creation',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateUpdateCoupon = (req, res, next) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderValue,
    maxDiscount,
    startDate,
    endDate,
    usageLimit,
    status
  } = req.body;

  const errors = [];

  if (code !== undefined) {
    if (typeof code !== 'string' || !code.trim()) {
      errors.push({ field: 'code', message: 'Coupon code must be a non-empty string' });
    }
  }

  if (discountType !== undefined) {
    const normalizedType = String(discountType).trim().toUpperCase();
    if (!['PERCENTAGE', 'FIXED'].includes(normalizedType)) {
      errors.push({ field: 'discountType', message: 'Discount type must be PERCENTAGE or FIXED' });
    } else {
      req.body.discountType = normalizedType;
    }
  }

  if (discountValue !== undefined) {
    const numVal = Number(discountValue);
    if (isNaN(numVal) || numVal <= 0) {
      errors.push({ field: 'discountValue', message: 'Discount value must be greater than zero' });
    } else if (req.body.discountType === 'PERCENTAGE' && numVal > 100) {
      errors.push({ field: 'discountValue', message: 'Percentage discount cannot exceed 100%' });
    }
  }

  if (minOrderValue !== undefined && minOrderValue !== null) {
    const numMin = Number(minOrderValue);
    if (isNaN(numMin) || numMin < 0) {
      errors.push({ field: 'minOrderValue', message: 'Minimum order value cannot be negative' });
    }
  }

  if (maxDiscount !== undefined && maxDiscount !== null) {
    const numMax = Number(maxDiscount);
    if (isNaN(numMax) || numMax < 0) {
      errors.push({ field: 'maxDiscount', message: 'Maximum discount cap cannot be negative' });
    }
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push({ field: 'startDate', message: 'Invalid start date format' });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push({ field: 'endDate', message: 'Invalid end date format' });
  }

  if (startDate && endDate && !isNaN(Date.parse(startDate)) && !isNaN(Date.parse(endDate))) {
    if (new Date(endDate) <= new Date(startDate)) {
      errors.push({ field: 'endDate', message: 'End date must be strictly after start date' });
    }
  }

  if (usageLimit !== undefined && usageLimit !== null) {
    const numLimit = Number(usageLimit);
    if (isNaN(numLimit) || numLimit < 0) {
      errors.push({ field: 'usageLimit', message: 'Usage limit cannot be negative' });
    }
  }

  if (status !== undefined && status !== null) {
    const normalizedStatus = String(status).trim().toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
      errors.push({ field: 'status', message: 'Status must be ACTIVE or INACTIVE' });
    } else {
      req.body.status = normalizedStatus;
    }
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for coupon update',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateValidateCoupon = (req, res, next) => {
  const code = req.body.code || req.body.couponCode;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return sendError(
      res,
      'Coupon code is required',
      { field: 'code', message: 'Please provide a valid coupon code' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  next();
};

export default {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateValidateCoupon
};
