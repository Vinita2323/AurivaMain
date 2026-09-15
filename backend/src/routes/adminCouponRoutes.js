import { Router } from 'express';
import couponController from '../controllers/couponController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import {
  validateCreateCoupon,
  validateUpdateCoupon
} from '../validations/couponValidation.js';

const router = Router();

// Protect all admin coupon routes with JWT & Admin Role
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/coupons
 * @desc    Fetch coupons with pagination, search, status filtering
 * @access  Protected (Admin Only)
 */
router.get('/', (req, res, next) =>
  couponController.getAllCouponsAdmin(req, res, next)
);

/**
 * @route   POST /api/v1/admin/coupons
 * @desc    Create new coupon rule
 * @access  Protected (Admin Only)
 */
router.post('/', validateCreateCoupon, (req, res, next) =>
  couponController.createCouponAdmin(req, res, next)
);

/**
 * @route   GET /api/v1/admin/coupons/:id
 * @desc    Get single coupon details
 * @access  Protected (Admin Only)
 */
router.get('/:id', (req, res, next) =>
  couponController.getCouponByIdAdmin(req, res, next)
);

/**
 * @route   PUT /api/v1/admin/coupons/:id
 * @desc    Update coupon rule
 * @access  Protected (Admin Only)
 */
router.put('/:id', validateUpdateCoupon, (req, res, next) =>
  couponController.updateCouponAdmin(req, res, next)
);

/**
 * @route   PATCH /api/v1/admin/coupons/:id
 * @desc    Partial update coupon rule (status toggle, etc.)
 * @access  Protected (Admin Only)
 */
router.patch('/:id', validateUpdateCoupon, (req, res, next) =>
  couponController.updateCouponAdmin(req, res, next)
);

/**
 * @route   DELETE /api/v1/admin/coupons/:id
 * @desc    Delete coupon rule
 * @access  Protected (Admin Only)
 */
router.delete('/:id', (req, res, next) =>
  couponController.deleteCouponAdmin(req, res, next)
);

export default router;
