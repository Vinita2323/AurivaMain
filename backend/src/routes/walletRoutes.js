import { Router } from 'express';
import * as walletController from '../controllers/walletController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';

const router = Router();

// Customer: own wallet only
router.use(authMiddleware, requireUser);
router.get('/', walletController.getMyWallet);

export default router;
