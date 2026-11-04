/**
 * MUST be the first import of every test file.
 *
 * Builds a fully isolated environment BEFORE any application module is loaded:
 *  - NODE_ENV=test
 *  - an in-memory MongoDB (never Atlas / never the live database)
 *  - every key found in backend/.env is overwritten with an empty string, so dotenv cannot inject
 *    live credentials (dotenv never overrides variables that already exist)
 *  - dummy Razorpay TEST credentials (the SDK client itself is replaced by a fake in tests)
 *
 * Then it refuses to continue unless the configuration is provably safe.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(here, '../../.env');

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.replace(/^﻿/, '').match(/^\s*([A-Z0-9_]+)\s*=/);
    if (m) process.env[m[1]] = '';
  }
}

Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: '0',
  // Placeholder only: the real in-memory URI is assigned in harness.boot() before anything connects
  MONGO_URI: 'mongodb://127.0.0.1:1/auriva_unused',
  JWT_SECRET: 'unit_test_jwt_secret_not_for_production',
  JWT_EXPIRES_IN: '1d',
  CLIENT_URL: 'http://localhost:5173',
  SMS_PROVIDER: 'console',
  OTP_DEMO_MODE: 'true',
  SHIPROCKET_CHECKOUT_QUOTES: 'false',
  RAZORPAY_KEY_ID: 'rzp_test_UNITTESTDUMMY',
  RAZORPAY_KEY_SECRET: 'unit_test_razorpay_key_secret',
  RAZORPAY_WEBHOOK_SECRET: 'unit_test_razorpay_webhook_secret',
  ADMIN_LOGIN_EMAIL: 'admin@test.local',
  ADMIN_RECOVERY_EMAIL: 'admin@test.local'
});

// ---- Safety interlock: never run against anything but a local, test-keyed setup ----
const uri = process.env.MONGO_URI;
if (!(uri.startsWith('mongodb://127.0.0.1') || uri.startsWith('mongodb://localhost'))) {
  throw new Error('SAFETY: tests must use a local in-memory MongoDB. Refusing to run.');
}
if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
  throw new Error('SAFETY: tests must use rzp_test_ credentials only. Refusing to run.');
}
if (process.env.SMTP_HOST || process.env.SMS_API_KEY || process.env.SHIPROCKET_EMAIL || process.env.CLOUDINARY_API_KEY) {
  throw new Error('SAFETY: external service credentials must be blank in tests. Refusing to run.');
}
