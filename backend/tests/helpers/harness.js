// IMPORTANT: env-setup must be evaluated before any application code.
import './env-setup.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import http from 'http';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import env from '../../src/config/env.js';
import { __setRazorpayClientForTests } from '../../src/config/razorpay.js';
import { generateToken } from '../../src/utils/generateToken.js';
import User from '../../src/models/User.js';
import Admin from '../../src/models/Admin.js';
import Product from '../../src/models/Product.js';
import Address from '../../src/models/Address.js';
import Order from '../../src/models/Order.js';
import Payment from '../../src/models/Payment.js';
import Cart from '../../src/models/Cart.js';
import Wallet from '../../src/models/Wallet.js';
import WalletTransaction from '../../src/models/WalletTransaction.js';
import { createFakeRazorpay } from './fakeRazorpay.js';

export { User, Admin, Product, Address, Order, Payment, Cart, Wallet, WalletTransaction, mongoose, env };

export const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
export const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
export const gateway = createFakeRazorpay();

let server;
let baseUrl;
let counter = 0;
let mongod;

export async function boot() {
  __setRazorpayClientForTests(gateway);
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'auriva_payment_tests' } });
  const uri = mongod.getUri('auriva_payment_tests');
  // Safety interlock again, on the real URI, before anything connects
  if (!uri.startsWith('mongodb://127.0.0.1') && !uri.startsWith('mongodb://localhost')) {
    throw new Error('SAFETY: refusing to connect to a non-local database.');
  }
  process.env.MONGO_URI = uri;
  env.MONGO_URI = uri;
  await mongoose.connect(uri);
  // Build ALL indexes (including the new unique partial ones) and fail loudly on any index conflict
  for (const model of Object.values(mongoose.models)) await model.createIndexes();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  return baseUrl;
}

export async function shutdown() {
  await new Promise((resolve) => server?.close(resolve));
  await mongoose.disconnect();
  await mongod?.stop();
}

export async function resetDb() {
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
  gateway.reset();
  env.RAZORPAY.WEBHOOK_SECRET = WEBHOOK_SECRET;
}

/** JSON request helper → { status, body } */
export async function call(method, path, { token, body, headers = {}, rawBody } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (rawBody !== undefined) payload = rawBody;
  else if (body !== undefined) payload = JSON.stringify(body);
  if (payload !== undefined) h['Content-Type'] = 'application/json';
  const res = await fetch(baseUrl + path, { method, headers: h, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, body: json, text };
}

// ---------------------------------------------------------------- factories
const phone = () => String(7000000000 + (++counter) * 7 + Math.floor(Math.random() * 5));

export async function makeCustomer() {
  const user = await User.create({ name: 'Test Customer', phone: phone(), role: 'USER', status: 'ACTIVE', isVerified: true });
  const address = await Address.create({
    user: user._id,
    fullName: 'Test Customer',
    phoneNumber: user.phone,
    addressLine1: '1 Test Street',
    city: 'Indore',
    state: 'Madhya Pradesh',
    postalCode: '452001',
    addressType: 'home',
    isDefault: true
  });
  return { user, address, id: String(user._id), addressId: String(address._id), token: generateToken({ id: user._id, role: 'USER' }) };
}

export async function makeAdmin() {
  const admin = await Admin.create({
    name: 'Test Admin',
    email: `admin${++counter}@test.local`,
    password: 'Test@12345',
    role: 'ADMIN',
    status: 'ACTIVE',
    permissions: ['SUPER_ADMIN']
  });
  return { admin, id: String(admin._id), token: generateToken({ id: admin._id, role: 'ADMIN' }) };
}

export async function makeProduct({ price = 200, stock = 50, weight = '100g', name } = {}) {
  const n = ++counter;
  return Product.create({
    name: name || `Test Makhana ${n}`,
    slug: `test-makhana-${n}-${Date.now()}`,
    price,
    oldPrice: Math.round(price * 1.2),
    image: 'https://example.com/p.jpg',
    category: 'flavoured-makhana',
    weight,
    weightOptions: [{ weight, price, oldPrice: Math.round(price * 1.2), isDefault: true }],
    stockCount: stock,
    inStock: stock > 0,
    status: 'ACTIVE'
  });
}

export async function addToCart(customer, product, qty = 1) {
  const res = await call('POST', '/api/v1/cart/items', {
    token: customer.token,
    body: { productId: String(product._id), qty, weight: product.weight }
  });
  if (res.status >= 300) throw new Error(`addToCart failed: ${res.status} ${res.text}`);
  return res;
}

// ---------------------------------------------------------------- payments helpers
export const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
export const sign = (razorpayOrderId, razorpayPaymentId, secret = KEY_SECRET) => hmac(secret, `${razorpayOrderId}|${razorpayPaymentId}`);

/** Customer starts prepaid checkout for the current cart → returns the server-created session */
export async function startSession(customer) {
  const res = await call('POST', '/api/v1/payments/checkout-session', {
    token: customer.token,
    body: { addressId: customer.addressId, paymentMethod: 'UPI' }
  });
  if (res.status !== 201) throw new Error(`checkout-session failed: ${res.status} ${res.text}`);
  return res.body.data; // { razorpayOrderId, amount (paise), payableTotal, paymentId ... }
}

export const verifySession = (customer, session, gatewayPayment, overrides = {}) =>
  call('POST', '/api/v1/payments/verify', {
    token: customer.token,
    body: {
      razorpayOrderId: session.razorpayOrderId,
      razorpayPaymentId: gatewayPayment.id,
      razorpaySignature: sign(session.razorpayOrderId, gatewayPayment.id),
      ...overrides
    }
  });

/** Full happy path: cart → session → gateway captures exact amount → verify. Returns everything. */
export async function completePrepaidPurchase(customer, product, qty = 1) {
  await addToCart(customer, product, qty);
  const session = await startSession(customer);
  const gp = gateway.simulatePayment({ orderId: session.razorpayOrderId, amount: session.amount });
  const res = await verifySession(customer, session, gp);
  if (res.status !== 200) throw new Error(`verify failed: ${res.status} ${res.text}`);
  const order = await Order.findById(res.body.data.order._id);
  const payment = await Payment.findOne({ gatewayOrderId: session.razorpayOrderId });
  return { session, gp, order, payment, res };
}

export async function sendWebhook(event, { signature, secret = WEBHOOK_SECRET, omitSignature = false } = {}) {
  const raw = JSON.stringify(event);
  const headers = {};
  if (!omitSignature) headers['x-razorpay-signature'] = signature ?? hmac(secret, raw);
  return call('POST', '/api/v1/payments/webhook', { rawBody: raw, headers });
}

export const capturedEvent = (entity) => ({ event: 'payment.captured', payload: { payment: { entity: { status: 'captured', ...entity } } } });
export const failedEvent = (entity) => ({ event: 'payment.failed', payload: { payment: { entity: { status: 'failed', ...entity } } } });
export const refundProcessedEvent = (entity) => ({ event: 'refund.processed', payload: { refund: { entity } } });
export const refundFailedEvent = (entity) => ({ event: 'refund.failed', payload: { refund: { entity } } });

/** Cross-collection invariant check used by refund tests */
export async function assertRefundLedger(paymentId) {
  const p = await Payment.findById(paymentId).lean();
  const processed = p.refunds.filter((r) => r.status === 'PROCESSED').reduce((s, r) => s + r.amount, 0);
  const pending = p.refunds.filter((r) => r.status === 'PENDING').reduce((s, r) => s + r.amount, 0);
  return {
    p,
    processed: Math.round(processed * 100) / 100,
    pending: Math.round(pending * 100) / 100,
    consistent:
      Math.abs((p.refundedAmount || 0) - processed) < 0.005 &&
      Math.abs((p.refundPendingAmount || 0) - pending) < 0.005 &&
      (p.refundedAmount || 0) + (p.refundPendingAmount || 0) <= p.amount + 0.005
  };
}
