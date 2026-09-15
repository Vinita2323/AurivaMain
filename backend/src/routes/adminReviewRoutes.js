import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import {
  validateReviewStatus,
  validateReviewFeatured,
  validateReviewReply
} from '../validations/reviewValidation.js';

const router = Router();

// Protect all admin review routes with Admin authentication
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/reviews
 * @desc    List all reviews with filtering, search, pagination, and KPI counts
 * @access  Private (Admin)
 */
router.get('/', reviewController.getAdminReviews);

/**
 * @route   PATCH /api/v1/admin/reviews/:id/status
 * @desc    Approve or reject a review (triggers dynamic product rating recalculation)
 * @access  Private (Admin)
 */
router.patch('/:id/status', validateReviewStatus, reviewController.updateReviewStatus);

/**
 * @route   PATCH /api/v1/admin/reviews/:id/featured
 * @desc    Feature or unfeature an approved review
 * @access  Private (Admin)
 */
router.patch('/:id/featured', validateReviewFeatured, reviewController.toggleReviewFeatured);

/**
 * @route   POST /api/v1/admin/reviews/:id/reply
 * @desc    Post official admin reply to a customer review
 * @access  Private (Admin)
 */
router.post('/:id/reply', validateReviewReply, reviewController.replyToReview);

/**
 * @route   DELETE /api/v1/admin/reviews/:id
 * @desc    Delete a review (triggers dynamic product rating recalculation)
 * @access  Private (Admin)
 */
router.delete('/:id', reviewController.deleteReview);

export default router;
