import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS } from '../data/products';
import { INITIAL_COUPONS } from '../data/coupons';
import { BANNERS_DATA } from '../data/adminData';


const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return PRODUCTS;
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_coupons');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COUPONS;
  });

  const [banners, setBanners] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_banners');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return BANNERS_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem('auriva_admin_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('auriva_admin_coupons', JSON.stringify(coupons));
    } catch (e) {
      console.error(e);
    }
  }, [coupons]);

  useEffect(() => {
    try {
      localStorage.setItem('auriva_admin_banners', JSON.stringify(banners));
    } catch (e) {
      console.error(e);
    }
  }, [banners]);

  // Product Actions
  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      slug: (productData.name || '').toLowerCase().replace(/\s+/g, '-'),
      rating: 4.8,
      reviewsCount: 1,
      inStock: true,
      stockCount: Number(productData.stockCount || 50),
      price: Number(productData.price || 199),
      oldPrice: Number(productData.oldPrice || 249),
      badge: productData.badge || "New",
      image: productData.image || "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=700&auto=format&fit=crop&q=80"
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id, updatedData) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleProductStatus = (id) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));
  };

  // Coupon Actions
  const addCoupon = (couponData) => {
    const newCoupon = {
      ...couponData,
      id: `coupon-${Date.now()}`,
      code: (couponData.code || '').toUpperCase().trim(),
      status: "Active",
      usageCount: 0
    };
    setCoupons(prev => [newCoupon, ...prev]);
  };

  const updateCoupon = (id, updatedData) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const deleteCoupon = (id) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const toggleCouponStatus = (id) => {
    setCoupons(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: c.status === "Active" ? "Inactive" : "Active"
        };
      }
      return c;
    }));
  };

  // Banner Actions
  const addBanner = (bannerData) => {
    const newBanner = {
      ...bannerData,
      id: `banner-${Date.now()}`,
      status: "Active"
    };
    setBanners(prev => [newBanner, ...prev]);
  };

  const deleteBanner = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  return (
    <AdminContext.Provider value={{
      products,
      coupons,
      banners,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductStatus,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      toggleCouponStatus,
      addBanner,
      deleteBanner
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
