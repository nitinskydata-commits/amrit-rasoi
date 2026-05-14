import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaFire, FaHistory, FaSearch, FaStar, FaClock, FaTimes, FaChevronRight } from 'react-icons/fa';
import { clearSuggestions, addRecentSearch } from '../redux/slices/searchSlice';
import './SearchOverlay.css';

const SearchOverlay = ({ isOpen, onClose, query }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { suggestions, recentSearches, meta } = useSelector((state) => state.search);
    const [activeSuggestion, setActiveSuggestion] = useState(null);

    // ✅ AUTHENTIC MARKETPLACE DATA (Real spices, no fake electronics)
    const categories = meta?.categories?.length > 0 ? meta.categories : ['Spices', 'Masalas', 'Organic', 'Seeds', 'Herbs'];
    const trending = ['Premium Red Chili', 'Turmeric Powder', 'Organic Ghee', 'Black Pepper', 'Cumin Seeds'];

    useEffect(() => {
        if (!isOpen) {
            dispatch(clearSuggestions());
            setActiveSuggestion(null);
        }
    }, [isOpen, dispatch]);

    if (!isOpen) return null;

    const handleSearch = (keyword) => {
        dispatch(addRecentSearch(keyword));
        navigate(`/search?keyword=${keyword}`);
        onClose();
    };

    const handleHoverSuggestion = (s) => {
        setActiveSuggestion(s);
    };

    return (
        <div className="mega-dropdown-wrapper">
            <div className="mega-backdrop" onClick={onClose}></div>
            
            <div className="mega-dropdown-card">
                <div className="mega-content-layout">
                    
                    {/* 🏛️ LEFT COLUMN (30% WIDTH) - Keywords & Navigation */}
                    <div className="mega-column-left">
                        
                        {query.length < 2 ? (
                            <>
                                {recentSearches.length > 0 && (
                                    <section className="mega-section">
                                        <h4 className="section-title">Recent Searches</h4>
                                        {recentSearches.slice(0, 5).map((s, i) => (
                                            <div key={i} className="mega-row" onClick={() => handleSearch(s)}>
                                                <FaClock className="row-icon-dim" />
                                                <span className="row-text">{s}</span>
                                                <FaTimes className="row-remove" onClick={(e) => { e.stopPropagation(); /* Clear logic */ }} />
                                            </div>
                                        ))}
                                    </section>
                                )}

                                <section className="mega-section">
                                    <h4 className="section-title">Trending Searches</h4>
                                    {trending.map((t, i) => (
                                        <div key={i} className="mega-row" onClick={() => handleSearch(t)}>
                                            <span className="row-emoji">🔥</span>
                                            <span className="row-text">{t}</span>
                                        </div>
                                    ))}
                                </section>

                                <section className="mega-section">
                                    <h4 className="section-title">Browse Categories</h4>
                                    {categories.slice(0, 4).map((c, i) => (
                                        <div key={i} className="mega-row" onClick={() => handleSearch(c)}>
                                            <span className="row-text">{c}</span>
                                            <FaChevronRight className="row-arrow" />
                                        </div>
                                    ))}
                                </section>
                            </>
                        ) : (
                            <section className="mega-section">
                                <h4 className="section-title">Suggestions</h4>
                                {suggestions.map((s, i) => (
                                    <div 
                                        key={i} 
                                        className={`mega-row ${activeSuggestion?.name === s.name ? 'active' : ''}`}
                                        onMouseEnter={() => handleHoverSuggestion(s)}
                                        onClick={() => handleSearch(s.name)}
                                    >
                                        <FaSearch className="row-icon-dim" />
                                        <span className="row-text">
                                            <strong>{s.name.substring(0, query.length)}</strong>
                                            {s.name.substring(query.length)}
                                            <small className="row-cat"> in {s.category}</small>
                                        </span>
                                    </div>
                                ))}
                            </section>
                        )}
                    </div>

                    {/* 🏛️ RIGHT COLUMN (70% WIDTH) - Visual Discovery */}
                    <div className="mega-column-right">
                        <h4 className="section-title">
                            {query.length < 2 ? 'Recommended for You' : `Top Results for "${query}"`}
                        </h4>
                        
                        <div className="product-preview-grid">
                            {(suggestions.length > 0 ? suggestions : []).slice(0, 4).map((p) => (
                                <div key={p.id} className="preview-card" onClick={() => navigate(`/product/${p.id}`)}>
                                    <div className="preview-image">
                                        <img src={p.image || '/placeholder.png'} alt={p.name} />
                                    </div>
                                    <div className="preview-info">
                                        <span className="preview-brand">{p.brand || 'Amrit Rasoi'}</span>
                                        <span className="preview-name">{p.name}</span>
                                        <div className="preview-rating">
                                            <div className="stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className={i < Math.floor(p.rating) ? 'filled' : ''} />
                                                ))}
                                            </div>
                                            <span className="rating-val">({p.numOfReviews || 0})</span>
                                        </div>
                                        <div className="preview-price-row">
                                            <span className="curr-price">₹{p.price}</span>
                                            {p.discount && <span className="disc-badge">-{p.discount}%</span>}
                                        </div>
                                        <span className="delivery-hint">Get it by Tomorrow</span>
                                    </div>
                                </div>
                            ))}

                            {suggestions.length === 0 && query.length >= 2 && (
                                <div className="no-preview-placeholder">
                                    <p>No visual matches found. Try a different search.</p>
                                </div>
                            )}

                            {query.length < 2 && (
                                <div className="personalized-placeholder">
                                    <p>Start typing to see personalized product matches...</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SearchOverlay;
