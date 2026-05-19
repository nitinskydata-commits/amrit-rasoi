import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, updateProduct, deleteProduct, bulkDeleteProducts } from '../utils/api';
import { FaEdit, FaTrash, FaSearch, FaPlus, FaCheckSquare } from 'react-icons/fa';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getAllProducts();
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        alert('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateProduct(product._id, { isActive: !product.isActive });
      alert('Product status updated');
      fetchProducts();
    } catch (error) {
      alert('Error updating product');
    }
  };

  const handleSelectProduct = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(item => item !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      try {
        await bulkDeleteProducts(selectedProducts);
        alert('Selected products deleted successfully');
        setSelectedProducts([]);
        fetchProducts();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting products');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'low') return matchesSearch && product.stock < 10;
    if (filter === 'out') return matchesSearch && product.stock === 0;
    return matchesSearch;
  });

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Products Management</h1>
          <p>Manage your product inventory</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/add-product')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaPlus /> Add New Product
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: '200px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock (&lt;10)</option>
            <option value="out">Out of Stock</option>
          </select>
          {selectedProducts.length > 0 && (
            <button 
              className="btn btn-danger" 
              onClick={handleBulkDelete}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s' }}
            >
              <FaTrash /> Delete Selected ({selectedProducts.length})
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                  />
                </th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id} className={selectedProducts.includes(product._id) ? 'selected-row' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectProduct(product._id)}
                    />
                  </td>
                  <td>
                    <img 
                      src={product.images[0]?.url || '/placeholder.png'} 
                      alt={product.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.category}</td>
                  <td>₹{product.price}</td>
                  <td>
                    <span className={product.stock < 10 ? 'text-danger' : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleActive(product)}
                      className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => navigate(`/edit-product/${product._id}`)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(product._id)}
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

        {filteredProducts.length === 0 && (
          <p className="no-data">No products found</p>
        )}
      </div>
    </div>
  );
};

// Add some styles for the selected row
const styles = `
  .selected-row { background-color: #fff4f4 !important; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Products;
