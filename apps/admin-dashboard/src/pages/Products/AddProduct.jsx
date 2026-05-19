import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Box, Tags, Image as ImageIcon, 
  Settings, ArrowLeft, UploadCloud, Plus, X, 
  Percent, ShieldCheck, Activity
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Spices',
    brand: 'Amrit Rasoi',
    isFeatured: false,
    inTodaysDeal: false,
    inNewArrivals: false
  });

  // Variant State (Advanced Architecture)
  const [variants, setVariants] = useState([
    { 
      id: crypto.randomUUID(),
      attributeName: 'Weight', 
      attributeValue: '500g', 
      price: '', 
      mrp: '', 
      stock: '', 
      sku: '', 
      barcode: '', 
      files: [] 
    }
  ]);

  // Marketing & Discount Engine State
  const [discountRules, setDiscountRules] = useState([]);

  // Global Media
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (id, field, value) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    setVariants([...variants, { 
      id: crypto.randomUUID(), 
      attributeName: 'Weight', 
      attributeValue: '', 
      price: '', 
      mrp: '', 
      stock: '', 
      sku: '', 
      barcode: '', 
      files: [] 
    }]);
  };

  const removeVariant = (id) => {
    if (variants.length > 1) {
      setVariants(variants.filter(v => v.id !== id));
    }
  };

  const handleVariantFileChange = (id, e) => {
    const files = Array.from(e.target.files);
    setVariants(variants.map(v => v.id === id ? { ...v, files } : v));
  };

  const handleGlobalImageDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target.files);
    setImages(prev => [...prev, ...files]);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeGlobalImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Marketing Rules
  const addDiscountRule = () => {
    setDiscountRules([...discountRules, {
      id: crypto.randomUUID(),
      type: 'PERCENTAGE', // PERCENTAGE, FIXED, BOGO
      value: '',
      minQuantity: 2,
      isActive: true
    }]);
  };

  const removeDiscountRule = (id) => {
    setDiscountRules(discountRules.filter(r => r.id !== id));
  };

  const updateDiscountRule = (id, field, value) => {
    setDiscountRules(discountRules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Mapping variants to backend schema
      const mappedVariants = variants.map(v => ({
        attributes: [{ name: v.attributeName || 'Variant', value: v.attributeValue || '' }],
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        sku: v.sku,
        barcode: v.barcode
      }));

      formDataToSend.append('variants', JSON.stringify(mappedVariants));
      
      // Append discount rules
      formDataToSend.append('discountRules', JSON.stringify(discountRules.filter(r => r.isActive)));

      // Append global images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      // Append variant specific media
      variants.forEach((variant, index) => {
        if (variant.files && variant.files.length > 0) {
          variant.files.forEach(file => {
            formDataToSend.append(`variant_images_${index}`, file);
          });
        }
      });

      const { data } = await axios.post(
        `${API_BASE_URL}/admin/product/new`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } }
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
        <div>
          <h1>Premium Editor Mode</h1>
          <p style={{ color: '#8b949e', marginTop: '4px', fontSize: '14px' }}>Expert product data entry & variant management.</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/products')}>
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        <div className="form-main">
          
          {/* BASIC INFO */}
          <motion.div className="form-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2><Package size={18} /> Basic Information</h2>
            
            <div className="form-group">
              <label>Product Title *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., Premium Saffron Threads" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Engaging product description..." />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="Spices">Spices</option>
                  <option value="Powders">Powders</option>
                  <option value="Blends">Blends</option>
                  <option value="Organic">Organic</option>
                </select>
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand Name" />
              </div>
            </div>
          </motion.div>

          {/* ADVANCED VARIANTS */}
          <motion.div className="form-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}><Box size={18} /> Advanced Variants</h2>
              <button type="button" className="btn-add-variant" style={{ width: 'auto', padding: '6px 12px' }} onClick={addVariant}>
                <Plus size={16} /> Add Variant
              </button>
            </div>

            <AnimatePresence>
              {variants.map((variant, index) => {
                const savings = (variant.mrp && variant.price && variant.mrp > variant.price) 
                  ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) 
                  : 0;

                return (
                  <motion.div 
                    key={variant.id} 
                    className="variant-card"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="variant-header">
                      <h3>Variant {index + 1}</h3>
                      {variants.length > 1 && (
                        <button type="button" className="btn-remove-variant" onClick={() => removeVariant(variant.id)}>
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Attribute (e.g. Size)</label>
                        <input type="text" value={variant.attributeName} onChange={e => handleVariantChange(variant.id, 'attributeName', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Value (e.g. 500g)</label>
                        <input type="text" value={variant.attributeValue} onChange={e => handleVariantChange(variant.id, 'attributeValue', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>SKU (Stock Keeping Unit)</label>
                        <input type="text" value={variant.sku} onChange={e => handleVariantChange(variant.id, 'sku', e.target.value)} placeholder="XYZ-123" />
                      </div>
                      <div className="form-group">
                        <label>Barcode (UPC/EAN)</label>
                        <input type="text" value={variant.barcode} onChange={e => handleVariantChange(variant.id, 'barcode', e.target.value)} placeholder="00000000" />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Regular Price (MRP) ₹</label>
                        <input type="number" value={variant.mrp} onChange={e => handleVariantChange(variant.id, 'mrp', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Sale Price ₹</label>
                        <input type="number" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)} required />
                        {savings > 0 ? (
                          <div className="savings-indicator">✓ {savings}% Savings calculated</div>
                        ) : (variant.price > variant.mrp && (
                          <div className="error-indicator">Sale price exceeds MRP!</div>
                        ))}
                      </div>
                      <div className="form-group">
                        <label>Stock Qty</label>
                        <input type="number" value={variant.stock} onChange={e => handleVariantChange(variant.id, 'stock', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Variant Media</label>
                        <input type="file" multiple accept="image/*,video/*" onChange={e => handleVariantFileChange(variant.id, e)} style={{ padding: '6px' }} />
                        {variant.files?.length > 0 && <span style={{ fontSize: '11px', color: '#58a6ff', display: 'block', marginTop: '4px' }}>{variant.files.length} file(s) attached</span>}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

        </div>

        <div className="form-sidebar">
          
          {/* MEDIA HANDLING */}
          <motion.div className="form-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2><ImageIcon size={18} /> Global Media</h2>
            
            <div 
              className="file-upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleGlobalImageDrop}
            >
              <UploadCloud size={32} style={{ marginBottom: '12px', color: '#58a6ff' }} />
              <p>Drag & drop images here or <strong>browse</strong></p>
              <input type="file" ref={fileInputRef} className="file-upload-input" multiple accept="image/*" onChange={handleGlobalImageDrop} />
            </div>

            <div className="image-previews">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="preview-item">
                  <img src={src} alt="Preview" />
                  <button type="button" className="btn-remove-image" onClick={() => removeGlobalImage(idx)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* DYNAMIC DISCOUNT ENGINE */}
          <motion.div className="form-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}><Percent size={18} /> Marketing Rules</h2>
              <button type="button" onClick={addDiscountRule} style={{ background: 'none', color: '#bc8cff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                <Plus size={14} /> Add Rule
              </button>
            </div>

            <AnimatePresence>
              {discountRules.map((rule) => (
                <motion.div 
                  key={rule.id} className="discount-rule-card"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={rule.isActive} onChange={e => updateDiscountRule(rule.id, 'isActive', e.target.checked)} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: rule.isActive ? '#c9d1d9' : '#8b949e' }}>Active Rule</span>
                    </div>
                    <button type="button" onClick={() => removeDiscountRule(rule.id)} style={{ background: 'none', border: 'none', color: '#ff7b72', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Discount Type</label>
                    <select value={rule.type} onChange={e => updateDiscountRule(rule.id, 'type', e.target.value)} style={{ padding: '6px 8px' }}>
                      <option value="PERCENTAGE">Percentage Off (%)</option>
                      <option value="FIXED">Fixed Amount Off (₹)</option>
                      <option value="BOGO">Buy X Get Y</option>
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Value</label>
                      <input type="number" value={rule.value} onChange={e => updateDiscountRule(rule.id, 'value', e.target.value)} placeholder="e.g. 10" style={{ padding: '6px 8px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Min Qty Threshold</label>
                      <input type="number" value={rule.minQuantity} onChange={e => updateDiscountRule(rule.id, 'minQuantity', e.target.value)} style={{ padding: '6px 8px' }} />
                    </div>
                  </div>
                </motion.div>
              ))}
              {discountRules.length === 0 && (
                <p style={{ fontSize: '13px', color: '#8b949e', fontStyle: 'italic' }}>No active marketing rules applied.</p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* PLACEMENT & STATUS */}
          <motion.div className="form-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2><Activity size={18} /> Visibility & Status</h2>
            <div className="checkbox-group">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} />
              <span>Feature on Homepage (Top Placement)</span>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" name="inTodaysDeal" checked={formData.inTodaysDeal} onChange={handleChange} />
              <span>Show in "Today's Deals" Strip</span>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" name="inNewArrivals" checked={formData.inNewArrivals} onChange={handleChange} />
              <span>Show in "New Arrivals" Strip</span>
            </div>
          </motion.div>

        </div>
        
        {/* SUBMIT */}
        <div style={{ gridColumn: '1 / -1' }} className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/products')}>Cancel</button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Processing...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} /> Publish Premium Product
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
