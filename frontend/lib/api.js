import axios from 'axios';

/**
 * API Configuration
 * Backend API base URL - can be overridden with NEXT_PUBLIC_API_URL environment variable
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('messenger-token') || sessionStorage.getItem('messenger-token')
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('messenger-token');
        sessionStorage.removeItem('messenger-token');
        sessionStorage.removeItem('messenger-user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiClient = {
  // Auth
  auth: {
    login: (credentials) => {
      // Backend expects { username, password } but accepts email as username
      const payload = credentials.username 
        ? credentials 
        : { username: credentials.email || credentials.username, password: credentials.password };
      return api.post('/auth/login', payload);
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('messenger-token');
        sessionStorage.removeItem('messenger-token');
        sessionStorage.removeItem('messenger-user');
      }
    },
  },

  // Users
  users: {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
  },

  // Uploads
  uploads: {
    upload: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    getFile: (filename) => `${API_BASE_URL}/uploads/${filename}`,
  },

  // Settings / Profile
  profile: {
    get: () => api.get('/users/me'),
    update: (data) => api.put('/users/me', data),
    changePassword: (data) => api.post('/auth/change-password', data),
  },
};

export default apiClient;

