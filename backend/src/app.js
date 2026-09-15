import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import bestsellerRoutes from './routes/bestsellerRoutes.js';
import adminBestsellerRoutes from './routes/adminBestsellerRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminCategoryRoutes from './routes/adminCategoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminSettingsRoutes from './routes/adminSettingsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminReviewRoutes from './routes/adminReviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminPaymentRoutes from './routes/adminPaymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminCouponRoutes from './routes/adminCouponRoutes.js';
import { notFoundHandler, errorMiddleware } from './middleware/errorMiddleware.js';
import { sendSuccess } from './utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Enable CORS
app.use(
  cors({
    origin: env.CLIENT_URL === '*' ? '*' : [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id', 'X-Guest-Id', 'Accept', 'x-razorpay-signature']
  })
);

// Body Parsing Middleware (with rawBody capture for webhook signature verification)
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for file uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Root & Health Check Endpoint
app.get('/', (req, res) => {
  return sendSuccess(res, 'Auriva API is running', {
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, 'Server health check passed', {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting (v1 & standard)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/upload', uploadRoutes);
app.use('/api/v1/bestsellers', bestsellerRoutes);
app.use('/api/v1/admin/bestsellers', adminBestsellerRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/v1/admin/categories', adminCategoryRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/v1/user/addresses', addressRoutes);
app.use('/api/user/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/v1/admin/settings', adminSettingsRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/v1/products/:id/reviews', reviewRoutes);
app.use('/api/products/:id/reviews', reviewRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/v1/admin/payments', adminPaymentRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorMiddleware);

export default app;
