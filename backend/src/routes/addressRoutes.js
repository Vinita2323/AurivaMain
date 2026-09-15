import { Router } from 'express';
import * as addressController from '../controllers/addressController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';
import {
  validateCreateAddress,
  validateUpdateAddress,
  validateAddressId
} from '../validations/addressValidation.js';

const router = Router();

// Protect all address routes: must be authenticated user
router.use(authMiddleware, requireUser);

// GET /api/user/addresses
router.get('/', addressController.getAddresses);

// POST /api/user/addresses
router.post('/', validateCreateAddress, addressController.createAddress);

// PUT /api/user/addresses/:id
router.put('/:id', validateUpdateAddress, addressController.updateAddress);

// DELETE /api/user/addresses/:id
router.delete('/:id', validateAddressId, addressController.deleteAddress);

// PATCH /api/user/addresses/:id/default
router.patch('/:id/default', validateAddressId, addressController.setDefaultAddress);

export default router;
