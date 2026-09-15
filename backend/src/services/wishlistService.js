import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { HTTP_STATUS } from '../constants/status.js';

class WishlistService {
  /**
   * Helper to locate an existing wishlist or create a new one
   */
  async _findOrCreateWishlist(userId, guestId) {
    let wishlist = null;

    if (userId) {
      wishlist = await Wishlist.findOne({ user: userId });
      if (!wishlist && guestId) {
        // Check if there was a guest wishlist that should be claimed
        const guestWishlist = await Wishlist.findOne({ guestId });
        if (guestWishlist) {
          guestWishlist.user = userId;
          guestWishlist.guestId = null;
          await guestWishlist.save();
          return guestWishlist;
        }
      }
      if (!wishlist) {
        wishlist = await Wishlist.create({ user: userId, items: [] });
      }
    } else if (guestId) {
      wishlist = await Wishlist.findOne({ guestId });
      if (!wishlist) {
        wishlist = await Wishlist.create({ guestId, items: [] });
      }
    }

    return wishlist;
  }

  /**
   * Format wishlist payload for frontend
   */
  _formatWishlist(wishlist) {
    if (!wishlist) {
      return {
        _id: null,
        items: [],
        productIds: [],
        count: 0
      };
    }

    const items = (wishlist.items || []).map((item) => {
      const prod = item.product || {};
      const pid = (prod._id || prod.id || item.productId)?.toString();
      return {
        _id: item._id ? item._id.toString() : undefined,
        id: pid,
        productId: pid,
        slug: prod.slug || item.slug || '',
        name: prod.name || item.name || 'Snack Item',
        image: prod.image || item.image || '',
        price: Number(prod.price !== undefined ? prod.price : item.price || 0),
        oldPrice: Number(prod.oldPrice !== undefined ? prod.oldPrice : item.oldPrice || 0),
        category: prod.category || '',
        reviewsCount: prod.reviewsCount || 420,
        rating: prod.rating || 4.8,
        weight: prod.weight || '150g',
        weightOptions: prod.weightOptions || [],
        badge: prod.badge || ''
      };
    });

    const productIds = items
      .map((it) => it.id || it.productId || it.slug)
      .filter(Boolean);

    // Also include slugs in lookup array so frontend can match regardless of id or slug
    const allLookupKeys = Array.from(
      new Set(
        items.flatMap((it) => [it.id, it.productId, it.slug]).filter(Boolean)
      )
    );

    return {
      _id: wishlist._id ? wishlist._id.toString() : undefined,
      items,
      productIds: allLookupKeys,
      count: items.length
    };
  }

  /**
   * Get Wishlist for user or guest
   */
  async getWishlist(userId, guestId) {
    if (mongoose.connection.readyState !== 1) {
      return { _id: null, items: [], productIds: [], count: 0 };
    }

    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) {
      return { _id: null, items: [], productIds: [], count: 0 };
    }

    const wishlist = await Wishlist.findOne(query).populate('items.product');
    return this._formatWishlist(wishlist);
  }

  /**
   * Toggle product in wishlist (add if not present, remove if present)
   */
  async toggleWishlist(userId, guestId, { productId, productData = {} }) {
    if (!productId) {
      const err = new Error('Product ID is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database is currently offline. Cannot persist wishlist.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const wishlist = await this._findOrCreateWishlist(userId, guestId);
    if (!wishlist) {
      const err = new Error('Could not identify user or guest session for wishlist.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Try finding the product in MongoDB Product collection
    let productDoc = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      productDoc = await Product.findById(productId);
    }
    if (!productDoc) {
      productDoc = await Product.findOne({ slug: productId });
    }

    const actualObjectId = productDoc ? productDoc._id : null;
    const actualIdStr = productDoc ? productDoc._id.toString() : productId.toString();
    const slugStr = productDoc?.slug || productData.slug || productId.toString();
    const nameStr = productDoc?.name || productData.name || 'Snack Item';
    const imageStr = productDoc?.image || productData.image || '';
    const priceNum = Number(productDoc?.price ?? productData.price ?? 0);
    const oldPriceNum = Number(productDoc?.oldPrice ?? productData.oldPrice ?? 0);

    // Check if item is already in wishlist
    const existingIndex = wishlist.items.findIndex((it) => {
      const matchId = it.productId === actualIdStr || it.productId === productId.toString();
      const matchDoc = actualObjectId && it.product && it.product.toString() === actualObjectId.toString();
      const matchSlug = slugStr && it.slug === slugStr;
      return matchId || matchDoc || matchSlug;
    });

    let action = 'added';

    if (existingIndex > -1) {
      // Remove from wishlist
      wishlist.items.splice(existingIndex, 1);
      action = 'removed';
    } else {
      // Add to wishlist
      wishlist.items.push({
        product: actualObjectId,
        productId: actualIdStr,
        name: nameStr,
        image: imageStr,
        price: priceNum,
        oldPrice: oldPriceNum,
        slug: slugStr
      });
      action = 'added';
    }

    await wishlist.save();

    // Re-fetch with populated Product references
    const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.product');
    const formatted = this._formatWishlist(updatedWishlist);

    return {
      ...formatted,
      action
    };
  }

  /**
   * Remove single product from wishlist
   */
  async removeItem(userId, guestId, productId) {
    if (!productId) {
      const err = new Error('Product ID is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) return { _id: null, items: [], productIds: [], count: 0 };

    const wishlist = await Wishlist.findOne(query);
    if (!wishlist) return { _id: null, items: [], productIds: [], count: 0 };

    const pidStr = productId.toString();
    wishlist.items = wishlist.items.filter((it) => {
      const matchId = it.productId === pidStr;
      const matchDoc = it.product && it.product.toString() === pidStr;
      const matchSlug = it.slug === pidStr;
      return !(matchId || matchDoc || matchSlug);
    });

    await wishlist.save();
    const updated = await Wishlist.findById(wishlist._id).populate('items.product');
    return this._formatWishlist(updated);
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId, guestId) {
    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) return { _id: null, items: [], productIds: [], count: 0 };

    const wishlist = await Wishlist.findOne(query);
    if (wishlist) {
      wishlist.items = [];
      await wishlist.save();
    }

    return { _id: wishlist?._id?.toString(), items: [], productIds: [], count: 0 };
  }

  /**
   * Sync / Merge guest wishlist items into authenticated user wishlist upon login
   */
  async syncWishlist(userId, guestId, localProductIds = []) {
    if (!userId) {
      const err = new Error('User authentication required for wishlist sync.');
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    const userWishlist = await this._findOrCreateWishlist(userId, null);
    let itemsToMerge = [];

    // If guestId provided, merge items from stored guest wishlist
    if (guestId) {
      const guestWishlist = await Wishlist.findOne({ guestId });
      if (guestWishlist && guestWishlist.items.length > 0) {
        itemsToMerge.push(...guestWishlist.items);
        await Wishlist.deleteOne({ _id: guestWishlist._id });
      }
    }

    // Also consider any localProductIds passed from client
    if (Array.isArray(localProductIds) && localProductIds.length > 0) {
      for (const idOrItem of localProductIds) {
        const pid = typeof idOrItem === 'string' ? idOrItem : idOrItem?.id || idOrItem?.productId;
        if (!pid) continue;

        const alreadyExists = userWishlist.items.some(
          (it) => it.productId === pid || (it.product && it.product.toString() === pid) || it.slug === pid
        );

        if (!alreadyExists) {
          let pDoc = null;
          if (mongoose.Types.ObjectId.isValid(pid)) {
            pDoc = await Product.findById(pid);
          }
          if (!pDoc) {
            pDoc = await Product.findOne({ slug: pid });
          }

          userWishlist.items.push({
            product: pDoc ? pDoc._id : null,
            productId: pDoc ? pDoc._id.toString() : pid,
            name: pDoc?.name || (typeof idOrItem === 'object' ? idOrItem.name : '') || 'Snack Item',
            image: pDoc?.image || (typeof idOrItem === 'object' ? idOrItem.image : '') || '',
            price: Number(pDoc?.price ?? (typeof idOrItem === 'object' ? idOrItem.price : 0)),
            oldPrice: Number(pDoc?.oldPrice ?? (typeof idOrItem === 'object' ? idOrItem.oldPrice : 0)),
            slug: pDoc?.slug || (typeof idOrItem === 'object' ? idOrItem.slug : pid)
          });
        }
      }
    }

    // Merge any items from guest wishlist that aren't already in user wishlist
    for (const gItem of itemsToMerge) {
      const exists = userWishlist.items.some(
        (it) => it.productId === gItem.productId || (it.product && gItem.product && it.product.toString() === gItem.product.toString())
      );
      if (!exists) {
        userWishlist.items.push(gItem);
      }
    }

    await userWishlist.save();
    const updated = await Wishlist.findById(userWishlist._id).populate('items.product');
    return this._formatWishlist(updated);
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
