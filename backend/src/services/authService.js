import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { ROLES } from '../constants/roles.js';
import { ACCOUNT_STATUS, HTTP_STATUS } from '../constants/status.js';
import { generateToken } from '../utils/generateToken.js';
import otpService from './otpService.js';

class AuthService {
  /**
   * Register a new user
   * @param {object} userData - { name, email, password, phone }
   */
  async registerUser({ name, email, password, phone }) {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: ROLES.USER,
      status: ACCOUNT_STATUS.ACTIVE,
      isVerified: false
    });

    await user.save();

    // Generate and send verification OTP
    const otpCode = await otpService.generateAndAssignOtp(user);

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email
    });

    return {
      user: user.toJSON(),
      token,
      verificationRequired: true,
      // For development ease, include otp in response if dev mode
      devOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    };
  }

  /**
   * Authenticate user with email and password
   * @param {object} credentials - { email, password }
   */
  async loginUser({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    if (user.status === ACCOUNT_STATUS.BLOCKED) {
      const error = new Error('Your account has been blocked. Please contact support.');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    if (user.status === ACCOUNT_STATUS.INACTIVE) {
      const error = new Error('Your account is currently inactive.');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email
    });

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Verify User OTP (for account activation or phone verification)
   * @param {object} payload - { email, otp }
   */
  async verifyOtp({ email, otp }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const error = new Error('User account not found.');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const isValid = otpService.verifyOtp(user, otp);
    if (!isValid) {
      const error = new Error('Invalid or expired OTP code.');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    user.isVerified = true;
    await otpService.clearOtp(user);

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email
    });

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Resend OTP to user
   * @param {string} email
   */
  async resendOtp(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const error = new Error('User account not found.');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const otpCode = await otpService.generateAndAssignOtp(user);

    return {
      message: 'New OTP has been sent successfully.',
      devOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    };
  }

  /**
   * Initiate Forgot Password by sending OTP
   * @param {string} email
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // For security, don't leak whether the email exists
      return {
        message: 'If an account with that email exists, an OTP has been sent.'
      };
    }

    const otpCode = await otpService.generateAndAssignOtp(user);

    return {
      message: 'If an account with that email exists, an OTP has been sent.',
      devOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    };
  }

  /**
   * Reset Password with OTP verification
   * @param {object} payload - { email, otp, newPassword }
   */
  async resetPassword({ email, otp, newPassword }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const error = new Error('Invalid request.');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const isValid = otpService.verifyOtp(user, otp);
    if (!isValid) {
      const error = new Error('Invalid or expired OTP code.');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    user.password = newPassword;
    await otpService.clearOtp(user);

    return {
      message: 'Password reset successfully. You may now log in with your new password.'
    };
  }

  /**
   * Authenticate Admin
   * @param {object} credentials - { email, password }
   */
  async loginAdmin({ email, password }) {
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!admin) {
      const error = new Error('Invalid admin credentials.');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid admin credentials.');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw error;
    }

    if (admin.status === ACCOUNT_STATUS.BLOCKED) {
      const error = new Error('Admin account is blocked.');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken({
      id: admin._id,
      role: admin.role,
      email: admin.email
    });

    return {
      admin: admin.toJSON(),
      token
    };
  }
}

export const authService = new AuthService();
export default authService;
