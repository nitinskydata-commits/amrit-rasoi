import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './AddProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Spices',
    brand: 'Amrit Rasoi',
    isFeatured: false,
    inTodaysDeal: false,
    inNewArrivals: false
  });

  const [variants, setVariants] = useState([
    { attributeName: 'Weight', attributeValue: '100g', price: '', mrp: '', stock: '', sku: '', barcode: '', files: [], existingImages: [] }
  ]);

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [keepExistingImages, setKeepExistingImages] = useState(true);

  // Fetch existing product data
  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(
        `${API_BASE_URL}/product/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data.success) {
        const product = data.product;
        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          category: product.category || 'Spices',
          brand: product.brand || 'Amrit Rasoi',
          isFeatured: !!product.isFeatured,
          inTodaysDeal: !!product.inTodaysDeal,
          inNewArrivals: !!product.inNewArrivals
        });

        // Set variants if they exist
        if (product.variants && product.variants.length > 0) {
          const mappedVariants = product.variants.map(v => {
            const attr = v.attributes && v.attributes.length > 0 ? v.attributes[0] : {};
            return {
              ...v,
              attributeName: attr.name || 'Weight',
              attributeValue: attr.value || v.weight || '',
              price: v.price || '',
              mrp: v.mrp || '',
              stock: v.stock !== undefined ? v.stock : 0,
              sku: v.sku || '',
              barcode: v.barcode || '',
              files: [],
              existingImages: v.images || []
            };
          });
          setVariants(mappedVariants);
        }

        // Set existing images
        if (product.images && product.images.length > 0) {
          setExistingImages(product.images);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product details');
    } finally {
      setFetchingProduct(false);
    }
  };

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
    setVariants([...variants, { attributeName: 'Weight', attributeValue: '', price: '', mrp: '', stock: '', sku: '', barcode: '', files: [], existingImages: [] }]);
  };

  const handleVariantFileChange = (index, e) => {
    const files = Array.from(e.target.files);
    const updatedVariants = [...variants];
    updatedVariants[index].files = files;
    setVariants(updatedVariants);
  };

  const removeVariantExistingImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].existingImages = updatedVariants[variantIndex].existingImages.filter((_, i) => i !== imageIndex);
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

  // Remove existing image
  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  // Validate form before submission
  const validateForm = () => {
    // Check if at least one variant exists
    if (variants.length === 0) {
      alert('Please add at least one weight variant!');
      return false;
    }

    // Check variants
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      if (!variant.attributeValue && !variant.weight) {
        alert(`Variant ${i + 1}: Please provide an attribute value (e.g. 500g)`);
        return false;
      }
      if (!variant.price || !variant.mrp || variant.stock === undefined || variant.stock === '') {
        alert(`Variant ${i + 1}: Please fill all required fields (Price, MRP, Stock)`);
        return false;
      }

      if (parseFloat(variant.price) > parseFloat(variant.mrp)) {
        alert(`Variant ${i + 1}: Selling price (₹${variant.price}) cannot be more than MRP (₹${variant.mrp})`);
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Set base price/mrp/stock as the first variant's values (for backward compatibility)
      if (variants.length > 0) {
        formDataToSend.append('price', variants[0].price);
        formDataToSend.append('mrp', variants[0].mrp);
        formDataToSend.append('stock', variants[0].stock);
      }

      // Map frontend variant format to backend schema
      const mappedVariants = variants.map(v => ({
        _id: v._id,
        attributes: [{ name: v.attributeName || 'Weight', value: v.attributeValue || v.weight }],
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        sku: v.sku,
        barcode: v.barcode,
        images: v.existingImages || []
      }));

      // Append variants as JSON string
      formDataToSend.append('variants', JSON.stringify(mappedVariants));

      // Append keep existing images flag
      formDataToSend.append('keepExistingImages', keepExistingImages);

      // If keeping existing images, append them
      if (keepExistingImages) {
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
      }

      // Append new images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      // Append new variant images/videos
      variants.forEach((variant, index) => {
        if (variant.files && variant.files.length > 0) {
          variant.files.forEach(file => {
            formDataToSend.append(`variant_images_${index}`, file);
          });
        }
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/admin/product/${id}`,
        formDataToSend,
        config
      );

      if (data.success) {
        alert('Product updated successfully!');
        navigate('/products');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="add-product-page">
      <div className="page-header">
        <h1>Edit Product</h1>
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
              <span>Today&apos;s Deal (storefront + /deals)</span>
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
              <span>New Arrivals (storefront + /new-arrivals)</span>
            </label>
          </div>
        </div>

        {/* Weight Variants - THE ONLY PRICING SECTION */}
        <div className="form-section">
          <div className="section-header">
            <h2>Universal Variants & Pricing</h2>
            <p className="help-text" style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Each variant has its own price, stock, SKU, barcode, and media. Add all available options below.
            </p>
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
                  <label>MRP (₹) * (Original Price)</label>
                  <input
                    type="number"
                    value={variant.mrp}
                    onChange={(e) => handleVariantChange(index, 'mrp', e.target.value)}
                    required
                    placeholder="150"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price (₹) * (Your Price)</label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                    required
                    placeholder="120"
                    min="0"
                    step="0.01"
                    className={variant.price && variant.mrp && parseFloat(variant.price) > parseFloat(variant.mrp) ? 'error-input' : ''}
                  />
                  {variant.price && variant.mrp && parseFloat(variant.price) > parseFloat(variant.mrp) && (
                    <span className="error-message">
                      ⚠️ Selling price cannot be more than MRP!
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                    required
                    placeholder="60"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Variant Images/Videos</label>
                  {variant.existingImages && variant.existingImages.length > 0 && (
                    <div className="variant-existing-images" style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                      {variant.existingImages.map((img, imgIdx) => (
                        <div key={imgIdx} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' }}>
                          <img src={img.url} alt="Variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => removeVariantExistingImage(index, imgIdx)}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '0 0 0 4px', fontSize: '10px', cursor: 'pointer', padding: '2px 4px' }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleVariantFileChange(index, e)}
                  />
                  {variant.files && variant.files.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#007185' }}>{variant.files.length} new file(s) selected</span>
                  )}
                </div>
              </div>

              {variant.price && variant.mrp && parseFloat(variant.price) <= parseFloat(variant.mrp) && (
                <div className="discount-preview">
                  Discount: {Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)}% off
                  (Save ₹{(variant.mrp - variant.price).toFixed(2)})
                </div>
              )}

              {variant.price && variant.mrp && parseFloat(variant.price) > parseFloat(variant.mrp) && (
                <div className="error-preview">
                  ❌ ERROR: Selling price (₹{variant.price}) is higher than MRP (₹{variant.mrp})
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
            <strong>💡 Tip:</strong> The first variant (Variant 1) will be shown as default on the product page.
          </div>
        </div>

        {/* Product Images */}
        <div className="form-section">
          <h2>Product Images</h2>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <>
              <h3>Current Images</h3>
              <div className="image-previews">
                {existingImages.map((image, index) => (
                  <div key={index} className="preview-item">
                    <img src={image.url} alt={`Product ${index + 1}`} />
                    <button
                      type="button"
                      className="btn-remove-image"
                      onClick={() => removeExistingImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-group checkbox-group" style={{ marginTop: '15px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={keepExistingImages}
                    onChange={(e) => setKeepExistingImages(e.target.checked)}
                  />
                  <span>Keep existing images</span>
                </label>
              </div>
            </>
          )}
          
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label>Upload New Images (Max 5)</label>
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
            <>
              <h3>New Images Preview</h3>
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="preview-item">
                    <img src={preview} alt={`New Preview ${index + 1}`} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Updating Product...' : 'Update Product'}
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate('/products')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
