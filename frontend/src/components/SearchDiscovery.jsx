import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaSearch,
  FaStar,
  FaClock,
  FaTimes,
  FaChevronRight,
  FaTag
} from 'react-icons/fa';
import {
  clearSuggestions,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  fetchSuggestions
} from '../redux/slices/searchSlice';
import './SearchDiscovery.css';

const STORE_CATEGORIES = [
  'Spices',
  'Powders',
  'Blends',
  'Organic',
  'Masalas',
  'Seeds',
  'Herbs'
];

function highlightMatch(name, query) {
  if (!query) return name;
  const lower = name.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return name;
  return (
    <>
      {name.slice(0, idx)}
      <strong>{name.slice(idx, idx + query.length)}</strong>
      {name.slice(idx + query.length)}
    </>
  );
}

const SearchDiscovery = ({ isOpen, onClose, query, searchCategory = 'all', variant = 'dropdown' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { suggestions, recentSearches, suggestionsLoading, meta } = useSelector(
    (state) => state.search
  );

  const categories =
    meta?.categories?.length > 0 ? meta.categories : STORE_CATEGORIES;

  const trimmed = (query || '').trim();
  const showTyping = trimmed.length >= 2;

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearSuggestions());
      return;
    }
    const timer = setTimeout(() => {
      dispatch(fetchSuggestions(trimmed));
    }, trimmed.length >= 2 ? 250 : 0);
    return () => clearTimeout(timer);
  }, [isOpen, trimmed, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const goSearch = (keyword) => {
    const term = String(keyword || '').trim();
    if (term) dispatch(addRecentSearch(term));
    const params = new URLSearchParams();
    if (term) params.set('keyword', term);
    if (searchCategory && searchCategory !== 'all') params.set('category', searchCategory);
    navigate(params.toString() ? `/search?${params.toString()}` : '/search');
    onClose();
  };

  const goCategory = (cat) => {
    navigate(`/search?category=${encodeURIComponent(cat)}`);
    onClose();
  };

  const previewProducts = suggestions.slice(0, 4);
  const wrapperClass =
    variant === 'page' ? 'search-discovery-page' : 'mega-dropdown-wrapper';

  return (
    <div className={wrapperClass}>
      {variant === 'dropdown' && (
        <div className="mega-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <div
        className={`mega-dropdown-card ${variant === 'page' ? 'mega-dropdown-card--page' : ''}`}
        role="dialog"
        aria-label="Search suggestions"
      >
        <div className="mega-content-layout">
          <div className="mega-column-left">
            {!showTyping ? (
              <>
                {recentSearches.length > 0 && (
                  <section className="mega-section">
                    <div className="section-head-row">
                      <h4 className="section-title">Recent searches</h4>
                      <button
                        type="button"
                        className="section-link-btn"
                        onClick={() => dispatch(clearRecentSearches())}
                      >
                        Clear all
                      </button>
                    </div>
                    {recentSearches.slice(0, 6).map((s) => (
                      <div key={s} className="mega-row" onClick={() => goSearch(s)}>
                        <FaClock className="row-icon-dim" />
                        <span className="row-text">{s}</span>
                        <button
                          type="button"
                          className="row-remove"
                          aria-label={`Remove ${s}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(removeRecentSearch(s));
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </section>
                )}

                <section className="mega-section">
                  <h4 className="section-title">Shop by category</h4>
                  {categories.slice(0, 7).map((c) => (
                    <div key={c} className="mega-row" onClick={() => goCategory(c)}>
                      <span className="row-text">{c}</span>
                      <FaChevronRight className="row-arrow" />
                    </div>
                  ))}
                </section>

                <section className="mega-section">
                  <h4 className="section-title">Quick links</h4>
                  <div
                    className="mega-row"
                    onClick={() => {
                      navigate('/deals');
                      onClose();
                    }}
                  >
                    <FaTag className="row-icon-dim" />
                    <span className="row-text">Today&apos;s Deals</span>
                  </div>
                  <div
                    className="mega-row"
                    onClick={() => {
                      navigate('/new-arrivals');
                      onClose();
                    }}
                  >
                    <span className="row-emoji">🆕</span>
                    <span className="row-text">New Arrivals</span>
                  </div>
                </section>
              </>
            ) : (
              <section className="mega-section">
                <h4 className="section-title">Suggestions</h4>
                {suggestionsLoading && suggestions.length === 0 ? (
                  <p className="mega-hint">Searching…</p>
                ) : suggestions.length === 0 ? (
                  <p className="mega-hint">No matches. Try another term or browse categories.</p>
                ) : (
                  suggestions.map((s) => (
                    <div key={s.id} className="mega-row" onClick={() => goSearch(s.name)}>
                      <FaSearch className="row-icon-dim" />
                      <span className="row-text">
                        {highlightMatch(s.name, trimmed)}
                        <small className="row-cat"> in {s.category}</small>
                      </span>
                    </div>
                  ))
                )}
                {trimmed && (
                  <div className="mega-row mega-row--cta" onClick={() => goSearch(trimmed)}>
                    <FaSearch className="row-icon-dim" />
                    <span className="row-text">
                      Search for <strong>&quot;{trimmed}&quot;</strong>
                    </span>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="mega-column-right">
            <div className="section-head-row">
              <h4 className="section-title">
                {showTyping ? `Results for “${trimmed}”` : 'Popular products'}
              </h4>
              {(showTyping || previewProducts.length > 0) && (
                <button
                  type="button"
                  className="section-link-btn"
                  onClick={() => goSearch(trimmed)}
                >
                  See all results
                </button>
              )}
            </div>

            {suggestionsLoading && previewProducts.length === 0 ? (
              <div className="preview-skeleton-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="preview-skeleton" />
                ))}
              </div>
            ) : previewProducts.length > 0 ? (
              <div className="product-preview-grid">
                {previewProducts.map((p) => (
                  <div
                    key={p.id}
                    className="preview-card"
                    onClick={() => {
                      navigate(`/product/${p.id}`);
                      onClose();
                    }}
                  >
                    <div className="preview-image">
                      <img
                        src={p.image || '/logo.png'}
                        alt={p.name}
                        onError={(e) => {
                          e.target.src = '/logo.png';
                        }}
                      />
                    </div>
                    <div className="preview-info">
                      <span className="preview-brand">{p.brand || 'Amrit Rasoi'}</span>
                      <span className="preview-name">{p.name}</span>
                      <div className="preview-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <FaStar
                              key={i}
                              className={i <= Math.round(p.rating) ? 'filled' : ''}
                            />
                          ))}
                        </div>
                        <span className="rating-val">
                          {p.numOfReviews > 0
                            ? `${Number(p.rating).toFixed(1)} (${p.numOfReviews})`
                            : 'No reviews yet'}
                        </span>
                      </div>
                      <div className="preview-price-row">
                        <span className="curr-price">₹{p.price}</span>
                        {p.discount > 0 && (
                          <>
                            <span className="list-price">₹{p.mrp}</span>
                            <span className="disc-badge">-{p.discount}%</span>
                          </>
                        )}
                      </div>
                      <span className="delivery-hint">
                        {p.discount > 0 ? 'Limited-time offer' : 'In stock'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-preview-placeholder">
                <p>
                  {showTyping
                    ? 'No products matched. Try a shorter keyword or pick a category on the left.'
                    : 'Mark products as featured or deals in admin to show recommendations here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDiscovery;
