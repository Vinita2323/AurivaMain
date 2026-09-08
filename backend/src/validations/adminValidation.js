import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

/**
 * Validate Admin Login payload
 */
export const validateAdminLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'A valid admin email is required' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Admin password is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for admin login', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  next();
};

/**
 * Validate Admin User Status Update payload
 */
export const validateUserStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

  if (!status || !validStatuses.includes(status)) {
    return sendError(
      res,
      'Invalid status. Allowed values: ACTIVE, INACTIVE, BLOCKED',
      { allowedStatuses: validStatuses },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export default {
  validateAdminLogin,
  validateUserStatusUpdate
};
