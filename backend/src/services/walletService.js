import mongoose from 'mongoose';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import notificationService from './notificationService.js';
import { HTTP_STATUS } from '../constants/status.js';

export const MAX_ADMIN_ADJUSTMENT = 100000; // ₹ per single admin action

const round2 = (n) => Math.round(Number(n) * 100) / 100;

const fail = (message, statusCode = HTTP_STATUS.BAD_REQUEST) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const cleanAmount = (amount) => {
  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) throw fail('Amount must be a number greater than 0.');
  return value;
};

class WalletService {
  /** Current balance (a wallet with no activity is simply ₹0). */
  async getBalance(userId) {
    const wallet = await Wallet.findOne({ user: userId }).lean();
    return round2(wallet?.balance || 0);
  }

  /** Add money. Safe to call concurrently; `dedupeKey` makes order-linked credits idempotent. */
  async credit({ userId, amount, source, reason = '', order = null, orderNumber = '', createdBy = 'System', dedupeKey = null }) {
    const value = cleanAmount(amount);

    if (dedupeKey && (await WalletTransaction.exists({ dedupeKey }))) {
      return { duplicate: true, balance: await this.getBalance(userId) };
    }

    let wallet;
    try {
      wallet = await Wallet.findOneAndUpdate({ user: userId }, { $inc: { balance: value } }, { new: true, upsert: true });
    } catch (err) {
      if (err?.code !== 11000) throw err; // two first-time credits raced on the unique index — retry once
      wallet = await Wallet.findOneAndUpdate({ user: userId }, { $inc: { balance: value } }, { new: true });
    }

    try {
      const txn = await WalletTransaction.create({
        user: userId,
        type: 'CREDIT',
        amount: value,
        balanceAfter: round2(wallet.balance),
        source,
        reason,
        order,
        orderNumber,
        createdBy,
        ...(dedupeKey ? { dedupeKey } : {})
      });
      return { duplicate: false, balance: round2(wallet.balance), transaction: txn };
    } catch (err) {
      // Ledger write failed: undo the balance change so balance and history never disagree
      await Wallet.updateOne({ user: userId }, { $inc: { balance: -value } }).catch(() => {});
      if (err?.code === 11000) return { duplicate: true, balance: await this.getBalance(userId) };
      throw err;
    }
  }

  /** Remove money. Fails (without changing anything) if the balance is too low. */
  async debit({ userId, amount, source, reason = '', order = null, orderNumber = '', createdBy = 'System', dedupeKey = null }) {
    const value = cleanAmount(amount);

    const wallet = await Wallet.findOneAndUpdate(
      { user: userId, balance: { $gte: value } },
      { $inc: { balance: -value } },
      { new: true }
    );
    if (!wallet) {
      const have = await this.getBalance(userId);
      throw fail(`Insufficient wallet balance. Available: ₹${have}.`);
    }

    try {
      const txn = await WalletTransaction.create({
        user: userId,
        type: 'DEBIT',
        amount: value,
        balanceAfter: round2(wallet.balance),
        source,
        reason,
        order,
        orderNumber,
        createdBy,
        ...(dedupeKey ? { dedupeKey } : {})
      });
      return { balance: round2(wallet.balance), transaction: txn };
    } catch (err) {
      await Wallet.updateOne({ user: userId }, { $inc: { balance: value } }).catch(() => {});
      throw err;
    }
  }

  /** Paginated history, newest first. */
  async getTransactions(userId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [items, total] = await Promise.all([
      WalletTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      WalletTransaction.countDocuments({ user: userId })
    ]);
    return {
      transactions: items.map((t) => ({
        id: String(t._id),
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        source: t.source,
        reason: t.reason,
        orderNumber: t.orderNumber || '',
        createdAt: t.createdAt
      })),
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 }
    };
  }

  /** Balance + a page of history — what the wallet screens show. */
  async getSummary(userId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw fail('Invalid customer id.');
    const [balance, history] = await Promise.all([this.getBalance(userId), this.getTransactions(userId, query)]);
    return { balance, ...history };
  }

  /** Admin adds / deducts credit with an audit note, and tells the customer. */
  async adminAdjust({ userId, type, amount, note, adminName = 'Admin' }) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw fail('Invalid customer id.');
    const kind = String(type || '').toUpperCase();
    if (!['CREDIT', 'DEBIT'].includes(kind)) throw fail('Type must be CREDIT or DEBIT.');
    const value = cleanAmount(amount);
    if (value > MAX_ADMIN_ADJUSTMENT) throw fail(`A single adjustment cannot exceed ₹${MAX_ADMIN_ADJUSTMENT}.`);
    const reason = String(note || '').trim();
    if (reason.length < 3) throw fail('Please add a short note explaining this adjustment.');

    const args = {
      userId,
      amount: value,
      source: kind === 'CREDIT' ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
      reason,
      createdBy: adminName
    };
    const result = kind === 'CREDIT' ? await this.credit(args) : await this.debit(args);

    notificationService
      .createNotification({
        recipient: userId,
        recipientRole: 'USER',
        title: kind === 'CREDIT' ? 'Wallet credited' : 'Wallet debited',
        message:
          kind === 'CREDIT'
            ? `₹${value} was added to your wallet. ${reason}`
            : `₹${value} was deducted from your wallet. ${reason}`,
        type: 'SYSTEM',
        link: '/account?tab=wallet',
        metadata: { amount: value, balance: result.balance }
      })
      .catch((e) => console.warn('[Wallet] notification note:', e.message));

    return result;
  }

  /** Give back the wallet money an order used (called when that order is cancelled). Idempotent. */
  async refundOrder(order) {
    const applied = round2(order?.pricing?.walletApplied || 0);
    if (!(applied > 0)) return null;
    return this.credit({
      userId: order.user,
      amount: applied,
      source: 'ORDER_REFUND',
      reason: `Refund for cancelled order #${order.orderNumber}`,
      order: order._id,
      orderNumber: order.orderNumber,
      createdBy: 'System',
      dedupeKey: `ORDER_REFUND:${order._id}`
    });
  }
}

export default new WalletService();
