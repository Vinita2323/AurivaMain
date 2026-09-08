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
import uploadRoutes from './routes/uploadRoutes.js';
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
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
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

// API Routes Mounting (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/upload', uploadRoutes);
app.use('/api/v1/bestsellers', bestsellerRoutes);
app.use('/api/v1/admin/bestsellers', adminBestsellerRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorMiddleware);

export default app;
