import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AiAssistant from './components/AiAssistant';

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

// Footer Pages
import ContactUs from './pages/ContactUs';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ReturnPolicy from './pages/ReturnPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import Help from './pages/Help';
import ComingSoon from './pages/ComingSoon';
import Deals from './pages/Deals';
import NewArrivals from './pages/NewArrivals';
import SearchSuggestPage from './pages/SearchSuggestPage';
import SearchResultsPage from './pages/SearchResultsPage';
import WholesaleRegister from './pages/WholesaleRegister';

import { getCart } from './redux/slices/cartSlice';
import { getMyOrders } from './redux/slices/orderSlice';
import { getSettings } from './redux/slices/settingsSlice';
import { getWishlist } from './redux/slices/wishlistSlice';
import Wishlist from './pages/Wishlist';
import SupportTickets from './pages/SupportTickets';

// Seller Pages
import SellerLayout from './pages/Seller/SellerLayout';
import SellerDashboard from './pages/Seller/SellerDashboard';
import SellerProducts from './pages/Seller/SellerProducts';
import SellerAddProduct from './pages/Seller/SellerAddProduct';
import SellerEditProduct from './pages/Seller/SellerEditProduct';
import SellerOrders from './pages/Seller/SellerOrders';
import SellerEarnings from './pages/Seller/SellerEarnings';
import SellerProfile from './pages/Seller/SellerProfile';
import SellerRegister from './pages/Seller/SellerRegister';
import SellerPendingApproval from './pages/Seller/SellerPendingApproval';
import { Navigate } from 'react-router-dom';

// Layout wrapper for main site pages (includes Header + Footer)
const MainLayout = ({ children }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
    <AiAssistant />
  </>
);

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { settings } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      if (settings.metaTitle) document.title = settings.metaTitle;
      if (settings.favIcon?.url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.favIcon.url;
      }
    }
  }, [settings]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCart());
      dispatch(getMyOrders());
      dispatch(getWishlist());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ===== SELLER ROUTES — No main Header/Footer (own layout) ===== */}
          <Route path="/seller/apply" element={
            <ProtectedRoute>
              <MainLayout><SellerRegister /></MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/seller/status" element={
            <ProtectedRoute>
              <MainLayout><SellerPendingApproval /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Seller Dashboard — standalone layout, no site header/footer */}
          <Route path="/seller" element={
            <ProtectedRoute>
              <SellerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="add-product" element={<SellerAddProduct />} />
            <Route path="edit-product/:id" element={<SellerEditProduct />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="earnings" element={<SellerEarnings />} />
            <Route path="profile" element={<SellerProfile />} />
          </Route>

          {/* ===== MAIN SITE ROUTES — With Header/Footer ===== */}
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/product/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
          <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
          <Route path="/search-suggest" element={<MainLayout><SearchSuggestPage /></MainLayout>} />
          <Route path="/search" element={<MainLayout><SearchResultsPage /></MainLayout>} />
          <Route path="/contact" element={<MainLayout><ContactUs /></MainLayout>} />
          <Route path="/about" element={<MainLayout><About /></MainLayout>} />
          <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
          <Route path="/terms" element={<MainLayout><TermsOfService /></MainLayout>} />
          <Route path="/returns" element={<MainLayout><ReturnPolicy /></MainLayout>} />
          <Route path="/shipping" element={<MainLayout><ShippingPolicy /></MainLayout>} />
          <Route path="/help" element={<MainLayout><Help /></MainLayout>} />
          <Route path="/deals" element={<MainLayout><Deals /></MainLayout>} />
          <Route path="/new-arrivals" element={<MainLayout><NewArrivals /></MainLayout>} />
          <Route path="/careers" element={<MainLayout><ComingSoon title="Careers" /></MainLayout>} />
          <Route path="/press" element={<MainLayout><ComingSoon title="Press Releases" /></MainLayout>} />
          <Route path="/blog" element={<MainLayout><ComingSoon title="SBMI Blog" /></MainLayout>} />
          <Route path="/sell" element={<MainLayout><ComingSoon title="Sell on SBMI" /></MainLayout>} />
          <Route path="/affiliate" element={<MainLayout><ComingSoon title="Affiliate Program" /></MainLayout>} />
          <Route path="/advertise" element={<MainLayout><ComingSoon title="Advertise Your Products" /></MainLayout>} />
          <Route path="/account" element={<MainLayout><ComingSoon title="Your Account" /></MainLayout>} />
          <Route path="/science" element={<MainLayout><ComingSoon title="SBMI Science" /></MainLayout>} />
          <Route path="/register" element={<MainLayout><Login /></MainLayout>} />

          {/* Protected Routes */}
          <Route path="/cart" element={<MainLayout><ProtectedRoute><Cart /></ProtectedRoute></MainLayout>} />
          <Route path="/checkout" element={<MainLayout><ProtectedRoute><Checkout /></ProtectedRoute></MainLayout>} />
          <Route path="/orders" element={<MainLayout><ProtectedRoute><Orders /></ProtectedRoute></MainLayout>} />
          <Route path="/order/:id" element={<MainLayout><ProtectedRoute><OrderDetail /></ProtectedRoute></MainLayout>} />
          <Route path="/profile" element={<MainLayout><ProtectedRoute><Profile /></ProtectedRoute></MainLayout>} />
          <Route path="/addresses" element={<MainLayout><ProtectedRoute><Addresses /></ProtectedRoute></MainLayout>} />
          <Route path="/admin" element={<MainLayout><ProtectedRoute><Admin /></ProtectedRoute></MainLayout>} />
          <Route path="/wishlist" element={<MainLayout><ProtectedRoute><Wishlist /></ProtectedRoute></MainLayout>} />
          <Route path="/support" element={<MainLayout><ProtectedRoute><SupportTickets /></ProtectedRoute></MainLayout>} />
          <Route path="/wholesale/apply" element={<MainLayout><ProtectedRoute><WholesaleRegister /></ProtectedRoute></MainLayout>} />
        </Routes>

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
