import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to extract data from response with proper error handling
const extractData = (response) => {
  try {
    const responseData = response.data;
    
    // If response has success property, return the data array
    if (responseData && responseData.success !== undefined) {
      return responseData.data || [];
    }
    
    // If response is already an array, return it
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    // If response is an object with data property, return that
    if (responseData && responseData.data !== undefined) {
      return responseData.data || [];
    }
    
    // Fallback: return empty array
    console.warn('Unexpected API response format:', responseData);
    return [];
  } catch (error) {
    console.error('Error extracting data from response:', error);
    return [];
  }
};

// ADMIN APIs - FIXED VERSION
export const productAPI = {
  getAll: async (params) => {
    const response = await api.get('/admin/products', { params });
    return response.data; // Return the raw data
  },
  getById: async (id) => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/admin/products', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },
};
// CUSTOMER APIs 
export const customerProductAPI = {
  getAll: (params) => api.get('/products', { params }).then(extractData),
  getById: (id) => api.get(`/products/${id}`).then(extractData),
  search: (query) => api.get(`/products?search=${query}`).then(extractData),
  getByCategory: (category) => api.get(`/products?category=${category}`).then(extractData),
};

export const categoryAPI = {
  getAll: () => api.get('/categories').then(extractData),
  getMain: () => api.get('/categories/main').then(extractData),
  getSubcategories: (parentId) => {
    console.log('🔗 Calling subcategories API for:', parentId);
    return api.get(`/categories/subcategories/${parentId}`).then(extractData);
  },
  getHierarchy: () => api.get('/categories/hierarchy').then(extractData),
  getById: (id) => api.get(`/categories/${id}`).then(extractData),
  getByLevel: (level) => api.get(`/categories/level/${level}`).then(extractData),
  create: (data) => api.post('/categories', data).then(extractData),
  update: (id, data) => api.put(`/categories/${id}`, data).then(extractData),
  // delete: (id) => api.delete(`/categories/${id}`).then(extractData), // Uncomment when backend supports delete
};

// Order APIs
export const orderAPI = {
  // Admin orders
  getAll: (params) => api.get('/orders/admin', { params }).then(response => response.data),
  getStats: () => api.get('/orders/admin/stats').then(response => response.data),
  updateStatus: (id, data) => api.put(`/orders/admin/${id}/status`, data).then(response => response.data),
  cancel: (id) => api.put(`/orders/${id}/cancel`).then(response => response.data),
  
  // User orders
  getUserOrders: (params) => api.get('/orders/user', { params }).then(response => response.data),
  getOrder: (id) => api.get(`/orders/${id}`).then(response => response.data),
};

// Upload API - 
export const uploadAPI = {
  uploadSingle: (formData) => api.post('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadMultiple: (formData) => api.post('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;