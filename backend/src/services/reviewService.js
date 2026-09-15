import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { HTTP_STATUS } from '../constants/status.js';

class ReviewService {
  /**
   * Helper: Resolve product by ObjectId or slug
   */
  async resolveProduct(productIdOrSlug) {
    let product;
    if (mongoose.Types.ObjectId.isValid(productIdOrSlug)) {
      product = await Product.findById(productIdOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ slug: String(productIdOrSlug).toLowerCase().trim() });
    }
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }
    return product;
  }

  /**
   * Recalculate and persist Product.rating and Product.reviewsCount from APPROVED reviews
   * @param {mongoose.Types.ObjectId|string} productId
   * @returns {Promise<{ rating: number, reviewsCount: number }>}
   */
  async recalculateProductRating(productId) {
    const prodObjectId = new mongoose.Types.ObjectId(productId);

    const stats = await Review.aggregate([
      {
        $match: {
          product: prodObjectId,
          status: 'APPROVED'
        }
      },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          reviewsCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].avgRating * 10) / 10; // Round to 1 decimal place (e.g. 4.7)
      const count = stats[0].reviewsCount;

      await Product.findByIdAndUpdate(prodObjectId, {
        rating: avg,
        reviewsCount: count
      });

      return { rating: avg, reviewsCount: count };
    } else {
      // Zero approved reviews
      await Product.findByIdAndUpdate(prodObjectId, {
        rating: 0,
        reviewsCount: 0
      });

      return { rating: 0, reviewsCount: 0 };
    }
  }

  /**
   * Check customer's review eligibility for a given product
   * @param {string} userId
   * @param {string} productIdOrSlug
   */
  async checkReviewEligibility(userId, productIdOrSlug) {
    const product = await this.resolveProduct(productIdOrSlug);

    // 1. Check if customer has any DELIVERED order containing this product
    const deliveredOrder = await Order.findOne({
      user: userId,
      status: 'DELIVERED',
      'items.product': product._id
    }).sort({ createdAt: -1 });

    if (!deliveredOrder) {
      // Check if user has an undelivered order containing this product
      const activeOrder = await Order.findOne({
        user: userId,
        status: { $in: ['CONFIRMED', 'PACKED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
        'items.product': product._id
      });

      if (activeOrder) {
        return {
          canReview: false,
          reason: 'ORDER_NOT_DELIVERED',
          message: 'You can submit a review once your order has been delivered.',
          orderId: activeOrder._id,
          orderNumber: activeOrder.orderNumber
        };
      }

      return {
        canReview: false,
        reason: 'NOT_PURCHASED',
        message: 'Verified purchase required. You can only review products you have purchased and received.'
      };
    }

    // 2. Check if user has already reviewed this delivered order
    const existingReview = await Review.findOne({
      user: userId,
      product: product._id,
      order: deliveredOrder._id
    });

    if (existingReview) {
      return {
        canReview: false,
        reason: 'ALREADY_REVIEWED',
        message: 'You have already submitted a review for this purchase.',
        existingReview: existingReview.toJSON()
      };
    }

    return {
      canReview: true,
      reason: 'ELIGIBLE',
      message: 'You are eligible to review this product.',
      orderId: deliveredOrder._id,
      orderNumber: deliveredOrder.orderNumber
    };
  }

  /**
   * Submit a new customer review (stores as PENDING, verified purchase enforced)
   * @param {string} userId
   * @param {string} productIdOrSlug
   * @param {object} payload
   */
  async submitReview(userId, productIdOrSlug, payload) {
    const product = await this.resolveProduct(productIdOrSlug);

    // Check review eligibility
    const eligibility = await this.checkReviewEligibility(userId, product._id);
    if (!eligibility.canReview) {
      const err = new Error(eligibility.message);
      err.statusCode = eligibility.reason === 'NOT_PURCHASED' ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
      err.reason = eligibility.reason;
      throw err;
    }

    const rating = Math.min(5, Math.max(1, Math.round(Number(payload.rating) || 5)));
    const title = (payload.title || '').trim().slice(0, 120);
    const comment = (payload.comment || payload.content || '').trim().slice(0, 2000);

    const newReview = await Review.create({
      product: product._id,
      user: userId,
      order: eligibility.orderId,
      rating,
      title,
      comment,
      status: 'PENDING', // Always starts as PENDING awaiting admin moderation
      verifiedPurchase: true,
      featured: false,
      adminReply: null
    });

    // PENDING review does NOT update Product.rating yet!
    return newReview.toJSON();
  }

  /**
   * Public: Get approved reviews for a product with pagination, filtering & sorting
   * @param {string} productIdOrSlug
   * @param {object} query
   */
  async getPublicReviews(productIdOrSlug, query = {}) {
    const product = await this.resolveProduct(productIdOrSlug);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {
      product: product._id,
      status: 'APPROVED' // Public sees only APPROVED reviews
    };

    if (query.rating) {
      const r = parseInt(query.rating, 10);
      if (r >= 1 && r <= 5) filter.rating = r;
    }

    let sort = { createdAt: -1 }; // default newest
    if (query.sort === 'oldest') sort = { createdAt: 1 };
    else if (query.sort === 'rating_high') sort = { rating: -1, createdAt: -1 };
    else if (query.sort === 'rating_low') sort = { rating: 1, createdAt: -1 };

    const [reviews, totalCount] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name avatar') // Safe user fields only
        .lean(),
      Review.countDocuments(filter)
    ]);

    // Format reviews for consistent storefront consumption
    const formattedReviews = reviews.map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      author: r.user?.name || 'Verified Customer',
      avatar: r.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: r.rating,
      title: r.title,
      content: r.comment,
      comment: r.comment,
      date: new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: r.createdAt,
      verified: r.verifiedPurchase,
      verifiedPurchase: r.verifiedPurchase,
      featured: r.featured,
      adminReply: r.adminReply?.reply || null,
      adminReplyDetails: r.adminReply || null
    }));

    return {
      reviews: formattedReviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      stats: {
        averageRating: product.rating || 0,
        reviewsCount: product.reviewsCount || 0
      }
    };
  }

  /**
   * Admin: List all reviews with filtering, search, pagination, and KPI counts
   * @param {object} query
   */
  async getAdminReviews(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Status filter ('ALL', 'PENDING', 'APPROVED', 'REJECTED')
    if (query.status && query.status.toUpperCase() !== 'ALL') {
      filter.status = query.status.toUpperCase();
    }

    // Featured filter
    if (query.featured === 'true' || query.featured === true) {
      filter.featured = true;
    }

    // Rating filter
    if (query.rating) {
      const r = parseInt(query.rating, 10);
      if (r >= 1 && r <= 5) filter.rating = r;
    }

    // Product filter
    if (query.productId && mongoose.Types.ObjectId.isValid(query.productId)) {
      filter.product = new mongoose.Types.ObjectId(query.productId);
    }

    // Search filter
    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { comment: { $regex: q, $options: 'i' } }
      ];
    }

    const [reviews, totalCount, allReviewsSummary] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone avatar')
        .populate('product', 'name image slug price')
        .populate('order', 'orderNumber status')
        .lean(),
      Review.countDocuments(filter),
      // Aggregate stats across the entire collection for admin KPI cards
      Review.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
            approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
            rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
            featuredCount: { $sum: { $cond: ['$featured', 1, 0] } },
            avgRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    const summary = allReviewsSummary[0] || {
      total: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      featuredCount: 0,
      avgRating: 5.0
    };

    // Format reviews for AdminReviews.jsx
    const formatted = reviews.map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      author: r.user?.name || 'Customer',
      userEmail: r.user?.email || '',
      userPhone: r.user?.phone || '',
      avatar: r.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      product: r.product?.name || 'AURIVÁ Product',
      productId: r.product?._id?.toString() || '',
      productImage: r.product?.image || '',
      orderId: r.order?._id?.toString() || '',
      orderNumber: r.order?.orderNumber || '',
      rating: r.rating,
      title: r.title,
      content: r.comment,
      comment: r.comment,
      status: r.status === 'APPROVED' ? 'Approved' : r.status === 'PENDING' ? 'Pending' : 'Rejected',
      rawStatus: r.status,
      verified: r.verifiedPurchase,
      verifiedPurchase: r.verifiedPurchase,
      featured: r.featured,
      adminReply: r.adminReply?.reply || null,
      date: new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      createdAt: r.createdAt
    }));

    return {
      reviews: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      stats: {
        total: summary.total,
        pendingCount: summary.pendingCount,
        approvedCount: summary.approvedCount,
        rejectedCount: summary.rejectedCount,
        featuredCount: summary.featuredCount,
        avgRating: summary.avgRating ? Math.round(summary.avgRating * 10) / 10 : 5.0
      }
    };
  }

  /**
   * Admin: Approve or Reject a review with dynamic rating recalculation
   * @param {string} reviewId
   * @param {string} newStatus - 'APPROVED' | 'REJECTED'
   * @param {string} adminId
   */
  async updateReviewStatus(reviewId, newStatus, adminId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const normalizedStatus = String(newStatus).toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(normalizedStatus)) {
      const err = new Error('Invalid review status. Must be APPROVED or REJECTED.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const previousStatus = review.status;
    review.status = normalizedStatus;

    // If rejected, ensure it cannot remain featured
    if (normalizedStatus === 'REJECTED') {
      review.featured = false;
    }

    await review.save();

    // Recalculate rating if status changed to or from APPROVED
    let ratingStats = null;
    if (previousStatus === 'APPROVED' || normalizedStatus === 'APPROVED') {
      ratingStats = await this.recalculateProductRating(review.product);
    }

    return {
      review: review.toJSON(),
      recalculatedRating: ratingStats
    };
  }

  /**
   * Admin: Feature or unfeature an approved review
   * @param {string} reviewId
   * @param {boolean} isFeatured
   */
  async toggleReviewFeatured(reviewId, isFeatured) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    if (isFeatured && review.status !== 'APPROVED') {
      const err = new Error('Only approved reviews can be marked as featured.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    review.featured = Boolean(isFeatured);
    await review.save();

    return review.toJSON();
  }

  /**
   * Admin: Store official store response to a review
   * @param {string} reviewId
   * @param {string} replyText
   * @param {string} adminId
   */
  async replyToReview(reviewId, replyText, adminId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    review.adminReply = {
      reply: String(replyText).trim(),
      repliedAt: new Date(),
      repliedBy: adminId || null
    };

    await review.save();
    return review.toJSON();
  }

  /**
   * Admin: Delete review and recalculate rating
   * @param {string} reviewId
   */
  async deleteReview(reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const wasApproved = review.status === 'APPROVED';
    const productId = review.product;

    await Review.deleteOne({ _id: reviewId });

    if (wasApproved) {
      await this.recalculateProductRating(productId);
    }

    return { message: 'Review deleted successfully' };
  }
}

export const reviewService = new ReviewService();
export default reviewService;
