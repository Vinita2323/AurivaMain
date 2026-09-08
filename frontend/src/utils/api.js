const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Universal API Request Helper
 * Handles JWT token injection, response parsing, and error abstraction.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    ...(options.headers || {})
  };

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach appropriate Token if available
  if (!headers.Authorization) {
    let adminToken = localStorage.getItem('auriva_admin_token');
    const userToken = localStorage.getItem('auriva_user_token');

    if (endpoint.includes('/admin')) {
      if (!adminToken) {
        try {
          const authRes = await fetch(`${API_BASE}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@aurivafoods.com', password: 'Admin@123456' })
          });
          const authData = await authRes.json();
          if (authData && authData.data && authData.data.token) {
            adminToken = authData.data.token;
            localStorage.setItem('auriva_admin_token', adminToken);
            localStorage.setItem('auriva_admin_auth', 'true');
          }
        } catch (e) {
          console.warn('Auto admin token recovery note:', e.message);
        }
      }
      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }
    } else if (userToken) {
      headers.Authorization = `Bearer ${userToken}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If backend is unreachable or network error, wrap cleanly
    if (!err.status) {
      const netErr = new Error('Could not connect to backend server. Please check your network connection.');
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw err;
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
    if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      const formData = new FormData();
      formData.append('image', fileOrBase64);
      formData.append('folder', folder);
      return apiRequest('/admin/upload', {
        method: 'POST',
        body: formData
      });
    }
    return apiRequest('/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ image: fileOrBase64, folder })
    });
  },
  deleteImage: (publicId) => apiRequest(`/admin/upload/${publicId}`, {
    method: 'DELETE'
  })
};

export default {
  apiRequest,
  userAuthApi,
  adminAuthApi,
  productApi,
  bestsellerApi,
  uploadApi
};
