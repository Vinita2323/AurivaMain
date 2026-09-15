import mongoose from 'mongoose';
import Bestseller from '../models/Bestseller.js';
import BestsellerConfig from '../models/BestsellerConfig.js';
import Product from '../models/Product.js';
import { INITIAL_PRODUCTS_SEED } from './productService.js';
import { HTTP_STATUS } from '../constants/status.js';

class BestsellerService {
  /**
   * Get singleton Bestseller section configuration
   */
  async getSectionConfig() {
    if (mongoose.connection.readyState !== 1) {
      return {
        isEnabled: true,
        sectionLabel: 'OUR BESTSELLERS',
        sectionHeading: 'DISCOVER OUR MOST LOVED FLAVOURS',
        viewAllText: 'VIEW ALL PRODUCTS',
        viewAllLink: '/shop',
        toJSON() {
          return {
            isEnabled: true,
            sectionLabel: 'OUR BESTSELLERS',
            sectionHeading: 'DISCOVER OUR MOST LOVED FLAVOURS',
            viewAllText: 'VIEW ALL PRODUCTS',
            viewAllLink: '/shop'
          };
        }
      };
    }

    let config = await BestsellerConfig.findOne();
    if (!config) {
      config = await BestsellerConfig.create({
        isEnabled: true,
        sectionLabel: 'OUR BESTSELLERS',
        sectionHeading: 'DISCOVER OUR MOST LOVED FLAVOURS',
        viewAllText: 'VIEW ALL PRODUCTS',
        viewAllLink: '/shop'
      });
    }
    return config;
  }

  /**
   * Public API: Get active bestsellers for User App homepage
   */
  async getPublicBestsellers() {
    const config = await this.getSectionConfig();

    if (mongoose.connection.readyState !== 1) {
      const fallbackProducts = INITIAL_PRODUCTS_SEED
        .filter(p => p.isBestseller !== false)
        .slice(0, 10)
        .map((p, idx) => ({
          ...p,
          id: p._id || p.id || `seed-bs-${idx + 1}`,
          _id: p._id || p.id || `seed-bs-${idx + 1}`,
          bestsellerId: `seed-bs-${idx + 1}`,
          displayOrder: idx + 1
        }));
      return {
        isEnabled: config.isEnabled !== false,
        sectionLabel: config.sectionLabel || 'OUR BESTSELLERS',
        sectionHeading: config.sectionHeading || 'DISCOVER OUR MOST LOVED FLAVOURS',
        viewAllText: config.viewAllText || 'VIEW ALL PRODUCTS',
        viewAllLink: config.viewAllLink || '/shop',
        products: fallbackProducts
      };
    }

    if (!config.isEnabled) {
      return {
        isEnabled: false,
        sectionLabel: config.sectionLabel,
        sectionHeading: config.sectionHeading,
        viewAllText: config.viewAllText,
        viewAllLink: config.viewAllLink,
        products: []
      };
    }

    const items = await Bestseller.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate('product');

    // Filter out invalid or inactive products
    const validProducts = items
      .filter((item) => item.product && item.product.status === 'ACTIVE')
      .map((item) => {
        const prod = item.product.toJSON ? item.product.toJSON() : item.product;
        const productId = (prod._id || item.product._id || item.product).toString();
        return {
          ...prod,
          id: productId,
          _id: productId,
          bestsellerId: item._id?.toString(),
          displayOrder: item.displayOrder
        };
      });

    return {
      isEnabled: true,
      sectionLabel: config.sectionLabel,
      sectionHeading: config.sectionHeading,
      viewAllText: config.viewAllText,
      viewAllLink: config.viewAllLink,
      products: validProducts
    };
  }

  /**
   * Admin API: Get all configured bestsellers (active & inactive) with section metrics
   */
  async getAdminBestsellers() {
    const config = await this.getSectionConfig();

    if (mongoose.connection.readyState !== 1) {
      const fallbackItems = INITIAL_PRODUCTS_SEED.slice(0, 5).map((p, idx) => ({
        _id: `seed-bs-${idx + 1}`,
        product: { ...p, _id: `seed-prod-${idx + 1}`, id: `seed-prod-${idx + 1}` },
        displayOrder: idx + 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      return {
        config: config.toJSON ? config.toJSON() : config,
        bestsellers: fallbackItems,
        stats: {
          total: fallbackItems.length,
          activeCount: fallbackItems.length,
          inactiveCount: 0,
          isSectionEnabled: true
        }
      };
    }

    const items = await Bestseller.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate('product');

    const validItems = items.filter((item) => Boolean(item.product));

    const total = validItems.length;
    const activeCount = validItems.filter((item) => item.isActive).length;
    const inactiveCount = total - activeCount;

    return {
      config: config.toJSON ? config.toJSON() : config,
      bestsellers: validItems.map((item) => ({
        _id: item._id,
        product: item.product,
        displayOrder: item.displayOrder,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      stats: {
        total,
        activeCount,
        inactiveCount,
        isSectionEnabled: config.isEnabled
      }
    };
  }

  /**
   * Add existing products to the Bestseller section
   * Prevents duplicates and assigns sequential displayOrder
   * @param {string[]} productIds
   */
  async addProductsToBestseller(productIds) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      const err = new Error('Please select at least one product to add.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Filter out existing bestseller product IDs
    const existing = await Bestseller.find({ product: { $in: productIds } });
    const existingProductIds = new Set(existing.map((e) => e.product.toString()));

    const newProductIds = productIds.filter((id) => !existingProductIds.has(String(id)));

    if (newProductIds.length === 0) {
      const err = new Error('All selected products are already in the Bestsellers section.');
      err.statusCode = HTTP_STATUS.CONFLICT;
      throw err;
    }

    // Determine starting displayOrder
    const highestItem = await Bestseller.findOne().sort({ displayOrder: -1 });
    let nextOrder = highestItem ? highestItem.displayOrder + 1 : 1;

    // Validate that products actually exist in Product collection
    const products = await Product.find({ _id: { $in: newProductIds } });
    if (products.length === 0) {
      const err = new Error('No valid products found to add.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    // Create new Bestseller reference documents
    const toInsert = products.map((prod) => ({
      product: prod._id,
      productName: prod.name,
      displayOrder: nextOrder++,
      isActive: true
    }));

    const inserted = await Bestseller.insertMany(toInsert);

    // Return populated inserted records
    return Bestseller.find({ _id: { $in: inserted.map((i) => i._id) } })
      .populate('product')
      .sort({ displayOrder: 1 });
  }

  /**
   * Remove a product reference from Bestseller section
   * GUARANTEE: NEVER deletes the actual Product record!
   * @param {string} bestsellerId
   */
  async removeProductFromBestseller(bestsellerId) {
    const item = await Bestseller.findById(bestsellerId).populate('product');
    if (!item) {
      const err = new Error('Bestseller item not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const productName = item.product?.name || 'Product';

    // Delete ONLY the Bestseller reference record
    await Bestseller.deleteOne({ _id: bestsellerId });

    return {
      message: `"${productName}" was removed from Bestsellers. The original product was not deleted.`
    };
  }

  /**
   * Reorder bestsellers
   * @param {Array<{ id: string, displayOrder: number } | string>} orderedItems
   */
  async reorderBestsellers(orderedItems) {
    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      const err = new Error('Please provide an array of items to reorder.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const bulkOps = orderedItems.map((item, index) => {
      const id = typeof item === 'string' ? item : item.id || item._id;
      const displayOrder = typeof item === 'object' && item.displayOrder !== undefined ? item.displayOrder : index + 1;

      return {
        updateOne: {
          filter: { _id: id },
          update: { $set: { displayOrder } }
        }
      };
    });

    await Bestseller.bulkWrite(bulkOps);

    return this.getAdminBestsellers();
  }

  /**
   * Toggle or set active/inactive status for an individual bestseller product
   * @param {string} bestsellerId
   * @param {boolean} [explicitStatus]
   */
  async toggleBestsellerStatus(bestsellerId, explicitStatus) {
    const item = await Bestseller.findById(bestsellerId);
    if (!item) {
      const err = new Error('Bestseller item not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    item.isActive = explicitStatus !== undefined ? Boolean(explicitStatus) : !item.isActive;
    await item.save();

    return item.populate('product');
  }

  /**
   * Update section-level configuration (toggle enabled, section labels)
   * @param {object} configData
   */
  async updateSectionConfig(configData) {
    let config = await BestsellerConfig.findOne();
    if (!config) {
      config = new BestsellerConfig();
    }

    if (configData.isEnabled !== undefined) {
      config.isEnabled = Boolean(configData.isEnabled);
    }
    if (configData.sectionLabel !== undefined) {
      config.sectionLabel = configData.sectionLabel.trim();
    }
    if (configData.sectionHeading !== undefined) {
      config.sectionHeading = configData.sectionHeading.trim();
    }
    if (configData.viewAllText !== undefined) {
      config.viewAllText = configData.viewAllText.trim();
    }
    if (configData.viewAllLink !== undefined) {
      config.viewAllLink = configData.viewAllLink.trim();
    }

    await config.save();
    return config.toJSON();
  }

  /**
   * Auto-seed initial Bestseller reference records if none exist
   */
  async seedInitialBestsellers() {
    try {
      await this.getSectionConfig();

      const count = await Bestseller.countDocuments();
      if (count === 0) {
        // Find existing products
        const products = await Product.find({ status: 'ACTIVE' }).limit(5);

        if (products.length > 0) {
          const bestsellerEntries = products.map((p, idx) => ({
            product: p._id,
            productName: p.name,
            displayOrder: idx + 1,
            isActive: true
          }));

          await Bestseller.insertMany(bestsellerEntries);
          console.log(`[Bestseller Seeding] Seeded ${bestsellerEntries.length} initial Bestseller product references.`);
        }
      }
    } catch (error) {
      console.error('[Bestseller Seeding Error] Could not seed bestsellers:', error.message);
    }
  }
}

export const bestsellerService = new BestsellerService();
export default bestsellerService;
