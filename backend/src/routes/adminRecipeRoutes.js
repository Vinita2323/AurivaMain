import { Router } from 'express';
import recipeController from '../controllers/recipeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// Protect all admin recipe routes
router.use(authMiddleware, requireAdmin);

// GET /api/v1/admin/recipes
router.get('/', recipeController.getAllRecipesAdmin);

// POST /api/v1/admin/recipes
router.post('/', recipeController.createRecipe);

// PUT /api/v1/admin/recipes/:id
router.put('/:id', recipeController.updateRecipe);

// DELETE /api/v1/admin/recipes/:id
router.delete('/:id', recipeController.deleteRecipe);

export default router;
