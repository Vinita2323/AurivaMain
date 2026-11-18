import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import CodPermissionAudit from '../models/CodPermissionAudit.js';
import { HTTP_STATUS } from '../constants/status.js';

export const COD_NOT_ALLOWED_MESSAGE =
  'Cash on Delivery is not available for your account. Please select another payment method.';

/**
 * "Refused" is not an order status in this system (see Order.status enum). A customer refusal is recorded as either
 *  - the courier returning the parcel (shiprocket.isRto === true), or
 *  - a CANCELLED order whose cancel reason says the customer refused / rejected / was undeliverable.
 */
const REFUSAL_REGEX = 'refus|rto|undeliver|not accept|rejected by customer|customer rejected';

// A customer is only *recommended* for review (admin always decides) when the history looks clean.
export const ELIGIBILITY = Object.freeze({ minDelivered: 3, maxProblemRate: 0.2 });
// "High cancellation / rejection" filter
export const HIGH_RISK = Object.freeze({ minProblemOrders: 2, minProblemRate: 0.3 });

const fail = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
};

export const codNotAllowedError = () => fail(COD_NOT_ALLOWED_MESSAGE, HTTP_STATUS.FORBIDDEN, 'COD_NOT_ALLOWED');

/** Authoritative check: always read from MongoDB, never from the request. Missing field === disabled. */
export const isCodEnabled = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) return false;
  const doc = await User.findById(userId).select('codAccess').lean();
  return doc?.codAccess?.isEnabled === true;
};

// ---------------------------------------------------------------- statistics
const refusedExpr = {
  $or: [
    { $eq: ['$shiprocket.isRto', true] },
    {
      $and: [
        { $eq: ['$status', 'CANCELLED'] },
        { $regexMatch: { input: { $ifNull: ['$cancelReason', ''] }, regex: REFUSAL_REGEX, options: 'i' } }
      ]
    }
  ]
};
const one = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });
const isCod = { $eq: ['$payment.method', 'COD'] };
const isDelivered = { $and: [{ $eq: ['$status', 'DELIVERED'] }, { $not: [refusedExpr] }] };

// One document per Order (orders are a single collection: no sub-orders / seller orders to double count).
const statsGroup = {
  _id: '$user',
  totalOrders: { $sum: 1 },
  deliveredOrders: one(isDelivered),
  refusedOrders: one(refusedExpr),
  cancelledOrders: one({ $and: [{ $eq: ['$status', 'CANCELLED'] }, { $not: [refusedExpr] }] }),
  codOrders: one(isCod),
  codDeliveredOrders: one({ $and: [isCod, isDelivered] })
};

const emptyStats = () => ({
  totalOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  refusedOrders: 0,
  codOrders: 0,
  codDeliveredOrders: 0
});

const cleanStats = (row) => {
  if (!row) return emptyStats();
  const { _id, ...rest } = row;
  return { ...emptyStats(), ...rest };
};

const problemRate = (s) => (s.totalOrders > 0 ? (s.cancelledOrders + s.refusedOrders) / s.totalOrders : 0);

export const isEligibleForReview = (stats, codEnabled) =>
  !codEnabled &&
  stats.deliveredOrders >= ELIGIBILITY.minDelivered &&
  stats.refusedOrders === 0 &&
  problemRate(stats) <= ELIGIBILITY.maxProblemRate;

const statsForUsers = async (ids) => {
  if (!ids.length) return new Map();
  const rows = await Order.aggregate([{ $match: { user: { $in: ids } } }, { $group: statsGroup }]);
  return new Map(rows.map((r) => [String(r._id), cleanStats(r)]));
};

const shapeCustomer = (u, stats) => {
  const enabled = u.codAccess?.isEnabled === true;
  return {
    id: String(u._id),
    name: u.name || '',
    phone: u.phone,
    email: u.email || '',
    registeredAt: u.createdAt,
    stats,
    codAccess: {
      isEnabled: enabled,
      enabledAt: u.codAccess?.enabledAt || null,
      disabledAt: u.codAccess?.disabledAt || null,
      reason: u.codAccess?.reason || ''
    },
    codStatus: enabled ? 'ENABLED' : 'DISABLED',
    eligibleForReview: isEligibleForReview(stats, enabled)
  };
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------- list
export const listCustomers = async ({ search, codStatus, filter, page = 1, limit = 10 } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const query = { role: 'USER', deletedAt: null };
  const term = String(search || '').trim();
  if (term) {
    const re = { $regex: escapeRegex(term), $options: 'i' };
    query.$or = [{ name: re }, { phone: re }];
  }
  if (codStatus === 'enabled') query['codAccess.isEnabled'] = true;
  else if (codStatus === 'disabled') query['codAccess.isEnabled'] = { $ne: true };

  // Filters that depend on order history: resolve the matching customer ids from the orders first.
  if (['delivered', 'high_cancellation', 'eligible'].includes(filter)) {
    const problems = { $add: ['$cancelledOrders', '$refusedOrders'] };
    const conditions = {
      delivered: { $gte: ['$deliveredOrders', 1] },
      high_cancellation: {
        $and: [
          { $gte: [problems, HIGH_RISK.minProblemOrders] },
          { $gte: [{ $divide: [problems, '$totalOrders'] }, HIGH_RISK.minProblemRate] }
        ]
      },
      eligible: {
        $and: [
          { $gte: ['$deliveredOrders', ELIGIBILITY.minDelivered] },
          { $eq: ['$refusedOrders', 0] },
          { $lte: [{ $divide: [problems, '$totalOrders'] }, ELIGIBILITY.maxProblemRate] }
        ]
      }
    };
    const rows = await Order.aggregate([
      { $group: statsGroup },
      { $match: { $expr: conditions[filter] } },
      { $project: { _id: 1 } }
    ]);
    query._id = { $in: rows.map((r) => r._id) };
    // "Eligible for review" only ever means customers whose COD is currently OFF
    if (filter === 'eligible') {
      if (codStatus === 'enabled') query._id = { $in: [] };
      else query['codAccess.isEnabled'] = { $ne: true };
    }
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    User.countDocuments(query)
  ]);
  const statMap = await statsForUsers(users.map((u) => u._id));

  return {
    customers: users.map((u) => shapeCustomer(u, statMap.get(String(u._id)) || emptyStats())),
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.max(1, Math.ceil(total / limitNum)) }
  };
};

// ---------------------------------------------------------------- detail
export const getCustomerDetail = async (customerId) => {
  if (!mongoose.isValidObjectId(customerId)) throw fail('Customer not found.', HTTP_STATUS.NOT_FOUND);
  const user = await User.findOne({ _id: customerId, role: 'USER' }).lean();
  if (!user) throw fail('Customer not found.', HTTP_STATUS.NOT_FOUND);

  const [statMap, recentOrders, audit] = await Promise.all([
    statsForUsers([user._id]),
    Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(25)
      .select('orderNumber status createdAt pricing.total payment.method payment.status cancelReason cancelledBy shiprocket.isRto')
      .lean(),
    CodPermissionAudit.find({ customer: user._id }).sort({ createdAt: -1 }).limit(50).lean()
  ]);

  const stats = statMap.get(String(user._id)) || emptyStats();
  return {
    customer: shapeCustomer(user, stats),
    recentOrders: recentOrders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      status: o.status,
      createdAt: o.createdAt,
      total: o.pricing?.total ?? 0,
      paymentMethod: o.payment?.method || '',
      paymentStatus: o.payment?.status || '',
      refused: o.shiprocket?.isRto === true,
      cancelReason: o.cancelReason || ''
    })),
    auditTrail: audit.map((a) => ({
      id: String(a._id),
      action: a.action,
      previousEnabled: a.previousEnabled,
      newEnabled: a.newEnabled,
      reason: a.reason,
      adminName: a.adminName,
      adminEmail: a.adminEmail,
      at: a.createdAt
    }))
  };
};

// ---------------------------------------------------------------- change (audited)
export const setCodPermission = async (customerId, admin, { enabled, reason }) => {
  if (typeof enabled !== 'boolean') throw fail('"enabled" must be true or false.', HTTP_STATUS.BAD_REQUEST);
  const cleanReason = String(reason ?? '').trim();
  if (cleanReason.length < 3 || cleanReason.length > 500) {
    throw fail('A reason of 3 to 500 characters is required.', HTTP_STATUS.BAD_REQUEST);
  }
  if (!mongoose.isValidObjectId(customerId)) throw fail('Customer not found.', HTTP_STATUS.NOT_FOUND);

  const user = await User.findOne({ _id: customerId, role: 'USER', deletedAt: null }).select('codAccess').lean();
  if (!user) throw fail('Customer not found.', HTTP_STATUS.NOT_FOUND);

  const previous = user.codAccess?.isEnabled === true;
  if (previous === enabled) {
    throw fail(`Cash on Delivery is already ${enabled ? 'enabled' : 'disabled'} for this customer.`, HTTP_STATUS.CONFLICT);
  }

  const now = new Date();
  const set = enabled
    ? { 'codAccess.isEnabled': true, 'codAccess.enabledBy': admin._id, 'codAccess.enabledAt': now, 'codAccess.reason': cleanReason }
    : { 'codAccess.isEnabled': false, 'codAccess.disabledAt': now, 'codAccess.reason': cleanReason };

  // Compare-and-set on the previous state so two admins clicking at once cannot both "win"
  const updated = await User.updateOne(
    { _id: user._id, role: 'USER', 'codAccess.isEnabled': previous ? true : { $ne: true } },
    { $set: set }
  );
  if (updated.modifiedCount !== 1) {
    throw fail('This customer was just changed by someone else. Refresh and try again.', HTTP_STATUS.CONFLICT);
  }

  try {
    await CodPermissionAudit.create({
      customer: user._id,
      admin: admin._id,
      adminName: admin.name || '',
      adminEmail: admin.email || '',
      action: enabled ? 'ENABLE' : 'DISABLE',
      previousEnabled: previous,
      newEnabled: enabled,
      reason: cleanReason
    });
  } catch (auditErr) {
    // Never leave a permission change without its audit record
    await User.updateOne({ _id: user._id }, { $set: { 'codAccess.isEnabled': previous } });
    throw auditErr;
  }

  return getCustomerDetail(user._id);
};

export default { isCodEnabled, codNotAllowedError, listCustomers, getCustomerDetail, setCodPermission };
