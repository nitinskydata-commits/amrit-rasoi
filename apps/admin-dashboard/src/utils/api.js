import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set Content-Type based on data type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const loginAdmin = (credentials) => api.post('/login', credentials);
export const getProfile = () => api.get('/me');

// Dashboard APIs
export const getDashboardStats = () => api.get('/admin/dashboard');
export const getSalesAnalytics = () => api.get('/analytics/sales');
export const getInventoryAnalytics = () => api.get('/analytics/inventory');
export const getDemandForecasts = () => api.get('/analytics/forecasts');

// Product APIs - FIXED
export const getAllProducts = (params) => api.get('/admin/products', { params });
export const createProduct = (data) => api.post('/admin/product/new', data);
export const updateProduct = (id, data) => api.put(`/admin/product/${id}`, data);
export const deleteProduct = (id) => api.delete(`/admin/product/${id}`);
export const bulkDeleteProducts = (productIds) => api.post('/admin/products/bulk-delete', { productIds });

// Order APIs
export const getAllOrders = (params) => api.get('/admin/orders', { params });
export const updateOrderStatus = (id, data) => api.put(`/admin/order/${id}`, data);
export const processRefund = (id, data) => api.put(`/admin/order/${id}/refund`, data);
export const deleteOrder = (id) => api.delete(`/admin/order/${id}`);

// User APIs
export const getAllUsers = () => api.get('/admin/users');
export const updateUserRole = (id, role) => api.put(`/admin/user/${id}`, { role });
export const secureRoleUpdate = (id, data) => api.put(`/admin/user/secure-role-update/${id}`, data);
export const deleteUser = (id) => api.delete(`/admin/user/${id}`);

// Review APIs
export const getAllReviews = () => api.get('/admin/reviews');
export const deleteReview = (id) => api.delete(`/admin/review/${id}`);

// Brand APIs
export const getAllBrands = () => api.get('/admin/brands');
export const createBrand = (data) => api.post('/admin/brand/new', data);
export const updateBrand = (id, data) => api.put(`/admin/brand/${id}`, data);
export const deleteBrand = (id) => api.delete(`/admin/brand/${id}`);

// Coupon APIs
export const getAllCoupons = () => api.get('/admin/coupons');
export const createCoupon = (data) => api.post('/admin/coupon/new', data);
export const updateCoupon = (id, data) => api.put(`/admin/coupon/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/admin/coupon/${id}`);

// Collaboration APIs
export const getAllCollaborations = () => api.get('/admin/collaborations');
export const createCollaboration = (data) => api.post('/admin/collaboration/new', data);
export const updateCollaboration = (id, data) => api.put(`/admin/collaboration/${id}`, data);
export const deleteCollaboration = (id) => api.delete(`/admin/collaboration/${id}`);

// Advertisement APIs
export const getAllAds = () => api.get('/admin/ads');
export const createAd = (data) => api.post('/admin/ad/new', data);
export const updateAd = (id, data) => api.put(`/admin/ad/${id}`, data);
export const deleteAd = (id) => api.delete(`/admin/ad/${id}`);
export const toggleAdStatus = (id) => api.put(`/admin/ad/${id}/toggle`);

// Settings APIs
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (data) => api.put('/admin/settings', data);
export const changeAdminPassword = (data) => api.put('/admin/change-password', data);

// Testimonial APIs
export const getAllTestimonials = () => api.get('/admin/testimonials');
export const createTestimonial = (data) => api.post('/admin/testimonials', data);
export const updateTestimonial = (id, data) => api.put(`/admin/testimonials/${id}`, data);
export const deleteTestimonial = (id) => api.delete(`/admin/testimonials/${id}`);

// Newsletter APIs
export const getAllSubscribers = () => api.get('/admin/newsletter');
export const deleteSubscriber = (id) => api.delete(`/admin/newsletter/${id}`);

// Badge APIs
export const getAllBadges = () => api.get('/admin/badges');
export const createBadge = (data) => api.post('/admin/badges', data);
export const updateBadge = (id, data) => api.put(`/admin/badges/${id}`, data);
export const deleteBadge = (id) => api.delete(`/admin/badges/${id}`);

// Warehouse APIs
export const getAllWarehouses = () => api.get('/warehouses');
export const createWarehouse = (data) => api.post('/warehouses', data);
export const intakeStock = (data) => api.post('/warehouses/intake', data);
export const transferStock = (data) => api.post('/warehouses/transfer', data);
export const getStockLedger = (params) => api.get('/warehouses/ledger', { params });
export const getWarehouseStock = (id) => api.get(`/warehouses/${id}/stock`);

// Finance APIs
export const getTransactions = (params) => api.get('/finance/transactions', { params });
export const getPayouts = (params) => api.get('/finance/payouts', { params });
export const updateBankDetails = (data) => api.put('/finance/bank-details', data);
export const requestPayout = (data) => api.post('/finance/payouts/request', data);
export const processPayout = (id) => api.post(`/finance/payouts/${id}/process`);

// Notification APIs
export const getMyNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// Audit Log APIs
export const getAuditLogs = (params) => api.get('/admin/audit-logs', { params });

// Inventory APIs
export const getInventory = () => api.get('/admin/inventory');
export const updateBulkInventory = (data) => api.put('/admin/inventory/bulk', data);

// Staff APIs
export const getAllStaff = () => api.get('/admin/staff');
export const createStaff = (data) => api.post('/admin/staff', data);
export const updateStaff = (id, data) => api.put(`/admin/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/admin/staff/${id}`);
export const getActiveCollaborations = () => api.get('/admin/collaborations');
export const getStaffCollaborations = () => api.get('/admin/staff/collaborations');

// User Management Contact details API
export const updateUserDetails = (id, data) => api.put(`/admin/user/${id}/details`, data);

// Doorstep Delivery OTP handshake APIs
export const sendDeliveryOTP = (id) => api.post(`/admin/order/${id}/send-delivery-otp`);
export const verifyDeliveryOTP = (id, otp) => api.post(`/admin/order/${id}/verify-delivery`, { otp });

export default api;
