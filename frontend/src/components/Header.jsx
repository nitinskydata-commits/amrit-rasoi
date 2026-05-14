import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { fetchAddresses } from '../redux/slices/addressSlice';
import { fetchSuggestions, addRecentSearch } from '../redux/slices/searchSlice';
import { FaSearch, FaShoppingCart, FaUser, FaMapMarkerAlt, FaMicrophone, FaCamera, FaBars } from 'react-icons/fa';
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
    const [searchCategory, setSearchCategory] = useState(searchParams.get('category') || 'all');
    const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const cartItemsCount = cart?.items?.length || 0;

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                dispatch(fetchSuggestions(searchQuery));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, dispatch]);

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

    const defaultAddress = addresses?.find((addr) => addr.isDefault) || addresses?.[0];
    const deliverLine1 = () => {
        if (defaultAddress?.city && defaultAddress?.state) return `${defaultAddress.city}, ${defaultAddress.state}`;
        if (defaultAddress?.city) return defaultAddress.city;
        return null;
    };

    return (
        <header className="header">
            <div className="header-top">
                <div className="container">
                    <div className="header-content">
                        <Link to="/" className="logo">
                            <img src={settings?.companyLogo?.url || "/logo.png"} alt="SBMI" />
                            <span className="logo-text">{settings?.siteName || 'SBMI'}</span>
                        </Link>

                        <Link to="/addresses" className="location">
                            <FaMapMarkerAlt />
                            <div className="location-text">
                                <span className="deliver-to">Deliver to</span>
                                <span className="location-name">{deliverLine1() || 'Set Address'}</span>
                            </div>
                        </Link>

                        {/* 🛒 PREMIUM AMAZON SEARCH BAR */}
                        <form className="search-bar" onSubmit={handleSearchSubmit}>
                            <select 
                                className="search-category-select"
                                value={searchCategory}
                                onChange={(e) => setSearchCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="Spices">Spices</option>
                                <option value="Masalas">Masalas</option>
                                <option value="Seeds">Seeds</option>
                                <option value="Organic">Organic</option>
                                <option value="Herbs">Herbs</option>
                            </select>

                            <div className="search-input-container">
                                <input 
                                    type="text" 
                                    placeholder="Search for premium spices, masalas..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsDiscoveryOpen(true)}
                                    autoComplete="off"
                                />
                                <div className="search-icons-group">
                                    <span className="icon-trigger"><FaMicrophone /></span>
                                    <span className="icon-trigger"><FaCamera /></span>
                                </div>
                                <SearchOverlay 
                                    isOpen={isDiscoveryOpen} 
                                    onClose={() => setIsDiscoveryOpen(false)} 
                                    query={searchQuery}
                                />
                            </div>

                            <button type="submit" className="search-btn">
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
                                            <hr />
                                            <button onClick={() => dispatch(logout())}>Sign Out</button>
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

                            <button className="mobile-menu-toggle" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                                <FaBars />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🏠 PREMIUM NAVIGATION ICONS */}
            <nav className={`header-nav ${showMobileMenu ? 'show' : ''}`}>
                <div className="container">
                    <Link to="/" className="nav-link">🏠 Home</Link>
                    <Link to="/deals" className="nav-link deals">🔥 Today's Deals</Link>
                    <Link to="/new-arrivals" className="nav-link">🆕 New Arrivals</Link>
                    <Link to="/about" className="nav-link">ℹ️ About Us</Link>
                    <Link to="/contact" className="nav-link">📞 Contact Us</Link>
                </div>
            </nav>
        </header>
    );
};

export default Header;
