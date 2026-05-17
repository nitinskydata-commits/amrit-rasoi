import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';
import SearchDiscovery from '../components/SearchDiscovery';
import './SearchSuggestPage.css';

const SearchSuggestPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set('keyword', q);
    if (category !== 'all') params.set('category', category);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search-suggest-page">
      <div className="search-suggest-toolbar">
        <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <FaArrowLeft />
        </button>
        <form className="search-suggest-form" onSubmit={handleSubmit}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
          >
            <option value="all">All</option>
            <option value="Spices">Spices</option>
            <option value="Powders">Powders</option>
            <option value="Blends">Blends</option>
            <option value="Organic">Organic</option>
            <option value="Masalas">Masalas</option>
            <option value="Seeds">Seeds</option>
            <option value="Herbs">Herbs</option>
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            autoFocus
          />
          <button type="submit" aria-label="Search">
            <FaSearch />
          </button>
        </form>
      </div>

      <SearchDiscovery
        isOpen
        onClose={() => navigate(-1)}
        query={query}
        searchCategory={category}
        variant="page"
      />
    </div>
  );
};

export default SearchSuggestPage;
