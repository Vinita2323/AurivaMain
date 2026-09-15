import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { INITIAL_PRODUCTS_SEED } from './productService.js';
import { HTTP_STATUS } from '../constants/status.js';

export const INITIAL_CATEGORIES_SEED = [
  {
    name: "Classic Makhana",
    subtext: "Pure & Lightly Salted",
    slug: "classic-makhana",
    description: "Crispy, handpicked & slow-roasted classic fox nuts with pure Himalayan crystal salt.",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
    badge: "Bestseller",
    popular: true,
    status: "Active",
    sortOrder: 1,
    order: 1
  },
  {
    name: "Flavoured Makhana",
    subtext: "Botanical Spices",
    slug: "flavoured-makhana",
    description: "Infused with artisanal Indian and international herbs and spice blends.",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
    badge: "Popular",
    popular: true,
    status: "Active",
    sortOrder: 2,
    order: 2
  },
  {
    name: "Premium Makhana",
    subtext: "Jumbo Selected",
    slug: "premium-makhana",
    description: "Extra large 6-suta hand-sorted jumbo lotus seeds roasted in cold-pressed virgin olive mist.",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
    badge: "Jumbo Size",
    popular: true,
    status: "Active",
    sortOrder: 3,
    order: 3
  },
  {
    name: "Makhana Combos",
    subtext: "Value & Gift Packs",
    slug: "makhana-combos",
    description: "Curated variety boxes, family mega packs, and luxury festive gifting assortments.",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
    badge: "Value Packs",
    popular: true,
    status: "Active",
    sortOrder: 4,
    order: 4
  },
  {
    name: "Healthy / Fitness Makhana",
    subtext: "High Protein & Low Cal",
    slug: "healthy-fitness-makhana",
    description: "Zero-oil roasted superfood snacks with high satiety, enriched with plant protein.",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
    badge: "High Protein",
    popular: true,
    status: "Active",
    sortOrder: 5,
    order: 5
  }
];

class CategoryService {
  /**
   * Helper: Generate a URL-friendly slug
   */
  slugify(text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Admin API: Get all categories with filtering, search, sorting & optional pagination
   */
  async getAllCategories(filters = {}, pagination = {}) {
    const isOffline = mongoose.connection.readyState !== 1;

    if (isOffline) {
      let list = [...INITIAL_CATEGORIES_SEED];
      if (filters.status && filters.status !== 'all') {
        list = list.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(c =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.subtext || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        );
      }
      list.sort((a, b) => (a.sortOrder || a.order || 0) - (b.sortOrder || b.order || 0));

      const total = list.length;
      if (pagination.page && pagination.limit && Number(pagination.limit) > 0) {
        const page = Math.max(1, Number(pagination.page));
        const limit = Number(pagination.limit);
        const start = (page - 1) * limit;
        const pagedItems = list.slice(start, start + limit);
        return {
          categories: pagedItems,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      }
      return { categories: list, pagination: null };
    }

    const query = {};

    if (filters.status && filters.status !== 'all') {
      const s = filters.status.toLowerCase();
      query.status = s === 'active' ? 'Active' : 'Inactive';
    }

    if (filters.search) {
      const regex = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: regex },
        { subtext: regex },
        { description: regex },
        { 'subcategories.name': regex }
      ];
    }

    const sortOption = { sortOrder: 1, order: 1, createdAt: 1 };
    if (filters.sort === 'name') sortOption.name = 1;
    if (filters.sort === 'newest') sortOption.createdAt = -1;

    const total = await Category.countDocuments(query);

    let categoriesQuery = Category.find(query).sort(sortOption);

    if (pagination.page && pagination.limit && Number(pagination.limit) > 0) {
      const page = Math.max(1, Number(pagination.page));
      const limit = Number(pagination.limit);
      const skip = (page - 1) * limit;

      categoriesQuery = categoriesQuery.skip(skip).limit(limit);
      const categories = await categoriesQuery;

      return {
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    const categories = await categoriesQuery;
    return { categories, pagination: null };
  }

  /**
   * Public API: Get all active categories for User/Storefront
   */
  async getActiveCategories(filters = {}) {
    if (mongoose.connection.readyState !== 1) {
      return INITIAL_CATEGORIES_SEED
        .filter(c => c.status === 'Active')
        .sort((a, b) => (a.sortOrder || a.order || 0) - (b.sortOrder || b.order || 0));
    }

    const query = { status: 'Active' };
    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ name: regex }, { subtext: regex }, { description: regex }];
    }

    return Category.find(query)
      .sort({ sortOrder: 1, order: 1, createdAt: 1 })
      .select('name slug subtext description image badge popular sortOrder order subcategories createdAt updatedAt');
  }

  /**
   * Get single category by MongoDB ID or slug
   */
  async getCategoryByIdOrSlug(idOrSlug) {
    if (!idOrSlug) {
      const err = new Error('Category ID or slug is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (mongoose.connection.readyState !== 1) {
      const found = INITIAL_CATEGORIES_SEED.find(
        c => (c._id && c._id.toString() === idOrSlug) || c.id === idOrSlug || c.slug === idOrSlug
      );
      if (!found) {
        const err = new Error(`Category "${idOrSlug}" not found.`);
        err.statusCode = HTTP_STATUS.NOT_FOUND;
        throw err;
      }
      return found;
    }

    let category = null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      category = await Category.findById(idOrSlug);
    }
    if (!category) {
      category = await Category.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!category) {
      const err = new Error(`Category "${idOrSlug}" not found.`);
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    return category;
  }

  /**
   * Create a new category
   */
  async createCategory(data) {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Category name is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const trimmedName = data.name.trim();

    // Auto-generate or sanitize slug
    let baseSlug = this.slugify(data.slug || trimmedName);
    if (!baseSlug) baseSlug = `category-${Date.now()}`;

    const orderNum = Number(data.sortOrder !== undefined ? data.sortOrder : (data.order || 1));
    const statusVal = data.status && String(data.status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

    // Disconnected fallback
    if (mongoose.connection.readyState !== 1) {
      const tempId = `cat-offline-${Date.now()}`;
      const newCategory = {
        _id: tempId,
        id: tempId,
        name: trimmedName,
        slug: baseSlug,
        subtext: data.subtext || '',
        description: data.description || '',
        image: data.image || '',
        badge: data.badge || 'Popular',
        popular: data.popular !== false,
        status: statusVal,
        sortOrder: orderNum,
        order: orderNum,
        subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      INITIAL_CATEGORIES_SEED.push(newCategory);
      return newCategory;
    }

    // Ensure slug uniqueness
    let slug = baseSlug;
    const existingCategoryWithSlug = await Category.findOne({ slug });
    if (existingCategoryWithSlug) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newCategory = await Category.create({
      name: trimmedName,
      slug,
      subtext: data.subtext || '',
      description: data.description || '',
      image: data.image || '',
      badge: data.badge || 'Popular',
      popular: data.popular !== false,
      status: statusVal,
      sortOrder: orderNum,
      order: orderNum,
      subcategories: Array.isArray(data.subcategories) ? data.subcategories : []
    });

    return newCategory;
  }

  /**
   * Update category
   */
  async updateCategory(idOrSlug, data) {
    const category = await this.getCategoryByIdOrSlug(idOrSlug);

    const isOffline = mongoose.connection.readyState !== 1;
    if (isOffline) {
      if (data.name) category.name = data.name.trim();
      if (data.subtext !== undefined) category.subtext = data.subtext;
      if (data.description !== undefined) category.description = data.description;
      if (data.image !== undefined) category.image = data.image;
      if (data.badge !== undefined) category.badge = data.badge;
      if (data.popular !== undefined) category.popular = Boolean(data.popular);
      if (data.status) {
        category.status = String(data.status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
      }
      if (data.sortOrder !== undefined || data.order !== undefined) {
        const orderNum = Number(data.sortOrder !== undefined ? data.sortOrder : data.order);
        category.sortOrder = orderNum;
        category.order = orderNum;
      }
      if (data.slug) category.slug = this.slugify(data.slug);
      if (Array.isArray(data.subcategories)) category.subcategories = data.subcategories;
      category.updatedAt = new Date().toISOString();
      return category;
    }

    // Live MongoDB update
    if (data.name && data.name.trim() !== category.name) {
      category.name = data.name.trim();
      if (!data.slug) {
        let candidateSlug = this.slugify(data.name);
        const slugConflict = await Category.findOne({ slug: candidateSlug, _id: { $ne: category._id } });
        if (slugConflict) {
          candidateSlug = `${candidateSlug}-${Date.now().toString().slice(-4)}`;
        }
        category.slug = candidateSlug;
      }
    }

    if (data.slug) {
      const sanitizedSlug = this.slugify(data.slug);
      const slugConflict = await Category.findOne({ slug: sanitizedSlug, _id: { $ne: category._id } });
      if (slugConflict) {
        const err = new Error(`Category slug "${sanitizedSlug}" is already in use.`);
        err.statusCode = HTTP_STATUS.CONFLICT;
        throw err;
      }
      category.slug = sanitizedSlug;
    }

    if (data.subtext !== undefined) category.subtext = data.subtext;
    if (data.description !== undefined) category.description = data.description;
    if (data.image !== undefined) category.image = data.image;
    if (data.badge !== undefined) category.badge = data.badge;
    if (data.popular !== undefined) category.popular = Boolean(data.popular);
    if (data.status !== undefined) {
      category.status = String(data.status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
    }
    if (data.sortOrder !== undefined || data.order !== undefined) {
      const orderNum = Number(data.sortOrder !== undefined ? data.sortOrder : data.order);
      category.sortOrder = orderNum;
      category.order = orderNum;
    }
    if (Array.isArray(data.subcategories)) {
      category.subcategories = data.subcategories;
    }

    await category.save();
    return category;
  }

  /**
   * Delete Category with Safety Reference Check
   */
  async deleteCategory(idOrSlug) {
    const category = await this.getCategoryByIdOrSlug(idOrSlug);

    const isOffline = mongoose.connection.readyState !== 1;
    if (isOffline) {
      const catSlug = category.slug;
      const catName = category.name;
      const catId = category._id || category.id;

      // Check offline products
      const referenced = (INITIAL_PRODUCTS_SEED || []).filter(p =>
        p.category === catSlug ||
        p.category === catName ||
        p.categoryId === catId ||
        (p.category && catSlug && p.category.toLowerCase() === catSlug.toLowerCase()) ||
        (p.category && catName && p.category.toLowerCase() === catName.toLowerCase())
      );
      if (referenced.length > 0) {
        const err = new Error(`This category is currently used by ${referenced.length} product(s) and cannot be deleted.`);
        err.statusCode = HTTP_STATUS.BAD_REQUEST;
        err.productCount = referenced.length;
        throw err;
      }

      const idx = INITIAL_CATEGORIES_SEED.findIndex(c => c.slug === catSlug || c._id === catId || c.id === catId);
      if (idx !== -1) {
        INITIAL_CATEGORIES_SEED.splice(idx, 1);
      }
      return { message: `Category "${category.name}" was deleted successfully.` };
    }

    // Safety Check: Verify if any active products reference this category
    const catSlug = category.slug;
    const catName = category.name;
    const catId = category._id.toString();

    const productCount = await Product.countDocuments({
      $or: [
        { category: catSlug },
        { category: catName },
        { category: catId }
      ]
    });

    if (productCount > 0) {
      const err = new Error(
        `This category is currently used by ${productCount} product(s) and cannot be deleted. Please reassign or delete the products first.`
      );
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      err.productCount = productCount;
      throw err;
    }

    await Category.deleteOne({ _id: category._id });
    return { message: `Category "${category.name}" was deleted successfully.` };
  }

  /**
   * Update Category Active/Inactive Status
   */
  async updateCategoryStatus(idOrSlug, status) {
    const normalizedStatus = String(status).toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
    return this.updateCategory(idOrSlug, { status: normalizedStatus });
  }

  /**
   * Seed initial store categories if collection is empty
   */
  async seedInitialCategories() {
    try {
      if (mongoose.connection.readyState !== 1) return;
      const count = await Category.countDocuments();
      if (count === 0) {
        await Category.insertMany(INITIAL_CATEGORIES_SEED);
        console.log(`[Category Seeding] Successfully seeded ${INITIAL_CATEGORIES_SEED.length} initial categories.`);
      }
    } catch (error) {
      console.error('[Category Seeding Error] Could not seed categories:', error.message);
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
