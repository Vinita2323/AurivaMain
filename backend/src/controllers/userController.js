import userAuthService from '../services/userAuthService.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Get Authenticated User Profile
 * GET /api/v1/users/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await userAuthService.getUserProfile(req.user._id);
    return sendSuccess(res, 'User profile fetched successfully', { user }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, {}, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update User Profile
 * PUT /api/v1/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await userAuthService.updateUserProfile(req.user._id, req.body);
    return sendSuccess(res, 'Profile updated successfully', { user: updatedUser }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, {}, error.statusCode);
    }
    next(error);
  }
};

/**
 * Delete User Account
 * DELETE /api/v1/users/account
 */
export const deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return sendSuccess(res, 'User account deleted successfully', null, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  deleteAccount
};
