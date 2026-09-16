import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

let app = null;
let messaging = null;

try {
  if (isFirebaseConfigured) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    // getMessaging will be initialized conditionally when supported in browser
  } else {
    console.log('[FCM Frontend] Firebase credentials pending. Push notification service ready in standby mode.');
  }
} catch (err) {
  console.warn('[FCM Frontend] Initialization standby:', err.message);
}

/**
 * Safely obtain messaging instance if supported by browser environment
 */
export async function getSafeMessaging() {
  if (!isFirebaseConfigured) return null;
  if (messaging) return messaging;

  try {
    const supported = await isSupported();
    if (supported && app) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (err) {
    console.warn('[FCM Frontend] Messaging not supported in current context:', err.message);
  }
  return null;
}

export { app, messaging, getToken, onMessage };
export default app;
