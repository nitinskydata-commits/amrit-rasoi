import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { API_BASE_URL } from '../../config/api';

// Get token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token;
};

// Fetch all addresses
export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const { data } = await axios.get(`${API_BASE_URL}/addresses`, config);
      return data.addresses;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }
);

// Add new address
export const addAddress = createAsyncThunk(
  'address/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const token = getToken();
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      const { data } = await axios.post(`${API_BASE_URL}/addresses`, addressData, config);
      return data.address;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add address');
    }
  }
);

// Update address
export const updateAddress = createAsyncThunk(
  'address/updateAddress',
  async ({ id, addressData }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      const { data } = await axios.put(`${API_BASE_URL}/addresses/${id}`, addressData, config);
      return data.address;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update address');
    }
  }
);

// Delete address
export const deleteAddress = createAsyncThunk(
  'address/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      const token = getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.delete(`${API_BASE_URL}/addresses/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
    }
  }
);

// Set default address
export const setDefaultAddress = createAsyncThunk(
  'address/setDefaultAddress',
  async (id, { rejectWithValue }) => {
    try {
      const token = getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const { data } = await axios.put(`${API_BASE_URL}/addresses/${id}/default`, {}, config);
      return data.address;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set default address');
    }
  }
);

const addressSlice = createSlice({
  name: 'address',
  initialState: {
    addresses: [],
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
      // Fetch Addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Address
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses.push(action.payload);
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Address
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.addresses.findIndex(addr => addr._id === action.payload._id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Address
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.filter(addr => addr._id !== action.payload);
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Set Default Address
      .addCase(setDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === action.payload._id
        }));
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = addressSlice.actions;
export default addressSlice.reducer;
