import React from 'react';
import SearchDiscovery from './SearchDiscovery';

const SearchOverlay = ({ isOpen, onClose, query, searchCategory }) => (
  <SearchDiscovery
    isOpen={isOpen}
    onClose={onClose}
    query={query}
    searchCategory={searchCategory}
    variant="dropdown"
  />
);

export default SearchOverlay;
