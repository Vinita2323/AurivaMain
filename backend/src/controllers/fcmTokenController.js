import User from '../models/User.js';
import Admin from '../models/Admin.js';
import firebaseAdminService from '../services/firebaseAdminService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class FcmTokenController {
  /**
   * Save FCM Token for authenticated user/admin (Web or Mobile)
   * POST /api/v1/fcm-tokens/save
   */
  async saveToken(req, res, next) {
    try {
      const { token, platform = 'web' } = req.body;
      const userId = req.user?.id || req.user?._id;
      const userRole = req.user?.role || 'USER';

      if (!token || typeof token !== 'string' || !token.trim()) {
        return sendError(res, 'FCM registration token is required.', null, HTTP_STATUS.BAD_REQUEST);
      }

      const cleanToken = token.trim();
      const Model = userRole === 'ADMIN' ? Admin : User;
      const account = await Model.findById(userId);

      if (!account) {
        return sendError(res, 'Account not found.', null, HTTP_STATUS.NOT_FOUND);
      }

      const field = platform === 'mobile' ? 'fcmTokenMobile' : 'fcmTokens';

      if (!Array.isArray(account[field])) {
        account[field] = [];
      }

      // Add token if not present
      if (!account[field].includes(cleanToken)) {
        account[field].push(cleanToken);
        // Cap to latest 10 tokens per SOP best practices
        if (account[field].length > 10) {
          account[field] = account[field].slice(-10);
        }
      }

      await account.save();

      return sendSuccess(res, 'FCM token saved successfully.', {
        platform,
        tokensCount: account[field].length,
        status: firebaseAdminService.getStatus()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save Mobile FCM Token
   * POST /api/v1/fcm-tokens/mobile/save
   */
  async saveMobileToken(req, res, next) {
    req.body.platform = 'mobile';
    return this.saveToken(req, res, next);
  }

  /**
   * Remove FCM Token on logout or permission revocation
   * DELETE /api/v1/fcm-tokens/remove
   */
  async removeToken(req, res, next) {
    try {
      const { token, platform = 'web' } = req.body;
      const userId = req.user?.id || req.user?._id;
      const userRole = req.user?.role || 'USER';

      if (!token) {
        return sendError(res, 'Token to remove is required.', null, HTTP_STATUS.BAD_REQUEST);
      }

      const Model = userRole === 'ADMIN' ? Admin : User;
      const field = platform === 'mobile' ? 'fcmTokenMobile' : 'fcmTokens';

      await Model.updateOne(
        { _id: userId },
        { $pull: { [field]: token.trim() } }
      );

      return sendSuccess(res, 'FCM token removed successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send test push notification to the authenticated user's registered devices
   * POST /api/v1/fcm-tokens/test
   */
  async sendTestNotification(req, res, next) {
    try {
      const userId = req.user?.id || req.user?._id;
      const userRole = req.user?.role || 'USER';
      const { title, body, link } = req.body || {};

      const Model = userRole === 'ADMIN' ? Admin : User;
      const account = await Model.findById(userId).select('fcmTokens fcmTokenMobile name');

      if (!account) {
        return sendError(res, 'Account not found.', null, HTTP_STATUS.NOT_FOUND);
      }

      const tokens = [
        ...(account.fcmTokens || []),
        ...(account.fcmTokenMobile || [])
      ].filter(Boolean);

      const uniqueTokens = [...new Set(tokens)];

      if (uniqueTokens.length === 0) {
        // If in standby mode or testing without registered devices, simulate delivery
        if (!firebaseAdminService.getStatus().isInitialized) {
          const simulatedTokens = ['simulated_device_token_standby'];
          const payload = {
            title: title || 'Aurivá Push Notification Engine 🔔',
            body: body || `Order update simulated for ${account.name || 'Admin'}! Push notification pipeline operational.`,
            data: {
              type: 'test',
              link: link || (userRole === 'ADMIN' ? '/admin/notifications' : '/account?tab=notifications'),
              timestamp: new Date().toISOString()
            }
          };

          const result = await firebaseAdminService.sendPushNotification(simulatedTokens, payload);
          return sendSuccess(res, 'Push notification simulated in Standby Mode! (Backend log recorded)', {
            result,
            tokensCount: 1,
            isSimulated: true,
            status: firebaseAdminService.getStatus()
          });
        }

        return sendError(
          res,
          'No active FCM device tokens found for this account. Please enable browser or mobile push permissions first.',
          { tokensCount: 0 },
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const payload = {
        title: title || 'Aurivá Test Notification 🔔',
        body: body || `Hello ${account.name || 'there'}! This is a verified test push notification from Aurivá.`,
        data: {
          type: 'test',
          link: link || (userRole === 'ADMIN' ? '/admin/notifications' : '/account?tab=notifications'),
          timestamp: new Date().toISOString()
        }
      };

      const result = await firebaseAdminService.sendPushNotification(uniqueTokens, payload);

      return sendSuccess(res, 'Test notification dispatched.', {
        result,
        tokensCount: uniqueTokens.length,
        status: firebaseAdminService.getStatus()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current Push Notification configuration & token status
   * GET /api/v1/fcm-tokens/status
   */
  async getStatus(req, res, next) {
    try {
      const userId = req.user?.id || req.user?._id;
      const userRole = req.user?.role || 'USER';

      let tokensCount = 0;
      let activeTokensCount = 0;
      let activeMobileTokensCount = 0;

      if (userId) {
        const Model = userRole === 'ADMIN' ? Admin : User;
        const account = await Model.findById(userId).select('fcmTokens fcmTokenMobile');
        if (account) {
          activeTokensCount = account.fcmTokens?.length || 0;
          activeMobileTokensCount = account.fcmTokenMobile?.length || 0;
          tokensCount = activeTokensCount + activeMobileTokensCount;
        }
      }

      return sendSuccess(res, 'Push notification status retrieved.', {
        ...firebaseAdminService.getStatus(),
        userRegisteredTokens: tokensCount,
        activeTokensCount,
        activeMobileTokensCount
      });
    } catch (err) {
      next(err);
    }
  }
}

export const fcmTokenController = new FcmTokenController();
export default fcmTokenController;
