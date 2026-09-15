import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAdmin } from './AdminContext';
import { cartApi, settingsApi } from '../utils/api';
import { resolveProductImage } from '../utils/productImage';

const CartContext = createContext();

const getOrCreateGuestId = () => {
  try {
    let gid = localStorage.getItem('auriva_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('auriva_guest_id', gid);
    }
    return gid;
  } catch {
    return 'guest_' + Date.now();
  }
};

export function CartProvider({ children }) {
  const { coupons, settings } = useAdmin();
  const [liveSettings, setLiveSettings] = useState(null);
  const [guestId] = useState(getOrCreateGuestId);

  useEffect(() => {
    let isMounted = true;
    settingsApi.getPublicSettings()
      .then(res => {
        if (isMounted && res?.data?.settings) {
          setLiveSettings(res.data.settings);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // 1. Clean cart initialization - starts EMPTY without any hardcoded dummy items
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 2. Coupon state - starts clean without dummy coupon
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_coupon');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartToast, setCartToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync state with localStorage cache
  useEffect(() => {
    try {
      localStorage.setItem('auriva_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('auriva_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('auriva_coupon');
      }
    } catch (e) {
      console.error(e);
    }
  }, [appliedCoupon]);

  // Fetch or sync authoritative cart from backend MongoDB on mount
  const refreshCartFromBackend = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await cartApi.getCart(guestId);
      if (res && res.data && res.data.cart) {
        const serverCart = res.data.cart;
        if (Array.isArray(serverCart.items) && serverCart.items.length > 0) {
          setCartItems(serverCart.items);
          if (serverCart.appliedCoupon) {
            setAppliedCoupon(serverCart.appliedCoupon);
          }
        } else {
          // If server cart is empty but local has items, sync them up to backend
          const localSaved = localStorage.getItem('auriva_cart');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const syncRes = await cartApi.syncCart(parsed, guestId);
              if (syncRes?.data?.cart?.items) {
                setCartItems(syncRes.data.cart.items);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[CartContext] Could not fetch cart from backend, using local state:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [guestId]);

  useEffect(() => {
    refreshCartFromBackend();
  }, [refreshCartFromBackend]);

  const hideCartToast = () => {
    setCartToast(null);
  };

  /**
   * Add to Cart from any section (Homepage bestsellers, Shop, Details, Wishlist)
   * Standardizes product ID, weight, image and price snapshot
   */
  const addToCart = async (product, weight = '150g', qty = 1, openDrawer = false) => {
    if (!product) return;

    const prodId = (product._id || product.id || product.slug)?.toString();
    const cleanWeight = weight || product.weight || '150g';
    const cleanQty = Math.max(1, Number(qty) || 1);

    let itemPrice = Number(product.price || 249);
    let itemOldPrice = Number(product.oldPrice || 0);

    if (product.weightOptions && Array.isArray(product.weightOptions)) {
      const match = product.weightOptions.find(w => w.weight === cleanWeight);
      if (match) {
        itemPrice = Number(match.price || itemPrice);
        itemOldPrice = Number(match.oldPrice || itemOldPrice);
      }
    }

    const resolvedImg = resolveProductImage(product);

    // 1. Optimistic UI update
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => {
        const itId = (item.productId || item.id || item._id)?.toString();
        return itId === prodId && item.weight === cleanWeight;
      });

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + cleanQty
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: prodId,
            productId: prodId,
            name: product.name,
            weight: cleanWeight,
            price: itemPrice,
            oldPrice: itemOldPrice,
            qty: cleanQty,
            image: resolvedImg
          }
        ];
      }
    });

    setCartToast({
      product,
      weight: cleanWeight,
      qty: cleanQty,
      price: itemPrice
    });

    if (openDrawer) {
      setIsDrawerOpen(true);
    }

    // 2. Persist permanently to MongoDB Backend
    try {
      const res = await cartApi.addItem(
        { productId: prodId, weight: cleanWeight, qty: cleanQty },
        guestId
      );
      if (res && res.data && res.data.cart) {
        if (Array.isArray(res.data.cart.items)) setCartItems(res.data.cart.items);
        if (res.data.cart.appliedCoupon !== undefined) setAppliedCoupon(res.data.cart.appliedCoupon);
      }
    } catch (err) {
      console.warn('[CartContext] Backend cart add sync note:', err.message);
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = async (id, weight) => {
    const targetId = id?.toString();

    // 1. Optimistic update
    setCartItems(prev => prev.filter(item => {
      const itId = (item.productId || item.id || item._id)?.toString();
      return !(itId === targetId && item.weight === weight);
    }));

    // 2. Persist to backend
    try {
      const res = await cartApi.removeItem({ productId: targetId, weight }, guestId);
      if (res && res.data && res.data.cart) {
        if (Array.isArray(res.data.cart.items)) setCartItems(res.data.cart.items);
        if (res.data.cart.appliedCoupon !== undefined) setAppliedCoupon(res.data.cart.appliedCoupon);
      }
    } catch (err) {
      console.warn('[CartContext] Backend cart remove sync note:', err.message);
    }
  };

  /**
   * Update item quantity (step up/down)
   */
  const updateQty = async (id, weight, delta) => {
    const targetId = id?.toString();

    // 1. Optimistic update
    setCartItems(prev => {
      return prev.map(item => {
        const itId = (item.productId || item.id || item._id)?.toString();
        if (itId === targetId && item.weight === weight) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });

    // 2. Persist to backend
    try {
      const res = await cartApi.updateItemQty({ productId: targetId, weight, delta }, guestId);
      if (res && res.data && res.data.cart) {
        if (Array.isArray(res.data.cart.items)) setCartItems(res.data.cart.items);
        if (res.data.cart.appliedCoupon !== undefined) setAppliedCoupon(res.data.cart.appliedCoupon);
      }
    } catch (err) {
      console.warn('[CartContext] Backend cart updateQty sync note:', err.message);
    }
  };

  /**
   * Clear entire cart (Called after successful checkout/order placement or user reset)
   */
  const clearCart = async () => {
    setCartItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('auriva_cart');
      localStorage.removeItem('auriva_coupon');
      await cartApi.clearCart(guestId);
    } catch (err) {
      console.warn('[CartContext] Backend clearCart sync note:', err.message);
    }
  };

  // Backend-Driven Authoritative Coupon Application
  const applyCoupon = async (codeStr) => {
    const cleanCode = (codeStr || '').trim().toUpperCase();
    if (!cleanCode) {
      const msg = 'Please enter a coupon code';
      setCouponError(msg);
      setCouponSuccess('');
      return { success: false, message: msg };
    }

    if (cartItems.length === 0) {
      const msg = 'Cart is empty. Add items before applying a coupon.';
      setCouponError(msg);
      setCouponSuccess('');
      return { success: false, message: msg };
    }

    try {
      const res = await cartApi.applyCoupon(cleanCode, guestId);
      if (res && res.data && res.data.cart) {
        const cart = res.data.cart;
        setAppliedCoupon(cart.appliedCoupon);
        if (Array.isArray(cart.items) && cart.items.length > 0) {
          setCartItems(cart.items);
        }
        const successMsg = res.message || `Coupon ${cart.appliedCoupon?.code || cleanCode} applied successfully!`;
        setCouponSuccess(successMsg);
        setCouponError('');
        return { success: true, message: successMsg };
      }
      return { success: false, message: res?.message || 'Failed to apply coupon' };
    } catch (err) {
      const errMsg = err.message || 'Invalid or expired coupon code';
      setCouponError(errMsg);
      setCouponSuccess('');
      return { success: false, message: errMsg };
    }
  };

  const removeCoupon = async () => {
    try {
      const res = await cartApi.removeCoupon(guestId);
      if (res && res.data && res.data.cart) {
        setAppliedCoupon(res.data.cart.appliedCoupon || null);
        if (Array.isArray(res.data.cart.items)) {
          setCartItems(res.data.cart.items);
        }
      } else {
        setAppliedCoupon(null);
      }
    } catch (e) {
      console.warn('Remove coupon API note:', e.message);
      setAppliedCoupon(null);
    }
    setCouponError('');
    setCouponSuccess('');
  };

  // Calculations with dynamic store settings
  const itemCount = cartItems.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (typeof appliedCoupon.discountAmount === 'number' && appliedCoupon.discountAmount > 0) {
      discountAmount = appliedCoupon.discountAmount;
    } else if (appliedCoupon.discountType === 'PERCENTAGE' || appliedCoupon.discountPercent) {
      const pct = Number(appliedCoupon.discountValue || appliedCoupon.discountPercent || 0);
      discountAmount = Math.round((subtotal * pct) / 100);
      if (appliedCoupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
      }
    } else if (appliedCoupon.discountType === 'FIXED' || appliedCoupon.flatDiscount) {
      discountAmount = Math.min(Number(appliedCoupon.discountValue || appliedCoupon.flatDiscount || 0), subtotal);
    }
  }

  const effectiveSettings = liveSettings || settings;
  const freeShippingMin = effectiveSettings?.freeDeliveryThreshold ?? 499;
  const standardFee = effectiveSettings?.standardDeliveryFee ?? 40;
  const gstRate = (effectiveSettings?.gstRate ?? 5) / 100;

  const deliveryFee = subtotal >= freeShippingMin || subtotal === 0 ? 0 : standardFee;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * gstRate);
  const total = Math.max(0, taxableAmount + deliveryFee + tax);

  return (
    <CartContext.Provider value={{
      cartItems,
      itemCount,
      subtotal,
      discountAmount,
      deliveryFee,
      tax,
      total,
      appliedCoupon,
      couponError,
      couponSuccess,
      isDrawerOpen,
      setIsDrawerOpen,
      cartToast,
      hideCartToast,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      applyCoupon,
      removeCoupon,
      freeShippingMin,
      standardFee,
      isSyncing,
      refreshCartFromBackend
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
