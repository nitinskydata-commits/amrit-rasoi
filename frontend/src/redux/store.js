import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import addressReducer from './slices/addressSlice';
import settingsReducer from './slices/settingsSlice';
import searchReducer from './slices/searchSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    order: orderReducer,
    address: addressReducer,
    settings: settingsReducer,
    search: searchReducer,
  },
});

export default store;
