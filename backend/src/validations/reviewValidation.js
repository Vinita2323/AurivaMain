import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Validate customer review submission payload
 */
export const validateSubmitReview = (req, res, next) => {
  const { rating, title, comment, content } = req.body;
  const errors = [];

  // Rating validation (1-5)
  if (rating === undefined || rating === null) {
    errors.push({ field: 'rating', message: 'Rating is required' });
  } else {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      errors.push({ field: 'rating', message: 'Rating must be an integer between 1 and 5' });
    }
  }

  // Comment / Content validation
  const actualComment = (comment || content || '').trim();
  if (!actualComment) {
    errors.push({ field: 'comment', message: 'Review comment is required' });
  } else if (actualComment.length < 3) {
    errors.push({ field: 'comment', message: 'Review comment must be at least 3 characters' });
  } else if (actualComment.length > 2000) {
    errors.push({ field: 'comment', message: 'Review comment cannot exceed 2000 characters' });
  }

  // Title validation
  if (title !== undefined && typeof title === 'string' && title.trim().length > 120) {
    errors.push({ field: 'title', message: 'Review title cannot exceed 120 characters' });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for review submission',
      { errors },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

/**
 * Validate admin review status update
 */
export const validateReviewStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['APPROVED', 'REJECTED'];

  if (!status || !validStatuses.includes(String(status).toUpperCase())) {
    return sendError(
      res,
      'Invalid status. Allowed values: APPROVED, REJECTED',
      { allowedStatuses: validStatuses },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

/**
 * Validate admin review reply
 */
export const validateReviewReply = (req, res, next) => {
  const { reply } = req.body;
  if (!reply || typeof reply !== 'string' || !reply.trim()) {
    return sendError(
      res,
      'Reply message is required',
      { field: 'reply' },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  if (reply.trim().length > 1000) {
    return sendError(
      res,
      'Reply message cannot exceed 1000 characters',
      { field: 'reply' },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

/**
 * Validate admin featured toggle
 */
export const validateReviewFeatured = (req, res, next) => {
  const { featured } = req.body;
  if (featured === undefined || typeof featured !== 'boolean') {
    return sendError(
      res,
      'Featured must be a boolean (true or false)',
      { field: 'featured' },
      HTTP_STATUS.UNPROCESSABLE_ENTITY
    );
  }

  next();
};

export default {
  validateSubmitReview,
  validateReviewStatus,
  validateReviewReply,
  validateReviewFeatured
};
