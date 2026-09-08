import { Router } from 'express';
import bestsellerController from '../controllers/bestsellerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// All Admin Bestseller routes require Authentication and ADMIN Role
router.use(authMiddleware, requireAdmin);

/**
 * @route   GET /api/v1/admin/bestsellers
 * @desc    Fetch all configured bestsellers + section settings + statistics
 */
router.get('/', bestsellerController.getAdminBestsellers);

/**
 * @route   POST /api/v1/admin/bestsellers
 * @desc    Add existing products to Bestsellers (prevents duplicates)
 */
router.post('/', bestsellerController.addProducts);

/**
 * @route   DELETE /api/v1/admin/bestsellers/:id
 * @desc    Remove a product from Bestsellers (NEVER deletes the Product itself)
 */
router.delete('/:id', bestsellerController.removeProduct);

/**
 * @route   PUT /api/v1/admin/bestsellers/reorder
 * @desc    Reorder bestsellers displayOrder
 */
router.put('/reorder', bestsellerController.reorder);

/**
 * @route   PATCH /api/v1/admin/bestsellers/:id/status
 * @desc    Toggle or set active status of a bestseller item
 */
router.patch('/:id/status', bestsellerController.toggleStatus);

/**
 * @route   PATCH /api/v1/admin/bestsellers/section-status
 * @route   PUT /api/v1/admin/bestsellers/config
 * @desc    Update section configuration (enable/disable, labels, heading)
 */
router.patch('/section-status', bestsellerController.updateSectionConfig);
router.put('/config', bestsellerController.updateSectionConfig);

export default router;
