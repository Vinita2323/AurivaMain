import { Router } from 'express';
import * as walletController from '../controllers/walletController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware, requireAdmin);
router.get('/:userId', walletController.getCustomerWallet);
router.post('/:userId/adjust', walletController.adjustCustomerWallet);

export default router;
