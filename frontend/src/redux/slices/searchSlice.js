import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch Suggestions (Real-time Autocomplete)
export const fetchSuggestions = createAsyncThunk(
    'search/fetchSuggestions',
    async (query, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`/api/v1/products/suggestions?q=${query}`);
            return data.suggestions;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

// Fetch Search Results with Advanced Filters
export const fetchSearchResults = createAsyncThunk(
    'search/fetchSearchResults',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await axios.get('/api/v1/products', { params });
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
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
        loading: false,
        error: null,
        recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
    },
    reducers: {
        addRecentSearch: (state, action) => {
            const updated = [action.payload, ...state.recentSearches.filter(s => s !== action.payload)].slice(0, 10);
            state.recentSearches = updated;
            localStorage.setItem('recentSearches', JSON.stringify(updated));
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
            .addCase(fetchSuggestions.fulfilled, (state, action) => {
                state.suggestions = action.payload;
            })
            .addCase(fetchSearchResults.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSearchResults.fulfilled, (state, action) => {
                state.loading = false;
                state.results = action.payload.products;
                state.totalResults = action.payload.totalProducts;
                state.totalPages = action.payload.totalPages;
                state.currentPage = action.payload.currentPage;
                state.meta = action.payload.meta;
            })
            .addCase(fetchSearchResults.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { addRecentSearch, clearRecentSearches, clearSuggestions } = searchSlice.actions;
export default searchSlice.reducer;
