import notificationService from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class NotificationController {
  // -------------------------------------------------------------
  // Customer Notification Handlers
  // -------------------------------------------------------------

  async getUserNotifications(req, res, next) {
    try {
      const result = await notificationService.getNotifications({
        recipient: req.user._id,
        role: 'USER',
        status: req.query.status,
        type: req.query.type,
        page: req.query.page,
        limit: req.query.limit
      });
      return sendSuccess(res, 'Notifications retrieved successfully', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async getUserUnreadCount(req, res, next) {
    try {
      const unreadCount = await notificationService.getUnreadCount({
        recipient: req.user._id,
        role: 'USER'
      });
      return sendSuccess(res, 'Unread count retrieved', { unreadCount }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async markUserAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, {
        recipient: req.user._id,
        role: 'USER'
      });
      return sendSuccess(res, 'Notification marked as read', { notification }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async markUserAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead({
        recipient: req.user._id,
        role: 'USER'
      });
      return sendSuccess(res, 'All notifications marked as read', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async deleteUserNotification(req, res, next) {
    try {
      const result = await notificationService.deleteNotification(req.params.id, {
        recipient: req.user._id,
        role: 'USER'
      });
      return sendSuccess(res, 'Notification deleted successfully', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  // -------------------------------------------------------------
  // Admin Notification Handlers
  // -------------------------------------------------------------

  async getAdminNotifications(req, res, next) {
    try {
      const result = await notificationService.getNotifications({
        recipient: req.user._id,
        role: 'ADMIN',
        status: req.query.status,
        type: req.query.type,
        page: req.query.page,
        limit: req.query.limit
      });
      return sendSuccess(res, 'Admin notifications retrieved successfully', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async getAdminUnreadCount(req, res, next) {
    try {
      const unreadCount = await notificationService.getUnreadCount({
        recipient: req.user._id,
        role: 'ADMIN'
      });
      return sendSuccess(res, 'Admin unread count retrieved', { unreadCount }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async markAdminAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, {
        recipient: req.user._id,
        role: 'ADMIN'
      });
      return sendSuccess(res, 'Admin notification marked as read', { notification }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async markAdminAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead({
        recipient: req.user._id,
        role: 'ADMIN'
      });
      return sendSuccess(res, 'All admin notifications marked as read', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  async deleteAdminNotification(req, res, next) {
    try {
      const result = await notificationService.deleteNotification(req.params.id, {
        recipient: req.user._id,
        role: 'ADMIN'
      });
      return sendSuccess(res, 'Admin notification deleted successfully', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
