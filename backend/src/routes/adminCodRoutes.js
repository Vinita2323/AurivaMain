import { Router } from 'express';
import * as adminCodController from '../controllers/adminCodController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// Admin only. Customers can never reach (or change) COD permission.
router.use(authMiddleware, requireAdmin);

router.get('/', adminCodController.listCodCustomers);
router.get('/:id', adminCodController.getCodCustomer);
router.patch('/:id', adminCodController.updateCodPermission);

export default router;
