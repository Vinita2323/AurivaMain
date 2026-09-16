import { Router } from 'express';
import fcmTokenController from '../controllers/fcmTokenController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All FCM token management routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/fcm-tokens AND POST /api/v1/fcm-tokens/save
 * @desc    Register / Save Web FCM Device Token
 * @access  Protected (User or Admin)
 */
router.post('/', (req, res, next) => fcmTokenController.saveToken(req, res, next));
router.post('/save', (req, res, next) => fcmTokenController.saveToken(req, res, next));

/**
 * @route   POST /api/v1/fcm-tokens/mobile/save
 * @desc    Register / Save Mobile FCM Device Token
 * @access  Protected (User or Admin)
 */
router.post('/mobile/save', (req, res, next) => fcmTokenController.saveMobileToken(req, res, next));

/**
 * @route   DELETE /api/v1/fcm-tokens AND DELETE /api/v1/fcm-tokens/remove
 * @desc    Remove / Revoke FCM Device Token
 * @access  Protected (User or Admin)
 */
router.delete('/', (req, res, next) => fcmTokenController.removeToken(req, res, next));
router.delete('/remove', (req, res, next) => fcmTokenController.removeToken(req, res, next));

/**
 * @route   POST /api/v1/fcm-tokens/test
 * @desc    Send test push notification to user's registered devices
 * @access  Protected (User or Admin)
 */
router.post('/test', (req, res, next) => fcmTokenController.sendTestNotification(req, res, next));

/**
 * @route   GET /api/v1/fcm-tokens AND GET /api/v1/fcm-tokens/status
 * @desc    Get FCM setup and registration status
 * @access  Protected (User or Admin)
 */
router.get('/', (req, res, next) => fcmTokenController.getStatus(req, res, next));
router.get('/status', (req, res, next) => fcmTokenController.getStatus(req, res, next));

export default router;
