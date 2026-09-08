import productService from '../services/productService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class ProductController {
  /**
   * Get all products with search & category filters
   * GET /api/v1/products
   */
  async getAllProducts(req, res, next) {
    try {
      const products = await productService.getAllProducts(req.query);
      return sendSuccess(res, 'Products retrieved successfully', { products });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Get single product by ID or Slug
   * GET /api/v1/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return sendSuccess(res, 'Product retrieved successfully', { product });
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Create new product
   * POST /api/v1/admin/products or POST /api/v1/products
   */
  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      return sendSuccess(res, 'Product created successfully', { product }, HTTP_STATUS.CREATED);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Update existing product
   * PUT /api/v1/admin/products/:id
   */
  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, 'Product updated successfully', { product }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Delete product
   * DELETE /api/v1/admin/products/:id
   */
  async deleteProduct(req, res, next) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      return sendSuccess(res, result.message, {}, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }

  /**
   * Admin: Toggle product inStock / active status
   * PATCH /api/v1/admin/products/:id/status
   */
  async toggleProductStatus(req, res, next) {
    try {
      const product = await productService.toggleProductStatus(req.params.id);
      return sendSuccess(
        res,
        `Product status changed to ${product.inStock ? 'In Stock' : 'Out of Stock'}.`,
        { product },
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
   * Admin: Update product inventory stock
   * PATCH /api/v1/admin/products/:id/stock
   */
  async updateStock(req, res, next) {
    try {
      const { stockCount } = req.body;
      const product = await productService.updateStock(req.params.id, stockCount);
      return sendSuccess(res, `Stock updated to ${product.stockCount}.`, { product }, HTTP_STATUS.OK);
    } catch (error) {
      if (error.statusCode) {
        return sendError(res, error.message, {}, error.statusCode);
      }
      next(error);
    }
  }
}

export const productController = new ProductController();
export default productController;
