import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
import notificationRoutes from './routes/notificationRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import adminRecipeRoutes from './routes/adminRecipeRoutes.js';
import fcmTokenRoutes from './routes/fcmTokenRoutes.js';
import { notFoundHandler, errorMiddleware } from './middleware/errorMiddleware.js';
import { sendSuccess } from './utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Enable CORS
app.use(
  cors({
    origin: env.CLIENT_URL === '*' ? '*' : [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000',"http://localhost:5174","http://localhost:5175"],
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

// Resolve frontend static files directory across local dev & production environments
const resolveFrontendDistPath = () => {
  const candidates = [
    process.env.FRONTEND_DIST_PATH,
    path.resolve(__dirname, '../public'),             // backend/public (Production Git commit)
    path.resolve(__dirname, '../../frontend/dist'),   // frontend/dist (Local monorepo dev)
    path.resolve(process.cwd(), 'public'),           // Current working directory / public
    path.resolve(process.cwd(), 'dist'),             // Current working directory / dist
    path.resolve(__dirname, '../dist'),               // backend/dist
    path.resolve(__dirname, '../../public_html'),     // Hostinger root public_html
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.resolve(dir, 'index.html'))) {
      console.log(`[Frontend] Serving static files from: ${dir}`);
      return dir;
    }
  }

  // Fallback default
  console.warn(`[Frontend] Warning: index.html not found in candidate paths. Defaulting to backend/public.`);
  return path.resolve(__dirname, '../public');
};

const frontendDistPath = resolveFrontendDistPath();

// Static directory for file uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Serve frontend static build files (JS, CSS, images, etc.)
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Health Check Endpoints
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, 'Server health check passed', {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
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
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/admin/notifications', adminNotificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/v1/admin/recipes', adminRecipeRoutes);
app.use('/api/admin/recipes', adminRecipeRoutes);
app.use('/api/v1/fcm-tokens', fcmTokenRoutes);
app.use('/api/fcm-tokens', fcmTokenRoutes);
app.use('/api/v1/admin', adminRoutes);

// SPA Fallback: Serve frontend index.html for all client-side navigation (non-API & non-uploads)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return next();
  }

  const indexPath = path.resolve(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // Diagnostic fallback for production troubleshooting instead of silent 404 crash
  console.error(`[Frontend Error] index.html not found at ${indexPath} for requested route ${req.originalUrl}`);
  return res.status(503).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Auriva - Frontend Build Not Found</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0E2A1B; color: #F7F3E9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #182019; border: 1px solid #D4AF37; border-radius: 12px; max-width: 600px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          h1 { color: #D4AF37; margin-top: 0; font-size: 24px; }
          code { background: #242E25; padding: 3px 8px; border-radius: 4px; color: #86EFAC; font-size: 14px; word-break: break-all; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ Frontend Build Not Found</h1>
          <p>The Auriva Backend Server is running, but <code>index.html</code> was not found on the server.</p>
          <p><strong>Attempted path:</strong><br /><code>${indexPath}</code></p>
          <p><strong>Quick Fix:</strong></p>
          <ul>
            <li>Run <code>npm run build:frontend</code> in your backend directory.</li>
            <li>Commit the <code>backend/public</code> folder to Git and push to your repository.</li>
            <li>Hostinger will automatically pull the built files and render the UI.</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorMiddleware);

export default app;
