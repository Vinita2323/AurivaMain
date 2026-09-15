import mongoose from 'mongoose';
import env from './env.js';

let isConnecting = false;
let retryTimer = null;
let registeredOnConnected = null;

/**
 * Check whether database is actively connected
 */
export const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * Connect to MongoDB database instance
 * Resilient connection handler with automated retry and reconnection.
 */
export const connectDB = async (onConnectedCallback = null) => {
  if (onConnectedCallback) {
    registeredOnConnected = onConnectedCallback;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return null;
  }

  isConnecting = true;
  try {
    mongoose.set('bufferTimeoutMS', 10000);
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000 // 10 seconds timeout for resilient handshake
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    if (registeredOnConnected) {
      try {
        await registeredOnConnected();
      } catch (cbErr) {
        console.error('[Database Init Warning]', cbErr.message);
      }
    }

    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    if (error.message.includes('whitelist') || error.message.includes('SSL') || error.message.includes('ssl3_read_bytes')) {
      console.warn('----------------------------------------------------');
      console.warn('⚠️  MONGODB ATLAS IP ACCESS LIST (WHITELIST) REQUIRED:');
      console.warn('   1. Open MongoDB Atlas -> Security -> Network Access');
      console.warn('   2. Click "+ Add IP Address"');
      console.warn('   3. Add Current IP (or "0.0.0.0/0" for dev access)');
      console.warn('   4. Click Confirm & wait ~30 seconds for it to activate.');
      console.warn('----------------------------------------------------');
    } else {
      console.warn('[Database Notice] Will automatically retry connection in 5 seconds...');
    }

    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }

    // Schedule automated reconnection in development
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB(registeredOnConnected);
      }, 5000);
    }

    return null;
  }
};

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB connection lost. Scheduling auto-reconnection...');
  if (!retryTimer) {
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connectDB(registeredOnConnected);
    }, 5000);
  }
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] MongoDB runtime error: ${err.message}`);
});

export default connectDB;

