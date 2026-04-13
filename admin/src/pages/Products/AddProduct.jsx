import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Spices',
    brand: 'Amrit Rasoi',
    price: '',
    mrp: '',
    stock: '',
    isFeatured: false
  });

  const [variants, setVariants] = useState([
    { weight: '100g', price: '', mrp: '', stock: '' }
  ]);

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle variant changes
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  // Add new variant
  const addVariant = () => {
    setVariants([...variants, { weight: '', price: '', mrp: '', stock: '' }]);
  };

  // Remove variant
  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append variants as JSON string
      formDataToSend.append('variants', JSON.stringify(variants));

      // Append images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      const { data } = await axios.post(
        'http://localhost:5000/api/v1/admin/product/new',
        formDataToSend,
        config
      );

      if (data.success) {
        alert('Product created successfully!');
        navigate('/products');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <div className="page-header">
        <h1>Add New Product</h1>
        <button className="btn-back" onClick={() => navigate('/products')}>
          ← Back to Products
        </button>
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Red Chilli Powder"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Product description..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="Spices">Spices</option>
                <option value="Powders">Powders</option>
                <option value="Blends">Blends</option>
                <option value="Organic">Organic</option>
                <option value="Masalas">Masalas</option>
                <option value="Seeds">Seeds</option>
                <option value="Herbs">Herbs</option>
              </select>
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Brand name"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
              />
              <span>Feature this product on homepage</span>
            </label>
          </div>
        </div>

        {/* Weight Variants */}
        <div className="form-section">
          <div className="section-header">
            <h2>Weight Variants & Pricing</h2>
            <button type="button" className="btn-add-variant" onClick={addVariant}>
              + Add Variant
            </button>
          </div>

          {variants.map((variant, index) => (
            <div key={index} className="variant-card">
              <div className="variant-header">
                <h3>Variant {index + 1}</h3>
                {variants.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-variant"
                    onClick={() => removeVariant(index)}
                  >
                    × Remove
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight *</label>
                  <input
                    type="text"
                    value={variant.weight}
                    onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                    required
                    placeholder="e.g., 100g, 500g, 1kg"
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                    required
                    placeholder="120"
                  />
                </div>

                <div className="form-group">
                  <label>MRP (₹) *</label>
                  <input
                    type="number"
                    value={variant.mrp}
                    onChange={(e) => handleVariantChange(index, 'mrp', e.target.value)}
                    required
                    placeholder="150"
                  />
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                    required
                    placeholder="60"
                  />
                </div>
              </div>

              {variant.price && variant.mrp && (
                <div className="discount-preview">
                  Discount: {Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)}% off
                  (Save ₹{variant.mrp - variant.price})
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Default Pricing (for backward compatibility) */}
        <div className="form-section">
          <h2>Default Pricing (Base Price)</h2>
          <p className="help-text">
            These will be used as fallback if no variant is selected
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Base Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="120"
              />
            </div>

            <div className="form-group">
              <label>Base MRP (₹) *</label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                required
                placeholder="150"
              />
            </div>

            <div className="form-group">
              <label>Base Stock *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                placeholder="60"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="form-section">
          <h2>Product Images</h2>
          
          <div className="form-group">
            <label>Upload Images (Max 5)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              max="5"
            />
            <p className="help-text">Recommended: 800x800px, JPG or PNG</p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-previews">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating Product...' : 'Create Product'}
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate('/products')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
