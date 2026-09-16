import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS } from '../data/products';
import { INITIAL_COUPONS } from '../data/coupons';
import { CATEGORIES } from '../data/categories';
import { REVIEWS } from '../data/reviews';
import { BANNERS_DATA } from '../data/adminData';
import { INITIAL_RECIPES } from '../data/recipes';
import { recipeApi, adminRecipeApi } from '../utils/api';
import pushNotificationService from '../services/pushNotificationService';

const AdminContext = createContext();

const INITIAL_SETTINGS = {
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

const INITIAL_PROMOTIONS = [
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

import { adminAuthApi, productApi, categoryApi, adminSettingsApi, settingsApi, adminReviewApi, reviewApi, adminCouponApi } from '../utils/api';

const DEFAULT_ADMIN_CREDENTIALS = {
  email: "admin@aurivafoods.com",
  password: "admin"
};

export const normalizeCoupon = (c) => ({
  ...c,
  id: (c._id || c.id)?.toString(),
  _id: (c._id || c.id)?.toString(),
  code: (c.code || '').toUpperCase(),
  type: c.discountType === 'PERCENTAGE' ? 'Percentage' : (c.discountType === 'FIXED' ? 'Flat' : (c.type || 'Percentage')),
  discountType: c.discountType || (c.type === 'Flat' ? 'FIXED' : 'PERCENTAGE'),
  discount: c.discountValue !== undefined ? c.discountValue : (c.discount || 0),
  discountValue: c.discountValue !== undefined ? c.discountValue : (c.discount || 0),
  minOrder: c.minOrderValue !== undefined ? c.minOrderValue : (c.minOrder || 0),
  minOrderValue: c.minOrderValue !== undefined ? c.minOrderValue : (c.minOrder || 0),
  maxDiscount: c.maxDiscount || 0,
  usageLimit: c.usageLimit || 0,
  usageCount: c.usedCount !== undefined ? c.usedCount : (c.usageCount || 0),
  usedCount: c.usedCount !== undefined ? c.usedCount : (c.usageCount || 0),
  status: (c.status === 'ACTIVE' || c.status === 'Active') ? 'Active' : 'Inactive',
  startDate: c.startDate,
  endDate: c.endDate,
  validity: c.endDate
    ? `Valid until ${new Date(c.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : (c.validity || 'Ongoing')
});

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
    // Unregister FCM device token from backend per Push Notification SOP
    pushNotificationService.unregisterFCMToken().catch(() => {});

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

  // 2. Categories State
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(c => {
          const defaultCat = CATEGORIES.find(dc => dc.id === c.id || dc.slug === c.slug);
          const { subcategories, ...cleanC } = c;
          return {
            ...cleanC,
            status: c.status || 'Active',
            order: c.order || defaultCat?.order || 1
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

  // Recipes State
  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_admin_recipes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RECIPES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('auriva_admin_recipes', JSON.stringify(recipes));
    } catch (e) {
      console.error(e);
    }
  }, [recipes]);

  // Sync recipes from backend on mount
  useEffect(() => {
    recipeApi.getRecipes()
      .then(res => {
        if (res?.data?.recipes && res.data.recipes.length > 0) {
          const fetched = res.data.recipes.map(r => ({
            ...r,
            id: (r._id || r.id)?.toString()
          }));
          setRecipes(prev => {
            const serverIds = new Set(fetched.map(r => String(r.id || r._id)));
            const localOnly = (prev || []).filter(r => !serverIds.has(String(r.id || r._id)));
            return [...localOnly, ...fetched];
          });
        }
      })
      .catch(err => console.warn('[AdminContext] Recipes backend load note:', err.message));
  }, []);

  // Sync products from backend on mount with smart merging
  const refreshProducts = async () => {
    try {
      const res = await productApi.getAllProducts();
      if (res && res.data && res.data.products && Array.isArray(res.data.products)) {
        const fetched = res.data.products.map(p => ({
          ...p,
          id: (p._id || p.id)?.toString()
        }));
        if (fetched.length > 0) {
          setProducts(prev => {
            const serverIds = new Set(fetched.map(p => String(p.id || p._id)));
            const serverSlugs = new Set(fetched.map(p => p.slug));
            const localOnly = (prev || []).filter(p => {
              const pid = String(p.id || p._id || '');
              return !serverIds.has(pid) && !serverSlugs.has(p.slug);
            });
            return [...localOnly, ...fetched];
          });
        }
      }
    } catch (err) {
      console.warn('[AdminContext] Could not fetch products from backend API, using cached state:', err.message);
    }
  };

  // Category Sync from Backend API
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const refreshCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      let res;
      try {
        res = await categoryApi.getCategories();
      } catch (adminErr) {
        console.warn('[AdminContext] Admin categories endpoint error, trying public endpoint:', adminErr.message);
        res = await categoryApi.getActiveCategories();
      }
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.categories)
          ? res.data.categories
          : [];
      if (rawList.length > 0) {
        const fetched = rawList.map(c => ({
          ...c,
          id: (c._id || c.id)?.toString(),
          order: c.order || c.sortOrder || 1,
          sortOrder: c.sortOrder || c.order || 1,
          status: c.status || 'Active'
        }));
        setCategories(prev => {
          const serverIds = new Set(fetched.map(c => String(c.id || c._id)));
          const serverSlugs = new Set(fetched.map(c => c.slug));
          // Retain any locally created or custom categories that aren't yet on server
          const localOnly = prev.filter(c => {
            const cid = String(c.id || c._id || '');
            return !serverIds.has(cid) && !serverSlugs.has(c.slug);
          });
          return [...localOnly, ...fetched];
        });
      }
    } catch (err) {
      console.warn('[AdminContext] Could not fetch categories from backend API, using cached state:', err.message);
      setCategoriesError(err.message || 'Could not fetch categories from server');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Store Settings Sync from Backend API
  const refreshSettings = async () => {
    try {
      let res;
      if (isAdminAuthenticated) {
        try {
          res = await adminSettingsApi.getSettings();
        } catch (adminErr) {
          res = await settingsApi.getPublicSettings();
        }
      } else {
        res = await settingsApi.getPublicSettings();
      }
      if (res && res.data && res.data.settings) {
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.warn('[AdminContext] Could not fetch settings from API, using cached state:', err.message);
    }
  };

  // Reviews State & Backend API Sync
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsStats, setReviewsStats] = useState(null);

  const refreshReviews = async (params = {}) => {
    setReviewsLoading(true);
    try {
      const res = await adminReviewApi.getAllReviews(params);
      if (res && res.data) {
        if (Array.isArray(res.data.reviews)) {
          setReviews(res.data.reviews);
        }
        if (res.data.stats) {
          setReviewsStats(res.data.stats);
        }
        return res.data;
      }
    } catch (err) {
      console.warn('[AdminContext] Could not fetch reviews from backend API, using cached state:', err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshCategories();
    refreshSettings();
    refreshReviews();
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
      image: productData.image || productData.gallery?.[0] || "/src/assets/user/Types/PeriPeri.jpeg",
      gallery: Array.isArray(productData.gallery) && productData.gallery.length > 0
        ? productData.gallery
        : (productData.image ? [productData.image] : ["/src/assets/user/Types/PeriPeri.jpeg"]),
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
      console.warn('[AdminContext] Backend product create failed, rolling back:', err.message);
      // Rollback optimistic UI update
      setProducts(prev => prev.filter(p => (p.id || p._id) !== tempId));
      throw err;
    }
    return newProduct;
  };

  const updateProduct = async (id, updatedData) => {
    const targetId = id?.toString();
    const prevProducts = [...products];
    // Optimistic UI update
    setProducts(prev => prev.map(p => ((p.id || p._id)?.toString() === targetId) ? { ...p, ...updatedData } : p));

    try {
      const res = await productApi.updateProduct(targetId, updatedData);
      if (res && res.data && res.data.product) {
        const saved = {
          ...res.data.product,
          id: (res.data.product._id || res.data.product.id).toString()
        };
        setProducts(prev => prev.map(p => ((p.id || p._id)?.toString() === targetId) ? saved : p));
        return saved;
      }
    } catch (err) {
      console.warn('[AdminContext] Backend product update failed, rolling back:', err.message);
      // Rollback optimistic UI update
      setProducts(prevProducts);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    const prevProducts = [...products];
    // Optimistic UI update
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));

    try {
      await productApi.deleteProduct(id);
      await refreshProducts();
    } catch (err) {
      console.warn('[AdminContext] Backend product deletion failed, rolling back:', err.message);
      setProducts(prevProducts);
      throw err;
    }
  };

  const toggleProductStatus = async (id) => {
    const prevProducts = [...products];
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
      console.warn('[AdminContext] Backend product status toggle failed, rolling back:', err.message);
      setProducts(prevProducts);
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

  // Category Actions (Backend API + Optimistic UI)
  const addCategory = async (categoryData) => {
    const slug = (categoryData.slug || categoryData.name || `cat-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const orderNum = Number(categoryData.order || categoryData.sortOrder || 1);
    const payload = {
      ...categoryData,
      slug,
      order: orderNum,
      sortOrder: orderNum,
      status: categoryData.status || 'Active',
      badge: categoryData.badge || 'Popular',
      popular: categoryData.popular !== false,
      image: categoryData.image || "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80"
    };

    const tempId = categoryData.id || `cat-${Date.now()}`;
    const newCategory = { ...payload, id: tempId };

    // Optimistic UI update
    setCategories(prev => [...prev, newCategory]);

    try {
      const res = await categoryApi.createCategory(payload);
      if (res && res.data) {
        const saved = {
          ...res.data,
          id: (res.data._id || res.data.id).toString(),
          order: res.data.order || res.data.sortOrder || orderNum,
          sortOrder: res.data.sortOrder || res.data.order || orderNum
        };
        setCategories(prev => [
          ...prev.filter(c => (c.id || c._id) !== tempId && (c.id || c._id) !== saved.id),
          saved
        ]);
        return saved;
      }
    } catch (err) {
      console.warn('[AdminContext] Backend category create failed, rolling back:', err.message);
      setCategories(prev => prev.filter(c => (c.id || c._id) !== tempId));
      throw err;
    }
    return newCategory;
  };

  const updateCategory = async (id, updatedData) => {
    const targetId = id?.toString();
    const prevCategories = [...categories];

    // Optimistic UI update
    setCategories(prev => prev.map(c => {
      if ((c.id || c._id)?.toString() === targetId) {
        return { ...c, ...updatedData, id: targetId };
      }
      return c;
    }));

    try {
      const res = await categoryApi.updateCategory(targetId, updatedData);
      if (res && res.data) {
        const saved = {
          ...res.data,
          id: (res.data._id || res.data.id).toString(),
          order: res.data.order || res.data.sortOrder || 1,
          sortOrder: res.data.sortOrder || res.data.order || 1
        };
        setCategories(prev => prev.map(c => ((c.id || c._id)?.toString() === targetId ? saved : c)));
        return saved;
      }
    } catch (err) {
      console.warn('[AdminContext] Backend category update error, rolling back:', err.message);
      setCategories(prevCategories);
      throw err;
    }
  };

  const deleteCategory = async (id) => {
    const targetId = id?.toString();
    const prevCategories = [...categories];

    try {
      await categoryApi.deleteCategory(targetId);
      setCategories(prev => prev.filter(c => (c.id || c._id)?.toString() !== targetId));
      return { success: true };
    } catch (err) {
      console.warn('[AdminContext] Backend category deletion failed:', err.message);
      setCategories(prevCategories);
      throw err;
    }
  };

  const toggleCategoryStatus = async (id) => {
    const targetId = id?.toString();
    const target = categories.find(c => (c.id || c._id)?.toString() === targetId);
    if (!target) return;

    const nextStatus = target.status === 'Inactive' ? 'Active' : 'Inactive';
    const prevCategories = [...categories];

    setCategories(prev => prev.map(c => {
      if ((c.id || c._id)?.toString() === targetId) {
        return { ...c, status: nextStatus };
      }
      return c;
    }));

    try {
      const res = await categoryApi.updateCategoryStatus(targetId, nextStatus);
      if (res && res.data) {
        const saved = {
          ...res.data,
          id: (res.data._id || res.data.id).toString()
        };
        setCategories(prev => prev.map(c => ((c.id || c._id)?.toString() === targetId ? saved : c)));
      }
    } catch (err) {
      console.warn('[AdminContext] Backend category toggle failed, rolling back:', err.message);
      setCategories(prevCategories);
      throw err;
    }
  };

  // Coupon Actions (Backend API Integration)
  const refreshCoupons = useCallback(async () => {
    try {
      const res = await adminCouponApi.getCoupons({ limit: 100 });
      if (res && res.data && Array.isArray(res.data.coupons)) {
        const normalized = res.data.coupons.map(normalizeCoupon);
        setCoupons(normalized);
        try {
          localStorage.setItem('auriva_admin_coupons', JSON.stringify(normalized));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[AdminContext] Could not fetch coupons from backend:', err.message);
    }
  }, []);

  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  const addCoupon = async (couponData) => {
    const rawType = (couponData.discountType || (couponData.type === 'Flat' ? 'FIXED' : 'PERCENTAGE')).toUpperCase();
    const payload = {
      code: (couponData.code || '').toUpperCase().trim(),
      description: couponData.description || '',
      discountType: rawType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
      discountValue: Number(couponData.discountValue !== undefined ? couponData.discountValue : (couponData.discount || 0)),
      minOrderValue: Number(couponData.minOrderValue !== undefined ? couponData.minOrderValue : (couponData.minOrder || 0)),
      maxDiscount: Number(couponData.maxDiscount || 0),
      startDate: couponData.startDate ? new Date(couponData.startDate) : new Date(),
      endDate: couponData.endDate ? new Date(couponData.endDate) : null,
      usageLimit: Number(couponData.usageLimit || 0),
      status: (couponData.status === 'Inactive' || couponData.status === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE'
    };

    try {
      const res = await adminCouponApi.createCoupon(payload);
      if (res && res.data && res.data.coupon) {
        const normalized = normalizeCoupon(res.data.coupon);
        setCoupons(prev => [normalized, ...prev]);
        return normalized;
      }
    } catch (err) {
      console.warn('[AdminContext] Backend coupon creation failed:', err.message);
      throw err;
    } finally {
      await refreshCoupons();
    }
  };

  const updateCoupon = async (id, updatedData) => {
    const targetId = (id?._id || id?.id || id)?.toString();
    const payload = {
      ...(updatedData.code ? { code: updatedData.code.toUpperCase().trim() } : {}),
      ...(updatedData.description !== undefined ? { description: updatedData.description } : {}),
      ...(updatedData.discountType ? { discountType: updatedData.discountType.toUpperCase() } : updatedData.type ? { discountType: updatedData.type === 'Flat' ? 'FIXED' : 'PERCENTAGE' } : {}),
      ...(updatedData.discountValue !== undefined ? { discountValue: Number(updatedData.discountValue) } : updatedData.discount !== undefined ? { discountValue: Number(updatedData.discount) } : {}),
      ...(updatedData.minOrderValue !== undefined ? { minOrderValue: Number(updatedData.minOrderValue) } : updatedData.minOrder !== undefined ? { minOrderValue: Number(updatedData.minOrder) } : {}),
      ...(updatedData.maxDiscount !== undefined ? { maxDiscount: Number(updatedData.maxDiscount) } : {}),
      ...(updatedData.startDate ? { startDate: new Date(updatedData.startDate) } : {}),
      ...(updatedData.endDate !== undefined ? { endDate: updatedData.endDate ? new Date(updatedData.endDate) : null } : {}),
      ...(updatedData.usageLimit !== undefined ? { usageLimit: Number(updatedData.usageLimit) } : {}),
      ...(updatedData.status ? { status: (updatedData.status === 'Active' || updatedData.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE' } : {})
    };

    try {
      const res = await adminCouponApi.updateCoupon(targetId, payload);
      if (res && res.data && res.data.coupon) {
        const normalized = normalizeCoupon(res.data.coupon);
        setCoupons(prev => prev.map(c => ((c.id || c._id)?.toString() === targetId ? normalized : c)));
        return normalized;
      }
    } catch (err) {
      console.warn('[AdminContext] Backend coupon update failed:', err.message);
      throw err;
    } finally {
      await refreshCoupons();
    }
  };

  const deleteCoupon = async (id) => {
    const targetId = (id?._id || id?.id || id)?.toString();
    const prevCoupons = [...coupons];
    setCoupons(prev => prev.filter(c => (c.id || c._id)?.toString() !== targetId));

    try {
      await adminCouponApi.deleteCoupon(targetId);
    } catch (err) {
      console.warn('[AdminContext] Backend coupon delete failed, rolling back:', err.message);
      setCoupons(prevCoupons);
      throw err;
    }
  };

  const toggleCouponStatus = async (id) => {
    const targetId = (id?._id || id?.id || id)?.toString();
    const target = coupons.find(c => (c.id || c._id)?.toString() === targetId);
    if (!target) return;

    const nextStatus = (target.status === 'Active' || target.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    const prevCoupons = [...coupons];

    setCoupons(prev => prev.map(c => {
      if ((c.id || c._id)?.toString() === targetId) {
        return {
          ...c,
          status: nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'
        };
      }
      return c;
    }));

    try {
      await adminCouponApi.updateCoupon(targetId, { status: nextStatus });
    } catch (err) {
      console.warn('[AdminContext] Backend coupon status toggle failed, rolling back:', err.message);
      setCoupons(prevCoupons);
      throw err;
    }
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

  const approveReview = async (id) => {
    setReviews(prev => prev.map(r => (r.id === id || r._id === id) ? { ...r, status: 'Approved' } : r));
    try {
      await adminReviewApi.updateReviewStatus(id, 'APPROVED');
      refreshReviews();
      refreshProducts();
    } catch (e) {
      console.warn('API review approval failed, saved locally:', e.message);
    }
  };

  const featureReview = async (id) => {
    const target = reviews.find(r => r.id === id || r._id === id);
    const newFeatured = !target?.featured;
    setReviews(prev => prev.map(r => (r.id === id || r._id === id) ? { ...r, featured: newFeatured, status: 'Approved' } : r));
    try {
      await adminReviewApi.toggleReviewFeatured(id, newFeatured);
    } catch (e) {
      console.warn('API review feature toggle failed:', e.message);
    }
  };

  const rejectReview = async (id) => {
    setReviews(prev => prev.map(r => (r.id === id || r._id === id) ? { ...r, status: 'Rejected', featured: false } : r));
    try {
      await adminReviewApi.updateReviewStatus(id, 'REJECTED');
      refreshReviews();
      refreshProducts();
    } catch (e) {
      console.warn('API review rejection failed, saved locally:', e.message);
    }
  };

  const replyToReview = async (id, replyText) => {
    setReviews(prev => prev.map(r => (r.id === id || r._id === id) ? { ...r, adminReply: replyText } : r));
    try {
      await adminReviewApi.replyToReview(id, replyText);
    } catch (e) {
      console.warn('API review reply failed, saved locally:', e.message);
    }
  };

  const deleteReview = async (id) => {
    setReviews(prev => prev.filter(r => r.id !== id && r._id !== id));
    try {
      await adminReviewApi.deleteReview(id);
      refreshProducts();
    } catch (e) {
      console.warn('API review deletion failed:', e.message);
    }
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
  const updateSettings = async (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    try {
      const res = await adminSettingsApi.updateSettings(newSettings);
      if (res && res.data && res.data.settings) {
        setSettings(res.data.settings);
        return { success: true, settings: res.data.settings };
      }
    } catch (err) {
      console.warn('[AdminContext] Server settings update failed, saved locally:', err.message);
    }
    return { success: true };
  };

  // Recipe Actions
  const addRecipe = async (recipeData) => {
    const slug = recipeData.slug || recipeData.title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    const newRecipe = {
      ...recipeData,
      id: `recipe-${Date.now()}`,
      slug,
      status: recipeData.status || 'ACTIVE',
      isFeatured: recipeData.isFeatured !== undefined ? Boolean(recipeData.isFeatured) : true,
      createdAt: new Date().toISOString()
    };

    setRecipes(prev => [newRecipe, ...prev]);

    // Also persist to backend if admin token available
    try {
      const res = await adminRecipeApi.create(newRecipe);
      if (res?.data?.recipe) {
        const savedRecipe = { ...res.data.recipe, id: res.data.recipe._id || newRecipe.id };
        setRecipes(prev => prev.map(r => r.id === newRecipe.id ? savedRecipe : r));
        return { success: true, recipe: savedRecipe };
      }
    } catch (err) {
      console.warn('[AdminContext] Backend addRecipe note:', err.message);
    }
    return { success: true, recipe: newRecipe };
  };

  const updateRecipe = async (id, updatedData) => {
    setRecipes(prev => prev.map(r => (r.id === id || r._id === id) ? { ...r, ...updatedData } : r));

    try {
      await adminRecipeApi.update(id, updatedData);
    } catch (err) {
      console.warn('[AdminContext] Backend updateRecipe note:', err.message);
    }
    return { success: true };
  };

  const deleteRecipe = async (id) => {
    setRecipes(prev => prev.filter(r => r.id !== id && r._id !== id));

    try {
      await adminRecipeApi.delete(id);
    } catch (err) {
      console.warn('[AdminContext] Backend deleteRecipe note:', err.message);
    }
    return { success: true };
  };

  const toggleRecipeFeatured = async (id) => {
    const target = recipes.find(r => r.id === id || r._id === id);
    if (!target) return;
    const newFeatured = !target.isFeatured;
    updateRecipe(id, { isFeatured: newFeatured });
  };

  const toggleRecipeStatus = async (id) => {
    const target = recipes.find(r => r.id === id || r._id === id);
    if (!target) return;
    const newStatus = target.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    updateRecipe(id, { status: newStatus });
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
      categoriesLoading,
      categoriesError,
      refreshCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategoryStatus,
      // Coupon Actions
      refreshCoupons,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      toggleCouponStatus,
      // Banner Actions
      addBanner,
      updateBanner,
      deleteBanner,
      // Review Actions
      reviewsLoading,
      reviewsStats,
      refreshReviews,
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
      updateSettings,
      refreshSettings,
      // Recipe Actions
      recipes,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      toggleRecipeFeatured,
      toggleRecipeStatus
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
