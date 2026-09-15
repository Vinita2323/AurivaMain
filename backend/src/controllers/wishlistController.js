import wishlistService from '../services/wishlistService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class WishlistController {
  /**
   * Helper to extract user ID or guest ID from request
   */
  _getSession(req) {
    const userId = req.user?._id || req.user?.id || null;
    const guestId = req.headers['x-guest-id'] || req.body?.guestId || req.query?.guestId || null;
    return { userId, guestId };
  }

  /**
   * GET /api/v1/wishlist
   */
  async getWishlist(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const wishlist = await wishlistService.getWishlist(userId, guestId);
      return sendSuccess(res, 'Wishlist retrieved successfully', { wishlist });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/wishlist/toggle
   */
  async toggleWishlist(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const { productId, productData } = req.body;
      const wishlist = await wishlistService.toggleWishlist(userId, guestId, { productId, productData });
      return sendSuccess(
        res,
        wishlist.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist',
        { wishlist },
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
   * DELETE /api/v1/wishlist/items
   */
  async removeItem(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const productId = req.body?.productId || req.query?.productId;
      const wishlist = await wishlistService.removeItem(userId, guestId, productId);
      return sendSuccess(res, 'Item removed from wishlist', { wishlist });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/wishlist
   */
  async clearWishlist(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const wishlist = await wishlistService.clearWishlist(userId, guestId);
      return sendSuccess(res, 'Wishlist cleared successfully', { wishlist });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/wishlist/sync
   */
  async syncWishlist(req, res, next) {
    try {
      const { userId, guestId } = this._getSession(req);
      const { items } = req.body;
      const wishlist = await wishlistService.syncWishlist(userId, guestId, items);
      return sendSuccess(res, 'Wishlist synced successfully', { wishlist });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
export default wishlistController;
