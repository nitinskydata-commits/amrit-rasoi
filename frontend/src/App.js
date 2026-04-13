import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Existing Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import Admin from './pages/Admin';

// New Footer Pages
import ContactUs from './pages/ContactUs';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ReturnPolicy from './pages/ReturnPolicy';
import Help from './pages/Help';
import ComingSoon from './pages/ComingSoon';

import { getCart } from './redux/slices/cartSlice';
import { getMyOrders } from './redux/slices/orderSlice'; // ✅ ADD THIS
import { getSettings } from './redux/slices/settingsSlice'; // ✅ ADD THIS

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  // ✅ FETCH SETTINGS ON APP LOAD (for logo)
  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  // ✅ FETCH CART AND ORDERS WHEN USER IS AUTHENTICATED
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ User authenticated, fetching cart and orders...');
      dispatch(getCart());
      dispatch(getMyOrders()); // ✅ FETCH ORDERS ON LOGIN/RELOAD
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          
          {/* Footer Pages - Public */}
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/returns" element={<ReturnPolicy />} />
          <Route path="/help" element={<Help />} />
          
          {/* Coming Soon Pages */}
          <Route path="/careers" element={<ComingSoon title="Careers" />} />
          <Route path="/press" element={<ComingSoon title="Press Releases" />} />
          <Route path="/blog" element={<ComingSoon title="SBMI Blog" />} />
          <Route path="/sell" element={<ComingSoon title="Sell on SBMI" />} />
          <Route path="/affiliate" element={<ComingSoon title="Affiliate Program" />} />
          <Route path="/advertise" element={<ComingSoon title="Advertise Your Products" />} />
          <Route path="/account" element={<ComingSoon title="Your Account" />} />
          
          {/* Protected Routes */}
          <Route path="/cart" element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/order/:id" element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/addresses" element={
            <ProtectedRoute>
              <Addresses />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
