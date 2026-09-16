import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import invoiceController from '../controllers/invoiceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';
import { validatePlaceOrder, validateOrderId, validateCancelOrder } from '../validations/orderValidation.js';

const router = Router();

// Protect all order routes with JWT auth
router.use(authMiddleware);

// POST /api/orders - Place a new order
router.post('/', requireUser, validatePlaceOrder, orderController.placeOrder);

// GET /api/orders - Get orders of the logged-in user
router.get('/', requireUser, orderController.getUserOrders);

// GET /api/orders/:id - Get single order by ID or orderNumber
router.get('/:id', validateOrderId, orderController.getOrderById);

// GET /api/orders/:id/invoice - Download customer invoice PDF
router.get('/:id/invoice', requireUser, validateOrderId, invoiceController.getOrderInvoice);

// POST /api/orders/:id/cancel - Cancel customer order
router.post('/:id/cancel', requireUser, validateOrderId, validateCancelOrder, orderController.cancelOrderCustomer);

export default router;

