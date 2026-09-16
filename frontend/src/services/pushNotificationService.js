import { 
  getSafeMessaging, 
  getToken, 
  onMessage, 
  VAPID_KEY, 
  firebaseConfig, 
  isFirebaseConfigured 
} from '../firebase';
import { fcmApi } from '../utils/api';

class PushNotificationService {
  constructor() {
    this.serviceWorkerRegistration = null;
    this.currentToken = null;
    this.foregroundUnsubscribe = null;
  }

  /**
   * Register the background Firebase Messaging Service Worker
   */
  async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[FCM] Service Workers not supported in this browser.');
      return null;
    }

    try {
      // Pass config dynamically to service worker via query string
      const swParams = new URLSearchParams({
        apiKey: firebaseConfig.apiKey || '',
        authDomain: firebaseConfig.authDomain || '',
        projectId: firebaseConfig.projectId || '',
        storageBucket: firebaseConfig.storageBucket || '',
        messagingSenderId: firebaseConfig.messagingSenderId || '',
        appId: firebaseConfig.appId || ''
      });

      const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;
      const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
      this.serviceWorkerRegistration = registration;
      console.log('✅ [FCM] Service Worker registered successfully.');
      return registration;
    } catch (error) {
      console.warn('❌ [FCM] Service Worker registration notice:', error.message);
      return null;
    }
  }

  /**
   * Check current browser notification permission status
   * Returns: 'granted' | 'denied' | 'default' | 'unsupported'
   */
  getPermissionStatus() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Request native browser notification permission
   */
  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log(`[FCM] Notification permission: ${permission}`);
      return permission === 'granted';
    } catch (err) {
      console.error('[FCM] Error requesting permission:', err);
      return false;
    }
  }

  /**
   * Retrieve FCM device registration token
   */
  async getFCMToken() {
    try {
      const messagingInstance = await getSafeMessaging();
      if (!messagingInstance || !isFirebaseConfigured) {
        console.log('[FCM] Running in standby mode (Firebase credentials pending).');
        return null;
      }

      let registration = this.serviceWorkerRegistration;
      if (!registration) {
        registration = await this.registerServiceWorker();
      }

      if (!registration) {
        throw new Error('Service worker registration failed.');
      }

      await registration.update().catch(() => {});

      const tokenOptions = {
        serviceWorkerRegistration: registration
      };

      if (VAPID_KEY && VAPID_KEY.trim()) {
        tokenOptions.vapidKey = VAPID_KEY.trim();
      }

      const token = await getToken(messagingInstance, tokenOptions);
      if (token) {
        this.currentToken = token;
        console.log('✅ [FCM] Token obtained:', token.slice(0, 15) + '...');
        return token;
      }

      return null;
    } catch (error) {
      console.warn('[FCM] Could not get FCM token:', error.message);
      return null;
    }
  }

  /**
   * Register device FCM token with backend
   * @param {boolean} forceUpdate - Force registration even if already saved locally
   */
  async registerFCMToken(forceUpdate = false) {
    try {
      // 1. Request user permission
      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) {
        return { success: false, reason: 'PERMISSION_DENIED', message: 'Notification permission was not granted.' };
      }

      // Check local cache
      const localToken = localStorage.getItem('fcm_token_web');
      if (localToken && !forceUpdate) {
        return { success: true, token: localToken, isCached: true };
      }

      // 2. Retrieve live token from Firebase (or generate persistent client token in standby mode)
      let token = await this.getFCMToken();

      if (!token) {
        // Standby client device identifier
        token = localToken || `web_device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      }

      // 3. Register token with backend
      try {
        await fcmApi.saveToken(token, 'web');
        localStorage.setItem('fcm_token_web', token);
        this.currentToken = token;
        console.log('✅ [FCM] Token successfully registered with Aurivá backend.');
        return { success: true, token };
      } catch (apiErr) {
        // If offline or not authenticated yet, save locally for sync on login
        localStorage.setItem('fcm_token_web', token);
        return { success: true, token, offline: true };
      }
    } catch (err) {
      console.warn('[FCM] Token registration warning:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Remove token upon logout or permission revocation
   */
  async unregisterFCMToken() {
    try {
      const token = localStorage.getItem('fcm_token_web') || this.currentToken;
      if (token) {
        await fcmApi.removeToken(token, 'web').catch(() => {});
        localStorage.removeItem('fcm_token_web');
        this.currentToken = null;
      }
      return { success: true };
    } catch (err) {
      console.warn('[FCM] Unregister token error:', err.message);
      return { success: false };
    }
  }

  /**
   * Setup listener for foreground notifications
   */
  async setupForegroundNotificationHandler(customHandler) {
    try {
      const messagingInstance = await getSafeMessaging();
      if (!messagingInstance) return;

      if (this.foregroundUnsubscribe) {
        this.foregroundUnsubscribe();
      }

      this.foregroundUnsubscribe = onMessage(messagingInstance, (payload) => {
        console.log('📬 [FCM] Foreground push message received:', payload);

        const title = payload.notification?.title || payload.data?.title || 'Aurivá Notification';
        const body = payload.notification?.body || payload.data?.body || '';
        const icon = payload.notification?.icon || payload.data?.icon || '/AurivaLogo.png';

        // Show native notification if allowed
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notif = new Notification(title, {
              body,
              icon,
              data: payload.data
            });

            notif.onclick = () => {
              window.focus();
              const link = payload.data?.link || payload.data?.click_action;
              if (link) {
                window.location.href = link;
              }
              notif.close();
            };
          } catch (e) {
            console.warn('[FCM] Native notification display notice:', e.message);
          }
        }

        if (customHandler && typeof customHandler === 'function') {
          customHandler(payload);
        }
      });
    } catch (err) {
      console.warn('[FCM] Foreground handler notice:', err.message);
    }
  }

  /**
   * Initialize push notifications on app launch
   */
  async initializePushNotifications(customHandler = null) {
    try {
      await this.registerServiceWorker();

      // If user had already granted permission, ensure token is refreshed
      if (this.getPermissionStatus() === 'granted') {
        this.registerFCMToken(false).catch(() => {});
      }

      if (customHandler) {
        this.setupForegroundNotificationHandler(customHandler);
      }
    } catch (err) {
      console.warn('[FCM] Initialize notice:', err.message);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
