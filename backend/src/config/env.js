import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/auriva_db',
  JWT_SECRET: process.env.JWT_SECRET || 'auriva_default_dev_jwt_secret_key_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SMS: {
    API_KEY: process.env.SMS_API_KEY || '',
    SENDER_ID: process.env.SMS_SENDER_ID || 'AURIVA',
    TEMPLATE_ID: process.env.SMS_TEMPLATE_ID || ''
  },
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    FOLDER: process.env.CLOUDINARY_FOLDER || 'auriva_products'
  },
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    IS_CONFIGURED: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  },
  FIREBASE: {
    SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/firebase-service-account.json',
    CONFIG_JSON: process.env.FIREBASE_CONFIG || '',
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || ''
  },
  SHIPROCKET: {
    EMAIL: process.env.SHIPROCKET_EMAIL || '',
    PASSWORD: process.env.SHIPROCKET_PASSWORD || '',
    BASE_URL: (process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external').replace(/\/$/, ''),
    // Registered pickup location nickname in Shiprocket dashboard (warehouse, not customer address)
    PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    PICKUP_CONTACT_PERSON: process.env.SHIPROCKET_PICKUP_CONTACT_PERSON || '',
    PICKUP_PHONE: process.env.SHIPROCKET_PICKUP_PHONE || '',
    PICKUP_ADDRESS: process.env.SHIPROCKET_PICKUP_ADDRESS || '',
    PICKUP_CITY: process.env.SHIPROCKET_PICKUP_CITY || '',
    PICKUP_STATE: process.env.SHIPROCKET_PICKUP_STATE || '',
    PICKUP_PINCODE: process.env.SHIPROCKET_PICKUP_PINCODE || '',
    PICKUP_COUNTRY: process.env.SHIPROCKET_PICKUP_COUNTRY || 'India',
    GSTIN: process.env.SHIPROCKET_GSTIN || '',
    WEBHOOK_TOKEN: process.env.SHIPROCKET_WEBHOOK_TOKEN || '',
    // When true and credentials exist, create Shiprocket order after prepaid verify / COD place
    AUTO_CREATE: String(process.env.SHIPROCKET_AUTO_CREATE || 'true').toLowerCase() !== 'false',
    // Package fallbacks (kg / cm) — used only when product shipping fields are unset
    DEFAULT_WEIGHT_KG: process.env.SHIPROCKET_DEFAULT_WEIGHT_KG
      ? Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG)
      : null,
    DEFAULT_LENGTH_CM: process.env.SHIPROCKET_DEFAULT_LENGTH_CM
      ? Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM)
      : null,
    DEFAULT_BREADTH_CM: process.env.SHIPROCKET_DEFAULT_BREADTH_CM
      ? Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM)
      : null,
    DEFAULT_HEIGHT_CM: process.env.SHIPROCKET_DEFAULT_HEIGHT_CM
      ? Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM)
      : null,
    IS_CONFIGURED: Boolean(
      process.env.SHIPROCKET_EMAIL &&
      process.env.SHIPROCKET_PASSWORD
    )
  }
};

export default env;
