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

  // Contacts
  contacts: {
    getAll: (params) => api.get('/contacts', { params }),
    getById: (id) => api.get(`/contacts/${id}`),
    search: (query, limit) => api.get('/contacts/search', { params: { q: query, limit } }),
    create: (data) => api.post('/contacts', data),
    bulkCreate: (data) => api.post('/contacts/bulk', data),
    update: (id, data) => api.put(`/contacts/${id}`, data),
    delete: (id) => api.delete(`/contacts/${id}`),
  },

  // Groups
  groups: {
    getAll: () => api.get('/groups'),
    getById: (id) => api.get(`/groups/${id}`),
    create: (data) => api.post('/groups', data),
    update: (id, data) => api.put(`/groups/${id}`, data),
    delete: (id) => api.delete(`/groups/${id}`),
    addContacts: (id, data) => api.post(`/groups/${id}/contacts`, data),
    removeContact: (groupId, contactId) => api.delete(`/groups/${groupId}/contacts/${contactId}`),
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

  // Messages
  messages: {
    getAll: (params) => api.get('/messages', { params }),
    getById: (id) => api.get(`/messages/${id}`),
    create: (data) => api.post('/messages', data),
    update: (id, data) => api.put(`/messages/${id}`, data),
    delete: (id) => api.delete(`/messages/${id}`),
    resend: (id) => api.post(`/messages/${id}/resend`),
    getRecipients: (id) => api.get(`/messages/${id}/recipients`),
  },

  // Dashboard
  dashboard: {
    getMetrics: () => api.get('/dashboard/metrics'),
  },

  // SMS Provider
  smsProvider: {
    getConfig: () => api.get('/sms-provider/config'),
    createOrUpdateConfig: (data) => api.post('/sms-provider/config', data),
    updateConfig: (id, data) => api.put(`/sms-provider/config/${id}`, data),
    getBalance: () => api.get('/sms-provider/balance'),
    refreshBalance: () => api.post('/sms-provider/balance/refresh'),
    testSms: (data) => api.post('/sms-provider/test', data),
  },

  // Uploads
  uploads: {
    uploadExcel: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/uploads/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Settings / Profile
  profile: {
    get: () => api.get('/users/me'),
    update: (data) => api.put('/users/me', data),
    changePassword: (data) => api.post('/auth/change-password', data),
  },
};

export default apiClient;

