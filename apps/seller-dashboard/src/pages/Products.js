import React, { useState, useEffect } from 'react';
import { getProducts, deleteProduct } from '../utils/api';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page, status]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined
      };
      const response = await getProducts(params);
      setProducts(response.data.products || []);
      setTotal(response.data.total || 0);
      setPagesCount(response.data.pages || 1);
    } catch (error) {
      console.error('Error loading seller products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDeleteClick = async (productId, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from your catalog?`)) {
      try {
        await deleteProduct(productId);
        alert('Product deleted successfully.');
        fetchProducts();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting product');
      }
    }
  };

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <div>
          <h1>My Product Catalog</h1>
          <p>Manage items, check stock levels, and review approval queues.</p>
        </div>
        <Link to="/add-product" className="btn btn-primary btn-icon">
          <FaPlus /> Add Product
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar-card">
        <form onSubmit={handleSearchSubmit} className="search-filter-form">
          <div className="search-input-box">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search products by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="search-btn">Search</button>
          </div>

          <div className="status-dropdown-box">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="draft">Draft (Review Pending)</option>
              <option value="published">Published (Live)</option>
            </select>
          </div>
        </form>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="seller-loading">Loading catalog items...</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Stock Status</th>
                  <th>Unit Price</th>
                  <th>Catalog Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-info-cell">
                        <div className="product-thumbnail">
                          {product.images?.length > 0 ? (
                            <img src={product.images[0].url} alt={product.name} />
                          ) : (
                            <div className="thumbnail-fallback">📦</div>
                          )}
                        </div>
                        <div className="product-info-meta">
                          <strong>{product.name}</strong>
                          <span>{product.category || 'Uncategorized'}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="sku-text">{product.sku || 'N/A'}</span></td>
                    <td>
                      <div className="stock-info-col">
                        <span className={`stock-indicator ${product.stock < 10 ? 'low' : 'ok'}`}>
                          {product.stock} units
                        </span>
                        {product.stock < 10 && <small className="stock-warn">Low stock!</small>}
                      </div>
                    </td>
                    <td><strong>${product.price?.toFixed(2)}</strong></td>
                    <td>
                      <span className={`product-status-badge badge-${product.status || 'draft'}`}>
                        {product.status === 'draft' ? 'Draft/Pending' : 'Live'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <Link 
                          to={`/edit-product/${product._id}`} 
                          className="btn btn-sm btn-outline-primary"
                          title="Edit Details"
                        >
                          <FaEdit /> Edit
                        </Link>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteClick(product._id, product.name)}
                          title="Delete Product"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <p className="no-data-msg">
              Your catalog is empty. Start adding products using the "Add Product" button!
            </p>
          )}

          {/* Pagination */}
          {pagesCount > 1 && (
            <div className="pagination-wrapper">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                className="btn btn-sm btn-outline"
              >
                Previous
              </button>
              <span className="page-status-indicator">Page {page} of {pagesCount}</span>
              <button 
                disabled={page === pagesCount} 
                onClick={() => setPage(page + 1)}
                className="btn btn-sm btn-outline"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;
