import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import AdminProducts from '../pages/AdminProducts';
import AdminCoupons from '../pages/AdminCoupons';
import AdminOrders from '../pages/AdminOrders';
import AdminBanners from '../pages/AdminBanners';
import AdminSettings from '../pages/AdminSettings';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/products" element={<AdminProducts />} />
      <Route path="/coupons" element={<AdminCoupons />} />
      <Route path="/orders" element={<AdminOrders />} />
      <Route path="/banners" element={<AdminBanners />} />
      <Route path="/categories" element={<AdminProducts />} />
      <Route path="/inventory" element={<AdminProducts />} />
      <Route path="/customers" element={<AdminOrders />} />
      <Route path="/reviews" element={<AdminDashboard />} />
      <Route path="/promotions" element={<AdminCoupons />} />
      <Route path="/analytics" element={<AdminDashboard />} />
      <Route path="/settings" element={<AdminSettings />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
