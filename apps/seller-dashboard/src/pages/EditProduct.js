import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductDetails, updateProduct } from '../utils/api';
import './AddProduct.css'; // Reuse form styles

const EditProduct = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Grocery',
    sku: '',
    imageUrl: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await getProductDetails(id);
      const product = response.data.product;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock !== undefined ? product.stock : '',
        category: product.category || 'Grocery',
        sku: product.sku || '',
        imageUrl: product.images?.length > 0 ? product.images[0].url : ''
      });
    } catch (error) {
      setErrorMsg('Error loading product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    // Construct image payload if URL is provided
    const images = formData.imageUrl 
      ? [{ url: formData.imageUrl, publicId: `seller_${Date.now()}` }] 
      : [];

    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category: formData.category,
      sku: formData.sku || undefined,
      images
    };

    try {
      await updateProduct(id, payload);
      alert('Product updated successfully.');
      navigate('/products');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Error updating product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="seller-loading">Loading product details...</div>;
  }

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h1>Edit Product Details</h1>
        <p>Modify catalog options, adjust stock thresholds, and update pricing.</p>
      </div>

      {errorMsg && <div className="form-alert-danger">{errorMsg}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row-grid">
            <div className="form-field full-width">
              <label>Product Name *</label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="e.g. Organic Brown Basmati Rice" 
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-field full-width">
              <label>Description *</label>
              <textarea 
                name="description" 
                required 
                rows="5"
                placeholder="Describe key details, ingredients, net weight..." 
                value={formData.description}
                onChange={handleInputChange}
                className="form-input text-area"
              />
            </div>

            <div className="form-field">
              <label>Price ($) *</label>
              <input 
                type="number" 
                name="price" 
                required 
                min="0.01" 
                step="0.01" 
                placeholder="9.99" 
                value={formData.price}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label>Stock Count *</label>
              <input 
                type="number" 
                name="stock" 
                required 
                min="0" 
                placeholder="100" 
                value={formData.stock}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label>Category *</label>
              <select 
                name="category" 
                value={formData.category}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Grocery">Grocery</option>
                <option value="Snacks">Snacks & Confectionery</option>
                <option value="Beverages">Beverages</option>
                <option value="Dairy">Dairy & Bakery</option>
                <option value="Household">Household Care</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Gourmet">Gourmet & Imports</option>
              </select>
            </div>

            <div className="form-field">
              <label>SKU / Barcode ID (Optional)</label>
              <input 
                type="text" 
                name="sku" 
                placeholder="e.g. ORG-RIC-5KG" 
                value={formData.sku}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-field full-width">
              <label>Product Image URL (Optional)</label>
              <input 
                type="url" 
                name="imageUrl" 
                placeholder="https://images.unsplash.com/photo-... or custom URL" 
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="form-input"
              />
              <small className="help-text">Provide a direct hotlink to your product image (jpg/png) for immediate display.</small>
            </div>
          </div>

          <div className="form-actions-row">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => navigate('/products')}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Updating Product...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
