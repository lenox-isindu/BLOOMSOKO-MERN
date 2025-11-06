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

// ADMIN APIs
export const productAPI = {
  getAll: (params) => api.get('/admin/products', { params }),
  getById: (id) => api.get(`/admin/products/${id}`),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
};

// CUSTOMER APIs 
export const customerProductAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  search: (query) => api.get(`/products?search=${query}`),
  getByCategory: (category) => api.get(`/products?category=${category}`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getMain: () => api.get('/categories/main'),
  getSubcategories: (parentId) => {
    console.log('🔗 Calling subcategories API for:', parentId);
    return api.get(`/categories/subcategories/${parentId}`);
  },
  getHierarchy: () => api.get('/categories/hierarchy'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
};

// Upload API
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