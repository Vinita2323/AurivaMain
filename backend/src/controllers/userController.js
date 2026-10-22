import userAuthService from '../services/userAuthService.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Address from '../models/Address.js';
import Notification from '../models/Notification.js';
import Otp from '../models/Otp.js';
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
// Orders that are still being fulfilled — the account can't be deleted until they finish
const IN_PROGRESS_ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'ACCEPTED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'
];

/**
 * Deleting an account erases the customer's personal data but KEEPS order / payment records
 * (needed for accounting, invoices and returns). The user record is anonymised, not removed,
 * so past orders and reviews stay valid, and the phone number becomes free to sign up again.
 */
export const deleteAccount = async (req, res, next) => {
  try {
    // Explicit confirmation required — never delete on a bare request
    if (String(req.body?.confirm || '').trim().toUpperCase() !== 'DELETE') {
      return sendError(res, 'Please type DELETE to confirm account deletion.', {}, HTTP_STATUS.BAD_REQUEST);
    }

    const userId = req.user._id;

    const inProgress = await Order.exists({ user: userId, status: { $in: IN_PROGRESS_ORDER_STATUSES } });
    if (inProgress) {
      return sendError(
        res,
        'You have an order in progress. You can delete your account after it is delivered or cancelled.',
        {},
        HTTP_STATUS.CONFLICT || 409
      );
    }

    const phone = req.user.phone;
    await Promise.all([
      Cart.deleteMany({ user: userId }),
      Wishlist.deleteMany({ user: userId }),
      Address.deleteMany({ user: userId }),
      Notification.deleteMany({ recipient: userId }),
      phone ? Otp.deleteMany({ phone }) : Promise.resolve()
    ]);

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          name: 'Deleted User',
          phone: `deleted_${userId}`,
          avatar: '',
          addresses: [],
          fcmTokens: [],
          fcmTokenMobile: [],
          status: 'INACTIVE',
          isVerified: false,
          deletedAt: new Date()
        },
        $unset: { email: 1 }
      }
    );

    return sendSuccess(res, 'Your account has been deleted.', null, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  deleteAccount
};
