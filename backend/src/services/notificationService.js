import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import settingsService from './settingsService.js';
import firebaseAdminService from './firebaseAdminService.js';
import { HTTP_STATUS } from '../constants/status.js';

class NotificationService {
  /**
   * Create a single in-app notification
   * @param {object} data
   * @returns {Promise<Notification>}
   */
  async createNotification(data) {
    const {
      recipient = null,
      recipientRole,
      title,
      message,
      type = 'SYSTEM',
      relatedId = null,
      link = '',
      metadata = {}
    } = data;

    if (!recipientRole || !['USER', 'ADMIN'].includes(recipientRole)) {
      const err = new Error('Invalid or missing recipientRole. Must be USER or ADMIN.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (!title || !title.trim()) {
      const err = new Error('Notification title is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (!message || !message.trim()) {
      const err = new Error('Notification message is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const notification = new Notification({
      recipient: recipient ? new mongoose.Types.ObjectId(recipient) : null,
      recipientRole,
      title: title.trim(),
      message: message.trim(),
      type,
      relatedId: relatedId ? String(relatedId) : null,
      link: link || (recipientRole === 'ADMIN' ? '/admin/orders' : '/orders'),
      metadata: metadata || {}
    });

    const savedNotification = await notification.save();

    // Trigger push notification asynchronously (non-blocking)
    try {
      const pushPayload = {
        title: savedNotification.title,
        body: savedNotification.message,
        data: {
          notificationId: String(savedNotification._id),
          type: savedNotification.type,
          relatedId: String(savedNotification.relatedId || ''),
          link: savedNotification.link || '/'
        }
      };

      if (recipientRole === 'ADMIN' && !recipient) {
        // Broadcast to all active admins
        firebaseAdminService.broadcastToAdmins(pushPayload).catch(() => {});
      } else if (recipient) {
        // Send to specific user or admin
        firebaseAdminService.sendNotificationToUser(recipient, recipientRole, pushPayload).catch(() => {});
      }
    } catch (pushErr) {
      console.warn('[NotificationService] Push notification dispatch error:', pushErr.message);
    }

    return savedNotification;
  }

  /**
   * Create multiple notifications in a batch
   * @param {Array<object>} items
   * @returns {Promise<Array<Notification>>}
   */
  async createBulkNotifications(items = []) {
    if (!Array.isArray(items) || items.length === 0) return [];
    return await Notification.insertMany(items);
  }

  /**
   * Check product stock level against store settings and generate Admin notification if low
   * Includes deduplication so unread alerts for the same product are not spammed.
   * @param {object} product - Mongoose document or product POJO with _id, name, stockCount
   * @returns {Promise<Notification|null>}
   */
  async checkAndNotifyLowStock(product) {
    if (!product || product.stockCount === undefined) return null;

    try {
      const settings = await settingsService.getSettings();
      const threshold = typeof settings.lowStockThreshold === 'number' ? settings.lowStockThreshold : 30;

      const currentStock = Number(product.stockCount);
      if (currentStock > threshold) {
        return null;
      }

      const prodIdStr = (product._id || product.id).toString();

      // Deduplication: check if an unread LOW_STOCK notification for this product already exists
      const existingAlert = await Notification.findOne({
        recipientRole: 'ADMIN',
        type: 'LOW_STOCK',
        'metadata.productId': prodIdStr,
        read: false
      });

      if (existingAlert) {
        return existingAlert;
      }

      // Create new low-stock notification for Admin
      const title = `Low Stock Warning: ${product.name}`;
      const message = currentStock <= 0
        ? `"${product.name}" is OUT OF STOCK (0 units remaining). Please restock immediately.`
        : `Warehouse stock for "${product.name}" has fallen to ${currentStock} units remaining (Threshold: ${threshold}).`;

      return await this.createNotification({
        recipientRole: 'ADMIN',
        title,
        message,
        type: 'LOW_STOCK',
        relatedId: prodIdStr,
        link: '/admin/inventory',
        metadata: {
          productId: prodIdStr,
          productName: product.name,
          stockCount: currentStock,
          threshold
        }
      });
    } catch (error) {
      console.warn('[Notification Service] Low stock notification note:', error.message);
      return null;
    }
  }

  /**
   * Retrieve paginated notifications with role isolation
   * @param {object} params
   * @returns {Promise<{ notifications: Array, pagination: object }>}
   */
  async getNotifications({
    recipient = null,
    role = 'USER',
    status = 'all',
    type = null,
    page = 1,
    limit = 20
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (role === 'ADMIN') {
      query.recipientRole = 'ADMIN';
      if (recipient) {
        query.$or = [{ recipient: null }, { recipient: new mongoose.Types.ObjectId(recipient) }];
      }
    } else {
      // User role requires specific recipient
      if (!recipient) {
        const err = new Error('User recipient identifier is required.');
        err.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw err;
      }
      query.recipientRole = 'USER';
      query.recipient = new mongoose.Types.ObjectId(recipient);
    }

    if (status === 'unread') {
      query.read = false;
    } else if (status === 'read') {
      query.read = true;
    }

    if (type) {
      query.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, read: false })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  /**
   * Get unread notification count for an actor
   * @param {object} params
   * @returns {Promise<number>}
   */
  async getUnreadCount({ recipient = null, role = 'USER' }) {
    const query = { read: false };

    if (role === 'ADMIN') {
      query.recipientRole = 'ADMIN';
      if (recipient) {
        query.$or = [{ recipient: null }, { recipient: new mongoose.Types.ObjectId(recipient) }];
      }
    } else {
      if (!recipient) return 0;
      query.recipientRole = 'USER';
      query.recipient = new mongoose.Types.ObjectId(recipient);
    }

    return await Notification.countDocuments(query);
  }

  /**
   * Mark a single notification as read with ownership verification
   * @param {string} notificationId
   * @param {object} actor - { recipient, role }
   * @returns {Promise<Notification>}
   */
  async markAsRead(notificationId, { recipient = null, role = 'USER' }) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      const err = new Error('Invalid notification ID format.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const query = { _id: notificationId };

    if (role === 'ADMIN') {
      query.recipientRole = 'ADMIN';
    } else {
      if (!recipient) {
        const err = new Error('Unauthorized: User identification missing.');
        err.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw err;
      }
      query.recipientRole = 'USER';
      query.recipient = new mongoose.Types.ObjectId(recipient);
    }

    const notification = await Notification.findOne(query);
    if (!notification) {
      const err = new Error('Notification not found or access denied.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all unread notifications as read for an actor
   * @param {object} actor - { recipient, role }
   * @returns {Promise<{ modifiedCount: number }>}
   */
  async markAllAsRead({ recipient = null, role = 'USER' }) {
    const query = { read: false };

    if (role === 'ADMIN') {
      query.recipientRole = 'ADMIN';
      if (recipient) {
        query.$or = [{ recipient: null }, { recipient: new mongoose.Types.ObjectId(recipient) }];
      }
    } else {
      if (!recipient) {
        const err = new Error('Unauthorized: User identification missing.');
        err.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw err;
      }
      query.recipientRole = 'USER';
      query.recipient = new mongoose.Types.ObjectId(recipient);
    }

    const result = await Notification.updateMany(query, {
      $set: { read: true, readAt: new Date() }
    });

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification with ownership verification
   * @param {string} notificationId
   * @param {object} actor - { recipient, role }
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteNotification(notificationId, { recipient = null, role = 'USER' }) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      const err = new Error('Invalid notification ID format.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const query = { _id: notificationId };

    if (role === 'ADMIN') {
      query.recipientRole = 'ADMIN';
    } else {
      if (!recipient) {
        const err = new Error('Unauthorized: User identification missing.');
        err.statusCode = HTTP_STATUS.UNAUTHORIZED;
        throw err;
      }
      query.recipientRole = 'USER';
      query.recipient = new mongoose.Types.ObjectId(recipient);
    }

    const result = await Notification.deleteOne(query);
    if (result.deletedCount === 0) {
      const err = new Error('Notification not found or access denied.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    return { success: true, message: 'Notification deleted successfully.' };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
