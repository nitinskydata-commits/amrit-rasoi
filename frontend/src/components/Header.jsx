import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchAddresses } from '../redux/slices/addressSlice';
import { getSettings } from '../utils/api';
import { FaSearch, FaShoppingCart, FaUser, FaMapMarkerAlt, FaBars } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { cart } = useSelector(state => state.cart);
  const { addresses } = useSelector(state => state.address);
  const { settings } = useSelector(state => state.settings); // ✅ Use Redux settings
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const cartItemsCount = cart?.items?.length || 0;

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAddresses());
    }
  }, [dispatch, isAuthenticated]);

  const defaultAddress = addresses?.find(addr => addr.isDefault) || addresses?.[0];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('keyword', searchQuery);
      if (searchCategory !== 'all') {
        params.append('category', searchCategory);
      }
      navigate(`/?${params.toString()}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="header">
      {/* Top Header */}
      <div className="header-top">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <Link to="/" className="logo">
              {settings?.companyLogo?.url ? (
                <>
                  <img 
                    src={settings.companyLogo.url} 
                    alt={settings.siteName || 'SBMI'}
                    onError={(e) => {
                      e.target.src = '/logo.png';
                    }}
                  />
                  <span className="logo-text">{settings.siteName || 'SBMI'}</span>
                </>
              ) : (
                <>
                  <img src="/logo.png" alt="SBMI" />
                  <span className="logo-text">{settings?.siteName || 'SBMI'}</span>
                </>
              )}
            </Link>

            {/* Location */}
            <div className="location">
              <FaMapMarkerAlt />
              <div className="location-text">
                <span className="deliver-to">Deliver to</span>
                <span className="location-name">
                  {defaultAddress ? (
                    `${defaultAddress.city}, ${defaultAddress.state}`
                  ) : (
                    'Sikar, Rajasthan'
                  )}
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <form className="search-bar" onSubmit={handleSearch}>
              <select 
                className="search-category"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Spices">Spices</option>
                <option value="Powders">Powders</option>
                <option value="Blends">Blends</option>
                <option value="Organic">Organic</option>
              </select>
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <FaSearch />
              </button>
            </form>

            {/* Right Actions */}
            <div className="header-actions">
              {/* Account */}
              {isAuthenticated ? (
                <div 
                  className="account-menu"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div className="account-trigger">
                    <span className="greeting">Hello, {user?.name?.split(' ')[0]}</span>
                    <span className="account-text">Account & Lists</span>
                  </div>
                  {showDropdown && (
                    <div className="dropdown-menu">
                      <Link to="/profile">Your Profile</Link>
                      <Link to="/orders">Your Orders</Link>
                      <Link to="/addresses">Your Addresses</Link>
                      <hr />
                      <button onClick={handleLogout}>Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="account-link">
                  <FaUser />
                  <div>
                    <span className="greeting">Hello, Sign in</span>
                    <span className="account-text">Account & Lists</span>
                  </div>
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="cart-link">
                <div className="cart-icon-wrapper">
                  <FaShoppingCart className="cart-icon" />
                  {cartItemsCount > 0 && (
                    <span className="cart-count">{cartItemsCount}</span>
                  )}
                </div>
                <span className="cart-text">Cart</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button 
                className="mobile-menu-toggle"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ UPDATED NAVIGATION - No duplicate categories */}
      <nav className={`header-nav ${showMobileMenu ? 'show' : ''}`}>
        <div className="container">
          <Link to="/" className="nav-link">🏠 Home</Link>
          <Link to="/deals" className="nav-link deals">🔥 Today's Deals</Link>
          <Link to="/new-arrivals" className="nav-link">🆕 New Arrivals</Link>
          <Link to="/about" className="nav-link">ℹ️ About Us</Link>
          <Link to="/contact" className="nav-link">📞 Contact</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
