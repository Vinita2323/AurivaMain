import { Router } from 'express';
import couponController from '../controllers/couponController.js';
import { validateValidateCoupon } from '../validations/couponValidation.js';

const router = Router();

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate coupon code against order subtotal and calculate discount
 * @access  Public / Customer
 */
router.post('/validate', validateValidateCoupon, (req, res, next) =>
  couponController.validateCoupon(req, res, next)
);

/**
 * @route   GET /api/v1/coupons
 * @desc    Get active, valid coupons for customer display
 * @access  Public / Customer
 */
router.get('/', (req, res, next) =>
  couponController.getActiveCoupons(req, res, next)
);

// Fallback for root POST
router.post('/', validateValidateCoupon, (req, res, next) =>
  couponController.validateCoupon(req, res, next)
);

export default router;
