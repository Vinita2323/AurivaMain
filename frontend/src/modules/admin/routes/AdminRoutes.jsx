import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';
import AdminDashboard from '../pages/AdminDashboard';
import AdminProducts from '../pages/AdminProducts';
import AdminCategories from '../pages/AdminCategories';
import AdminInventory from '../pages/AdminInventory';
import AdminOrders from '../pages/AdminOrders';
import AdminCustomers from '../pages/AdminCustomers';
import AdminCoupons from '../pages/AdminCoupons';
import AdminReviews from '../pages/AdminReviews';
import AdminPromotions from '../pages/AdminPromotions';
import AdminAnalytics from '../pages/AdminAnalytics';
import AdminNotifications from '../pages/AdminNotifications';
import AdminSettings from '../pages/AdminSettings';
import AdminLogin from '../pages/AdminLogin';

function ProtectedAdminRoute({ children }) {
  const { isAdminAuthenticated } = useAdmin();
  const location = useLocation();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Public Admin Login Route */}
      <Route path="/login" element={<AdminLogin />} />

      {/* Protected Admin Subpages */}
      <Route path="/" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="/products" element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
      <Route path="/categories" element={<ProtectedAdminRoute><AdminCategories /></ProtectedAdminRoute>} />
      <Route path="/inventory" element={<ProtectedAdminRoute><AdminInventory /></ProtectedAdminRoute>} />
      <Route path="/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
      <Route path="/customers" element={<ProtectedAdminRoute><AdminCustomers /></ProtectedAdminRoute>} />
      <Route path="/coupons" element={<ProtectedAdminRoute><AdminCoupons /></ProtectedAdminRoute>} />
      <Route path="/reviews" element={<ProtectedAdminRoute><AdminReviews /></ProtectedAdminRoute>} />
      <Route path="/promotions" element={<ProtectedAdminRoute><AdminPromotions /></ProtectedAdminRoute>} />
      <Route path="/notifications" element={<ProtectedAdminRoute><AdminNotifications /></ProtectedAdminRoute>} />
      <Route path="/analytics" element={<ProtectedAdminRoute><AdminAnalytics /></ProtectedAdminRoute>} />
      <Route path="/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
