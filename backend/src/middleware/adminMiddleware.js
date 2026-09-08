import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';

/**
 * Admin authorization middleware
 * Ensures the authenticated user has ADMIN role privileges.
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return sendError(
      res,
      'Authentication required to access admin resources.',
      { reason: 'UNAUTHENTICATED' },
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (req.user.role !== ROLES.ADMIN) {
    return sendError(
      res,
      'Access forbidden. Admin privileges required.',
      { reason: 'INSUFFICIENT_PERMISSIONS' },
      HTTP_STATUS.FORBIDDEN
    );
  }

  next();
};

export default adminMiddleware;
