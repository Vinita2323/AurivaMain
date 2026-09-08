import { Router } from 'express';
import bestsellerController from '../controllers/bestsellerController.js';

const router = Router();

/**
 * @route   GET /api/v1/bestsellers
 * @desc    Get active Bestsellers for User App homepage
 * @access  Public
 */
router.get('/', bestsellerController.getPublicBestsellers);

export default router;
