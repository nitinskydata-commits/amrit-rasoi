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
                      <button type="button" onClick={() => dispatch(logout())}>
                        Sign Out
                      </button>
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
        <div className="container">
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
        </div>
      </nav>
    </header>
  );
};

export default Header;
