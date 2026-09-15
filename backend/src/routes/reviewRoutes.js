import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireUser } from '../middleware/roleMiddleware.js';
import { validateSubmitReview } from '../validations/reviewValidation.js';

// Enable mergeParams to access :id from parent router (/api/v1/products/:id/reviews)
const router = Router({ mergeParams: true });

/**
 * @route   GET /api/v1/products/:id/reviews
 * @desc    Get all approved reviews for a product
 * @access  Public
 */
router.get('/', reviewController.getPublicReviews);

/**
 * @route   GET /api/v1/products/:id/reviews/eligibility
 * @desc    Check customer's review eligibility for this product
 * @access  Private (Customer)
 */
router.get('/eligibility', authMiddleware, requireUser, reviewController.checkReviewEligibility);

/**
 * @route   POST /api/v1/products/:id/reviews
 * @desc    Submit a review for a purchased & delivered product
 * @access  Private (Customer)
 */
router.post('/', authMiddleware, requireUser, validateSubmitReview, reviewController.submitReview);

export default router;
