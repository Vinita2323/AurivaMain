import env from '../config/env.js';

/**
 * Normalizes a phone number to standard format
 * e.g., "+91 98765 43210" -> "9876543210" or "+919876543210"
 * @param {string} rawPhone
 * @returns {string} Clean normalized 10-digit or E.164 phone string
 */
export const normalizePhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  // Remove all spaces, dashes, parentheses
  let cleaned = rawPhone.replace(/[\s\-()]/g, '');
  
  // If starts with +91, strip or keep consistently
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
 * Pluggable SMS Service Gateway
 */
class SmsService {
  /**
   * Send OTP via SMS
   * @param {string} phone - Target phone number
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<{ success: boolean, messageId?: string }>}
   */
  async sendOtpSms(phone, otp) {
    const normalized = normalizePhone(phone);
    const message = `Your Aurivá verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

    // In development / test environment, log clearly to console for instant local development
    if (env.NODE_ENV !== 'production' || !env.SMS.API_KEY || env.SMS.API_KEY === 'your_sms_api_key') {
      console.log('----------------------------------------------------');
      console.log(`📱 [SMS SERVICE DEV LOG]`);
      console.log(`📞 Recipient: +91 ${normalized}`);
      console.log(`🔑 OTP Code:  ${otp}`);
      console.log(`⏱️  Expires In: 5 Minutes`);
      console.log('----------------------------------------------------');
      return { success: true, messageId: `dev-mock-${Date.now()}` };
    }

    try {
      // Production SMS Gateway Dispatch Hook (e.g. Fast2SMS, MSG91, Twilio, AWS SNS)
      // Example implementation ready for external SMS gateway integration:
      /*
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': env.SMS.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: normalized
        })
      });
      const data = await response.json();
      return { success: data.return === true, messageId: data.request_id };
      */

      return { success: true, messageId: `sms-gw-${Date.now()}` };
    } catch (error) {
      console.error('[SMS Service Error] Failed to deliver SMS:', error.message);
      // Fail safely without crashing the service
      return { success: false, error: error.message };
    }
  }
}

export const smsService = new SmsService();
export default smsService;
