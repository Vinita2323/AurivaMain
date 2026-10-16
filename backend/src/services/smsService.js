import env from '../config/env.js';

/**
 * Normalizes a phone number to standard 10-digit Indian mobile format
 * e.g., "+91 98765 43210" -> "9876543210"
 * @param {string} rawPhone
 * @returns {string}
 */
export const normalizePhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let cleaned = rawPhone.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
};

/**
 * Formats a phone number with country code for display or SMS gateway
 * @param {string} phone
 * @returns {string} e.g. "+919876543210"
 */
export const formatE164 = (phone) => {
  const normalized = normalizePhone(phone);
  return `+91${normalized}`;
};

/**
 * True when a real SMS gateway API key is configured (not placeholder).
 */
export const isSmsConfigured = () => {
  const key = String(env.SMS.API_KEY || '').trim();
  if (!key) return false;
  const lowered = key.toLowerCase();
  return lowered !== 'your_sms_api_key' && lowered !== 'none' && lowered !== 'placeholder';
};

/**
 * Demo / console OTP mode:
 * - OTP_DEMO_MODE=true|false overrides
 * - otherwise auto-on when SMS gateway is not configured
 */
export const isOtpDemoMode = () => {
  const explicit = String(process.env.OTP_DEMO_MODE || '').trim().toLowerCase();
  if (explicit === 'true' || explicit === '1' || explicit === 'yes') return true;
  if (explicit === 'false' || explicit === '0' || explicit === 'no') return false;
  return !isSmsConfigured();
};

/**
 * Pluggable SMS Service Gateway (Fast2SMS by default)
 */
class SmsService {
  /**
   * Send OTP via SMS
   * @param {string} phone - Target phone number
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<{ success: boolean, messageId?: string, demoMode?: boolean, error?: string }>}
   */
  async sendOtpSms(phone, otp) {
    const normalized = normalizePhone(phone);
    const demoMode = isOtpDemoMode();

    // Demo / local: never claim a real SMS was delivered
    if (demoMode || !isSmsConfigured()) {
      console.log('----------------------------------------------------');
      console.log(`📱 [SMS DEMO / CONSOLE MODE]`);
      console.log(`📞 Recipient: +91 ${normalized}`);
      console.log(`🔑 OTP Code:  ${otp}`);
      console.log(`⏱️  Expires In: 5 Minutes`);
      console.log(`ℹ️  SMS gateway not active — use the OTP above (or 123456 in demo mode).`);
      console.log('----------------------------------------------------');
      return { success: true, messageId: `demo-${Date.now()}`, demoMode: true };
    }

    try {
      const provider = String(env.SMS.PROVIDER || 'fast2sms').toLowerCase();
      if (provider === 'fast2sms') {
        return await this.#sendViaFast2Sms(normalized, otp);
      }

      console.error(`[SMS Service] Unsupported SMS_PROVIDER="${provider}"`);
      return { success: false, error: `Unsupported SMS provider: ${provider}` };
    } catch (error) {
      console.error('[SMS Service Error] Failed to deliver SMS:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fast2SMS OTP / DLT dispatch
   * @param {string} numbers - 10-digit phone
   * @param {string} otp
   */
  async #sendViaFast2Sms(numbers, otp) {
    const body = env.SMS.TEMPLATE_ID
      ? {
          route: 'dlt',
          sender_id: env.SMS.SENDER_ID || 'AURIVA',
          message: env.SMS.TEMPLATE_ID,
          variables_values: otp,
          flash: 0,
          numbers
        }
      : {
          route: 'otp',
          variables_values: otp,
          numbers
        };

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: env.SMS.API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));
    const ok = response.ok && (data.return === true || data.success === true);

    if (!ok) {
      const detail = data.message || data.msg || JSON.stringify(data) || `HTTP ${response.status}`;
      console.error('[SMS Fast2SMS] Dispatch failed:', detail);
      return { success: false, error: String(detail) };
    }

    return {
      success: true,
      messageId: String(data.request_id || data.message_id || `f2s-${Date.now()}`),
      demoMode: false
    };
  }
}

export const smsService = new SmsService();
export default smsService;
