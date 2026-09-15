import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import { INITIAL_CATEGORIES_SEED } from '../services/categoryService.js';

/**
 * Validate Create Category Payload
 */
export const validateCreateCategory = async (req, res, next) => {
  const { name, status, sortOrder, order } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Category name is required' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Category name must be at least 2 characters long' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Category name cannot exceed 100 characters' });
  }

  if (status !== undefined && status !== null) {
    const normalizedStatus = String(status).toLowerCase();
    if (!['active', 'inactive'].includes(normalizedStatus)) {
      errors.push({ field: 'status', message: 'Status must be either "Active" or "Inactive"' });
    }
  }

  const orderVal = sortOrder !== undefined ? sortOrder : order;
  if (orderVal !== undefined && isNaN(Number(orderVal))) {
    errors.push({ field: 'sortOrder', message: 'sortOrder must be a valid number' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for category creation', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  // Case-insensitive duplicate check (handles both offline and live MongoDB)
  const trimmedName = name.trim();
  if (mongoose.connection.readyState !== 1) {
    const existing = INITIAL_CATEGORIES_SEED.find(
      c => c.name && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return sendError(res, `Category "${trimmedName}" already exists.`, { field: 'name' }, HTTP_STATUS.CONFLICT);
    }
  } else {
    try {
      const existing = await Category.findOne({
        name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      });
      if (existing) {
        return sendError(res, `Category "${trimmedName}" already exists.`, { field: 'name' }, HTTP_STATUS.CONFLICT);
      }
    } catch (err) {
      console.warn('[Category Validation Warning]:', err.message);
    }
  }

  next();
};

/**
 * Validate Update Category Payload
 */
export const validateUpdateCategory = async (req, res, next) => {
  const { name, status, sortOrder, order } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      errors.push({ field: 'name', message: 'Category name cannot be empty' });
    } else if (name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Category name must be at least 2 characters long' });
    } else if (name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Category name cannot exceed 100 characters' });
    }
  }

  if (status !== undefined && status !== null) {
    const normalizedStatus = String(status).toLowerCase();
    if (!['active', 'inactive'].includes(normalizedStatus)) {
      errors.push({ field: 'status', message: 'Status must be either "Active" or "Inactive"' });
    }
  }

  const orderVal = sortOrder !== undefined ? sortOrder : order;
  if (orderVal !== undefined && isNaN(Number(orderVal))) {
    errors.push({ field: 'sortOrder', message: 'sortOrder must be a valid number' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for category update', { errors }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  // If name is changed, check for case-insensitive duplicate excluding current category
  if (name) {
    const trimmedName = name.trim();
    const categoryId = req.params.id;

    if (mongoose.connection.readyState !== 1) {
      const existing = INITIAL_CATEGORIES_SEED.find(
        c => (c.name && c.name.trim().toLowerCase() === trimmedName.toLowerCase()) &&
             (c._id !== categoryId && c.id !== categoryId && c.slug !== categoryId)
      );
      if (existing) {
        return sendError(res, `Another category named "${trimmedName}" already exists.`, { field: 'name' }, HTTP_STATUS.CONFLICT);
      }
    } else {
      try {
        const isObjectId = mongoose.Types.ObjectId.isValid(categoryId);
        const query = {
          name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          ...(isObjectId ? { _id: { $ne: categoryId } } : { slug: { $ne: categoryId } })
        };

        const existing = await Category.findOne(query);
        if (existing) {
          return sendError(res, `Another category named "${trimmedName}" already exists.`, { field: 'name' }, HTTP_STATUS.CONFLICT);
        }
      } catch (err) {
        console.warn('[Category Validation Warning]:', err.message);
      }
    }
  }

  next();
};

/**
 * Validate Category Status Toggle Payload
 */
export const validateCategoryStatus = (req, res, next) => {
  const { status } = req.body;

  if (status === undefined || status === null) {
    return sendError(res, 'Status is required to update category status.', {}, HTTP_STATUS.BAD_REQUEST);
  }

  let normalized = status;
  if (typeof status === 'boolean') {
    normalized = status ? 'Active' : 'Inactive';
  } else {
    const s = String(status).trim().toLowerCase();
    if (s === 'active') normalized = 'Active';
    else if (s === 'inactive') normalized = 'Inactive';
    else {
      return sendError(res, 'Invalid status. Allowed values: Active, Inactive, true, false', {}, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }

  req.body.status = normalized;
  next();
};

export default {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryStatus
};
