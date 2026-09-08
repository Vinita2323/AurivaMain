import mongoose from 'mongoose';
import env from './env.js';

/**
 * Connect to MongoDB database instance
 * Centralized connection handler with graceful error handling.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    console.warn('[Database Notice] Backend is running. Please ensure MongoDB is started or set a valid MONGO_URI in .env');
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB connection lost. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] MongoDB runtime error: ${err.message}`);
});

export default connectDB;
