import walletService from '../services/walletService.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.message, {}, error.statusCode);
    next(error);
  }
};

/** GET /api/v1/wallet — the signed-in customer's balance and history */
export const getMyWallet = handle(async (req, res) => {
  const summary = await walletService.getSummary(req.user._id, req.query);
  return sendSuccess(res, 'Wallet retrieved successfully', summary, HTTP_STATUS.OK);
});

/** GET /api/v1/admin/wallets/:userId — a customer's balance and history */
export const getCustomerWallet = handle(async (req, res) => {
  const summary = await walletService.getSummary(req.params.userId, req.query);
  return sendSuccess(res, 'Wallet retrieved successfully', summary, HTTP_STATUS.OK);
});

/** POST /api/v1/admin/wallets/:userId/adjust  { type: CREDIT|DEBIT, amount, note } */
export const adjustCustomerWallet = handle(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.userId, role: 'USER', deletedAt: null }).select('_id');
  if (!customer) return sendError(res, 'Customer not found.', {}, HTTP_STATUS.NOT_FOUND);

  const result = await walletService.adminAdjust({
    userId: req.params.userId,
    type: req.body?.type,
    amount: req.body?.amount,
    note: req.body?.note,
    adminName: req.user?.name || req.user?.email || 'Admin'
  });
  return sendSuccess(res, 'Wallet updated successfully', { balance: result.balance }, HTTP_STATUS.OK);
});
