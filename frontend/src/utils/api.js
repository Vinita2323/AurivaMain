const LOCAL_API_BASE = 'http://localhost:5000/api/v1';

function resolveApiBase() {
  // Always use local backend while Vite is in development — avoids hitting
  // production (aurivabites.in) where new routes are not deployed yet.
  if (import.meta.env.DEV) {
    return LOCAL_API_BASE;
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return String(envUrl).replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}/api/v1`;
    }
  }

  return LOCAL_API_BASE;
}

const API_BASE = resolveApiBase();

/** Decode JWT payload without verifying signature (client-side expiry check only). */
export function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const part = token.split('.')[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return !payload;
  return payload.exp * 1000 <= Date.now();
}

function clearExpiredUserSession() {
  try {
    localStorage.removeItem('auriva_user_token');
    localStorage.removeItem('auriva_user');
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auriva:auth-expired'));
  }
}

/**
 * Universal API Request Helper
 * Handles JWT token injection, response parsing, and error abstraction.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const { timeoutMs, ...fetchOptions } = options;

  const headers = {
    ...(fetchOptions.headers || {})
  };

  // Only set application/json if body is not FormData
  if (!(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach appropriate Token if available
  // IMPORTANT: Never send admin JWT on storefront/user APIs (cart, wishlist, orders…).
  // Doing so causes User.findById(adminId) to fail → 401 → clears the fresh user session after OTP login.
  let attachedAuthRole = null; // 'ADMIN' | 'USER' | null
  if (!headers.Authorization) {
    let adminToken = localStorage.getItem('auriva_admin_token');
    let userToken = localStorage.getItem('auriva_user_token');
    const pathIsAdmin =
      typeof window !== 'undefined' && window.location.pathname.includes('/admin');
    const endpointIsAdmin = endpoint.includes('/admin') || endpoint.includes('/auth/admin');
    const isAdminContext = endpointIsAdmin || pathIsAdmin;

    // Drop stale user JWTs before they spam 401s on checkout / orders
    if (userToken && isJwtExpired(userToken)) {
      clearExpiredUserSession();
      userToken = null;
    }

    if (isAdminContext || (endpoint.includes('/fcm-tokens') && !userToken && pathIsAdmin)) {
      // Never auto-login with embedded credentials — admin must sign in via /admin/login
      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
        attachedAuthRole = 'ADMIN';
      } else if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
        attachedAuthRole = 'USER';
      }
    } else if (userToken) {
      headers.Authorization = `Bearer ${userToken}`;
      attachedAuthRole = 'USER';
    }
    // No admin-token fallback on user/storefront endpoints
  } else if (typeof headers.Authorization === 'string') {
    const payload = decodeJwtPayload(headers.Authorization.replace(/^Bearer\s+/i, ''));
    attachedAuthRole = payload?.role === 'ADMIN' ? 'ADMIN' : payload ? 'USER' : null;
  }

  const controller = typeof timeoutMs === 'number' && timeoutMs > 0 ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller?.signal || fetchOptions.signal
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Auto-retry once on 401 Unauthorized for admin endpoints
      const isAdminRetry = endpoint.includes('/admin') || 
        (typeof window !== 'undefined' && window.location.pathname.includes('/admin'));
      if (response.status === 401 && isAdminRetry && !endpoint.includes('/auth/admin/login')) {
        try {
          localStorage.removeItem('auriva_admin_token');
          localStorage.removeItem('auriva_admin_auth');
          localStorage.removeItem('auriva_admin_user');
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
          window.location.assign('/admin/login');
        }
      }

      // User session expired / invalid — clear so checkout can prompt login.
      // Only clear when THIS request actually used the user JWT (never after an admin-token mishap).
      const isUserAuthEndpoint = endpoint.includes('/auth/user');
      if (
        response.status === 401 &&
        !isAdminRetry &&
        !isUserAuthEndpoint &&
        attachedAuthRole === 'USER' &&
        localStorage.getItem('auriva_user_token')
      ) {
        clearExpiredUserSession();
      }

      let errorMsg = data?.message || data?.error?.message;
      if (Array.isArray(data?.error) && data.error.length > 0) {
        errorMsg = data.error.map((e) => (typeof e === 'object' ? (e.message || e.msg || JSON.stringify(e)) : String(e))).join(' • ');
      }
      if (data?.data?.errors && Array.isArray(data.data.errors) && data.data.errors.length > 0) {
        const errorStrings = data.data.errors.map(e => (typeof e === 'object' ? (e.message || e.msg || JSON.stringify(e)) : String(e)));
        errorMsg = errorStrings.join(' • ');
      }
      if (!errorMsg) {
        errorMsg = `Request failed with status ${response.status}`;
      }
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please try again with a smaller image or check your connection.');
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    // If backend is unreachable or network error, wrap cleanly
    if (!err.status) {
      const netErr = new Error('Could not connect to backend server. Please check your network connection.');
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// User Auth API methods
export const userAuthApi = {
  sendOtp: (phone) => apiRequest('/auth/user/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone })
  }),

  verifyOtp: (phone, otp) => apiRequest('/auth/user/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp })
  }),

  getProfile: () => apiRequest('/auth/user/profile', {
    method: 'GET'
  }),

  updateProfile: (profileData) => apiRequest('/auth/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData)
  })
};

// Admin Auth API methods
export const adminAuthApi = {
  login: (email, password) => apiRequest('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  getProfile: () => apiRequest('/auth/admin/profile', {
    method: 'GET'
  }),

  updateProfile: (data) => apiRequest('/auth/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  changePassword: (data) => apiRequest('/auth/admin/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Product Catalog API
export const productApi = {
  getAllProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.inStock !== undefined) query.append('inStock', params.inStock);
    const qs = query.toString();
    return apiRequest(`/products${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getProductById: (id) => apiRequest(`/products/${id}`, { method: 'GET' }),
  createProduct: (productData) => apiRequest('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  updateProduct: (id, productData) => apiRequest(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  deleteProduct: (id) => apiRequest(`/admin/products/${id}`, {
    method: 'DELETE'
  }),
  toggleStatus: (id) => apiRequest(`/admin/products/${id}/status`, {
    method: 'PATCH'
  }),
  updateStock: (id, stockCount) => apiRequest(`/admin/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stockCount })
  })
};

// Bestsellers API (Public + Admin)
export const bestsellerApi = {
  // Public Homepage retrieval
  getPublicBestsellers: () => apiRequest('/bestsellers', { method: 'GET' }),

  // Admin Management APIs
  getAdminBestsellers: () => apiRequest('/admin/bestsellers', { method: 'GET' }),

  addProducts: (productIds) => apiRequest('/admin/bestsellers', {
    method: 'POST',
    body: JSON.stringify({ productIds })
  }),

  removeProduct: (bestsellerId) => apiRequest(`/admin/bestsellers/${bestsellerId}`, {
    method: 'DELETE'
  }),

  reorder: (items) => apiRequest('/admin/bestsellers/reorder', {
    method: 'PUT',
    body: JSON.stringify({ items })
  }),

  toggleStatus: (bestsellerId, isActive) => apiRequest(`/admin/bestsellers/${bestsellerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  }),

  updateSectionConfig: (configData) => apiRequest('/admin/bestsellers/section-status', {
    method: 'PATCH',
    body: JSON.stringify(configData)
  })
};

// Cloudinary Media Upload API
export const uploadApi = {
  uploadImage: async (fileOrBase64, folder = 'auriva_products') => {
    const UPLOAD_TIMEOUT_MS = 35_000;
    if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      const formData = new FormData();
      formData.append('image', fileOrBase64);
      formData.append('folder', folder);
      return apiRequest('/admin/upload', {
        method: 'POST',
        body: formData,
        timeoutMs: UPLOAD_TIMEOUT_MS
      });
    }
    return apiRequest('/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ image: fileOrBase64, folder }),
      timeoutMs: UPLOAD_TIMEOUT_MS
    });
  },
  deleteImage: (publicId) => apiRequest(`/admin/upload/${publicId}`, {
    method: 'DELETE'
  })
};

// Category Management API (Admin + Public)
export const categoryApi = {
  // Public Storefront (Active categories only)
  getActiveCategories: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/categories${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  // Admin Categories (All with status filter, search, sort, pagination)
  getCategories: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return apiRequest(`/admin/categories${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getCategoryById: (id) => apiRequest(`/admin/categories/${id}`, { method: 'GET' }),

  createCategory: (categoryData) => apiRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData)
  }),

  updateCategory: (id, categoryData) => apiRequest(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData)
  }),

  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, {
    method: 'DELETE'
  }),

  updateCategoryStatus: (id, status) => apiRequest(`/admin/categories/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
};

// Cart Management API (Persistent Backend Cart)
export const cartApi = {
  getCart: (guestId) => {
    return apiRequest('/cart', {
      method: 'GET',
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  addItem: ({ productId, weight = '150g', qty = 1 }, guestId) => {
    return apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, weight, qty }),
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  updateItemQty: ({ productId, weight, qty, delta }, guestId) => {
    return apiRequest('/cart/items', {
      method: 'PUT',
      body: JSON.stringify({ productId, weight, qty, delta }),
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  removeItem: ({ productId, weight }, guestId) => {
    return apiRequest('/cart/items', {
      method: 'DELETE',
      body: JSON.stringify({ productId, weight }),
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  clearCart: (guestId) => {
    return apiRequest('/cart', {
      method: 'DELETE',
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  syncCart: (items = [], guestId) => {
    return apiRequest('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items, guestId })
    });
  },

  applyCoupon: (code, guestId) => {
    return apiRequest('/cart/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, couponCode: code }),
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  removeCoupon: (guestId) => {
    return apiRequest('/cart/remove-coupon', {
      method: 'POST',
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  }
};

export const wishlistApi = {
  getWishlist: (guestId) => {
    return apiRequest('/wishlist', {
      method: 'GET',
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  toggleWishlist: (productId, productData = {}, guestId) => {
    return apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId, productData }),
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  removeItem: (productId, guestId) => {
    return apiRequest('/wishlist/items', {
      method: 'DELETE',
      body: JSON.stringify({ productId }),
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  clearWishlist: (guestId) => {
    return apiRequest('/wishlist', {
      method: 'DELETE',
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },

  syncWishlist: (items = [], guestId) => {
    return apiRequest('/wishlist/sync', {
      method: 'POST',
      body: JSON.stringify({ items, guestId })
    });
  }
};

// Address Management API
export const addressApi = {
  getAddresses: () => apiRequest('/user/addresses', { method: 'GET' }),
  addAddress: (addressData) => apiRequest('/user/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData)
  }),
  updateAddress: (id, addressData) => apiRequest(`/user/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(addressData)
  }),
  deleteAddress: (id) => apiRequest(`/user/addresses/${id}`, {
    method: 'DELETE'
  }),
  setDefaultAddress: (id) => apiRequest(`/user/addresses/${id}/default`, {
    method: 'PATCH'
  })
};

/**
 * Helper to download authenticated binary PDF files as a file download
 */
export async function fetchPdfBlob(url) {
  const adminToken = localStorage.getItem('auriva_admin_token');
  const userToken = localStorage.getItem('auriva_user_token');
  const token = url.includes('/admin') ? (adminToken || userToken) : (userToken || adminToken);

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.message || `Failed to load invoice (HTTP ${response.status})`);
  }

  return await response.blob();
}

export function downloadBlobFile(blob, filename = 'Invoice.pdf') {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
}

export async function downloadPdfBlob(url, fallbackFilename = 'Invoice.pdf') {
  const blob = await fetchPdfBlob(url);
  downloadBlobFile(blob, fallbackFilename);
  return true;
}

// Order Management API (Customer)
export const orderApi = {
  placeOrder: (orderPayload) => {
    const guestId =
      orderPayload?.guestId ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('auriva_guest_id') : null);
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
      headers: guestId ? { 'x-guest-id': guestId } : {}
    });
  },
  getUserOrders: () => apiRequest('/orders', { method: 'GET' }),
  getOrderById: (id) => apiRequest(`/orders/${id}`, { method: 'GET' }),
  cancelOrder: (id, reason = '') => apiRequest(`/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  getInvoiceBlob: (id) => {
    const url = `${API_BASE}/orders/${id}/invoice`;
    return fetchPdfBlob(url);
  },
  downloadInvoice: (id, options = { download: true }) => {
    const url = `${API_BASE}/orders/${id}/invoice${options.download ? '?download=1' : ''}`;
    return downloadPdfBlob(url, `Invoice-${id}.pdf`);
  }
};

// Admin Order Management API
export const adminDashboardApi = {
  getSummary: () => apiRequest('/admin/dashboard', { method: 'GET' })
};

export const adminOrderApi = {
  getAllOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'all' && params.status !== 'All') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    const qs = query.toString();
    return apiRequest(`/admin/orders${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getOrderById: (id) => apiRequest(`/admin/orders/${id}`, { method: 'GET' }),
  updateStatus: (id, status, note = '') => apiRequest(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note })
  }),
  dispatchOrder: (id, dispatchData = {}) => apiRequest(`/admin/orders/${id}/dispatch`, {
    method: 'PATCH',
    body: JSON.stringify(dispatchData)
  }),
  cancelOrder: (id, reason = '') => apiRequest(`/admin/orders/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  }),
  // Shiprocket (admin-only; credentials stay on backend)
  shiprocketCreate: (id, body = {}) => apiRequest(`/admin/orders/${id}/shiprocket/create`, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  shiprocketFulfill: (id, body = {}) => apiRequest(`/admin/orders/${id}/shiprocket/fulfill`, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  shiprocketServiceability: (id) => apiRequest(`/admin/orders/${id}/shiprocket/serviceability`, {
    method: 'GET'
  }),
  shiprocketAwb: (id, body = {}) => apiRequest(`/admin/orders/${id}/shiprocket/awb`, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  shiprocketPickup: (id) => apiRequest(`/admin/orders/${id}/shiprocket/pickup`, {
    method: 'POST',
    body: JSON.stringify({})
  }),
  shiprocketLabel: (id) => apiRequest(`/admin/orders/${id}/shiprocket/label`, {
    method: 'POST',
    body: JSON.stringify({})
  }),
  shiprocketInvoice: (id) => apiRequest(`/admin/orders/${id}/shiprocket/invoice`, {
    method: 'POST',
    body: JSON.stringify({})
  }),
  shiprocketManifest: (id) => apiRequest(`/admin/orders/${id}/shiprocket/manifest`, {
    method: 'POST',
    body: JSON.stringify({})
  }),
  shiprocketTrack: (id) => apiRequest(`/admin/orders/${id}/shiprocket/track`, {
    method: 'GET'
  }),
  shiprocketCancel: (id, cancelOrder = false) => apiRequest(`/admin/orders/${id}/shiprocket/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancelOrder: Boolean(cancelOrder) })
  }),
  shiprocketStatus: () => apiRequest('/admin/shiprocket/status', { method: 'GET' }),
  getInvoiceBlob: (id) => {
    const url = `${API_BASE}/admin/orders/${id}/invoice`;
    return fetchPdfBlob(url);
  },
  downloadInvoice: (id, options = { download: true }) => {
    const url = `${API_BASE}/admin/orders/${id}/invoice${options.download ? '?download=1' : ''}`;
    return downloadPdfBlob(url, `Invoice-${id}.pdf`);
  }
};

// Checkout API
export const checkoutApi = {
  getSummary: () => apiRequest('/checkout/summary', { method: 'GET' })
};

// Shipping quote (DB fee vs Shiprocket live rates)
export const shippingApi = {
  getQuote: ({ pincode, paymentMethod, subtotal, weightKg }) => {
    const query = new URLSearchParams();
    if (pincode) query.set('pincode', pincode);
    if (paymentMethod) query.set('paymentMethod', paymentMethod);
    if (subtotal != null) query.set('subtotal', String(subtotal));
    if (weightKg != null) query.set('weightKg', String(weightKg));
    return apiRequest(`/shipping/quote?${query.toString()}`, { method: 'GET' });
  }
};

// Store Settings & Business Rules API (Admin + Public)
export const adminSettingsApi = {
  getSettings: () => apiRequest('/admin/settings', { method: 'GET' }),
  updateSettings: (data) => apiRequest('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

export const settingsApi = {
  getPublicSettings: () => apiRequest('/settings', { method: 'GET' })
};

// Customer & Public Reviews API
export const reviewApi = {
  getProductReviews: (productId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.rating) query.append('rating', params.rating);
    if (params.sort) query.append('sort', params.sort);
    const qs = query.toString();
    return apiRequest(`/products/${productId}/reviews${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  checkReviewEligibility: (productId) =>
    apiRequest(`/products/${productId}/reviews/eligibility`, { method: 'GET' }),
  submitReview: (productId, payload) =>
    apiRequest(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

// Admin Reviews Moderation API
export const adminReviewApi = {
  getAllReviews: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    if (params.rating) query.append('rating', params.rating);
    if (params.featured !== undefined) query.append('featured', params.featured);
    if (params.search) query.append('search', params.search);
    if (params.productId) query.append('productId', params.productId);
    const qs = query.toString();
    return apiRequest(`/admin/reviews${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  updateReviewStatus: (id, status) =>
    apiRequest(`/admin/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  toggleReviewFeatured: (id, featured) =>
    apiRequest(`/admin/reviews/${id}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ featured })
    }),
  replyToReview: (id, reply) =>
    apiRequest(`/admin/reviews/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply })
    }),
  deleteReview: (id) =>
    apiRequest(`/admin/reviews/${id}`, { method: 'DELETE' })
};

export const paymentApi = {
  getConfig: () =>
    apiRequest('/payments/config'),
  /** Prepaid: open Razorpay without creating Auriva order yet */
  createCheckoutSession: (payload) =>
    apiRequest('/payments/checkout-session', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  createOrder: (payload) =>
    apiRequest('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  verifyPayment: (payload) =>
    apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getOrderPayment: (orderId) =>
    apiRequest(`/payments/order/${orderId}`)
};

export const adminPaymentApi = {
  getPayments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    if (params.method) query.append('method', params.method);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/admin/payments${qs ? `?${qs}` : ''}`);
  },
  getPaymentById: (id) =>
    apiRequest(`/admin/payments/${id}`),
  initiateRefund: (id, payload) =>
    apiRequest(`/admin/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

// Customer Coupon API
export const couponApi = {
  validateCoupon: (code, subtotal = 0) =>
    apiRequest('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, couponCode: code, subtotal })
    })
};

// Admin Coupon Management API
export const adminCouponApi = {
  getCoupons: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'all' && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/admin/coupons${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getCouponById: (id) =>
    apiRequest(`/admin/coupons/${id}`, { method: 'GET' }),
  createCoupon: (payload) =>
    apiRequest('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateCoupon: (id, payload) =>
    apiRequest(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteCoupon: (id) =>
    apiRequest(`/admin/coupons/${id}`, { method: 'DELETE' })
};

// Admin Notifications API
export const adminNotificationApi = {
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.type) query.append('type', params.type);
    const qs = query.toString();
    return apiRequest(`/admin/notifications${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getUnreadCount: () =>
    apiRequest('/admin/notifications/unread-count', { method: 'GET' }),
  markAsRead: (id) =>
    apiRequest(`/admin/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    apiRequest('/admin/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) =>
    apiRequest(`/admin/notifications/${id}`, { method: 'DELETE' })
};

// Customer Notifications API
export const notificationApi = {
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.type) query.append('type', params.type);
    const qs = query.toString();
    return apiRequest(`/notifications${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getUnreadCount: () =>
    apiRequest('/notifications/unread-count', { method: 'GET' }),
  markAsRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) =>
    apiRequest(`/notifications/${id}`, { method: 'DELETE' })
};

// Public Recipes API
export const recipeApi = {
  getRecipes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.featured) query.append('featured', '1');
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/recipes${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getRecipe: (idOrSlug) =>
    apiRequest(`/recipes/${idOrSlug}`, { method: 'GET' })
};

// Admin Recipe Management API
export const adminRecipeApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/admin/recipes${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  create: (data) =>
    apiRequest('/admin/recipes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    apiRequest(`/admin/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id) =>
    apiRequest(`/admin/recipes/${id}`, { method: 'DELETE' })
};

// FCM Push Notification Token API (SOP implementation)
export const fcmApi = {
  saveToken: (token, platform = 'web') =>
    apiRequest('/fcm-tokens/save', {
      method: 'POST',
      body: JSON.stringify({ token, platform })
    }),
  saveMobileToken: (token) =>
    apiRequest('/fcm-tokens/mobile/save', {
      method: 'POST',
      body: JSON.stringify({ token, platform: 'mobile' })
    }),
  removeToken: (token, platform = 'web') =>
    apiRequest('/fcm-tokens/remove', {
      method: 'DELETE',
      body: JSON.stringify({ token, platform })
    }),
  sendTestNotification: (payload = {}) =>
    apiRequest('/fcm-tokens/test', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getStatus: () =>
    apiRequest('/fcm-tokens/status', { method: 'GET' })
};

export default {
  apiRequest,
  userAuthApi,
  adminAuthApi,
  productApi,
  bestsellerApi,
  categoryApi,
  uploadApi,
  cartApi,
  wishlistApi,
  addressApi,
  orderApi,
  adminDashboardApi,
  adminOrderApi,
  checkoutApi,
  shippingApi,
  adminSettingsApi,
  settingsApi,
  reviewApi,
  adminReviewApi,
  paymentApi,
  adminPaymentApi,
  couponApi,
  adminCouponApi,
  adminNotificationApi,
  notificationApi,
  recipeApi,
  adminRecipeApi,
  fcmApi
};



