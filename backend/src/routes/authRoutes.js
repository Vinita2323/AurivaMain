import { Router } from 'express';
import userAuthRoutes from './userAuthRoutes.js';
import adminAuthRoutes from './adminAuthRoutes.js';
import userAuthController from '../controllers/userAuthController.js';
import adminAuthController from '../controllers/adminAuthController.js';
import { validateSendOtp, validateVerifyOtp } from '../validations/userAuthValidation.js';
import { validateAdminLogin } from '../validations/adminAuthValidation.js';
import { otpRequestLimiter, otpVerifyLimiter, adminLoginLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// 1. Mount decoupled sub-routers
router.use('/user', userAuthRoutes);
router.use('/admin', adminAuthRoutes);

// 2. Direct Root-Level Aliases for convenience & backward compatibility
router.post('/send-otp', otpRequestLimiter, validateSendOtp, userAuthController.sendOtp);
router.post('/verify-otp', otpVerifyLimiter, validateVerifyOtp, userAuthController.verifyOtp);
router.post('/login', adminLoginLimiter, validateAdminLogin, adminAuthController.login);

/**
 * Universal Me / Session verification endpoint
 * GET /api/v1/auth/me
 */
router.get('/me', authMiddleware, (req, res) => {
  return sendSuccess(res, 'Session is valid', {
    account: req.user.toJSON ? req.user.toJSON() : req.user
  });
});

export default router;
