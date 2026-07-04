import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

// Get Cart
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

// Add to Cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity, variantId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('Please login to add items to cart');
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/cart`,
        { productId, quantity, variantId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

// Update Cart Item
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${API_BASE_URL}/cart/item`,
        { itemId, quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart');
    }
  }
);

// Remove from Cart
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.delete(`${API_BASE_URL}/cart/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

// Clear Cart
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.delete(`${API_BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: null,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload.cart;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload.cart;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.cart = action.payload.cart;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = action.payload.cart;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.cart = action.payload.cart;
      });
  }
});

export const { clearError } = cartSlice.actions;
export default cartSlice.reducer;
