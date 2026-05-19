import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSearchResults } from '../redux/slices/searchSlice';
import ProductCard from '../components/ProductCard';
import { FaFilter, FaStar, FaChevronRight, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchResultsPage.css';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { results, totalResults, loading, meta, totalPages, currentPage, error } =
    useSelector((state) => state.search);

  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const rating = searchParams.get('ratings') || '';
  const page = Number(searchParams.get('page') || 1);

  const categories = meta?.categories || [];
  const brands = meta?.brands || [];

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    dispatch(fetchSearchResults(params));
  }, [dispatch, searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    if (key !== 'page') newParams.delete('page');
    setSearchParams(newParams);
  };

  const applyPriceFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    if (priceRange.min) newParams.set('minPrice', priceRange.min);
    else newParams.delete('minPrice');
    if (priceRange.max) newParams.set('maxPrice', priceRange.max);
    else newParams.delete('maxPrice');
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (keyword) next.set('keyword', keyword);
    setSearchParams(next);
    setPriceRange({ min: '', max: '' });
  };

  const activeFilters = [
    category && { label: `Category: ${category}`, key: 'category' },
    brand && { label: `Brand: ${brand}`, key: 'brand' },
    rating && { label: `${rating}★ & up`, key: 'ratings' },
    searchParams.get('minPrice') && {
      label: `Min: ₹${searchParams.get('minPrice')}`,
      key: 'minPrice'
    },
    searchParams.get('maxPrice') && {
      label: `Max: ₹${searchParams.get('maxPrice')}`,
      key: 'maxPrice'
    }
  ].filter(Boolean);

  const resultTitle = keyword
    ? `Results for “${keyword}”`
    : category
    ? `${category} products`
    : 'All products';

  return (
    <div className="discovery-hub">
      <div className="discovery-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>{resultTitle}</h1>
              <p>
                {loading
                  ? 'Searching…'
                  : `${totalResults} ${totalResults === 1 ? 'result' : 'results'}`}
                {category && keyword ? ` in ${category}` : ''}
              </p>
            </div>
            <div className="hero-actions">
              <button
                type="button"
                className="mobile-filter-btn"
                onClick={() => setShowMobileFilters(true)}
              >
                <FaFilter /> Filters
              </button>
              <div className="sort-dropdown">
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  aria-label="Sort results"
                >
                  <option value="relevance">Sort: Featured / Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Avg. Customer Review</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </div>
          {activeFilters.length > 0 && (
            <div className="active-pills">
              {activeFilters.map((f) => (
                <span key={f.key} className="pill" onClick={() => updateParam(f.key, '')}>
                  {f.label} <FaTimes />
                </span>
              ))}
              <button type="button" className="clear-link" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <div className="discovery-main">
          <aside className={`discovery-sidebar ${showMobileFilters ? 'open' : ''}`}>
            <button
              type="button"
              className="sidebar-close"
              onClick={() => setShowMobileFilters(false)}
            >
              <FaTimes /> Close
            </button>

            <div className="filter-block">
              <h4>Department</h4>
              <div className="link-list">
                <span
                  className={!category ? 'active' : ''}
                  onClick={() => updateParam('category', '')}
                  role="button"
                  tabIndex={0}
                >
                  All Categories
                </span>
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className={`link-item ${category === cat ? 'active' : ''}`}
                    onClick={() => updateParam('category', cat)}
                    role="button"
                    tabIndex={0}
                  >
                    <span>{cat}</span> <FaChevronRight />
                  </div>
                ))}
              </div>
            </div>

            {brands.length > 0 && (
              <div className="filter-block">
                <h4>Brand</h4>
                <div className="link-list">
                  <span
                    className={!brand ? 'active' : ''}
                    onClick={() => updateParam('brand', '')}
                    role="button"
                    tabIndex={0}
                  >
                    All brands
                  </span>
                  {brands.filter(Boolean).slice(0, 12).map((b) => (
                    <div
                      key={b}
                      className={`link-item ${brand === b ? 'active' : ''}`}
                      onClick={() => updateParam('brand', b)}
                      role="button"
                      tabIndex={0}
                    >
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="filter-block">
              <h4>Customer reviews</h4>
              {[4, 3, 2].map((r) => (
                <div
                  key={r}
                  className={`rating-row ${rating === String(r) ? 'active' : ''}`}
                  onClick={() => updateParam('ratings', rating === String(r) ? '' : String(r))}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < r ? 'gold' : 'dim'} />
                    ))}
                  </div>
                  <span>& up</span>
                </div>
              ))}
            </div>

            <div className="filter-block">
              <h4>Price</h4>
              <div className="price-hub">
                <div className="inputs">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    min="0"
                  />
                </div>
                <button type="button" className="go-btn" onClick={applyPriceFilter}>
                  Apply
                </button>
              </div>
            </div>
          </aside>

          <main className="discovery-content">
            {error && (
              <p className="search-error" role="alert">
                {error}. Check that the backend is running.
              </p>
            )}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" className="shimmer-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shimmer-card" />
                  ))}
                </motion.div>
              ) : results.length > 0 ? (
                <motion.div key="results" className="product-grid-layout">
                  {results.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </motion.div>
              ) : (
                <div className="no-results">
                  <h2>No matches found</h2>
                  <p>Try different keywords or clear filters.</p>
                  <button type="button" onClick={clearFilters}>
                    Reset filters
                  </button>
                  <Link to="/" className="btn btn-primary" style={{ marginTop: 12, display: 'inline-block' }}>
                    Continue shopping
                  </Link>
                </div>
              )}
            </AnimatePresence>

            {totalPages > 1 && !loading && (
              <div className="search-pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParam('page', String(page - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => updateParam('page', String(page + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
