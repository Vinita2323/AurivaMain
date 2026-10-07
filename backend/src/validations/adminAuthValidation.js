import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Validate Admin login request payload
 */
export const validateAdminLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return sendError(
      res,
      'Admin email is required.',
      { field: 'email', reason: 'REQUIRED' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  if (!emailRegex.test(String(email).trim())) {
    return sendError(
      res,
      'Please enter a valid admin email address.',
      { field: 'email', reason: 'INVALID_FORMAT' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (!password) {
    return sendError(
      res,
      'Admin password is required.',
      { field: 'password', reason: 'REQUIRED' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (typeof password !== 'string' || password.length < 6) {
    return sendError(
      res,
      'Password must be at least 6 characters long.',
      { field: 'password', reason: 'MIN_LENGTH' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  next();
};

/**
 * Validate Admin profile update payload
 */
export const validateAdminProfileUpdate = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return sendError(
      res,
      'Profile update payload must be an object.',
      { reason: 'INVALID_BODY' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const hasAny =
    body.name !== undefined ||
    body.email !== undefined ||
    body.phone !== undefined;

  if (!hasAny) {
    return sendError(
      res,
      'Provide at least one of: name, email, phone.',
      { reason: 'EMPTY_UPDATE' },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name || name.length > 100) {
      errors.push({ field: 'name', message: 'Name is required (max 100 characters).' });
    }
  }

  if (body.email !== undefined) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(String(body.email || '').trim())) {
      errors.push({ field: 'email', message: 'Please enter a valid email address.' });
    }
  }

  if (body.phone !== undefined && String(body.phone).trim().length > 20) {
    errors.push({ field: 'phone', message: 'Phone cannot exceed 20 characters.' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Profile validation failed.', { errors }, HTTP_STATUS.BAD_REQUEST);
  }

  next();
};

/**
 * Validate Admin password change payload
 */
export const validateAdminChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push({ field: 'currentPassword', message: 'Current password is required.' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters.' });
  }

  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    errors.push({ field: 'confirmPassword', message: 'Password confirmation does not match.' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Password validation failed.', { errors }, HTTP_STATUS.BAD_REQUEST);
  }

  next();
};

export default {
  validateAdminLogin,
  validateAdminProfileUpdate,
  validateAdminChangePassword
};
