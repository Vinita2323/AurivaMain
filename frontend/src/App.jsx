import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';

import UserRoutes from './modules/user/routes/UserRoutes';
import AdminRoutes from './modules/admin/routes/AdminRoutes';
import CartToast from './modules/user/components/CartToast';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;

