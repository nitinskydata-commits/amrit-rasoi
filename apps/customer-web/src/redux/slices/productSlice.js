import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

// Get All Products
export const getProducts = createAsyncThunk(
  'products/getProducts',
  async ({
    keyword = '',
    category = '',
    page = 1,
    sort = '',
    minPrice = '',
    maxPrice = '',
    todaysDeal = false,
    newArrivals = false,
    limit = ''
  }, { rejectWithValue }) => {
    try {
      let url = `${API_BASE_URL}/products?page=${page}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (sort) url += `&sort=${encodeURIComponent(sort)}`;
      if (minPrice) url += `&minPrice=${encodeURIComponent(minPrice)}`;
      if (maxPrice) url += `&maxPrice=${encodeURIComponent(maxPrice)}`;
      if (todaysDeal) url += '&todaysDeal=true';
      if (newArrivals) url += '&newArrivals=true';
      if (limit) url += `&limit=${encodeURIComponent(String(limit))}`;

      const { data } = await axios.get(url);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get Product Details
export const getProductDetails = createAsyncThunk(
  'products/getProductDetails',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/product/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product details');
    }
  }
);

// Create Review
export const createReview = createAsyncThunk(
  'products/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/review`, reviewData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit review');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    product: null,
    loading: false,
    error: null,
    totalProducts: 0,
    resultsPerPage: 12,
    currentPage: 1,
    totalPages: 1
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Products
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalProducts = action.payload.totalProducts;
        state.resultsPerPage = action.payload.resultsPerPage;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Product Details
      .addCase(getProductDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload.product;
      })
      .addCase(getProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Review
      .addCase(createReview.fulfilled, (state) => {
        state.loading = false;
      });
  }
});

export const { clearError } = productSlice.actions;
export default productSlice.reducer;
