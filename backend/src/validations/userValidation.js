import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

/**
 * Validate User Profile Update payload
 */
export const validateUpdateProfile = (req, res, next) => {
  const { name, email, phone, address } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    errors.push({ field: 'name', message: 'Name cannot be empty' });
  }

  if (email !== undefined && !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (phone !== undefined && typeof phone !== 'string') {
    errors.push({ field: 'phone', message: 'Phone must be a valid string' });
  }

  if (address !== undefined && (typeof address !== 'object' || address === null || Array.isArray(address))) {
    errors.push({ field: 'address', message: 'Address must be an object' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for profile update', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

/**
 * Validate User Password Change payload
 */
export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push({ field: 'currentPassword', message: 'Current password is required' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters long' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for password change', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

export default {
  validateUpdateProfile,
  validateChangePassword
};
