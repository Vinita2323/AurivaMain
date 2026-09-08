import { Router } from 'express';
import userAuthController from '../controllers/userAuthController.js';
import { validateSendOtp, validateVerifyOtp, validateUpdateProfile } from '../validations/userAuthValidation.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/user/send-otp
 * @desc    Send 6-digit OTP to user mobile number
 * @access  Public (Rate-limited)
 */
router.post('/send-otp', otpRequestLimiter, validateSendOtp, userAuthController.sendOtp);

/**
 * @route   POST /api/v1/auth/user/verify-otp
 * @desc    Verify OTP and log in / register user
 * @access  Public (Rate-limited)
 */
router.post('/verify-otp', otpVerifyLimiter, validateVerifyOtp, userAuthController.verifyOtp);

/**
 * @route   GET /api/v1/auth/user/profile
 * @desc    Get current user profile
 * @access  Protected (User Only)
 */
router.get('/profile', authMiddleware, requireUser, userAuthController.getProfile);

/**
 * @route   PATCH /api/v1/auth/user/profile
 * @desc    Update current user profile (name, email, address)
 * @access  Protected (User Only)
 */
router.patch('/profile', authMiddleware, requireUser, validateUpdateProfile, userAuthController.updateProfile);

export default router;
