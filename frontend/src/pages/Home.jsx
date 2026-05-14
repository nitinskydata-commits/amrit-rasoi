import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getProducts } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import Testimonials from '../components/Testimonials';
import TrustBadges from '../components/TrustBadges';
import Newsletter from '../components/Newsletter';
import AdDisplay from '../components/AdDisplay';
import { API_BASE_URL } from '../config/api';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { products, loading, totalProducts, currentPage, totalPages } = useSelector(state => state.products);
  const { settings } = useSelector(state => state.settings);
  
  const productsRef = useRef(null);

  const [dealStrip, setDealStrip] = useState([]);
  const [newArrivalStrip, setNewArrivalStrip] = useState([]);
  const [stripLoading, setStripLoading] = useState(true);

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    page: 1,
    sort: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    let cancelled = false;
    const loadStrips = async () => {
      setStripLoading(true);
      try {
        const [dealsRes, newRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/products?todaysDeal=true&limit=8`),
          axios.get(`${API_BASE_URL}/products?newArrivals=true&limit=8`)
        ]);
        if (!cancelled) {
          setDealStrip(dealsRes.data?.products || []);
          setNewArrivalStrip(newRes.data?.products || []);
        }
      } catch {
        if (!cancelled) {
          setDealStrip([]);
          setNewArrivalStrip([]);
        }
      } finally {
        if (!cancelled) setStripLoading(false);
      }
    };
    loadStrips();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    dispatch(getProducts(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      keyword: searchParams.get('keyword') || '',
      category: searchParams.get('category') || '',
      page: 1
    }));
  }, [searchParams]);

  const handleSortChange = (e) => {
    setFilters({ ...filters, sort: e.target.value });
  };

  const handlePriceFilter = (min, max) => {
    setFilters({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleCategoryChange = (category) => {
    setFilters({ ...filters, category, page: 1 });
    
    setTimeout(() => {
      if (productsRef.current) {
        const yOffset = -80;
        const element = productsRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150);
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home">
      {/* Hero Banner */}
      <motion.section 
        className="hero-banner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {settings?.heroTitle || 'Premium Indian Spices'}
          </motion.h1>
          <motion.p
            className="hero-tagline"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {settings?.heroTagline || `From Our Kitchen to Yours - ${settings?.siteName || 'Amrit Rasoi'}`}
          </motion.p>
          
          <motion.div
            className="authenticity-badges"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">100% Authentic & Pure</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Farm Fresh Ingredients</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Traditional Recipes</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Quality You Can Trust</span>
            </div>
          </motion.div>
        </div>
        <div className="hero-gradient"></div>
      </motion.section>

      {/* Admin-curated: Today's Deals & New Arrivals */}
      <section className="home-strip-section">
        <div className="container">
          <div className="home-strip-head">
            <h2>Today&apos;s Deals</h2>
            <Link to="/deals">See all</Link>
          </div>
          {stripLoading ? (
            <p className="home-strip-empty">Loading deals…</p>
          ) : dealStrip.length > 0 ? (
            <div className="home-strip-grid">
              {dealStrip.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="home-strip-empty">
              No deals yet — your admin can add products and enable <strong>Today&apos;s Deal</strong> in the admin panel.
            </p>
          )}
        </div>
      </section>

      <section className="home-strip-section" style={{ background: '#f7fafa' }}>
        <div className="container">
          <div className="home-strip-head">
            <h2>New Arrivals</h2>
            <Link to="/new-arrivals">See all</Link>
          </div>
          {stripLoading ? (
            <p className="home-strip-empty">Loading new arrivals…</p>
          ) : newArrivalStrip.length > 0 ? (
            <div className="home-strip-grid">
              {newArrivalStrip.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="home-strip-empty">
              No new arrivals yet — your admin can mark products under <strong>New Arrivals</strong> in the admin panel.
            </p>
          )}
        </div>
      </section>

      {/* Top Banner Ad */}
      <AdDisplay position="home-top" />

      {/* Categories with Premium Emojis */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid">
            
            {/* SPICES */}
            <motion.div
              className={`category-card ${filters.category === 'Spices' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('Spices')}
              whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-icon-emoji">
                <span className="emoji-icon">🌶️</span>
              </div>
              <h3>Spices</h3>
            </motion.div>

            {/* POWDERS */}
            <motion.div
              className={`category-card ${filters.category === 'Powders' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('Powders')}
              whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-icon-emoji">
                <span className="emoji-icon">🧂</span>
              </div>
              <h3>Powders</h3>
            </motion.div>

            {/* BLENDS */}
            <motion.div
              className={`category-card ${filters.category === 'Blends' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('Blends')}
              whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-icon-emoji">
                <span className="emoji-icon">🥘</span>
              </div>
              <h3>Blends</h3>
            </motion.div>

            {/* ORGANIC */}
            <motion.div
              className={`category-card ${filters.category === 'Organic' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('Organic')}
              whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-icon-emoji">
                <span className="emoji-icon">🌿</span>
              </div>
              <h3>Organic</h3>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section" ref={productsRef} style={{ scrollMarginTop: '100px' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {filters.category 
                  ? `${filters.category} Products` 
                  : filters.keyword 
                  ? `Search Results for "${filters.keyword}"` 
                  : 'All Products'}
              </h2>
              <p className="results-count">{totalProducts} products found</p>
            </div>

            <div className="filters">
              <select className="sort-select" onChange={handleSortChange} value={filters.sort}>
                <option value="">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="price-filters">
            <button 
              className={`price-chip ${filters.minPrice === '' ? 'active' : ''}`}
              onClick={() => handlePriceFilter('', '')}
            >
              All Prices
            </button>
            <button 
              className={`price-chip ${filters.minPrice === '0' && filters.maxPrice === '100' ? 'active' : ''}`}
              onClick={() => handlePriceFilter('0', '100')}
            >
              Under ₹100
            </button>
            <button 
              className={`price-chip ${filters.minPrice === '100' && filters.maxPrice === '300' ? 'active' : ''}`}
              onClick={() => handlePriceFilter('100', '300')}
            >
              ₹100 - ₹300
            </button>
            <button 
              className={`price-chip ${filters.minPrice === '300' && filters.maxPrice === '500' ? 'active' : ''}`}
              onClick={() => handlePriceFilter('300', '500')}
            >
              ₹300 - ₹500
            </button>
            <button 
              className={`price-chip ${filters.minPrice === '500' ? 'active' : ''}`}
              onClick={() => handlePriceFilter('500', '')}
            >
              Above ₹500
            </button>
          </div>

          {loading ? (
            <div className="loading-screen">
              <div className="spinner"></div>
              <p className="loading-text">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <motion.div 
                className="products-grid"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {products.map((product) => (
                  <motion.div
                    key={product._id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button className="btn btn-primary" onClick={() => setFilters({
                keyword: '', category: '', page: 1, sort: '', minPrice: '', maxPrice: ''
              })}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Middle Banner Ad */}
      <AdDisplay position="home-middle" />

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">🚚</div>
              <h3>Free Delivery</h3>
              <p>On orders above ₹500</p>
            </motion.div>
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">✓</div>
              <h3>100% Authentic</h3>
              <p>Premium quality guaranteed</p>
            </motion.div>
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">↻</div>
              <h3>Easy Returns</h3>
              <p>7-day return policy</p>
            </motion.div>
            <motion.div 
              className="feature-card"
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">🔒</div>
              <h3>Secure Payments</h3>
              <p>Safe & encrypted checkout</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ✅ NEW PREMIUM SECTIONS */}
      <TrustBadges />
      <Testimonials />
      <Newsletter />
    </div>
  );
};

export default Home;
