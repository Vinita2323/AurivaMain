import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import adminAuthService from './services/adminAuthService.js';
import userAuthService from './services/userAuthService.js';
import productService from './services/productService.js';
import bestsellerService from './services/bestsellerService.js';
import User from './models/User.js';

/**
 * Start Auriva Backend Server
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    const conn = await connectDB();
    if (conn) {
      // Sync schema indexes and seed defaults
      await User.syncIndexes().catch(() => {});
      await adminAuthService.ensureDefaultAdmin();
      await userAuthService.ensureDefaultDemoUsers();
      await productService.seedInitialProducts();
      await bestsellerService.seedInitialBestsellers();
    }

    // 2. Start Express HTTP Server
    const server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Auriva Backend Server running in [${env.NODE_ENV}] mode`);
      console.log(`🌐 Server URL: http://localhost:${env.PORT}`);
      console.log(`📡 API Endpoints: http://localhost:${env.PORT}/api/v1`);
      console.log('====================================================');
    });

    // Handle server listen errors (e.g. port already in use)
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${env.PORT} is already in use. Please wait a moment or free the port.`);
      } else {
        console.error('[Server Error]:', err);
      }
      process.exit(1);
    });

    // 3. Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('[Fatal Error] Unhandled Promise Rejection:', err);
      server.close(() => process.exit(1));
    });

    // 4. Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      if (err.code !== 'EADDRINUSE') {
        console.error('[Fatal Error] Uncaught Exception:', err);
      }
      process.exit(1);
    });

    // 5. Graceful termination signals & nodemon restarts
    const handleShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.once('SIGUSR2', () => {
      server.close(() => {
        process.kill(process.pid, 'SIGUSR2');
      });
    });

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error(`[Server Startup Error] Failed to initialize server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
