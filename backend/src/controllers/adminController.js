import adminAuthService from '../services/adminAuthService.js';
import { getDashboardSummary, getAnalyticsSummary } from '../services/dashboardService.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Lifetime-spend thresholds (INR) for the CRM customer tiers
const CUSTOMER_TIER_GOLD = 2000;
const CUSTOMER_TIER_PLATINUM = 5000;
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
 * Update Admin Profile
 * PATCH|PUT /api/v1/admin/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const admin = await adminAuthService.updateAdminProfile(req.user._id, {
      name: req.body?.name,
      email: req.body?.email,
      phone: req.body?.phone
    });
    return sendSuccess(res, 'Admin profile updated successfully', { admin }, HTTP_STATUS.OK);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, {}, error.statusCode);
    }
    next(error);
  }
};

/**
 * Executive Dashboard summary (live KPIs, chart, top products, recent orders)
 * GET /api/v1/admin/dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const summary = await getDashboardSummary({ adminId: req.user?._id || null });
    return sendSuccess(res, 'Dashboard summary fetched successfully', summary, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin analytics (live, date-ranged)
 * GET /api/v1/admin/analytics?range=weekly|monthly|quarterly|yearly&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { range, from, to, tz } = req.query;
    const summary = await getAnalyticsSummary({ range, from, to, tz });
    return sendSuccess(res, 'Analytics fetched successfully', summary, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Registered Users (Admin only)
 * GET /api/v1/admin/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Customers only — admin accounts are not part of the CRM list
    const query = { role: 'USER', deletedAt: null };
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.search) {
      const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query)
    ]);

    // Real per-customer stats from their (non-cancelled) orders
    const ids = users.map((u) => u._id);
    const statRows = ids.length
      ? await Order.aggregate([
          { $match: { user: { $in: ids }, status: { $ne: 'CANCELLED' } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: '$user',
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$pricing.total' },
              city: { $first: '$shippingAddress.city' },
              state: { $first: '$shippingAddress.state' },
              lastOrderAt: { $first: '$createdAt' }
            }
          }
        ])
      : [];
    const statsById = new Map(statRows.map((r) => [String(r._id), r]));

    const enriched = users.map((u) => {
      const st = statsById.get(String(u._id)) || {};
      const totalSpent = Math.round(st.totalSpent || 0);
      const totalOrders = st.totalOrders || 0;
      // Customer tier is derived from real lifetime spend
      const tier =
        totalOrders === 0
          ? 'New Customer'
          : totalSpent >= CUSTOMER_TIER_PLATINUM
            ? 'Platinum Member'
            : totalSpent >= CUSTOMER_TIER_GOLD
              ? 'Gold Member'
              : 'Silver Member';
      return {
        id: String(u._id),
        _id: String(u._id),
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        avatar: u.avatar || '',
        status: u.status,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
        memberSince: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
          : '',
        lastLoginAt: u.lastLoginAt || null,
        totalOrders,
        totalSpent,
        city: st.city || u.addresses?.[0]?.city || '',
        state: st.state || u.addresses?.[0]?.state || '',
        lastOrderAt: st.lastOrderAt || null,
        tier
      };
    });

    return sendSuccess(
      res,
      'Users list retrieved successfully',
      {
        users: enriched,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1
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
  getDashboard,
  getAnalytics,
  getAllUsers,
  updateUserStatus
};
