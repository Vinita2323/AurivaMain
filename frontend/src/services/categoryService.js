import { categoryApi } from '../utils/api';

/**
 * Frontend Category Service
 * Reuses the centralized apiRequest helper without duplicating fetch/axios configuration.
 */

export const getCategories = (params = {}) => categoryApi.getCategories(params);

export const getActiveCategories = (params = {}) => categoryApi.getActiveCategories(params);

export const getCategoryById = (id) => categoryApi.getCategoryById(id);

export const createCategory = (data) => categoryApi.createCategory(data);

export const updateCategory = (id, data) => categoryApi.updateCategory(id, data);

export const deleteCategory = (id) => categoryApi.deleteCategory(id);

export const updateCategoryStatus = (id, status) => categoryApi.updateCategoryStatus(id, status);

export default {
  getCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus
};
