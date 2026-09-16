import { Router } from 'express';
import recipeController from '../controllers/recipeController.js';

const router = Router();

// GET /api/v1/recipes - Get public active recipes
router.get('/', recipeController.getPublicRecipes);

// GET /api/v1/recipes/:id - Get single recipe details
router.get('/:id', recipeController.getRecipeByIdOrSlug);

export default router;
