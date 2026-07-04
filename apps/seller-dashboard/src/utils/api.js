import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor to add jwt token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sellerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('sellerUser');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth & Setup APIs
export const login = (data) => api.post('/login', data);
export const registerSeller = (data) => api.post('/register/seller', data);
export const getSellerStatus = () => api.get('/seller/status');

// Seller Core Scoped APIs
export const getDashboardStats = () => api.get('/seller/dashboard');
export const getProducts = (params) => api.get('/seller/products', { params });
export const createProduct = (data) => api.post('/seller/product/new', data);
export const getProductDetails = (id) => api.get(`/product/${id}`);
export const updateProduct = (id, data) => api.put(`/seller/product/${id}`, data);
export const deleteProduct = (id) => api.delete(`/seller/product/${id}`);

export const getOrders = (params) => api.get('/seller/orders', { params });
export const updateOrderItemStatus = (id, data) => api.put(`/seller/order/${id}/item-status`, data);

export const getEarnings = () => api.get('/seller/earnings');
export const getProfile = () => api.get('/seller/profile');
export const updateProfile = (data) => api.put('/seller/profile', data);

export default api;
