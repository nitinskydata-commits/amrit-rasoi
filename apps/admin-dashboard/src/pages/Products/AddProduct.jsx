import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
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
    isFeatured: false,
    inTodaysDeal: false,
    inNewArrivals: false
  });

  const [variants, setVariants] = useState([
    { attributeName: 'Weight', attributeValue: '100g', price: '', mrp: '', stock: '', sku: '', barcode: '', files: [] }
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
    setVariants([...variants, { attributeName: 'Weight', attributeValue: '', price: '', mrp: '', stock: '', sku: '', barcode: '', files: [] }]);
  };

  const handleVariantFileChange = (index, e) => {
    const files = Array.from(e.target.files);
    const updatedVariants = [...variants];
    updatedVariants[index].files = files;
    setVariants(updatedVariants);
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
      const token = localStorage.getItem('adminToken');
      
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Map frontend variant format to backend schema
      const mappedVariants = variants.map(v => ({
        attributes: [{ name: v.attributeName || 'Weight', value: v.attributeValue || v.weight }],
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        sku: v.sku,
        barcode: v.barcode
      }));

      // Append variants as JSON string
      formDataToSend.append('variants', JSON.stringify(mappedVariants));

      // Append variant images/videos
      variants.forEach((variant, index) => {
        if (variant.files && variant.files.length > 0) {
          variant.files.forEach(file => {
            formDataToSend.append(`variant_images_${index}`, file);
          });
        }
      });

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
        `${API_BASE_URL}/admin/product/new`,
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
              <span>Feature on homepage (featured sort)</span>
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="inTodaysDeal"
                checked={formData.inTodaysDeal}
                onChange={handleChange}
              />
              <span>Today&apos;s Deal (home strip + /deals page)</span>
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="inNewArrivals"
                checked={formData.inNewArrivals}
                onChange={handleChange}
              />
              <span>New Arrivals (home strip + /new-arrivals page)</span>
            </label>
          </div>
        </div>

        {/* Weight Variants */}
        <div className="form-section">
          <div className="section-header">
            <h2>Universal Variants & Pricing</h2>
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
                  <label>Attribute Name *</label>
                  <input
                    type="text"
                    value={variant.attributeName || 'Weight'}
                    onChange={(e) => handleVariantChange(index, 'attributeName', e.target.value)}
                    required
                    placeholder="e.g., Weight, Size, Color"
                  />
                </div>

                <div className="form-group">
                  <label>Attribute Value *</label>
                  <input
                    type="text"
                    value={variant.attributeValue || variant.weight || ''}
                    onChange={(e) => handleVariantChange(index, 'attributeValue', e.target.value)}
                    required
                    placeholder="e.g., 500g, XL, Red"
                  />
                </div>

                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={variant.sku || ''}
                    onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                    placeholder="Variant SKU"
                  />
                </div>

                <div className="form-group">
                  <label>Barcode</label>
                  <input
                    type="text"
                    value={variant.barcode || ''}
                    onChange={(e) => handleVariantChange(index, 'barcode', e.target.value)}
                    placeholder="UPC / EAN"
                  />
                </div>
              </div>

              <div className="form-row">
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
                
                <div className="form-group">
                  <label>Variant Images/Videos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleVariantFileChange(index, e)}
                  />
                  {variant.files && variant.files.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#007185' }}>{variant.files.length} file(s) selected</span>
                  )}
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
