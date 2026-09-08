import bestsellerService from '../services/bestsellerService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class BestsellerController {
  /**
   * Public: Get active bestsellers for User App homepage
   * GET /api/v1/bestsellers
   */
  async getPublicBestsellers(req, res, next) {
    try {
      const data = await bestsellerService.getPublicBestsellers();
      return sendSuccess(res, 'Bestsellers retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Get all configured bestsellers with section settings and stats
   * GET /api/v1/admin/bestsellers
   */
  async getAdminBestsellers(req, res, next) {
    try {
      const data = await bestsellerService.getAdminBestsellers();
      return sendSuccess(res, 'Admin bestsellers fetched successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Add existing store products to Bestsellers
   * POST /api/v1/admin/bestsellers
   */
  async addProducts(req, res, next) {
    try {
      const { productIds } = req.body;
      const added = await bestsellerService.addProductsToBestseller(productIds);
      return sendSuccess(res, `Successfully added ${added.length} product(s) to Bestsellers.`, { added }, HTTP_STATUS.CREATED);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Remove a product from Bestsellers
   * DELETE /api/v1/admin/bestsellers/:id
   * GUARANTEE: Does NOT delete the product!
   */
  async removeProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await bestsellerService.removeProductFromBestseller(id);
      return sendSuccess(res, result.message, {}, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Reorder Bestsellers
   * PUT /api/v1/admin/bestsellers/reorder
   */
  async reorder(req, res, next) {
    try {
      const itemsToReorder = req.body.items || req.body.orderedIds || (Array.isArray(req.body) ? req.body : null);
      const result = await bestsellerService.reorderBestsellers(itemsToReorder);
      return sendSuccess(res, 'Bestsellers reordered successfully.', result, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Toggle individual bestseller product active status
   * PATCH /api/v1/admin/bestsellers/:id/status
   */
  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await bestsellerService.toggleBestsellerStatus(id, isActive);
      return sendSuccess(
        res,
        `Product ${updated.isActive ? 'activated' : 'deactivated'} in Bestsellers section.`,
        { item: updated },
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
   * Admin: Update section-level configuration & global enable toggle
   * PATCH /api/v1/admin/bestsellers/section-status
   * PUT /api/v1/admin/bestsellers/config
   */
  async updateSectionConfig(req, res, next) {
    try {
      const config = await bestsellerService.updateSectionConfig(req.body);
      return sendSuccess(res, 'Section settings updated successfully.', { config }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const bestsellerController = new BestsellerController();
export default bestsellerController;
