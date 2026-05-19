import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './AddProduct.css';

const PRODUCT_TYPES = [
  { id: 'simple', icon: '📦', name: 'Simple Product', desc: 'Single item, no variants' },
  { id: 'variable', icon: '🔀', name: 'Variable Product', desc: 'Has options like Size/Color/Weight' },
  { id: 'digital', icon: '💾', name: 'Digital Asset', desc: 'Downloadable software or files' },
  { id: 'subscription', icon: '🔄', name: 'Subscription', desc: 'Recurring billable plans' },
  { id: 'bundle', icon: '🎁', name: 'Bundle / Combo', desc: 'Pre-packaged kit of items' },
];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Core product details
  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: 'Amrit Rasoi',
    productType: 'variable',
    category: '',
    subcategory: '',
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    canonicalUrl: '',
    isFeatured: false,
    inTodaysDeal: false,
    inNewArrivals: false,
    price: '',
    mrp: '',
    stock: '',
    digitalLicenseKey: '',
    digitalDownloadLimit: -1,
    digitalExpiryDays: 0,
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [categories, setCategories] = useState([]);
  const [globalAttrs, setGlobalAttrs] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState([]); 
  const [variants, setVariants] = useState([]);
  
  // Media files
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  
  // Digital asset files
  const [digitalFiles, setDigitalFiles] = useState([]);
  const [digitalPreviews, setDigitalPreviews] = useState([]);
  const [existingDigitalFiles, setExistingDigitalFiles] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
    fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_BASE_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setCategories(data.categories);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttributes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_BASE_URL}/admin/attributes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setGlobalAttrs(data.attributes);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_BASE_URL}/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        const p = data.product;
        setForm({
          name: p.name || '',
          description: p.description || '',
          brand: p.brand || 'Amrit Rasoi',
          productType: p.productType || 'variable',
          category: p.category || '',
          subcategory: p.subcategory || '',
          status: p.status || 'draft',
          seoTitle: p.seoTitle || '',
          seoDescription: p.seoDescription || '',
          seoKeywords: (p.seoKeywords || []).join(', '),
          canonicalUrl: p.canonicalUrl || '',
          isFeatured: !!p.isFeatured,
          inTodaysDeal: !!p.inTodaysDeal,
          inNewArrivals: !!p.inNewArrivals,
          price: p.price || '',
          mrp: p.mrp || '',
          stock: p.stock || '',
          digitalLicenseKey: p.digitalAssets?.licenseKey || '',
          digitalDownloadLimit: p.digitalAssets?.downloadLimit !== undefined ? p.digitalAssets.downloadLimit : -1,
          digitalExpiryDays: p.digitalAssets?.expiryDays || 0,
        });
        setTags(p.tags || []);
        setSpecs(p.specifications?.length ? p.specifications : [{ key: '', value: '' }]);
        if (p.images?.length) setExistingImages(p.images);
        if (p.digitalAssets?.files?.length) setExistingDigitalFiles(p.digitalAssets.files);
        if (p.variants?.length) {
          setVariants(p.variants.map((v, i) => ({
            id: v._id || `v_${i}`,
            attributes: v.attributes || [{ name: 'Option', value: '' }],
            label: (v.attributes || []).map(a => a.value).join(' / '),
            sku: v.sku || '',
            barcode: v.barcode || '',
            price: v.price || '',
            mrp: v.mrp || '',
            stock: v.stock !== undefined ? v.stock : '10',
            taxRate: v.taxRate || 0,
            shippingWeight: v.shippingWeight || '',
            shippingClass: v.shippingClass || 'standard',
            isFragile: !!v.isFragile,
            dimensions: v.dimensions || { length: '', width: '', height: '' },
            files: [],
            existingImages: v.images || []
          })));
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to load product details');
    } finally {
      setFetching(false);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTag = i => setTags(tags.filter((_, idx) => idx !== i));
  
  const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const updateSpec = (i, f, v) => {
    const s = [...specs];
    s[i][f] = v;
    setSpecs(s);
  };
  const removeSpec = i => setSpecs(specs.filter((_, idx) => idx !== i));

  const toggleAttr = (attr) => {
    const exists = selectedAttrs.find(a => a.attrId === attr._id);
    if (exists) {
      setSelectedAttrs(selectedAttrs.filter(a => a.attrId !== attr._id));
    } else {
      setSelectedAttrs([...selectedAttrs, {
        attrId: attr._id,
        name: attr.name,
        values: attr.values || [],
        selectedValues: []
      }]);
    }
  };

  const toggleAttrValue = (attrId, val) => {
    setSelectedAttrs(selectedAttrs.map(a => {
      if (a.attrId !== attrId) return a;
      const sv = a.selectedValues || [];
      return {
        ...a,
        selectedValues: sv.includes(val) ? sv.filter(v => v !== val) : [...sv, val]
      };
    }));
  };

  const addCustomValue = (attrId, val) => {
    if (!val.trim()) return;
    setSelectedAttrs(selectedAttrs.map(a => {
      if (a.attrId !== attrId) return a;
      const cleanVal = val.trim();
      const currentValues = a.values || [];
      const updatedValues = currentValues.includes(cleanVal) ? currentValues : [...currentValues, cleanVal];
      return {
        ...a,
        values: updatedValues,
        selectedValues: [...(a.selectedValues || []), cleanVal]
      };
    }));
  };

  const generateVariants = () => {
    const attrsWithValues = selectedAttrs.filter(a => (a.selectedValues || []).length > 0);
    if (attrsWithValues.length === 0) return;

    const combos = attrsWithValues.reduce((acc, attr) => {
      if (acc.length === 0) return attr.selectedValues.map(v => [{ name: attr.name, value: v }]);
      const result = [];
      acc.forEach(combo => {
        attr.selectedValues.forEach(v => {
          result.push([...combo, { name: attr.name, value: v }]);
        });
      });
      return result;
    }, []);

    setVariants(combos.map((attrs, i) => {
      const label = attrs.map(a => a.value).join(' / ');
      const code = attrs.map(a => a.value.substring(0, 3).toUpperCase()).join('-');
      return {
        id: `v_${Date.now()}_${i}`,
        attributes: attrs,
        label,
        sku: `${form.brand.substring(0, 3).toUpperCase()}-${code}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        barcode: '',
        price: form.price || '',
        mrp: form.mrp || '',
        stock: form.stock || '10',
        taxRate: 0,
        shippingWeight: '',
        shippingClass: 'standard',
        isFragile: false,
        dimensions: { length: '', width: '', height: '' },
        files: [],
        existingImages: []
      };
    }));
  };

  const addManualVariant = () => {
    setVariants([...variants, {
      id: `v_${Date.now()}`,
      attributes: [{ name: 'Option', value: '' }],
      label: 'Custom Option',
      sku: '',
      barcode: '',
      price: '',
      mrp: '',
      stock: '10',
      taxRate: 0,
      shippingWeight: '',
      shippingClass: 'standard',
      isFragile: false,
      dimensions: { length: '', width: '', height: '' },
      files: [],
      existingImages: []
    }]);
  };

  const updateVariant = (id, f, v) => setVariants(variants.map(vr => vr.id === id ? { ...vr, [f]: v } : vr));
  const removeVariant = id => setVariants(variants.filter(v => v.id !== id));
  const handleVariantFiles = (id, e) => {
    const files = Array.from(e.target.files);
    setVariants(variants.map(v => v.id === id ? { ...v, files } : v));
  };

  // Media Gallery handlers
  const handleMedia = (e) => {
    const files = Array.from(e.dataTransfer?.files || e.target.files);
    setImages(p => [...p, ...files]);
    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeMedia = i => {
    setImages(images.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };
  const removeExistingMedia = i => setExistingImages(existingImages.filter((_, idx) => idx !== i));

  // Digital download files
  const handleDigitalFiles = (e) => {
    const files = Array.from(e.target.files);
    setDigitalFiles(p => [...p, ...files]);
    setDigitalPreviews(p => [...p, ...files.map(f => f.name)]);
  };
  const removeDigitalFile = i => {
    setDigitalFiles(digitalFiles.filter((_, idx) => idx !== i));
    setDigitalPreviews(digitalPreviews.filter((_, idx) => idx !== i));
  };
  const removeExistingDigitalFile = i => setExistingDigitalFiles(existingDigitalFiles.filter((_, idx) => idx !== i));

  // Form submission
  const handleSubmit = async () => {
    if (!form.name) return alert('Product title is required');
    if (!form.category) return alert('Please select a category');
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const fd = new FormData();
      
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      fd.append('tags', tags.join(','));
      fd.append('specifications', JSON.stringify(specs.filter(s => s.key)));
      fd.append('existingImages', JSON.stringify(existingImages));
      fd.append('existingDigitalFiles', JSON.stringify(existingDigitalFiles));

      if (form.productType === 'simple' || form.productType === 'digital') {
        fd.append('hasVariants', 'false');
      } else {
        fd.append('hasVariants', 'true');
        const mapped = variants.map(v => ({
          _id: v.id.startsWith('v_') ? undefined : v.id,
          attributes: v.attributes,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock,
          sku: v.sku,
          barcode: v.barcode,
          taxRate: v.taxRate,
          shippingWeight: v.shippingWeight,
          shippingClass: v.shippingClass,
          isFragile: v.isFragile,
          dimensions: v.dimensions,
          images: v.existingImages || []
        }));
        fd.append('variants', JSON.stringify(mapped));
      }

      // Append new general images
      images.forEach(img => fd.append('images', img));

      // Append new digital assets
      digitalFiles.forEach(file => fd.append('digital_assets', file));

      // Append variant specific images/videos
      variants.forEach((v, i) => {
        if (v.files?.length) {
          v.files.forEach(f => fd.append(`variant_images_${i}`, f));
        }
      });

      const { data } = await axios.put(`${API_BASE_URL}/admin/product/${id}`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (data.success) {
        alert('Product updated successfully!');
        navigate('/products');
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="add-product-page" style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>Loading product details...</div>;

  return (
    <div className="add-product-page">
      <div className="page-header">
        <div>
          <h1>Edit Product: {form.name}</h1>
          <p style={{ color: '#6c757d', fontSize: '13px', margin: '4px 0 0 0' }}>Configure global settings, attribute variations, specs, and details.</p>
        </div>
        <button className="btn-back" onClick={() => navigate('/products')}>← Back to Catalog</button>
      </div>

      <div className="product-form">
        <div className="form-main">
          {/* Section 1: Basic Info */}
          <div className="form-section">
            <h2>📋 Basic Information</h2>
            <div className="form-group">
              <label>Product Title *</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => set('name', e.target.value)} 
                placeholder="e.g., Premium Kashmiri Saffron" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={form.description} 
                onChange={e => set('description', e.target.value)} 
                placeholder="Write a detailed explanation..." 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Brand / Supplier</label>
                <input 
                  type="text" 
                  value={form.brand} 
                  onChange={e => set('brand', e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Keywords / Tags</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={tagInput} 
                    onChange={e => setTagInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} 
                    placeholder="Press Enter to add tag" 
                  />
                  <button type="button" onClick={addTag} className="btn-generate" style={{ padding: '8px 16px' }}>Add</button>
                </div>
                <div className="attr-chips" style={{ marginTop: '8px' }}>
                  {tags.map((t, i) => (
                    <span key={i} className="attr-chip" onClick={() => removeTag(i)}>{t} ✕</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Product Type Selector */}
          <div className="form-section">
            <h2>🏷️ Product Type</h2>
            <div className="type-grid">
              {PRODUCT_TYPES.map(t => (
                <div 
                  key={t.id} 
                  className={`type-card ${form.productType === t.id ? 'selected' : ''}`} 
                  onClick={() => set('productType', t.id)}
                >
                  <span className="type-icon">{t.icon}</span>
                  <div className="type-name">{t.name}</div>
                  <div className="type-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Attribute & Variant Options */}
          {form.productType !== 'simple' && form.productType !== 'digital' && (
            <div className="form-section">
              <h2>🔀 Variant Generator Options</h2>
              <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>
                Select global options or type values to generate customized inventory options (e.g. Weight: 100g, 250g, 500g).
              </p>
              
              <div className="attr-chips">
                {globalAttrs.map(a => {
                  const isSel = selectedAttrs.find(s => s.attrId === a._id);
                  return (
                    <span 
                      key={a._id} 
                      className={`attr-chip ${isSel ? 'active' : ''}`} 
                      onClick={() => toggleAttr(a)}
                    >
                      {a.name}
                    </span>
                  );
                })}
              </div>

              {selectedAttrs.map(sa => (
                <div key={sa.attrId} className="attr-section">
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>{sa.name} values:</div>
                  <div className="attr-chips">
                    {(sa.values || []).map((v, i) => {
                      const isValSel = (sa.selectedValues || []).includes(v);
                      return (
                        <span 
                          key={i} 
                          className={`attr-chip ${isValSel ? 'active' : ''}`} 
                          onClick={() => toggleAttrValue(sa.attrId, v)}
                        >
                          {v}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input 
                      type="text" 
                      placeholder={`Add new custom value for ${sa.name} (e.g., 200g)`} 
                      id={`custom_val_${sa.attrId}`} 
                      style={{ flex: 1 }} 
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomValue(sa.attrId, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-generate"
                      onClick={() => {
                        const input = document.getElementById(`custom_val_${sa.attrId}`);
                        addCustomValue(sa.attrId, input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}

              {selectedAttrs.some(a => (a.selectedValues || []).length > 0) && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#495057' }}>
                    Ready to generate {selectedAttrs.filter(a => a.selectedValues.length > 0).reduce((acc, a) => acc * a.selectedValues.length, 1)} variant combination(s).
                  </span>
                  <button type="button" className="btn-generate" onClick={generateVariants}>
                    ⚡ Generate Variant Rows
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Variant Inventory Details */}
          <div className="form-section">
            <h2>📊 Inventory & Pricing</h2>
            
            {form.productType === 'simple' || form.productType === 'digital' ? (
              <div className="form-row">
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input 
                    type="number" 
                    value={form.price} 
                    onChange={e => set('price', e.target.value)} 
                    placeholder="0.00" 
                  />
                </div>
                <div className="form-group">
                  <label>Original MRP (₹)</label>
                  <input 
                    type="number" 
                    value={form.mrp} 
                    onChange={e => set('mrp', e.target.value)} 
                    placeholder="0.00" 
                  />
                </div>
                <div className="form-group">
                  <label>Available Stock</label>
                  <input 
                    type="number" 
                    value={form.stock} 
                    onChange={e => set('stock', e.target.value)} 
                    placeholder="10" 
                  />
                </div>
              </div>
            ) : variants.length === 0 ? (
              <p style={{ color: '#6c757d', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                No variants configured. Use the attribute options above to generate variants, or add a row manually.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="variant-matrix">
                  <thead>
                    <tr>
                      <th>Option Label</th>
                      <th>SKU</th>
                      <th>Barcode</th>
                      <th>MRP (₹)</th>
                      <th>Price (₹)</th>
                      <th>Stock</th>
                      <th>Weight (g)</th>
                      <th>Upload Media</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => {
                      const savingPct = v.mrp && v.price && Number(v.mrp) > Number(v.price)
                        ? Math.round(((Number(v.mrp) - Number(v.price)) / Number(v.mrp)) * 100)
                        : 0;

                      return (
                        <tr key={v.id}>
                          <td style={{ fontWeight: '600' }}>
                            <input 
                              type="text" 
                              value={v.label} 
                              onChange={e => updateVariant(v.id, 'label', e.target.value)} 
                              style={{ width: '110px' }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              value={v.sku} 
                              onChange={e => updateVariant(v.id, 'sku', e.target.value)} 
                              style={{ width: '130px' }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              value={v.barcode} 
                              onChange={e => updateVariant(v.id, 'barcode', e.target.value)} 
                              style={{ width: '100px' }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              value={v.mrp} 
                              onChange={e => updateVariant(v.id, 'mrp', e.target.value)} 
                              style={{ width: '70px' }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              value={v.price} 
                              onChange={e => updateVariant(v.id, 'price', e.target.value)} 
                              style={{ width: '70px' }} 
                            />
                            {savingPct > 0 && (
                              <span className="savings-badge">{savingPct}% off</span>
                            )}
                          </td>
                          <td>
                            <input 
                              type="number" 
                              value={v.stock} 
                              onChange={e => updateVariant(v.id, 'stock', e.target.value)} 
                              style={{ width: '60px' }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              value={v.shippingWeight} 
                              onChange={e => updateVariant(v.id, 'shippingWeight', e.target.value)} 
                              style={{ width: '60px' }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*,video/*" 
                              onChange={e => handleVariantFiles(v.id, e)} 
                              style={{ width: '130px', fontSize: '11px' }} 
                            />
                            {v.existingImages?.length > 0 && (
                              <div style={{ color: '#4CAF50', fontSize: '11px', marginTop: '2px' }}>
                                {v.existingImages.length} saved image(s)
                              </div>
                            )}
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="btn-remove-row" 
                              onClick={() => removeVariant(v.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button type="button" className="btn-add-row" onClick={addManualVariant}>
                  + Add Custom Variant Row
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Dynamic Digital Asset File Upload */}
          {form.productType === 'digital' && (
            <div className="form-section">
              <h2>💾 Digital Assets Configuration</h2>
              {existingDigitalFiles.length > 0 && (
                <div style={{ marginBottom: '16px', background: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #ced4da' }}>
                  <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px' }}>Current Assets:</div>
                  {existingDigitalFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                      <span>{f.name}</span>
                      <span onClick={() => removeExistingDigitalFile(i)} style={{ color: '#dc3545', cursor: 'pointer' }}>Remove</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="form-group">
                <label>Attachments (Zip, PDF, Audio, Video, Image, Software)</label>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleDigitalFiles} 
                  style={{ display: 'block', margin: '8px 0' }}
                />
                {digitalPreviews.length > 0 && (
                  <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #ced4da' }}>
                    <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px' }}>Pending Upload:</div>
                    {digitalPreviews.map((name, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                        <span>{name}</span>
                        <span onClick={() => removeDigitalFile(i)} style={{ color: '#dc3545', cursor: 'pointer' }}>Remove</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Key / Code (Optional)</label>
                  <input 
                    type="text" 
                    value={form.digitalLicenseKey} 
                    onChange={e => set('digitalLicenseKey', e.target.value)} 
                    placeholder="Enter key to deliver to customer" 
                  />
                </div>
                <div className="form-group">
                  <label>Max Downloads Allowed (-1 for Unlimited)</label>
                  <input 
                    type="number" 
                    value={form.digitalDownloadLimit} 
                    onChange={e => set('digitalDownloadLimit', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Duration (Days, 0 for Unlimited)</label>
                  <input 
                    type="number" 
                    value={form.digitalExpiryDays} 
                    onChange={e => set('digitalExpiryDays', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Global Product Specifications */}
          <div className="form-section">
            <h2>📐 Technical Specifications</h2>
            <p style={{ color: '#6c757d', fontSize: '13px', marginBottom: '16px' }}>
              Add custom descriptors or specifications.
            </p>
            {specs.map((s, i) => (
              <div key={i} className="spec-row">
                <input 
                  type="text" 
                  value={s.key} 
                  onChange={e => updateSpec(i, 'key', e.target.value)} 
                  placeholder="e.g. Ingredients" 
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  value={s.value} 
                  onChange={e => updateSpec(i, 'value', e.target.value)} 
                  placeholder="e.g. Cardamom, Saffron" 
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-remove-row" onClick={() => removeSpec(i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-add-row" onClick={addSpec}>
              + Add New Spec Row
            </button>
          </div>
        </div>

        {/* Sidebar Settings Panel */}
        <div className="form-sidebar">
          {/* Classification & Organization */}
          <div className="form-section">
            <h2>📂 Classification</h2>
            <div className="form-group">
              <label>Primary Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subcategory</label>
              <input 
                type="text" 
                value={form.subcategory} 
                onChange={e => set('subcategory', e.target.value)} 
                placeholder="e.g. Powdered Masala" 
              />
            </div>
          </div>

          {/* Media Files */}
          <div className="form-section">
            <h2>🖼️ Product Gallery</h2>
            {existingImages.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px' }}>Current Images:</div>
                <div className="media-previews" style={{ marginTop: '0', marginBottom: '12px' }}>
                  {existingImages.map((img, i) => (
                    <div key={i} className="media-thumb">
                      <img src={img.url} alt="Saved gallery" />
                      <button type="button" className="remove-btn" onClick={() => removeExistingMedia(i)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div 
              className="media-drop-zone"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                handleMedia(e);
              }}
            >
              <div className="upload-icon">📤</div>
              <p style={{ fontSize: '13px', fontWeight: '500' }}>Click/drag images or videos</p>
              <input 
                type="file" 
                ref={fileRef} 
                style={{ display: 'none' }} 
                multiple 
                accept="image/*,video/*" 
                onChange={handleMedia} 
              />
            </div>
            {previews.length > 0 && (
              <div className="media-previews">
                {previews.map((src, i) => (
                  <div key={i} className="media-thumb">
                    <img src={src} alt="Upload preview" />
                    <button type="button" className="remove-btn" onClick={() => removeMedia(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Optimization */}
          <div className="form-section">
            <h2>🔍 SEO Optimization</h2>
            <div className="form-group">
              <label>Meta SEO Title</label>
              <input 
                type="text" 
                value={form.seoTitle} 
                onChange={e => set('seoTitle', e.target.value)} 
                placeholder="e.g. Buy Pure Spices Online" 
              />
            </div>
            <div className="form-group">
              <label>Meta SEO Description</label>
              <textarea 
                value={form.seoDescription} 
                onChange={e => set('seoDescription', e.target.value)} 
                placeholder="Enter details visible on Google searches" 
                style={{ minHeight: '60px' }}
              />
            </div>
            <div className="form-group">
              <label>SEO Keywords (comma separated)</label>
              <input 
                type="text" 
                value={form.seoKeywords} 
                onChange={e => set('seoKeywords', e.target.value)} 
                placeholder="spices, amrit rasoi, masala" 
              />
            </div>
            <div className="form-group">
              <label>Canonical URL</label>
              <input 
                type="url" 
                value={form.canonicalUrl} 
                onChange={e => set('canonicalUrl', e.target.value)} 
                placeholder="https://..." 
              />
            </div>
          </div>

          {/* Visibility / Status */}
          <div className="form-section">
            <h2>🚀 Visibility & Status</h2>
            <div className="form-group">
              <label>Product Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">📝 Draft</option>
                <option value="published">✅ Published</option>
                <option value="hidden">🙈 Hidden</option>
              </select>
            </div>
            <div className="checkbox-group" onClick={() => set('isFeatured', !form.isFeatured)}>
              <input type="checkbox" checked={form.isFeatured} readOnly />
              <span>Feature on Homepage</span>
            </div>
            <div className="checkbox-group" onClick={() => set('inTodaysDeal', !form.inTodaysDeal)}>
              <input type="checkbox" checked={form.inTodaysDeal} readOnly />
              <span>Today's Deal Promotion</span>
            </div>
            <div className="checkbox-group" onClick={() => set('inNewArrivals', !form.inNewArrivals)}>
              <input type="checkbox" checked={form.inNewArrivals} readOnly />
              <span>New Arrivals Badge</span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-cancel" onClick={() => navigate('/products')}>Cancel</button>
        <button 
          className="btn-submit" 
          disabled={loading} 
          onClick={handleSubmit}
        >
          {loading ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default EditProduct;
