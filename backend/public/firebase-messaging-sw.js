// Aurivá Firebase Cloud Messaging Service Worker
// Standard Operating Procedure (SOP) Web Push Implementation

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Dynamically read Firebase configuration from registration query parameters
const urlParams = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || 'AIzaSyPlaceholderAurivaConfig123456789',
  authDomain: urlParams.get('authDomain') || 'auriva-push.firebaseapp.com',
  projectId: urlParams.get('projectId') || 'auriva-push',
  storageBucket: urlParams.get('storageBucket') || 'auriva-push.firebasestorage.app',
  messagingSenderId: urlParams.get('messagingSenderId') || '123456789012',
  appId: urlParams.get('appId') || '1:123456789012:web:placeholder'
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background message handler (triggered when tab is inactive, minimized, or closed)
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background push received:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Aurivá Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || payload.data?.icon || '/AurivaLogo.png',
      badge: '/AurivaLogo.png',
      data: payload.data || {},
      vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Notice:', e.message);
}

// Notification Click Handler - Deep links to targeted order / section
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetPath = data.link || data.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If matching window exists, focus it
      for (const client of clientList) {
        if (client.url.includes(targetPath) && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. If any client is open, navigate and focus
      if (clientList.length > 0 && 'focus' in clientList[0] && 'navigate' in clientList[0]) {
        clientList[0].focus();
        return clientList[0].navigate(targetPath);
      }

      // 3. Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    })
  );
});
