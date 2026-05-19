import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaSearch,
  FaClock
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
        style={{
          maxWidth: '100%',
          minHeight: 'auto',
          maxHeight: '450px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #ddd',
          marginTop: '4px',
          overflowY: 'auto'
        }}
      >
        <div className="suggestions-list" style={{ padding: '8px 0' }}>
          {showTyping ? (
            <>
              {suggestionsLoading && suggestions.length === 0 ? (
                <div style={{ padding: '12px 20px', color: '#666', fontSize: '14px' }}>
                  Searching suggestions...
                </div>
              ) : suggestions.length === 0 ? (
                <div style={{ padding: '12px 20px', color: '#666', fontSize: '14px' }}>
                  No matches found for "{trimmed}"
                </div>
              ) : (
                suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="suggestion-item"
                    onClick={() => goSearch(s.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#111',
                      transition: 'background 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FaSearch style={{ color: '#a0aec0', fontSize: '12px' }} />
                    <span style={{ flex: 1 }}>
                      {highlightMatch(s.name, trimmed)}
                      {s.category && (
                        <span style={{ color: '#718096', fontSize: '12px', marginLeft: '8px', fontStyle: 'italic' }}>
                          in {s.category}
                        </span>
                      )}
                    </span>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {recentSearches.length > 0 && (
                <div className="section-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase' }}>
                    <span>Recent Searches</span>
                    <span style={{ color: '#007185', cursor: 'pointer' }} onClick={() => dispatch(clearRecentSearches())}>
                      Clear all
                    </span>
                  </div>
                  {recentSearches.slice(0, 5).map((s) => (
                    <div
                      key={s}
                      className="suggestion-item"
                      onClick={() => goSearch(s)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#111',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FaClock style={{ color: '#a0aec0', fontSize: '12px' }} />
                      <span style={{ flex: 1 }}>{s}</span>
                      <span
                        style={{ color: '#a0aec0', cursor: 'pointer', padding: '2px 6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(removeRecentSearch(s));
                        }}
                      >
                        ✕
                      </span>
                    </div>
                  ))}
                  <div style={{ height: '1px', background: '#edf2f7', margin: '8px 0' }} />
                </div>
              )}

              <div className="section-group">
                <div style={{ padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', textAlign: 'left' }}>
                  Shop By Category
                </div>
                {categories.slice(0, 5).map((c) => (
                  <div
                    key={c}
                    className="suggestion-item"
                    onClick={() => goCategory(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#111',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontSize: '12px' }}>📁</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchDiscovery;
