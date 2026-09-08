import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS } from '../data/products';
import { INITIAL_COUPONS } from '../data/coupons';
import { CATEGORIES } from '../data/categories';
import { REVIEWS } from '../data/reviews';
import { BANNERS_DATA } from '../data/adminData';

const AdminContext = createContext();

export const INITIAL_SETTINGS = {
  storeName: "AURIVÁ Foods Private Limited",
  supportEmail: "care@aurivafoods.com",
  supportPhone: "+91 9876543210",
  freeDeliveryThreshold: 499,
  standardDeliveryFee: 40,
  gstRate: 5,
  hubAddress: "AURIVÁ Central Fulfillment Hub, Plot 14, Sanwer Road Industrial Area, Indore, MP - 452015",
  lowStockThreshold: 30,
  currency: "₹"
};

export const INITIAL_PROMOTIONS = [
  {
    id: "promo-1",
    name: "Festive Monsoon Super Saver",
    tagline: "Flat 25% OFF on all Makhana Combos and Gifting Tubs",
    type: "Category Discount",
    discount: 25,
    category: "makhana-combos",
    bannerTag: "Festive Exclusive",
    status: "Active",
    startDate: "01 Aug 2024",
    endDate: "30 Sep 2024",
    minOrder: 599
  },
  {
    id: "promo-2",
    name: "High Protein Fitness Flash Sale",
    tagline: "Buy Any 2 Fitness Snacks & Get 1 Free Himalayan Salt Tub",
    type: "BOGO Offer",
    discount: 33,
    category: "healthy-fitness-makhana",
    bannerTag: "Flash Deal",
    status: "Active",
    startDate: "10 Aug 2024",
    endDate: "25 Aug 2024",
    minOrder: 499
  },
  {
    id: "promo-3",
    name: "New Flavors Launch Bundle",
    tagline: "Flat ₹150 OFF on orders containing Peri Peri & Cheese tubs",
    type: "Flat Off",
    discount: 150,
    category: "flavoured-makhana",
    bannerTag: "New Launch",
    status: "Inactive",
    startDate: "01 Jul 2024",
    endDate: "31 Jul 2024",
    minOrder: 799
  }
];

import { adminAuthApi, productApi } from '../utils/api';

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: "admin@aurivafoods.com",
  password: "admin"
};

export function AdminProvider({ children }) {
  // 0. Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('auriva_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [adminToken, setAdminToken] = useState(() => {
    try {
      return localStorage.getItem('auriva_admin_token') || null;
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      name: "Super Admin",
      email: "admin@aurivafoods.com",
      role: "ADMIN"
    };
  });

  const loginAdmin = async (inputEmail, inputPassword) => {
    const trimmedEmail = (inputEmail || '').trim().toLowerCase();
    const trimmedPassword = (inputPassword || '').trim();

    try {
      // 1. Try real backend admin login
      const response = await adminAuthApi.login(trimmedEmail, trimmedPassword);
      if (response && response.data) {
        const { token, admin } = response.data;
        setIsAdminAuthenticated(true);
        setAdminToken(token);
        setAdminUser(admin);
        try {
          localStorage.setItem('auriva_admin_auth', 'true');
          localStorage.setItem('auriva_admin_token', token);
          localStorage.setItem('auriva_admin_user', JSON.stringify(admin));
        } catch (e) {
          console.error(e);
        }
        return { success: true, admin };
      }
    } catch (err) {
      // If backend returns explicit rejection (invalid credentials), report it directly
      if (err.status && (err.status === 401 || err.status === 400 || err.status === 429)) {
        return { success: false, message: err.message || 'Invalid email or password.' };
      }

      // If backend is offline, check fallback dev credentials
      if (
        (trimmedEmail === 'admin@aurivafoods.com' || trimmedEmail === 'admin') &&
        (trimmedPassword === 'admin' || trimmedPassword === 'Admin@123456' || trimmedPassword === 'auriva@2026')
      ) {
        setIsAdminAuthenticated(true);
        try {
          localStorage.setItem('auriva_admin_auth', 'true');
        } catch (e) {
          console.error(e);
        }
        return { success: true };
      }

      return { success: false, message: err.message || "Invalid email or password." };
    }

    return { success: false, message: "Invalid email or password." };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAdminToken(null);
    try {
      localStorage.removeItem('auriva_admin_auth');
      localStorage.removeItem('auriva_admin_token');
      localStorage.removeItem('auriva_admin_user');
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Products State
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isPouch = (p) => {
            const name = (p.name || '').toLowerCase();
            const img = typeof p.image === 'string' ? p.image : '';
            return name.includes('peri') || name.includes('cream') || name.includes('tomato') || 
                   name.includes('salted') || name.includes('masala') || name.includes('pudina') ||
                   img.includes('PeriPeri') || img.includes('CreamOnion') || img.includes('Tomato') || img.includes('Types');
          };
          return [...parsed.filter(isPouch), ...parsed.filter(p => !isPouch(p))];
        }
      }
    } catch (e) {
      console.error(e);
    }
    return PRODUCTS;
  });

  // 2. Categories State (Active Mock Subcategories)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(c => {
          const defaultCat = CATEGORIES.find(dc => dc.id === c.id || dc.slug === c.slug);
          return {
            ...c,
            status: c.status || 'Active',
            order: c.order || defaultCat?.order || 1,
            subcategories: (c.subcategories && c.subcategories.length > 0) ? c.subcategories : (defaultCat?.subcategories || [])
          };
        });
      }
    } catch (e) {
      console.error(e);
    }
    return CATEGORIES;
  });

  // 3. Coupons State
  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_coupons');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COUPONS;
  });

  // 4. Banners State
  const [banners, setBanners] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_banners');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return BANNERS_DATA;
  });

  // 5. Reviews State
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_reviews');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return REVIEWS.map(r => ({ ...r, status: 'Approved', adminReply: null }));
  });

  // 6. Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SETTINGS;
  });

  // 7. Promotions State
  const [promotions, setPromotions] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_promotions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PROMOTIONS;
  });

  // LocalStorage sync effects
  useEffect(() => {
    try { localStorage.setItem('auriva_admin_products', JSON.stringify(products)); } catch (e) { console.error(e); }
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem('auriva_admin_categories', JSON.stringify(categories)); } catch (e) { console.error(e); }
  }, [categories]);

  useEffect(() => {
    try { localStorage.setItem('auriva_admin_coupons', JSON.stringify(coupons)); } catch (e) { console.error(e); }
  }, [coupons]);

  useEffect(() => {
    try { localStorage.setItem('auriva_admin_banners', JSON.stringify(banners)); } catch (e) { console.error(e); }
  }, [banners]);

  useEffect(() => {
    try { localStorage.setItem('auriva_admin_reviews', JSON.stringify(reviews)); } catch (e) { console.error(e); }
  }, [reviews]);

  useEffect(() => {
    try { localStorage.setItem('auriva_admin_settings', JSON.stringify(settings)); } catch (e) { console.error(e); }
  }, [settings]);

  useEffect(() => {
    try { localStorage.setItem('auriva_admin_promotions', JSON.stringify(promotions)); } catch (e) { console.error(e); }
  }, [promotions]);

  // Sync products from backend on mount
  const refreshProducts = async () => {
    try {
      const res = await productApi.getAllProducts();
      if (res && res.data && res.data.products && Array.isArray(res.data.products)) {
        const fetched = res.data.products.map(p => ({
          ...p,
          id: (p._id || p.id)?.toString()
        }));
        if (fetched.length > 0) {
          setProducts(fetched);
        }
      }
    } catch (err) {
      console.warn('[AdminContext] Could not fetch products from backend API, using cached state:', err.message);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  // Product Actions
  const addProduct = async (productData) => {
    const slug = (productData.slug || productData.name || `product-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const priceNum = Number(productData.price || 249);
    const oldPriceNum = Number(productData.oldPrice || Math.round(priceNum * 1.2));
    const stockCount = Number(productData.stockCount ?? 150);
    const isBestseller = productData.isBestseller !== undefined ? Boolean(productData.isBestseller) : true;

    const payload = {
      ...productData,
      slug,
      price: priceNum,
      oldPrice: oldPriceNum,
      stockCount: stockCount,
      isBestseller: isBestseller,
      badge: productData.badge || (isBestseller ? "BESTSELLER" : "New"),
      image: productData.image || "/src/assets/user/Types/PeriPeri.jpeg",
      weight: productData.weight || '150g',
      inStock: productData.inStock !== false,
      rating: Number(productData.rating || 4.8),
      reviewsCount: Number(productData.reviewsCount || 100),
      weightOptions: productData.weightOptions || [
        { weight: "150g", price: priceNum, oldPrice: oldPriceNum, isDefault: true },
        { weight: "300g", price: Math.round(priceNum * 1.8), oldPrice: Math.round(oldPriceNum * 1.8) }
      ]
    };

    const tempId = productData.id || `prod-${Date.now()}`;
    const newProduct = { ...payload, id: tempId };

    // Optimistic UI update
    setProducts(prev => [newProduct, ...prev]);

    // Persist to MongoDB backend
    try {
      const res = await productApi.createProduct(payload);
      if (res && res.data && res.data.product) {
        const saved = {
          ...res.data.product,
          id: (res.data.product._id || res.data.product.id).toString()
        };
        setProducts(prev => [saved, ...prev.filter(p => (p.id || p._id) !== tempId && (p.id || p._id) !== saved.id)]);
        await refreshProducts();
        return saved;
      }
    } catch (err) {
      console.warn('[AdminContext] Backend product create failed:', err.message);
      throw err;
    }
    return newProduct;
  };

  const updateProduct = async (id, updatedData) => {
    // Optimistic UI update
    setProducts(prev => prev.map(p => (p.id === id || p._id === id) ? { ...p, ...updatedData } : p));

    try {
      const res = await productApi.updateProduct(id, updatedData);
      if (res && res.data && res.data.product) {
        const saved = {
          ...res.data.product,
          id: (res.data.product._id || res.data.product.id).toString()
        };
        setProducts(prev => prev.map(p => (p.id === id || p._id === id) ? saved : p));
        await refreshProducts();
        return saved;
      }
    } catch (err) {
      console.warn('[AdminContext] Backend product update failed:', err.message);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    // Optimistic UI update
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));

    try {
      await productApi.deleteProduct(id);
      await refreshProducts();
    } catch (err) {
      console.warn('[AdminContext] Backend product deletion failed:', err.message);
      throw err;
    }
  };

  const toggleProductStatus = async (id) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id || p._id === id) {
        const nextInStock = !p.inStock;
        return { ...p, inStock: nextInStock, status: nextInStock ? 'ACTIVE' : 'INACTIVE' };
      }
      return p;
    }));

    try {
      const res = await productApi.toggleStatus(id);
      if (res && res.data && res.data.product) {
        const saved = { ...res.data.product, id: (res.data.product._id || res.data.product.id).toString() };
        setProducts(prev => prev.map(p => (p.id === id || p._id === id) ? saved : p));
        await refreshProducts();
      }
    } catch (err) {
      console.warn('[AdminContext] Backend product status toggle failed:', err.message);
      throw err;
    }
  };

  // Inventory Stock Adjusters
  const updateProductStock = async (id, newStock) => {
    const count = Math.max(0, Number(newStock));
    setProducts(prev => prev.map(p => {
      if (p.id === id || p._id === id) {
        return { ...p, stockCount: count, inStock: count > 0 };
      }
      return p;
    }));

    try {
      await productApi.updateStock(id, count);
    } catch (err) {
      console.warn('[AdminContext] Backend stock update failed:', err.message);
    }
  };

  const adjustProductStock = async (id, delta) => {
    const prod = products.find(p => p.id === id || p._id === id);
    const newStock = Math.max(0, (prod?.stockCount || 0) + delta);
    await updateProductStock(id, newStock);
  };

  const bulkRestock = (ids, amount = 100) => {
    ids.forEach(id => {
      const prod = products.find(p => p.id === id || p._id === id);
      const newStock = (prod?.stockCount || 0) + amount;
      updateProductStock(id, newStock);
    });
  };

  // Category Actions
  const addCategory = (categoryData) => {
    const slug = (categoryData.slug || categoryData.name || `cat-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newCategory = {
      ...categoryData,
      id: categoryData.id || `cat-${Date.now()}`,
      slug: slug,
      count: 0,
      badge: categoryData.badge || 'Popular',
      popular: categoryData.popular !== false,
      image: categoryData.image || "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80"
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id, updatedData) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Coupon Actions
  const addCoupon = (couponData) => {
    const newCoupon = {
      ...couponData,
      id: `coupon-${Date.now()}`,
      code: (couponData.code || '').toUpperCase().trim(),
      status: "Active",
      usageCount: 0,
      discount: Number(couponData.discount || 15),
      minOrder: Number(couponData.minOrder || 0),
      type: couponData.type || "Percentage",
      validity: couponData.validity || "Valid until Dec 2024",
      description: couponData.description || "Special promotional discount"
    };
    setCoupons(prev => [newCoupon, ...prev]);
    return newCoupon;
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
      status: "Active",
      title: bannerData.title || "Special Wellness Promotion",
      subtitle: bannerData.subtitle || "Premium healthy snack offers curated for you",
      cta: bannerData.cta || "Shop Now",
      link: bannerData.link || "/shop",
      tag: bannerData.tag || "Promotional",
      startDate: bannerData.startDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      endDate: bannerData.endDate || "31 Dec 2024"
    };
    setBanners(prev => [newBanner, ...prev]);
    return newBanner;
  };

  const updateBanner = (id, updatedData) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
  };

  const deleteBanner = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  // Review Actions
  const addReview = (reviewData) => {
    const newReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      author: reviewData.author || "Valued Customer",
      avatar: reviewData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      rating: Number(reviewData.rating || 5),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "Pending", // Needs admin approval
      verified: true,
      helpfulCount: 0,
      adminReply: null
    };
    setReviews(prev => [newReview, ...prev]);
    return newReview;
  };

  const approveReview = (id) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
  };

  const featureReview = (id) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, featured: !r.featured, status: 'Approved' } : r));
  };

  const rejectReview = (id) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
  };

  const replyToReview = (id, replyText) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, adminReply: replyText } : r));
  };

  const deleteReview = (id) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  // Promotion Campaign Actions
  const addPromotion = (promoData) => {
    const newPromo = {
      ...promoData,
      id: `promo-${Date.now()}`,
      status: "Active"
    };
    setPromotions(prev => [newPromo, ...prev]);
    return newPromo;
  };

  const updatePromotion = (id, updatedData) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deletePromotion = (id) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const togglePromotionStatus = (id) => {
    setPromotions(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: p.status === "Active" ? "Inactive" : "Active"
        };
      }
      return p;
    }));
  };

  // Settings Actions
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated,
      adminUser,
      loginAdmin,
      logoutAdmin,
      DEFAULT_ADMIN_CREDENTIALS,
      products,
      categories,
      coupons,
      banners,
      reviews,
      settings,
      promotions,
      // Product Actions
      refreshProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleProductStatus,
      // Inventory Actions
      updateProductStock,
      adjustProductStock,
      bulkRestock,
      // Category Actions
      addCategory,
      updateCategory,
      deleteCategory,
      // Coupon Actions
      addCoupon,
      updateCoupon,
      deleteCoupon,
      toggleCouponStatus,
      // Banner Actions
      addBanner,
      updateBanner,
      deleteBanner,
      // Review Actions
      addReview,
      approveReview,
      featureReview,
      rejectReview,
      replyToReview,
      deleteReview,
      // Promotion Actions
      addPromotion,
      updatePromotion,
      deletePromotion,
      togglePromotionStatus,
      // Settings Actions
      updateSettings
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
