import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';

/**
 * Higher-order middleware to authorize specific user/admin roles
 * @param  {...string} allowedRoles - e.g. ROLES.ADMIN, ROLES.USER
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        'Authentication required to perform this action.',
        { reason: 'UNAUTHENTICATED' },
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access forbidden. Required role: [${allowedRoles.join(', ')}], Current role: [${req.user.role}]`,
        { reason: 'FORBIDDEN_ROLE', requiredRoles: allowedRoles, currentRole: req.user.role },
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

/**
 * Convenience middleware: Require Admin Role
 */
export const requireAdmin = authorizeRoles(ROLES.ADMIN);

/**
 * Convenience middleware: Require User Role
 */
export const requireUser = authorizeRoles(ROLES.USER);

export default {
  authorizeRoles,
  requireAdmin,
  requireUser
};
