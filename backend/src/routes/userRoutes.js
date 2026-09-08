import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';
import { validateUpdateProfile } from '../validations/userValidation.js';

const router = Router();

// All user routes require authentication and USER role
router.use(authMiddleware, requireUser);

// Profile endpoints
router.get('/profile', userController.getProfile);
router.put('/profile', validateUpdateProfile, userController.updateProfile);
router.patch('/profile', validateUpdateProfile, userController.updateProfile);

// Account deletion endpoint
router.delete('/account', userController.deleteAccount);

export default router;
