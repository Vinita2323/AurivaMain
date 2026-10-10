import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';

import UserRoutes from './modules/user/routes/UserRoutes';
import AdminRoutes from './modules/admin/routes/AdminRoutes';
import CartToast from './modules/user/components/CartToast';
import SmoothScroll from './components/SmoothScroll';
import pushNotificationService from './services/pushNotificationService';

function App() {
  useEffect(() => {
    // Gracefully register background service worker & foreground listeners
    pushNotificationService.initializePushNotifications({
      onMessage: (payload) => {
        console.log('[Aurivá Push Engine] Received notification:', payload);
        try {
          const type =
            payload?.data?.type ||
            payload?.data?.notificationType ||
            payload?.notification?.title ||
            '';
          window.dispatchEvent(
            new CustomEvent('auriva:fcm-message', {
              detail: { type, payload, data: payload?.data || {} }
            })
          );
          if (String(type).toUpperCase().includes('ORDER')) {
            window.dispatchEvent(
              new CustomEvent('auriva:new-order', {
                detail: { type, payload, data: payload?.data || {} }
              })
            );
          }
        } catch (_) {
          /* ignore event dispatch failures */
        }
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <SmoothScroll>
        <AuthProvider>
          <AdminProvider>
            <CartProvider>
              <WishlistProvider>
                <CartToast />
                <Routes>
                  {/* Admin Management Routes */}
                  <Route path="/admin/*" element={<AdminRoutes />} />

                  {/* Public & Customer Storefront Routes */}
                  <Route path="/*" element={<UserRoutes />} />
                </Routes>
              </WishlistProvider>
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </SmoothScroll>
    </BrowserRouter>
  );
}

export default App;
