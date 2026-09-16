import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/env.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../../');

class FirebaseAdminService {
  constructor() {
    this.isInitialized = false;
    this.initError = null;
    this.initFirebase();
  }

  /**
   * Initialize Firebase Admin SDK from credentials
   */
  initFirebase() {
    try {
      // Avoid re-initialization if already initialized
      const apps = typeof admin.getApps === 'function' ? admin.getApps() : (admin.apps || []);
      if (apps.length > 0) {
        this.isInitialized = true;
        return;
      }

      let credential = null;

      // 1. Try inline JSON configuration from environment
      if (env.FIREBASE?.CONFIG_JSON) {
        try {
          const serviceAccount = JSON.parse(env.FIREBASE.CONFIG_JSON);
          credential = admin.credential.cert(serviceAccount);
        } catch (parseErr) {
          console.warn('[FCM] Could not parse FIREBASE_CONFIG JSON:', parseErr.message);
        }
      }

      // 2. Try file path from environment or default path
      if (!credential) {
        const potentialPaths = [
          env.FIREBASE?.SERVICE_ACCOUNT_PATH
            ? path.isAbsolute(env.FIREBASE.SERVICE_ACCOUNT_PATH)
              ? env.FIREBASE.SERVICE_ACCOUNT_PATH
              : path.resolve(backendRoot, env.FIREBASE.SERVICE_ACCOUNT_PATH)
            : null,
          path.resolve(backendRoot, 'config/firebase-service-account.json'),
          path.resolve(backendRoot, 'firebase-service-account.json')
        ].filter(Boolean);

        for (const filePath of potentialPaths) {
          if (fs.existsSync(filePath)) {
            try {
              const fileContent = fs.readFileSync(filePath, 'utf8');
              const serviceAccount = JSON.parse(fileContent);
              if (serviceAccount.project_id && serviceAccount.private_key) {
                credential = admin.credential.cert(serviceAccount);
                break;
              }
            } catch (fileErr) {
              console.warn(`[FCM] Could not parse service account file at ${filePath}:`, fileErr.message);
            }
          }
        }
      }

      if (credential) {
        admin.initializeApp({ credential });
        this.isInitialized = true;
        this.initError = null;
        console.log('[FCM] Firebase Admin SDK initialized successfully.');
      } else {
        this.isInitialized = false;
        this.initError = 'No valid Firebase credentials found.';
        console.log('[FCM] Firebase credentials not yet configured. Operating in Standby/Mock mode.');
      }
    } catch (err) {
      this.isInitialized = false;
      this.initError = err.message;
      console.warn('[FCM] Firebase Admin initialization standby:', err.message);
    }
  }

  /**
   * Get current configuration status
   */
  getStatus() {
    const apps = typeof admin.getApps === 'function' ? admin.getApps() : (admin.apps || []);
    return {
      isInitialized: this.isInitialized,
      hasApps: apps.length > 0,
      mode: this.isInitialized ? 'PRODUCTION_LIVE' : 'STANDBY_MOCK',
      message: this.isInitialized
        ? 'Firebase Cloud Messaging is active and delivering live push notifications.'
        : 'Firebase credentials pending. Push notifications operating in standby/mock mode.'
    };
  }

  /**
   * Send push notification to an array of FCM tokens (Multicast)
   * @param {string[]} tokens - Array of FCM device registration tokens
   * @param {object} payload - { title, body, data, icon }
   * @returns {Promise<object>}
   */
  async sendPushNotification(tokens = [], payload = {}) {
    try {
      if (!Array.isArray(tokens) || tokens.length === 0) {
        return { successCount: 0, failureCount: 0, staleTokens: [] };
      }

      // Filter and deduplicate tokens
      const uniqueTokens = [...new Set(tokens.filter(t => t && typeof t === 'string' && t.trim().length > 0))];
      if (uniqueTokens.length === 0) {
        return { successCount: 0, failureCount: 0, staleTokens: [] };
      }

      const title = payload.title || 'Aurivá Notification';
      const body = payload.body || '';
      const dataPayload = payload.data ? Object.fromEntries(
        Object.entries(payload.data).map(([k, v]) => [k, String(v ?? '')])
      ) : {};

      // Standby / Mock delivery mode when credentials not yet supplied
      if (!this.isInitialized) {
        console.log(`[FCM Standby] Simulated push to ${uniqueTokens.length} devices: "${title}" - "${body}"`);
        return {
          success: true,
          isMock: true,
          successCount: uniqueTokens.length,
          failureCount: 0,
          staleTokens: []
        };
      }

      // Construct live multicast message
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...dataPayload,
          click_action: dataPayload.link || '/'
        },
        tokens: uniqueTokens
      };

      if (payload.icon) {
        message.notification.icon = payload.icon;
      }

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[FCM] Sent push: ${response.successCount} succeeded, ${response.failureCount} failed.`);

      // Identify stale tokens for cleanup
      const staleTokens = [];
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token'
            ) {
              staleTokens.push(uniqueTokens[idx]);
            }
          }
        });
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        staleTokens,
        responses: response.responses
      };
    } catch (err) {
      console.error('[FCM] Error in sendPushNotification:', err.message);
      return {
        success: false,
        error: err.message,
        successCount: 0,
        failureCount: tokens.length,
        staleTokens: []
      };
    }
  }

  /**
   * Helper to send notification to a specific User or Admin by ID
   * @param {string} userId - User or Admin ID
   * @param {string} role - 'USER' or 'ADMIN'
   * @param {object} payload - { title, body, data, icon }
   * @param {boolean} includeMobile - Whether to include mobile tokens
   */
  async sendNotificationToUser(userId, role = 'USER', payload = {}, includeMobile = true) {
    try {
      if (!userId) return;

      const Model = role === 'ADMIN' ? Admin : User;
      const account = await Model.findById(userId).select('fcmTokens fcmTokenMobile name');
      if (!account) return;

      let tokens = [];
      if (account.fcmTokens && Array.isArray(account.fcmTokens)) {
        tokens.push(...account.fcmTokens);
      }
      if (includeMobile && account.fcmTokenMobile && Array.isArray(account.fcmTokenMobile)) {
        tokens.push(...account.fcmTokenMobile);
      }

      const uniqueTokens = [...new Set(tokens.filter(Boolean))];
      if (uniqueTokens.length === 0) return;

      const result = await this.sendPushNotification(uniqueTokens, payload);

      // Clean up stale tokens if detected
      if (result.staleTokens && result.staleTokens.length > 0) {
        await Model.updateOne(
          { _id: account._id },
          {
            $pull: {
              fcmTokens: { $in: result.staleTokens },
              fcmTokenMobile: { $in: result.staleTokens }
            }
          }
        ).catch(() => {});
      }

      return result;
    } catch (err) {
      console.warn('[FCM] sendNotificationToUser error:', err.message);
    }
  }

  /**
   * Broadcast push notification to all Admins
   * @param {object} payload - { title, body, data, icon }
   */
  async broadcastToAdmins(payload = {}) {
    try {
      const admins = await Admin.find({ status: 'ACTIVE' }).select('fcmTokens fcmTokenMobile');
      let tokens = [];

      admins.forEach(adm => {
        if (adm.fcmTokens) tokens.push(...adm.fcmTokens);
        if (adm.fcmTokenMobile) tokens.push(...adm.fcmTokenMobile);
      });

      const uniqueTokens = [...new Set(tokens.filter(Boolean))];
      if (uniqueTokens.length === 0) return;

      return await this.sendPushNotification(uniqueTokens, payload);
    } catch (err) {
      console.warn('[FCM] broadcastToAdmins error:', err.message);
    }
  }
}

export const firebaseAdminService = new FirebaseAdminService();
export default firebaseAdminService;
