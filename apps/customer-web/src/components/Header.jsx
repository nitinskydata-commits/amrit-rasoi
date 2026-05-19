import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchAddresses } from '../redux/slices/addressSlice';
import { addRecentSearch, clearSuggestions } from '../redux/slices/searchSlice';
import { FaSearch, FaShoppingCart, FaUser, FaMapMarkerAlt, FaBars } from 'react-icons/fa';
import SearchOverlay from './SearchOverlay';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const { addresses } = useSelector((state) => state.address);
  const { settings } = useSelector((state) => state.settings);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('keyword') || '');
  const [searchCategory, setSearchCategory] = useState(
    () => searchParams.get('category') || 'all'
  );
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const cartItemsCount = cart?.items?.length || 0;

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchAddresses());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const k = searchParams.get('keyword');
    if (k !== null) setSearchQuery(k);
    const c = searchParams.get('category');
    if (c) setSearchCategory(c);
  }, [searchParams]);

  const defaultAddress = addresses?.find((addr) => addr.isDefault) || addresses?.[0];

  const deliveryLabel = () => {
    if (defaultAddress?.city && defaultAddress?.state) {
      return `${defaultAddress.city}, ${defaultAddress.state}`;
    }
    if (defaultAddress?.city) return defaultAddress.city;
    if (defaultAddress?.state) return defaultAddress.state;
    const fallback = settings?.deliveryAreaLabel?.trim();
    if (fallback) return fallback;
    if (isAuthenticated) return 'Add delivery address';
    return 'Sign in for delivery';
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (q) dispatch(addRecentSearch(q));

    const params = new URLSearchParams();
    if (q) params.set('keyword', q);
    if (searchCategory !== 'all') params.set('category', searchCategory);

    navigate(`/search?${params.toString()}`);
    setIsDiscoveryOpen(false);
  };

  const openDiscovery = () => {
    setIsDiscoveryOpen(true);
    if (window.innerWidth < 768) {
      navigate(`/search-suggest?q=${encodeURIComponent(searchQuery)}&category=${searchCategory}`);
      return;
    }
  };

  const closeDiscovery = () => {
    setIsDiscoveryOpen(false);
    dispatch(clearSuggestions());
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <img
                src={settings?.companyLogo?.url || '/logo.png'}
                alt={settings?.siteName || 'SBMI'}
                onError={(e) => {
                  e.target.src = '/logo.png';
                }}
              />
              <span className="logo-text">{settings?.siteName || 'SBMI'}</span>
            </Link>

            <Link
              to={isAuthenticated ? '/addresses' : '/login'}
              className="location"
              title={isAuthenticated ? 'Your addresses' : 'Sign in'}
            >
              <FaMapMarkerAlt />
              <div className="location-text">
                <span className="deliver-to">Deliver to</span>
                <span className="location-name">{deliveryLabel()}</span>
              </div>
            </Link>

            <form className="search-bar" onSubmit={handleSearchSubmit}>
              <select
                className="search-category-select"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                aria-label="Search category"
              >
                <option value="all">All Categories</option>
                <option value="Spices">Spices</option>
                <option value="Powders">Powders</option>
                <option value="Blends">Blends</option>
                <option value="Organic">Organic</option>
                <option value="Masalas">Masalas</option>
                <option value="Seeds">Seeds</option>
                <option value="Herbs">Herbs</option>
              </select>

              <div className="search-input-container">
                <input
                  type="search"
                  placeholder="Search for premium spices, masalas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={openDiscovery}
                  autoComplete="off"
                  aria-label="Search products"
                />
                <SearchOverlay
                  isOpen={isDiscoveryOpen}
                  onClose={closeDiscovery}
                  query={searchQuery}
                  searchCategory={searchCategory}
                />
              </div>

              <button type="submit" className="search-btn" aria-label="Search">
                <FaSearch />
              </button>
            </form>

            <div className="header-actions">
              <div
                className="account-menu"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <Link to={isAuthenticated ? "/profile" : "/login"} className="account-trigger" style={{ textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column' }}>
                  <span className="greeting">Hello, {isAuthenticated ? user?.name?.split(' ')[0] : 'Sign in'}</span>
                  <span className="account-text">Account & Lists</span>
                </Link>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-column">
                      <h3 className="dropdown-col-title">Your Lists</h3>
                      <Link to="/lists/create">Create a Spice List</Link>
                      <Link to="/lists/refills">Organic Spice Refills</Link>
                      <Link to="/lists/custom">Custom Masala Blends</Link>
                      <Link to="/wishlist">Spices Wish List</Link>
                      <Link to="/library">Explore Spice Library</Link>
                    </div>

                    <div className="dropdown-vertical-divider"></div>

                    <div className="dropdown-column">
                      <h3 className="dropdown-col-title">Your Account</h3>
                      <Link to="/profile">Your Account</Link>
                      <Link to="/orders">Your Spice Orders</Link>
                      <Link to="/subscribe-save">Subscribe & Save</Link>
                      <Link to="/recommendations">Spice Recommendations</Link>
                      <Link to="/help">Help & Support</Link>
                      <Link to="/support">Support Tickets</Link>

                      {isAuthenticated ? (
                        <button type="button" className="dropdown-signin-btn" onClick={() => dispatch(logout())}>
                          Sign Out
                        </button>
                      ) : (
                        <div className="dropdown-guest-box">
                          <Link to="/login" className="dropdown-signin-btn">
                            Sign in
                          </Link>
                          <span className="dropdown-new-cust">
                            New customer? <Link to="/register" className="dropdown-start-here">Start here.</Link>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/orders" className="returns-orders-link">
                <span className="greeting">Returns</span>
                <span className="account-text">& Orders</span>
              </Link>

              <Link to="/cart" className="cart-link">
                <div className="cart-icon-wrapper">
                  <FaShoppingCart className="cart-icon" />
                  {cartItemsCount > 0 && <span className="cart-count">{cartItemsCount}</span>}
                </div>
                <span className="cart-text">Cart</span>
              </Link>

              <button
                type="button"
                className="mobile-menu-toggle"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-expanded={showMobileMenu}
              >
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav className={`header-nav ${showMobileMenu ? 'show' : ''}`}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="nav-link">
              🏠 Home
            </Link>
            <Link to="/deals" className="nav-link deals">
              🔥 Today&apos;s Deals
            </Link>
            <Link to="/new-arrivals" className="nav-link">
              🆕 New Arrivals
            </Link>
            <Link to="/about" className="nav-link">
              ℹ️ About Us
            </Link>
            <Link to="/contact" className="nav-link">
              📞 Contact Us
            </Link>

            {isAuthenticated && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 10px', fontSize: '14px' }}>|</span>
                <span className="nav-link" style={{ cursor: 'pointer', color: '#febd69', fontWeight: '700' }} onClick={() => navigate('/search?category=Spices')}>Whole Spices</span>
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/search?category=Powders')}>Ground Powders</span>
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/search?category=Blends')}>Gourmet Blends</span>
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/search?category=Organic')}>Organic Pantry</span>
              </>
            )}
          </div>

          {isAuthenticated && (
            <span className="deals" style={{ fontSize: '13px', fontWeight: '700', color: '#febd69', whiteSpace: 'nowrap' }}>
              🔥 Festive Spice Sale | Up to 60% Off
            </span>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
