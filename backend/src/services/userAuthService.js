import User from '../models/User.js';
import otpService from './otpService.js';
import smsService, { normalizePhone } from './smsService.js';
import { generateToken } from '../utils/generateToken.js';
import { ROLES } from '../constants/roles.js';
import { ACCOUNT_STATUS, HTTP_STATUS } from '../constants/status.js';

class UserAuthService {
  /**
   * Send OTP to a user's mobile number
   * @param {string} rawPhone
   * @returns {Promise<{ message: string, phone: string, isNewUser: boolean, retryAfterSeconds: number }>}
   */
  async requestOtp(rawPhone) {
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.length < 10) {
      const err = new Error('Please provide a valid 10-digit mobile number.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Check if user is registered and whether they are active
    const existingUser = await User.findOne({ phone });

    if (existingUser && existingUser.status === ACCOUNT_STATUS.BLOCKED) {
      const err = new Error('Your account is blocked. Please contact support.');
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    // Generate, hash, and store OTP with cooldown & TTL
    const { otp, retryAfterSeconds } = await otpService.generateAndSaveOtp(phone);

    // Send OTP via SMS gateway (or dev console)
    await smsService.sendOtpSms(phone, otp);

    return {
      message: 'OTP sent successfully to your mobile number.',
      phone,
      isNewUser: !existingUser,
      retryAfterSeconds
    };
  }

  /**
   * Verify OTP and complete user registration or login
   * @param {string} rawPhone
   * @param {string} otp
   * @returns {Promise<{ token: string, user: object, isNewUser: boolean }>}
   */
  async verifyOtpAndLogin(rawPhone, otp) {
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.length < 10) {
      const err = new Error('Please provide a valid 10-digit mobile number.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (!otp || String(otp).trim().length !== 6) {
      const err = new Error('Please provide a valid 6-digit OTP code.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Verify OTP securely
    const verifyResult = await otpService.verifyOtp(phone, otp);

    if (!verifyResult.success) {
      const err = new Error(verifyResult.message || 'Invalid or expired OTP.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      err.reason = verifyResult.reason;
      err.remainingAttempts = verifyResult.remainingAttempts;
      throw err;
    }

    // OTP is valid - Check if user exists or create new user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      // Auto-register new user with verified status
      user = await User.create({
        phone,
        name: '',
        role: ROLES.USER,
        status: ACCOUNT_STATUS.ACTIVE,
        isVerified: true,
        lastLoginAt: new Date()
      });
      isNewUser = true;
    } else {
      if (user.status === ACCOUNT_STATUS.BLOCKED) {
        const err = new Error('Your account is blocked. Please contact customer support.');
        err.statusCode = HTTP_STATUS.FORBIDDEN;
        throw err;
      }

      user.lastLoginAt = new Date();
      user.isVerified = true;
      await user.save();
    }

    // Issue JWT with USER role
    const token = generateToken({
      id: user._id.toString(),
      role: ROLES.USER,
      phone: user.phone
    });

    return {
      token,
      user: user.toJSON(),
      isNewUser
    };
  }

  /**
   * Get user profile by ID
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User account not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }
    return user.toJSON();
  }

  /**
   * Update user profile information
   * @param {string} userId
   * @param {object} updateData
   * @returns {Promise<object>}
   */
  async updateUserProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User account not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const allowedFields = ['name', 'email', 'avatar', 'addresses'];

    // Check if email already taken by another user
    if (updateData.email && updateData.email.trim() !== '') {
      const normalizedEmail = updateData.email.trim().toLowerCase();
      const existingWithEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId }
      });
      if (existingWithEmail) {
        const err = new Error('This email address is already in use by another account.');
        err.statusCode = HTTP_STATUS.CONFLICT;
        throw err;
      }
      user.email = normalizedEmail;
    }

    if (updateData.name !== undefined) {
      user.name = updateData.name.trim();
    }

    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
    }

    if (Array.isArray(updateData.addresses)) {
      user.addresses = updateData.addresses;
    }

    await user.save();
    return user.toJSON();
  }

  /**
   * Seed default client demo users if not present in database
   */
  async ensureDefaultDemoUsers() {
    try {
      const demoPhone = '9876543210';
      const existing = await User.findOne({ phone: demoPhone });

      if (!existing) {
        await User.create({
          name: 'Vini Sharma',
          phone: demoPhone,
          email: 'vini.sharma@gmail.com',
          role: ROLES.USER,
          status: ACCOUNT_STATUS.ACTIVE,
          isVerified: true,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          addresses: [
            {
              street: '32, Green Park, A-Block, Near Lotus Lake',
              city: 'Indore',
              state: 'Madhya Pradesh',
              postalCode: '452001',
              country: 'India',
              isDefault: true
            }
          ],
          lastLoginAt: new Date()
        });

        console.log(`[User Seeding] Seeded default Demo User: +91 ${demoPhone} (Vini Sharma)`);
      }
    } catch (error) {
      console.error('[User Seeding Error] Could not seed default demo user:', error.message);
    }
  }
}

export const userAuthService = new UserAuthService();
export default userAuthService;
