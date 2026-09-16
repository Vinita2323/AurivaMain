import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ShopPage from '../pages/ShopPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import WishlistPage from '../pages/WishlistPage';
import OrderTrackingPage from '../pages/OrderTrackingPage';
import AccountPage from '../pages/AccountPage';
import LoginPage from '../pages/LoginPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import RecipesPage from '../pages/RecipesPage';
import MobileBottomNav from '../components/MobileBottomNav';

export default function UserRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/order-tracking" element={<OrderTrackingPage />} />
        <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        {/* Catch-all to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MobileBottomNav />
    </>
  );
}

