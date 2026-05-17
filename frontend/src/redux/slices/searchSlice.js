import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export const fetchSuggestions = createAsyncThunk(
  'search/fetchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      const q = (query || '').trim();
      const { data } = await axios.get(
        `${API_BASE_URL}/products/suggestions?q=${encodeURIComponent(q)}`
      );
      return {
        suggestions: data.suggestions || [],
        meta: data.meta || { categories: [] }
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Suggestions failed'
      );
    }
  }
);

export const fetchSearchResults = createAsyncThunk(
  'search/fetchSearchResults',
  async (params, { rejectWithValue }) => {
    try {
      const apiParams = { ...params };
      if (apiParams.sort === 'relevance') delete apiParams.sort;
      const { data } = await axios.get(`${API_BASE_URL}/products`, { params: apiParams });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Search failed'
      );
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    suggestions: [],
    results: [],
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
    meta: { brands: [], categories: [] },
    suggestionsLoading: false,
    loading: false,
    error: null,
    recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]')
  },
  reducers: {
    addRecentSearch: (state, action) => {
      const term = String(action.payload || '').trim();
      if (!term) return;
      const updated = [term, ...state.recentSearches.filter((s) => s !== term)].slice(0, 10);
      state.recentSearches = updated;
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    },
    removeRecentSearch: (state, action) => {
      const term = action.payload;
      state.recentSearches = state.recentSearches.filter((s) => s !== term);
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentSearches');
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload.suggestions;
        if (action.payload.meta?.categories?.length) {
          state.meta = { ...state.meta, categories: action.payload.meta.categories };
        }
      })
      .addCase(fetchSuggestions.rejected, (state) => {
        state.suggestionsLoading = false;
        state.suggestions = [];
      })
      .addCase(fetchSearchResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSearchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.products || [];
        state.totalResults = action.payload.totalProducts || 0;
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.meta = action.payload.meta || { brands: [], categories: [] };
      })
      .addCase(fetchSearchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.results = [];
      });
  }
});

export const {
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  clearSuggestions
} = searchSlice.actions;
export default searchSlice.reducer;
