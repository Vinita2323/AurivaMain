import { Router } from 'express';
import productController from '../controllers/productController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// All Admin Product routes require Authentication and ADMIN Role
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/products
 * @desc    Fetch all products with admin filtering (active, inactive, inStock, search)
 */
router.get('/', productController.getAllProducts);

/**
 * @route   POST /api/v1/admin/products
 * @desc    Create new product in store catalog (and auto-bestseller if flagged)
 */
router.post('/', productController.createProduct);

/**
 * @route   GET /api/v1/admin/products/:id
 * @desc    Get single product by ID or slug
 */
router.get('/:id', productController.getProductById);

/**
 * @route   PUT /api/v1/admin/products/:id
 * @desc    Update existing product details
 */
router.put('/:id', productController.updateProduct);

/**
 * @route   DELETE /api/v1/admin/products/:id
 * @desc    Delete product from catalog and clean up references
 */
router.delete('/:id', productController.deleteProduct);

/**
 * @route   PATCH /api/v1/admin/products/:id/status
 * @desc    Toggle product inStock / active status
 */
router.patch('/:id/status', productController.toggleProductStatus);

/**
 * @route   PATCH /api/v1/admin/products/:id/stock
 * @desc    Update product inventory stock count
 */
router.patch('/:id/stock', productController.updateStock);

export default router;
