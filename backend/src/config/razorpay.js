import crypto from 'crypto';
import Razorpay from 'razorpay';
import env from './env.js';

let razorpayInstance = null;

/**
 * Get or lazily initialize Razorpay client instance.
 * Returns null if credentials are not configured.
 */
export const getRazorpayInstance = () => {
  if (!env.RAZORPAY.IS_CONFIGURED) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY.KEY_ID,
      key_secret: env.RAZORPAY.KEY_SECRET
    });
  }

  return razorpayInstance;
};

/**
 * Check whether Razorpay credentials are fully configured.
 */
export const isRazorpayConfigured = () => {
  return env.RAZORPAY.IS_CONFIGURED;
};

/**
 * Get public Razorpay Key ID for client checkout.
 * Secrets are never exposed.
 */
export const getPublicRazorpayKey = () => {
  return env.RAZORPAY.IS_CONFIGURED ? env.RAZORPAY.KEY_ID : null;
};

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 *
 * @param {Object} params
 * @param {string} params.orderId - Razorpay order ID (e.g. order_xxx)
 * @param {string} params.paymentId - Razorpay payment ID (e.g. pay_xxx)
 * @param {string} params.signature - Signature received from client
 * @param {string} [params.secret] - Optional override key secret (defaults to env.RAZORPAY.KEY_SECRET)
 * @returns {boolean}
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature, secret = null }) => {
  const activeSecret = secret || env.RAZORPAY.KEY_SECRET;
  if (!activeSecret || !orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    return false;
  }
};

/**
 * Verify Razorpay Webhook signature using HMAC SHA256.
 *
 * @param {Object} params
 * @param {Buffer|string} params.rawBody - Raw unparsed request body buffer or string
 * @param {string} params.signature - x-razorpay-signature header
 * @param {string} [params.webhookSecret] - Optional override webhook secret
 * @returns {boolean}
 */
export const verifyWebhookSignature = ({ rawBody, signature, webhookSecret = null }) => {
  const activeSecret = webhookSecret || env.RAZORPAY.WEBHOOK_SECRET;
  if (!activeSecret || !rawBody || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    return false;
  }
};
