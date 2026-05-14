import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Settings
export const getSettings = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching settings:', error.response?.data || error.message);
    return { success: false, settings: null };
  }
};

// Products
export const getAllProducts = async (params) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/product/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const getActiveAdsByPosition = async (position) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/ads/${position}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ads for ${position}:`, error);
    return { success: false, ads: [] };
  }
};

export default { getSettings, getAllProducts, getProductById, getActiveAdsByPosition };
