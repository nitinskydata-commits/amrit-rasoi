import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../utils/api';
import { FaUpload, FaTimes } from 'react-icons/fa';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    brand: '',
    stock: '',
    weight: '',
    unit: 'g',
    isFeatured: false,
    inTodaysDeal: false,
    inNewArrivals: false
  });

  const categories = [
    'Spices', 'Powders', 'Blends', 'Organic', 'Masalas', 'Seeds', 'Herbs'
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (imageFiles.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      alert('Please add at least one product image');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Append all text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append images
      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      console.log('🚀 Submitting product data...', Object.fromEntries(formDataToSend.entries()));

      const { data } = await createProduct(formDataToSend);
      console.log('✅ Product created response:', data);
      
      alert('Product created successfully!');
      navigate('/products');
    } catch (error) {
      console.error('❌ Submission Failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error creating product';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Create New Product</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Product Images */}
        <div className="card">
          <h2 className="card-title">Product Images</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <FaUpload /> Choose Images (Max 5)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {imagePreviews.map((preview, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '2px solid #ddd'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="card">
          <h2 className="card-title">Basic Information</h2>
          
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                className="form-control"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Storefront visibility</h2>
          <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>
            Control where this product appears on the customer site (managed by admin).
          </p>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            />{' '}
            Featured (homepage sort)
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={formData.inTodaysDeal}
              onChange={(e) => setFormData({ ...formData, inTodaysDeal: e.target.checked })}
            />{' '}
            Today&apos;s Deal
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={formData.inNewArrivals}
              onChange={(e) => setFormData({ ...formData, inNewArrivals: e.target.checked })}
            />{' '}
            New Arrivals
          </label>
        </div>

        {/* Pricing & Stock */}
        <div className="card">
          <h2 className="card-title">Pricing & Stock</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Selling Price (₹) *</label>
              <input
                type="number"
                className="form-control"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Original Price (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                className="form-control"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Weight/Quantity *</label>
              <input
                type="number"
                className="form-control"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Unit *</label>
              <select
                className="form-control"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="l">Liters (l)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
