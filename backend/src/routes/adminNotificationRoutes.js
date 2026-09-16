import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// All admin notification routes require Authentication and ADMIN Role
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/notifications
 * @desc    Get paginated admin notifications
 * @access  Protected (Admin Only)
 */
router.get('/', notificationController.getAdminNotifications);

/**
 * @route   GET /api/v1/admin/notifications/unread-count
 * @desc    Get admin unread notification count
 * @access  Protected (Admin Only)
 */
router.get('/unread-count', notificationController.getAdminUnreadCount);

/**
 * @route   PATCH /api/v1/admin/notifications/read-all
 * @route   POST /api/v1/admin/notifications/read-all
 * @desc    Mark all admin unread notifications as read
 * @access  Protected (Admin Only)
 */
router.patch('/read-all', notificationController.markAdminAllAsRead);
router.post('/read-all', notificationController.markAdminAllAsRead);

/**
 * @route   PATCH /api/v1/admin/notifications/:id/read
 * @route   PUT /api/v1/admin/notifications/:id/read
 * @desc    Mark a single admin notification as read
 * @access  Protected (Admin Only)
 */
router.patch('/:id/read', notificationController.markAdminAsRead);
router.put('/:id/read', notificationController.markAdminAsRead);

/**
 * @route   DELETE /api/v1/admin/notifications/:id
 * @desc    Delete an admin notification
 * @access  Protected (Admin Only)
 */
router.delete('/:id', notificationController.deleteAdminNotification);

export default router;
