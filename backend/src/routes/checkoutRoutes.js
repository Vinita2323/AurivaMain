import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';

const router = Router();

// Protect checkout summary endpoint
router.use(authMiddleware, requireUser);

// GET /api/checkout/summary
router.get('/summary', orderController.getCheckoutSummary);

export default router;
