import axios from 'axios';

const api = axios.create({
  baseURL:         '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,   // 10 second timeout — prevents hanging requests
});

// ── Response interceptor ──────────────────────────────────────────────────────
// Do NOT auto-redirect on 401 — let React Router handle it
// Auto-redirect was causing infinite loop
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Just reject — components handle 401 themselves
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:           (data)  => api.post('/auth/login', data),
  register:        (data)  => api.post('/auth/register', data),
  logout:          ()      => api.post('/auth/logout'),
  me:              ()      => api.get('/auth/me'),
  verifyAnswer:    (data)  => api.post('/auth/forgot-password/verify', data),
  resetPassword:   (data)  => api.post('/auth/forgot-password/reset', data),
  updateProfile:   (data)  => api.put('/auth/profile', data),
  changePassword:  (data)  => api.put('/auth/change-password', data),
};

// ── Residents ─────────────────────────────────────────────────────────────────
export const residentsAPI = {
  getAll:   (params) => api.get('/residents', { params }),
  getOne:   (id)     => api.get(`/residents/${id}`),
  create:   (data)   => api.post('/residents', data),
  update:   (id, d)  => api.put(`/residents/${id}`, d),
  remove:   (id)     => api.delete(`/residents/${id}`),
};

// ── Officials ─────────────────────────────────────────────────────────────────
export const officialsAPI = {
  getAll:   ()       => api.get('/officials'),
  create:   (data)   => api.post('/officials', data),
  update:   (id, d)  => api.put(`/officials/${id}`, d),
  remove:   (id)     => api.delete(`/officials/${id}`),
};

// ── Blotter ───────────────────────────────────────────────────────────────────
export const blotterAPI = {
  getAll:   (params) => api.get('/blotter', { params }),
  create:   (data)   => api.post('/blotter', data),
  update:   (id, d)  => api.put(`/blotter/${id}`, d),
  remove:   (id)     => api.delete(`/blotter/${id}`),
};

// ── Documents (factory) ───────────────────────────────────────────────────────
const docAPI = (endpoint) => ({
  getAll:       (params) => api.get(`/${endpoint}/admin`, { params }),
  getMy:        ()       => api.get(`/${endpoint}/my`),
  create:       (data)   => api.post(`/${endpoint}`, data),
  updateStatus: (id, d)  => api.patch(`/${endpoint}/${id}/status`, d),
  remove:       (id)     => api.delete(`/${endpoint}/${id}`),
  walkin:       (data)   => api.post(`/${endpoint}/walkin`, data),
});

export const clearanceAPI  = docAPI('clearance');
export const indigencyAPI  = docAPI('indigency');
export const residencyAPI  = docAPI('residency');
export const permitAPI     = docAPI('permits');

// ── History ───────────────────────────────────────────────────────────────────
export const historyAPI = {
  getAll: (params) => api.get('/doc-history', { params }),
};

// ── Verify ────────────────────────────────────────────────────────────────────
export const verifyAPI = {
  getAll:         (q = '') => api.get(`/verify${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  approve:        (id)       => api.patch(`/verify/${id}/approve`),
  reject:         (id, data) => api.delete(`/verify/${id}/reject`, { data }),
  reevaluate:     (id)       => api.patch(`/verify/${id}/reevaluate`),
  toggleStatus:   (id)       => api.patch(`/verify/${id}/toggle-status`),
  resetPassword:  (id, data) => api.patch(`/verify/${id}/reset-password`, data),
  deleteAccount:  (id)       => api.delete(`/verify/${id}/delete`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  pay:        (data)   => api.post('/payments/pay', data),
  getMy:      ()       => api.get('/payments/my'),
  getForDoc:  (ref)    => api.get(`/payments/doc/${ref}`),
  getAll:     (params) => api.get('/payments/admin', { params }),
  confirm:    (id)     => api.patch(`/payments/${id}/confirm`),
  reject:     (id)     => api.patch(`/payments/${id}/reject`),
  acceptCash: (id)     => api.patch(`/payments/${id}/accept-cash`),
};

export default api;
