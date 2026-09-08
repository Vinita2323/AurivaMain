import adminAuthService from '../services/adminAuthService.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Admin Login
 * POST /api/v1/admin/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await adminAuthService.loginAdmin({ email, password });
    return sendSuccess(res, 'Admin authentication successful', result, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, {}, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get Admin Profile
 * GET /api/v1/admin/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const admin = await adminAuthService.getAdminProfile(req.user._id);
    return sendSuccess(res, 'Admin profile fetched successfully', { admin }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, {}, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get All Registered Users (Admin only)
 * GET /api/v1/admin/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    return sendSuccess(
      res,
      'Users list retrieved successfully',
      {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update User Status (Admin only)
 * PATCH /api/v1/admin/users/:id/status
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', null, HTTP_STATUS.NOT_FOUND);
    }

    user.status = status;
    await user.save();

    return sendSuccess(res, `User status updated to ${status}`, { user: user.toJSON() }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  getProfile,
  getAllUsers,
  updateUserStatus
};
