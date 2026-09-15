import mongoose from 'mongoose';
import { verifyToken } from '../utils/generateToken.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS, ACCOUNT_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

/**
 * Protect routes - Verifies JWT and attaches authenticated account to `req.user`
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return sendError(
        res,
        'Access denied. No authentication token provided.',
        { reason: 'TOKEN_MISSING' },
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      return sendError(
        res,
        jwtErr.name === 'TokenExpiredError'
          ? 'Authentication token has expired. Please log in again.'
          : 'Invalid authentication token.',
        { reason: jwtErr.name },
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!decoded || !decoded.id) {
      return sendError(
        res,
        'Invalid authentication payload.',
        { reason: 'INVALID_PAYLOAD' },
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Identify user based on decoded role
    let account = null;
    if (mongoose.connection.readyState !== 1) {
      // Database offline fallback: construct account directly from verified token
      account = {
        _id: decoded.id || 'admin-fallback-001',
        id: decoded.id || 'admin-fallback-001',
        name: decoded.name || 'Super Admin',
        email: decoded.email || 'admin@aurivafoods.com',
        role: decoded.role || ROLES.ADMIN,
        status: ACCOUNT_STATUS.ACTIVE
      };
    } else if (decoded.role === ROLES.ADMIN) {
      account = await Admin.findById(decoded.id);
    } else {
      account = await User.findById(decoded.id);
    }

    if (!account) {
      return sendError(
        res,
        'Account associated with this token no longer exists.',
        { reason: 'ACCOUNT_NOT_FOUND' },
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check account status
    if (account.status === ACCOUNT_STATUS.BLOCKED) {
      return sendError(
        res,
        'Your account has been blocked. Please contact support.',
        { reason: 'ACCOUNT_BLOCKED' },
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (account.status === ACCOUNT_STATUS.INACTIVE) {
      return sendError(
        res,
        'Your account is currently inactive.',
        { reason: 'ACCOUNT_INACTIVE' },
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Attach account to request
    req.user = account;
    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
