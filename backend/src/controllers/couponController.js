import couponService from '../services/couponService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class CouponController {
  /**
   * POST /api/v1/coupons/validate
   * Public/Customer validation endpoint
   */
  async validateCoupon(req, res, next) {
    try {
      const code = req.body.code || req.body.couponCode;
      const subtotal = Number(req.body.subtotal || req.body.cartTotal || 0);

      const result = await couponService.validateCoupon({ code, subtotal });

      return sendSuccess(
        res,
        `Coupon "${result.coupon.code}" applied successfully! You saved ₹${result.discount}.`,
        result,
        HTTP_STATUS.OK
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { minOrderValue: error.minOrderValue }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/coupons
   * Admin: List all coupons with filtering & pagination
   */
  async getAllCouponsAdmin(req, res, next) {
    try {
      const data = await couponService.getAllCouponsAdmin(req.query);
      return sendSuccess(res, 'Coupons retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/coupons/:id
   * Admin: Get single coupon details
   */
  async getCouponByIdAdmin(req, res, next) {
    try {
      const coupon = await couponService.getCouponByIdAdmin(req.params.id);
      return sendSuccess(res, 'Coupon retrieved successfully', { coupon }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/coupons
   * Admin: Create new coupon
   */
  async createCouponAdmin(req, res, next) {
    try {
      const coupon = await couponService.createCoupon(req.body);
      return sendSuccess(
        res,
        `Coupon "${coupon.code}" created successfully`,
        { coupon },
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/coupons/:id
   * Admin: Update coupon
   */
  async updateCouponAdmin(req, res, next) {
    try {
      const coupon = await couponService.updateCouponAdmin(req.params.id, req.body);
      return sendSuccess(
        res,
        `Coupon "${coupon.code}" updated successfully`,
        { coupon },
        HTTP_STATUS.OK
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/coupons/:id
   * Admin: Delete coupon
   */
  async deleteCouponAdmin(req, res, next) {
    try {
      const result = await couponService.deleteCouponAdmin(req.params.id);
      return sendSuccess(res, result.message, {}, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const couponController = new CouponController();
export default couponController;
