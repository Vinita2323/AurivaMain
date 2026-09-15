import cartService from '../services/cartService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class CartController {
  /**
   * Helper to extract user ID or guest ID from request
   */
  _getSession(req) {
    const userId = req.user?._id || req.user?.id || null;
    const guestId = req.headers['x-guest-id'] || req.body?.guestId || req.query?.guestId || null;
    return { userId, guestId };
  }

  /**
   * GET /api/v1/cart
   */
  async getCart(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const cart = await cartService.getCart(userId, guestId);
      return sendSuccess(res, 'Cart retrieved successfully', { cart });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/items
   */
  async addItem(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const { productId, weight, qty } = req.body;
      const cart = await cartService.addToCart(userId, guestId, { productId, weight, qty });
      return sendSuccess(res, 'Item added to cart', { cart }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/cart/items
   */
  async updateQty(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const { productId, weight, qty, delta } = req.body;
      const cart = await cartService.updateQty(userId, guestId, { productId, weight, qty, delta });
      return sendSuccess(res, 'Cart item quantity updated', { cart });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/cart/items
   */
  async removeItem(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const productId = req.body?.productId || req.query?.productId;
      const weight = req.body?.weight || req.query?.weight;
      const cart = await cartService.removeItem(userId, guestId, { productId, weight });
      return sendSuccess(res, 'Item removed from cart', { cart });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/cart
   */
  async clearCart(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const cart = await cartService.clearCart(userId, guestId);
      return sendSuccess(res, 'Cart cleared successfully', { cart });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/sync
   */
  async syncCart(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const { items } = req.body;
      const cart = await cartService.syncCart(userId, guestId, items);
      return sendSuccess(res, 'Cart synced successfully', { cart });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/apply-coupon
   */
  async applyCoupon(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const code = req.body.code || req.body.couponCode;
      const cart = await cartService.applyCoupon(userId, guestId, code);
      return sendSuccess(
        res,
        `Coupon "${cart.appliedCoupon?.code}" applied successfully! You saved ₹${cart.discount}.`,
        { cart },
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
   * DELETE /api/v1/cart/remove-coupon
   */
  async removeCoupon(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const cart = await cartService.removeCoupon(userId, guestId);
      return sendSuccess(res, 'Coupon removed successfully', { cart }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const cartController = new CartController();
export default cartController;
