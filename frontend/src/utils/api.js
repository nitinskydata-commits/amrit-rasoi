import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

// Settings
export const getSettings = async () => {
  try {
    console.log('🔄 Fetching settings from:', `${API_URL}/settings`);
    const response = await axios.get(`${API_URL}/settings`);
    console.log('✅ Settings response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching settings:', error.response?.data || error.message);
    return { success: false, settings: null };
  }
};

// Products
export const getAllProducts = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/products`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/product/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export default { getSettings, getAllProducts, getProductById };
