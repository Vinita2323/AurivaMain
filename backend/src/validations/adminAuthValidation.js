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

export default {
  validateAdminLogin
};
