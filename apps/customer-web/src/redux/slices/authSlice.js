import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

// Helper function to get token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure axios interceptor to add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Send OTP
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phone, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/otp/send`, { phone });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
    }
  }
);

// Verify OTP
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/otp/verify`, { phone, otp });
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid OTP');
    }
  }
);

// Register
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/register`, userData);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/login`, { email, password });
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Logout
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await axios.get(`${API_BASE_URL}/logout`);
  } catch (error) {
    console.log('Logout error:', error);
  }
  localStorage.removeItem('user');
  localStorage.removeItem('token');
});

// Get User Profile
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/me`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

// Update Profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/me/update`, userData);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Add Address
export const addAddress = createAsyncThunk(
  'auth/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/address`, addressData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add address');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: (() => {
    let user = null;
    let token = null;
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined') user = JSON.parse(storedUser);
    } catch (e) { /* corrupted localStorage */ }
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken && storedToken !== 'undefined' && storedToken.length > 10) token = storedToken;
    } catch (e) { /* corrupted localStorage */ }
    return {
      user,
      token,
      isAuthenticated: !!token,
      loading: false,
      error: null,
      otpSent: false
    };
  })(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpSent = false;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Get Profile
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      // Add Address
      .addCase(addAddress.fulfilled, (state, action) => {
        state.user.addresses = action.payload.addresses;
      });
  }
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
