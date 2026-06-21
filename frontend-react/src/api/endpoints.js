import api from './axios';

export const auth = {
  login: (data) => api.post('/login', data),
  register: (data) => api.post('/register', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
};

export const categories = {
  getAll: () => api.get('/categories'),
  getActive: () => api.get('/categories/active'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const products = {
  getAll: (params) => api.get('/products', { params }),
  getActive: () => api.get('/products/active'),
  getLowStock: () => api.get('/products/low-stock'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  // ✅ FIXED – FormData support for updates
  update: (id, data) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return api.post(`/products/${id}`, data);
    }
    return api.put(`/products/${id}`, data);
  },
  delete: (id) => api.delete(`/products/${id}`),
  scan: (qrCode) => api.get(`/products/scan/${qrCode}`),
  generateQR: (id) => api.get(`/products/${id}/qr`),
  updateStock: (id, data) => api.post(`/products/${id}/stock`, data),
};

export const orders = {
  getAll: (params) => api.get('/orders', { params }),
  getToday: () => api.get('/orders/today'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  invoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
};

export const stock = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  getAlerts: () => api.get('/stock/alerts'),
  bulkUpdate: (data) => api.post('/stock/bulk', data),
};

export const reports = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getForecast: (params) => api.get('/reports/forecast', { params }),
  getForecastData: (params) => api.get('/reports/forecast-data', { params }),
  getStockReport: () => api.get('/reports/stock'),
};

export const dashboard = {
  getStats: () => api.get('/dashboard'),
  getSalesChart: (period) => api.get('/dashboard/sales-chart', { params: { period } }),
  getLowStock: () => api.get('/dashboard/low-stock'),
};

export const settings = {
  getAll: () => api.get('/settings'),
  get: (key) => api.get(`/settings/${key}`),
  set: (data) => api.post('/settings', data),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  delete: (key) => api.delete(`/settings/${key}`),
};