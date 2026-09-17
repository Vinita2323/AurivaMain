import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import couponService from './couponService.js';
import { HTTP_STATUS } from '../constants/status.js';

class CartService {
  /**
   * Helper to locate an existing cart or instantiate a new one
   */
  async _findOrCreateCart(userId, guestId) {
    let cart = null;

    if (userId) {
      cart = await Cart.findOne({ user: userId });
      if (!cart && guestId) {
        // Check if there was a guest cart that should be claimed
        const guestCart = await Cart.findOne({ guestId });
        if (guestCart) {
          guestCart.user = userId;
          guestCart.guestId = null;
          await guestCart.save();
          return guestCart;
        }
      }
      if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
      }
    } else if (guestId) {
      cart = await Cart.findOne({ guestId });
      if (!cart) {
        cart = await Cart.create({ guestId, items: [] });
      }
    }

    return cart;
  }

  /**
   * Internal helper to recalculate or detach coupon based on updated items & subtotal
   */
  async _recalculateCoupon(cart) {
    if (!cart || !cart.appliedCoupon || !cart.appliedCoupon.code) return;

    const subtotal = (cart.items || []).reduce(
      (acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)),
      0
    );

    if (subtotal <= 0 || !cart.items || cart.items.length === 0) {
      cart.appliedCoupon = {
        couponId: null,
        code: null,
        discountType: null,
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        discountAmount: 0,
        description: '',
        discountPercent: 0,
        flatDiscount: 0
      };
      return;
    }

    try {
      const validation = await couponService.validateCoupon({
        code: cart.appliedCoupon.code,
        subtotal
      });

      cart.appliedCoupon = {
        couponId: validation.coupon.id,
        code: validation.coupon.code,
        discountType: validation.coupon.discountType,
        discountValue: validation.coupon.discountValue,
        minOrderValue: validation.coupon.minOrderValue,
        maxDiscount: validation.coupon.maxDiscount,
        discountAmount: validation.discount,
        description: validation.coupon.description,
        discountPercent: validation.coupon.discountType === 'PERCENTAGE' ? validation.coupon.discountValue : 0,
        flatDiscount: validation.coupon.discountType === 'FIXED' ? validation.discount : 0
      };
    } catch (err) {
      // If validation fails (e.g. min order requirement not met, coupon expired), remove it cleanly
      cart.appliedCoupon = {
        couponId: null,
        code: null,
        discountType: null,
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        discountAmount: 0,
        description: '',
        discountPercent: 0,
        flatDiscount: 0
      };
    }
  }

  /**
   * Format cart output for frontend
   */
  _formatCart(cart) {
    if (!cart) {
      return {
        items: [],
        appliedCoupon: null,
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        finalSubtotal: 0
      };
    }

    const items = (cart.items || []).map((item) => {
      const prodId = item.product?._id || item.product?.id || item.product;
      return {
        _id: item._id ? item._id.toString() : undefined,
        id: prodId ? prodId.toString() : item._id?.toString(),
        productId: prodId ? prodId.toString() : undefined,
        name: item.name || item.product?.name || 'Snack Product',
        image: item.image || item.product?.image || '/assets/user/Types/PeriPeri.jpeg',
        weight: item.weight || '150g',
        price: Number(item.price || item.product?.price || 0),
        oldPrice: Number(item.oldPrice || item.product?.oldPrice || 0),
        qty: Number(item.qty || 1)
      };
    });

    const itemCount = items.reduce((acc, it) => acc + it.qty, 0);
    const subtotal = items.reduce((acc, it) => acc + (it.price * it.qty), 0);

    let discount = 0;
    let appliedCoupon = null;

    if (cart.appliedCoupon && cart.appliedCoupon.code) {
      discount = Math.max(0, Number(cart.appliedCoupon.discountAmount || 0));
      appliedCoupon = {
        couponId: cart.appliedCoupon.couponId ? cart.appliedCoupon.couponId.toString() : null,
        code: cart.appliedCoupon.code,
        discountType: cart.appliedCoupon.discountType,
        discountValue: cart.appliedCoupon.discountValue,
        minOrderValue: cart.appliedCoupon.minOrderValue,
        maxDiscount: cart.appliedCoupon.maxDiscount,
        discountAmount: discount,
        description: cart.appliedCoupon.description || '',
        discountPercent: cart.appliedCoupon.discountPercent || 0,
        flatDiscount: cart.appliedCoupon.flatDiscount || 0
      };
    }

    const finalSubtotal = Math.max(0, subtotal - discount);

    return {
      _id: cart._id ? cart._id.toString() : undefined,
      items,
      appliedCoupon,
      itemCount,
      subtotal,
      discount,
      finalSubtotal
    };
  }

  /**
   * Get Cart for current user or guest
   */
  async getCart(userId, guestId) {
    if (mongoose.connection.readyState !== 1) {
      return {
        items: [],
        appliedCoupon: null,
        itemCount: 0,
        subtotal: 0,
        discount: 0,
        finalSubtotal: 0
      };
    }

    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) {
      return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };
    }

    const cart = await Cart.findOne(query).populate('items.product');
    if (cart && cart.appliedCoupon && cart.appliedCoupon.code) {
      await this._recalculateCoupon(cart);
      await cart.save();
    }
    return this._formatCart(cart);
  }

  /**
   * Add item to cart
   */
  async addToCart(userId, guestId, { productId, weight = '150g', qty = 1 }) {
    if (!productId) {
      const err = new Error('Product ID is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database is currently offline. Cannot persist cart.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const cart = await this._findOrCreateCart(userId, guestId);
    if (!cart) {
      const err = new Error('Could not identify user or guest session for cart.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Lookup product to snapshot authentic details & weight price
    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ slug: productId });
    }

    if (!product) {
      const err = new Error('Product not found in catalog.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    let finalPrice = product.price;
    let finalOldPrice = product.oldPrice;

    if (product.weightOptions && product.weightOptions.length > 0) {
      const match = product.weightOptions.find((w) => w.weight === weight);
      if (match) {
        finalPrice = match.price;
        finalOldPrice = match.oldPrice || 0;
      }
    }

    const cleanQty = Math.max(1, Number(qty) || 1);
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === product._id.toString() && item.weight === weight
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].qty += cleanQty;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        image: product.image,
        weight: weight,
        price: finalPrice,
        oldPrice: finalOldPrice,
        qty: cleanQty
      });
    }

    await this._recalculateCoupon(cart);
    await cart.save();
    return this.getCart(userId, guestId);
  }

  /**
   * Update item quantity
   */
  async updateQty(userId, guestId, { productId, weight = '150g', qty, delta }) {
    if (!productId) {
      const err = new Error('Product ID is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) {
      const err = new Error('Session identifier missing.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const cart = await Cart.findOne(query);
    if (!cart) {
      return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString() && item.weight === weight
    );

    if (existingIndex > -1) {
      if (qty !== undefined) {
        const newQty = Number(qty);
        if (newQty <= 0) {
          cart.items.splice(existingIndex, 1);
        } else {
          cart.items[existingIndex].qty = newQty;
        }
      } else if (delta !== undefined) {
        const newQty = cart.items[existingIndex].qty + Number(delta);
        if (newQty <= 0) {
          cart.items.splice(existingIndex, 1);
        } else {
          cart.items[existingIndex].qty = newQty;
        }
      }

      await this._recalculateCoupon(cart);
      await cart.save();
    }

    return this.getCart(userId, guestId);
  }

  /**
   * Remove single item from cart
   */
  async removeItem(userId, guestId, { productId, weight }) {
    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };

    const cart = await Cart.findOne(query);
    if (!cart) return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };

    cart.items = cart.items.filter((item) => {
      const matchProduct = item.product.toString() === productId.toString();
      const matchWeight = weight ? item.weight === weight : true;
      return !(matchProduct && matchWeight);
    });

    await this._recalculateCoupon(cart);
    await cart.save();
    return this.getCart(userId, guestId);
  }

  /**
   * Apply coupon to cart
   */
  async applyCoupon(userId, guestId, code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      const err = new Error('Coupon code is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const cart = await this._findOrCreateCart(userId, guestId);
    if (!cart || !cart.items || cart.items.length === 0) {
      const err = new Error('Your cart is empty. Please add items before applying a coupon.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    const subtotal = cart.items.reduce(
      (acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)),
      0
    );

    const validation = await couponService.validateCoupon({
      code: cleanCode,
      subtotal
    });

    cart.appliedCoupon = {
      couponId: validation.coupon.id,
      code: validation.coupon.code,
      discountType: validation.coupon.discountType,
      discountValue: validation.coupon.discountValue,
      minOrderValue: validation.coupon.minOrderValue,
      maxDiscount: validation.coupon.maxDiscount,
      discountAmount: validation.discount,
      description: validation.coupon.description || '',
      discountPercent: validation.coupon.discountType === 'PERCENTAGE' ? validation.coupon.discountValue : 0,
      flatDiscount: validation.coupon.discountType === 'FIXED' ? validation.discount : 0
    };

    await cart.save();
    return this._formatCart(cart);
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(userId, guestId) {
    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) {
      return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };
    }

    const cart = await Cart.findOne(query);
    if (cart) {
      cart.appliedCoupon = {
        couponId: null,
        code: null,
        discountType: null,
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        discountAmount: 0,
        description: '',
        discountPercent: 0,
        flatDiscount: 0
      };
      await cart.save();
      return this._formatCart(cart);
    }

    return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };
  }

  /**
   * Clear entire cart (called after successful purchase or clear cart action)
   */
  async clearCart(userId, guestId) {
    const query = userId ? { user: userId } : guestId ? { guestId } : null;
    if (!query) return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };

    const cart = await Cart.findOne(query);
    if (cart) {
      cart.items = [];
      cart.appliedCoupon = {
        couponId: null,
        code: null,
        discountType: null,
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        discountAmount: 0,
        description: '',
        discountPercent: 0,
        flatDiscount: 0
      };
      await cart.save();
    }

    return { items: [], appliedCoupon: null, itemCount: 0, subtotal: 0, discount: 0, finalSubtotal: 0 };
  }

  /**
   * Sync / Merge guest cart items into authenticated user cart upon login
   */
  async syncCart(userId, guestId, guestItems = []) {
    if (!userId) {
      const err = new Error('User authentication required for cart sync.');
      err.statusCode = HTTP_STATUS.UNAUTHORIZED;
      throw err;
    }

    const userCart = await this._findOrCreateCart(userId, null);
    let itemsToMerge = Array.isArray(guestItems) ? [...guestItems] : [];

    // Also check if there's a stored guest cart in DB
    if (guestId) {
      const dbGuestCart = await Cart.findOne({ guestId });
      if (dbGuestCart && dbGuestCart.items.length > 0) {
        itemsToMerge = [...itemsToMerge, ...dbGuestCart.items];
        // Clean up guest cart record
        await Cart.deleteOne({ _id: dbGuestCart._id });
      }
    }

    for (const item of itemsToMerge) {
      const prodId = item.productId || item.product?._id || item.product || item.id;
      if (!prodId) continue;

      const existingIndex = userCart.items.findIndex(
        (it) => it.product.toString() === prodId.toString() && it.weight === (item.weight || '150g')
      );

      const qtyToAdd = Math.max(1, Number(item.qty || 1));

      if (existingIndex > -1) {
        userCart.items[existingIndex].qty = Math.max(userCart.items[existingIndex].qty, qtyToAdd);
      } else {
        userCart.items.push({
          product: prodId,
          name: item.name || 'Snack Product',
          image: item.image || '',
          weight: item.weight || '150g',
          price: Number(item.price || 249),
          oldPrice: Number(item.oldPrice || 0),
          qty: qtyToAdd
        });
      }
    }

    await this._recalculateCoupon(userCart);
    await userCart.save();
    return this.getCart(userId, null);
  }
}

export const cartService = new CartService();
export default cartService;
