import mongoose from 'mongoose';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

export const validateAddressId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return sendError(
      res,
      'Invalid address ID format',
      { field: 'id', reason: 'INVALID_OBJECT_ID' },
      HTTP_STATUS.BAD_REQUEST
    );
  }
  next();
};

export const validateCreateAddress = (req, res, next) => {
  const {
    fullName,
    phoneNumber,
    addressLine1,
    city,
    postalCode,
    addressType
  } = req.body;

  const errors = [];

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  }

  if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    errors.push({ field: 'phoneNumber', message: 'Phone number is required' });
  } else {
    const digits = phoneNumber.replace(/\D/g, '').slice(-10);
    if (digits.length < 10) {
      errors.push({ field: 'phoneNumber', message: 'Please provide a valid 10-digit phone number' });
    }
  }

  if (!addressLine1 || typeof addressLine1 !== 'string' || !addressLine1.trim()) {
    errors.push({ field: 'addressLine1', message: 'Address line 1 (house/street) is required' });
  }

  if (!city || typeof city !== 'string' || !city.trim()) {
    errors.push({ field: 'city', message: 'City is required' });
  }

  if (!postalCode || typeof postalCode !== 'string' || !postalCode.trim()) {
    errors.push({ field: 'postalCode', message: 'Postal code / pincode is required' });
  }

  if (addressType && !['home', 'work', 'other'].includes(addressType.toLowerCase())) {
    errors.push({ field: 'addressType', message: 'Address type must be home, work, or other' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for address creation',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export const validateUpdateAddress = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return sendError(
      res,
      'Invalid address ID format',
      { field: 'id', reason: 'INVALID_OBJECT_ID' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const {
    fullName,
    phoneNumber,
    addressLine1,
    city,
    postalCode,
    addressType
  } = req.body;

  const errors = [];

  if (fullName !== undefined && (typeof fullName !== 'string' || !fullName.trim())) {
    errors.push({ field: 'fullName', message: 'Full name cannot be empty' });
  }

  if (phoneNumber !== undefined) {
    const digits = String(phoneNumber).replace(/\D/g, '').slice(-10);
    if (digits.length < 10) {
      errors.push({ field: 'phoneNumber', message: 'Please provide a valid 10-digit phone number' });
    }
  }

  if (addressLine1 !== undefined && (typeof addressLine1 !== 'string' || !addressLine1.trim())) {
    errors.push({ field: 'addressLine1', message: 'Address line 1 cannot be empty' });
  }

  if (city !== undefined && (typeof city !== 'string' || !city.trim())) {
    errors.push({ field: 'city', message: 'City cannot be empty' });
  }

  if (postalCode !== undefined && (typeof postalCode !== 'string' || !postalCode.trim())) {
    errors.push({ field: 'postalCode', message: 'Postal code cannot be empty' });
  }

  if (addressType !== undefined && !['home', 'work', 'other'].includes(String(addressType).toLowerCase())) {
    errors.push({ field: 'addressType', message: 'Address type must be home, work, or other' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for address update',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export default {
  validateAddressId,
  validateCreateAddress,
  validateUpdateAddress
};
