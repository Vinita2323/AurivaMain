import { Router } from 'express';
import categoryController from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryStatus
} from '../validations/categoryValidation.js';

const router = Router();

// All Admin Category routes require JWT Authentication & Admin Role
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/categories
 * @desc    Fetch all categories (with search, status filter, sorting, pagination)
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/v1/admin/categories/:id
 * @desc    Get single category by MongoDB ID or slug
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   POST /api/v1/admin/categories
 * @desc    Create a new category
 */
router.post('/', validateCreateCategory, categoryController.createCategory);

/**
 * @route   PUT /api/v1/admin/categories/:id
 * @route   PATCH /api/v1/admin/categories/:id
 * @desc    Update an existing category
 */
router.put('/:id', validateUpdateCategory, categoryController.updateCategory);
router.patch('/:id', validateUpdateCategory, categoryController.updateCategory);

/**
 * @route   PATCH /api/v1/admin/categories/:id/status
 * @desc    Toggle category active / inactive status
 */
router.patch('/:id/status', validateCategoryStatus, categoryController.updateCategoryStatus);

/**
 * @route   DELETE /api/v1/admin/categories/:id
 * @desc    Delete category (with safety check preventing deletion if products use it)
 */
router.delete('/:id', categoryController.deleteCategory);

export default router;
