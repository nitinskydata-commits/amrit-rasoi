import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSearchResults } from '../redux/slices/searchSlice';
import ProductCard from '../components/ProductCard';
import { FaFilter, FaStar, FaChevronRight, FaTimes, FaThLarge } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchResultsPage.css';

const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { results, totalResults, loading, meta } = useSelector((state) => state.search);

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

    useEffect(() => {
        const params = Object.fromEntries([...searchParams]);
        dispatch(fetchSearchResults(params));
    }, [dispatch, searchParams]);

    const updateParam = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) newParams.set(key, value);
        else newParams.delete(key);
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setSearchParams({ keyword });
        setPriceRange({ min: '', max: '' });
    };

    const activeFilters = [
        category && { label: `Category: ${category}`, key: 'category' },
        brand && { label: `Brand: ${brand}`, key: 'brand' },
        rating && { label: `${rating}★ & Up`, key: 'ratings' },
        priceRange.min && { label: `Min: ₹${priceRange.min}`, key: 'minPrice' },
        priceRange.max && { label: `Max: ₹${priceRange.max}`, key: 'maxPrice' },
    ].filter(Boolean);

    return (
        <div className="discovery-hub">
            <div className="discovery-hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1>Discovery Results</h1>
                            <p>Exploring <strong>{totalResults} items</strong> {keyword ? `for "${keyword}"` : 'in our marketplace'}</p>
                        </div>
                        <div className="hero-actions">
                            <div className="view-toggle"><FaThLarge /> <span>Grid</span></div>
                            <div className="sort-dropdown">
                                <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                                    <option value="relevance">Sort: Relevance</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="rating">Top Rated</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {activeFilters.length > 0 && (
                        <div className="active-pills">
                            {activeFilters.map((f, i) => (
                                <span key={i} className="pill" onClick={() => updateParam(f.key, '')}>
                                    {f.label} <FaTimes />
                                </span>
                            ))}
                            <button className="clear-link" onClick={clearFilters}>Clear All</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="container">
                <div className="discovery-main">
                    <aside className={`discovery-sidebar ${showMobileFilters ? 'open' : ''}`}>
                        <div className="filter-block">
                            <h4>Department</h4>
                            <div className="link-list">
                                <span className={!category ? 'active' : ''} onClick={() => updateParam('category', '')}>All Categories</span>
                                {meta.categories.map(cat => (
                                    <div key={cat} className={`link-item ${category === cat ? 'active' : ''}`} onClick={() => updateParam('category', cat)}>
                                        <span>{cat}</span> <FaChevronRight />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="filter-block">
                            <h4>Customer Reviews</h4>
                            {[4, 3, 2].map(r => (
                                <div key={r} className={`rating-row ${rating == r ? 'active' : ''}`} onClick={() => updateParam('ratings', r)}>
                                    <div className="stars">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} className={i < r ? 'gold' : 'dim'} />
                                        ))}
                                    </div>
                                    <span>& Up</span>
                                </div>
                            ))}
                        </div>

                        <div className="filter-block">
                            <h4>Price Range</h4>
                            <div className="price-hub">
                                <div className="inputs">
                                    <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} />
                                    <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} />
                                </div>
                                <button className="go-btn" onClick={() => { updateParam('minPrice', priceRange.min); updateParam('maxPrice', priceRange.max); }}>Go</button>
                            </div>
                        </div>
                    </aside>

                    <main className="discovery-content">
                        <AnimatePresence mode='wait'>
                            {loading ? (
                                <motion.div key="loading" className="shimmer-grid">
                                    {[...Array(6)].map((_, i) => <div key={i} className="shimmer-card"></div>)}
                                </motion.div>
                            ) : results.length > 0 ? (
                                <motion.div key="results" className="product-grid-layout">
                                    {results.map(product => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="no-results">
                                    <h2>No matches found.</h2>
                                    <button onClick={clearFilters}>Reset Filters</button>
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SearchResultsPage;
