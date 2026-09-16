import mongoose from 'mongoose';
import Recipe from '../models/Recipe.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

class RecipeController {
  /**
   * Public: Get all active recipes with optional category/featured filters
   * GET /api/v1/recipes
   */
  async getPublicRecipes(req, res, next) {
    try {
      const { category, featured, search } = req.query;
      const query = { status: 'ACTIVE' };

      if (category && category !== 'All' && category !== 'all') {
        query.category = category;
      }

      if (featured === '1' || featured === 'true') {
        query.isFeatured = true;
      }

      if (search && search.trim()) {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
          { ingredients: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      const recipes = await Recipe.find(query).sort({ isFeatured: -1, order: 1, createdAt: -1 });
      return sendSuccess(res, 'Recipes retrieved successfully', { recipes });
    } catch (error) {
      console.error('[Recipe Controller Error - getPublicRecipes]', error);
      next(error);
    }
  }

  /**
   * Public: Get single recipe by ID or Slug
   * GET /api/v1/recipes/:id
   */
  async getRecipeByIdOrSlug(req, res, next) {
    try {
      const { id } = req.params;
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { slug: id };

      const recipe = await Recipe.findOne(query);
      if (!recipe) {
        return sendError(res, 'Recipe not found', {}, HTTP_STATUS.NOT_FOUND);
      }

      return sendSuccess(res, 'Recipe details retrieved', { recipe });
    } catch (error) {
      console.error('[Recipe Controller Error - getRecipeByIdOrSlug]', error);
      next(error);
    }
  }

  /**
   * Admin: Get all recipes (including drafts)
   * GET /api/v1/admin/recipes
   */
  async getAllRecipesAdmin(req, res, next) {
    try {
      const { search, category, status } = req.query;
      const query = {};

      if (status && status !== 'All') {
        query.status = status;
      }

      if (category && category !== 'All') {
        query.category = category;
      }

      if (search && search.trim()) {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      const recipes = await Recipe.find(query).sort({ createdAt: -1 });
      return sendSuccess(res, 'Admin recipes retrieved', { recipes, total: recipes.length });
    } catch (error) {
      console.error('[Recipe Controller Error - getAllRecipesAdmin]', error);
      next(error);
    }
  }

  /**
   * Admin: Create a new recipe
   * POST /api/v1/admin/recipes
   */
  async createRecipe(req, res, next) {
    try {
      const {
        title,
        description,
        image,
        category,
        prepTime,
        cookTime,
        servings,
        difficulty,
        calories,
        ingredients,
        instructions,
        recommendedProduct,
        isFeatured,
        status,
        order
      } = req.body;

      if (!title || !description) {
        return sendError(res, 'Title and description are required.', {}, HTTP_STATUS.BAD_REQUEST);
      }

      const newRecipe = new Recipe({
        title: title.trim(),
        description: description.trim(),
        image: image || '',
        category: category || 'Healthy Snacks',
        prepTime: prepTime || '10 mins',
        cookTime: cookTime || '5 mins',
        servings: servings || '2 servings',
        difficulty: difficulty || 'Easy',
        calories: calories || '180 kcal',
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        instructions: Array.isArray(instructions) ? instructions : [],
        recommendedProduct: recommendedProduct || 'Peri Peri Roasted Makhana',
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : true,
        status: status || 'ACTIVE',
        order: Number(order) || 0
      });

      await newRecipe.save();
      return sendSuccess(res, 'Recipe created successfully', { recipe: newRecipe }, HTTP_STATUS.CREATED);
    } catch (error) {
      console.error('[Recipe Controller Error - createRecipe]', error);
      next(error);
    }
  }

  /**
   * Admin: Update recipe
   * PUT /api/v1/admin/recipes/:id
   */
  async updateRecipe(req, res, next) {
    try {
      const { id } = req.params;
      const recipe = await Recipe.findById(id);

      if (!recipe) {
        return sendError(res, 'Recipe not found', {}, HTTP_STATUS.NOT_FOUND);
      }

      const fields = [
        'title', 'description', 'image', 'category', 'prepTime', 'cookTime',
        'servings', 'difficulty', 'calories', 'ingredients', 'instructions',
        'recommendedProduct', 'isFeatured', 'status', 'order'
      ];

      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          recipe[field] = req.body[field];
        }
      });

      await recipe.save();
      return sendSuccess(res, 'Recipe updated successfully', { recipe });
    } catch (error) {
      console.error('[Recipe Controller Error - updateRecipe]', error);
      next(error);
    }
  }

  /**
   * Admin: Delete recipe
   * DELETE /api/v1/admin/recipes/:id
   */
  async deleteRecipe(req, res, next) {
    try {
      const { id } = req.params;
      const recipe = await Recipe.findByIdAndDelete(id);

      if (!recipe) {
        return sendError(res, 'Recipe not found', {}, HTTP_STATUS.NOT_FOUND);
      }

      return sendSuccess(res, 'Recipe deleted successfully', { id });
    } catch (error) {
      console.error('[Recipe Controller Error - deleteRecipe]', error);
      next(error);
    }
  }
}

export const recipeController = new RecipeController();
export default recipeController;
