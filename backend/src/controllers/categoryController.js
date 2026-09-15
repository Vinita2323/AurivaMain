import categoryService from '../services/categoryService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class CategoryController {
  /**
   * Admin API: Get all categories with filtering, search, and pagination
   * GET /api/v1/admin/categories or GET /api/admin/categories
   */
  async getCategories(req, res, next) {
    try {
      const { search, status, sort, page, limit } = req.query;
      const result = await categoryService.getAllCategories(
        { search, status, sort },
        { page, limit }
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Categories fetched successfully',
        data: result.categories,
        ...(result.pagination ? { pagination: result.pagination } : {})
      });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Public Storefront API: Get active categories
   * GET /api/v1/categories or GET /api/categories
   */
  async getActiveCategories(req, res, next) {
    try {
      const categories = await categoryService.getActiveCategories(req.query);
      return sendSuccess(res, 'Active categories fetched successfully', categories);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Get single category by MongoDB ID or slug
   * GET /api/v1/categories/:id or GET /api/v1/admin/categories/:id
   */
  async getCategoryById(req, res, next) {
    try {
      const category = await categoryService.getCategoryByIdOrSlug(req.params.id);
      return sendSuccess(res, 'Category fetched successfully', category);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin API: Create a new category
   * POST /api/v1/admin/categories
   */
  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      return sendSuccess(res, 'Category created successfully', category, HTTP_STATUS.CREATED);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      if (error.code === 11000) {
        return sendError(res, 'Category with this name or slug already exists', {}, HTTP_STATUS.CONFLICT);
      }
      next(error);
    }
  }

  /**
   * Admin API: Update category
   * PUT/PATCH /api/v1/admin/categories/:id
   */
  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return sendSuccess(res, 'Category updated successfully', category);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      if (error.code === 11000) {
        return sendError(res, 'Category with this slug already exists', {}, HTTP_STATUS.CONFLICT);
      }
      next(error);
    }
  }

  /**
   * Admin API: Delete category (with product usage safety check)
   * DELETE /api/v1/admin/categories/:id
   */
  async deleteCategory(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      return sendSuccess(res, result.message, { id: req.params.id });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, { productCount: error.productCount }, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin API: Change category status (Active / Inactive)
   * PATCH /api/v1/admin/categories/:id/status
   */
  async updateCategoryStatus(req, res, next) {
    try {
      const category = await categoryService.updateCategoryStatus(req.params.id, req.body.status);
      return sendSuccess(
        res,
        `Category "${category.name}" status updated to "${category.status}" successfully`,
        category
      );
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
export default categoryController;
