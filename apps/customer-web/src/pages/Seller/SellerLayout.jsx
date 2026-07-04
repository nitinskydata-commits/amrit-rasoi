import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile } from '../../redux/slices/authSlice';
import { FaStore, FaTachometerAlt, FaBox, FaShoppingCart, FaHandHoldingUsd, FaUser, FaBars, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { logout } from '../../redux/slices/authSlice';
import './SellerLayout.css';

const SellerLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Re-verify profile on load to get latest sellerStatus
    if (isAuthenticated) {
      dispatch(getUserProfile());
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return <div className="seller-loading">Verifying merchant file...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const sellerStatus = user?.sellerStatus || 'none';

  // If they haven't applied yet, take them to the registration page
  if (sellerStatus === 'none') {
    return <Navigate to="/seller/apply" replace />;
  }

  // If pending/rejected/suspended, show status screen
  if (sellerStatus !== 'approved') {
    return <Navigate to="/seller/status" replace />;
  }

  const shopName = user?.sellerProfile?.shopName || 'Store';

  const menuItems = [
    { path: '/seller/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/seller/products', icon: <FaBox />, label: 'Products' },
    { path: '/seller/orders', icon: <FaShoppingCart />, label: 'Orders' },
    { path: '/seller/earnings', icon: <FaHandHoldingUsd />, label: 'Earnings & Payouts' },
    { path: '/seller/profile', icon: <FaUser />, label: 'Shop Profile' }
  ];

  return (
    <div className="seller-app-layout">
      {/* Sidebar */}
      <aside className={`seller-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="header-logo">
            <FaStore />
            <h2>SBMI Seller</h2>
          </div>
          <p className="shop-title-sub">{shopName}</p>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${window.location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          <Link to="/" className="nav-item back-to-store">
            <span className="nav-icon">🛒</span>
            <span className="nav-label">Back to Store</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`seller-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Navbar */}
        <header className="seller-navbar">
          <div className="navbar-left">
            <button className="menu-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FaBars />
            </button>
            <div className="navbar-store-badge">
              <FaStore />
              <span>{shopName}</span>
            </div>
          </div>
          
          <div className="navbar-right">
            <div className="user-profile-widget">
              <FaUserCircle className="user-avatar" />
              <div className="user-info">
                <span className="user-name">{user?.name || 'Seller'}</span>
                <span className="user-role-badge">Approved Seller</span>
              </div>
            </div>
            <button className="logout-btn" onClick={() => { dispatch(logout()); navigate('/login'); }} title="Logout">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="seller-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
