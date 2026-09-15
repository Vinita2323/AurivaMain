import reviewService from '../services/reviewService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Customer: Submit a new review for a purchased and delivered product
 * POST /api/v1/products/:id/reviews
 */
export const submitReview = async (req, res, next) => {
  try {
    const review = await reviewService.submitReview(req.user._id, req.params.id, req.body);
    return sendSuccess(
      res,
      'Review submitted successfully! It is currently pending admin moderation.',
      { review },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Public: Get approved reviews for a product
 * GET /api/v1/products/:id/reviews
 */
export const getPublicReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getPublicReviews(req.params.id, req.query);
    return sendSuccess(res, 'Product reviews retrieved successfully', data, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Customer: Check review eligibility for a product
 * GET /api/v1/products/:id/reviews/eligibility
 */
export const checkReviewEligibility = async (req, res, next) => {
  try {
    const eligibility = await reviewService.checkReviewEligibility(req.user._id, req.params.id);
    return sendSuccess(res, eligibility.message, eligibility, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: List reviews with filtering, search, pagination, and KPI counts
 * GET /api/v1/admin/reviews
 */
export const getAdminReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getAdminReviews(req.query);
    return sendSuccess(res, 'Admin reviews retrieved successfully', data, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Approve or reject a review
 * PATCH /api/v1/admin/reviews/:id/status
 */
export const updateReviewStatus = async (req, res, next) => {
  try {
    const result = await reviewService.updateReviewStatus(req.params.id, req.body.status, req.user._id);
    return sendSuccess(
      res,
      `Review status successfully updated to ${req.body.status}`,
      result,
      HTTP_STATUS.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Feature or unfeature an approved review
 * PATCH /api/v1/admin/reviews/:id/featured
 */
export const toggleReviewFeatured = async (req, res, next) => {
  try {
    const review = await reviewService.toggleReviewFeatured(req.params.id, req.body.featured);
    return sendSuccess(
      res,
      `Review successfully ${req.body.featured ? 'marked as featured' : 'unfeatured'}`,
      { review },
      HTTP_STATUS.OK
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Post official team reply to a review
 * POST /api/v1/admin/reviews/:id/reply
 */
export const replyToReview = async (req, res, next) => {
  try {
    const review = await reviewService.replyToReview(req.params.id, req.body.reply, req.user._id);
    return sendSuccess(res, 'Official response published successfully', { review }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Delete a review
 * DELETE /api/v1/admin/reviews/:id
 */
export const deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(req.params.id);
    return sendSuccess(res, result.message, null, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export default {
  submitReview,
  getPublicReviews,
  checkReviewEligibility,
  getAdminReviews,
  updateReviewStatus,
  toggleReviewFeatured,
  replyToReview,
  deleteReview
};
