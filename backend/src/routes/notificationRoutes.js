import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';

const router = Router();

// All customer notification routes require Authentication and USER Role
router.use(authMiddleware, requireUser);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get paginated notifications for authenticated user
 * @access  Protected (User Only)
 */
router.get('/', notificationController.getUserNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count for user
 * @access  Protected (User Only)
 */
router.get('/unread-count', notificationController.getUserUnreadCount);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @route   POST /api/v1/notifications/read-all
 * @desc    Mark all unread notifications as read
 * @access  Protected (User Only)
 */
router.patch('/read-all', notificationController.markUserAllAsRead);
router.post('/read-all', notificationController.markUserAllAsRead);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Protected (User Only)
 */
router.patch('/:id/read', notificationController.markUserAsRead);
router.put('/:id/read', notificationController.markUserAsRead);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Protected (User Only)
 */
router.delete('/:id', notificationController.deleteUserNotification);

export default router;
