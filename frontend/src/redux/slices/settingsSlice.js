import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

// Get settings
export const getSettings = createAsyncThunk(
  'settings/get',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/settings`);
      return data.settings;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    settings: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default settingsSlice.reducer;
