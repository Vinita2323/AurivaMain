import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import {
  validateOrderId,
  validateUpdateOrderStatus,
  validateDispatchOrder,
  validateCancelOrder
} from '../validations/orderValidation.js';

const router = Router();

// All Admin Order routes require JWT Authentication & Admin Role
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/orders
 * @desc    Fetch all orders with pagination, search, status & date filtering
 * @access  Protected (Admin Only)
 */
router.get('/', orderController.getAllOrdersAdmin);

/**
 * @route   GET /api/v1/admin/orders/:id
 * @desc    Get complete order details by MongoDB ID or orderNumber
 * @access  Protected (Admin Only)
 */
router.get('/:id', validateOrderId, orderController.getOrderById);

/**
 * @route   PATCH /api/v1/admin/orders/:id/status
 * @desc    Update order fulfillment status with lifecycle validation
 * @access  Protected (Admin Only)
 */
router.patch('/:id/status', validateOrderId, validateUpdateOrderStatus, orderController.updateOrderStatus);

/**
 * @route   PATCH /api/v1/admin/orders/:id/dispatch
 * @desc    Assign courier, AWB, rider tracking, and dispatch notes
 * @access  Protected (Admin Only)
 */
router.patch('/:id/dispatch', validateOrderId, validateDispatchOrder, orderController.dispatchOrder);

/**
 * @route   PATCH /api/v1/admin/orders/:id/cancel
 * @desc    Admin order cancellation with atomic stock restoration
 * @access  Protected (Admin Only)
 */
router.patch('/:id/cancel', validateOrderId, validateCancelOrder, orderController.cancelOrderAdmin);

export default router;
