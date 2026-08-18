import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_COUPONS } from '../data/coupons';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial items as shown in the Cart Reference Screen 04
    return [
      {
        id: "makhana-classic",
        name: "Classic Makhana",
        weight: "250g",
        price: 249,
        oldPrice: 299,
        qty: 1,
        image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300&auto=format&fit=crop&q=80"
      },
      {
        id: "makhana-peri-peri",
        name: "Peri Peri Makhana",
        weight: "250g",
        price: 249,
        oldPrice: 299,
        qty: 1,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80"
      },
      {
        id: "makhana-cheese",
        name: "Cheese Makhana",
        weight: "250g",
        price: 249,
        oldPrice: 299,
        qty: 1,
        image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&auto=format&fit=crop&q=80"
      }
    ];
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    return {
      code: "AURIVA20",
      discountPercent: 20,
      description: "20% off applied"
    };
  });

  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('AURIVA20 (20% OFF) is active');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cartToast, setCartToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('auriva_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const hideCartToast = () => {
    setCartToast(null);
  };

  const addToCart = (product, weight = '250g', qty = 1, openDrawer = false) => {
    // Find matching weight price if available
    let itemPrice = product.price;
    let itemOldPrice = product.oldPrice;
    if (product.weightOptions) {
      const match = product.weightOptions.find(w => w.weight === weight);
      if (match) {
        itemPrice = match.price;
        itemOldPrice = match.oldPrice;
      }
    }

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id && item.weight === weight);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + qty
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            weight: weight,
            price: itemPrice,
            oldPrice: itemOldPrice,
            qty: qty,
            image: product.image
          }
        ];
      }
    });

    // Trigger Popup Toast notification
    setCartToast({
      product,
      weight,
      qty,
      price: itemPrice
    });

    if (openDrawer) {
      setIsDrawerOpen(true);
    }
  };

  const removeFromCart = (id, weight) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.weight === weight)));
  };

  const updateQty = (id, weight, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id && item.weight === weight) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const applyCoupon = (codeStr) => {
    const cleanCode = codeStr.trim().toUpperCase();
    const found = INITIAL_COUPONS.find(c => c.code.toUpperCase() === cleanCode && c.status === 'Active');
    if (!found) {
      setCouponError('Invalid or expired coupon code');
      setCouponSuccess('');
      return false;
    }
    if (subtotal < (found.minOrder || 0)) {
      setCouponError(`Minimum order amount of ₹${found.minOrder} required for ${cleanCode}`);
      setCouponSuccess('');
      return false;
    }

    setAppliedCoupon({
      code: found.code,
      discountPercent: found.type === 'Percentage' ? found.discount : 0,
      flatDiscount: found.type === 'Flat' ? found.discount : 0,
      description: found.description
    });
    setCouponError('');
    setCouponSuccess(`Coupon ${found.code} applied successfully!`);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponSuccess('');
  };

  // Calculations
  const itemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      discountAmount = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
    } else if (appliedCoupon.flatDiscount) {
      discountAmount = appliedCoupon.flatDiscount;
    }
  }

  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * 0.05); // 5% GST
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
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
