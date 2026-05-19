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

  // Main Form fields
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
  
  // Selected attributes mapping: { attrId, name, values: [], selectedValues: [] }
  const [selectedAttrs, setSelectedAttrs] = useState([]);

  // Variants list
  const [variants, setVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]); // List of variant IDs selected via checkbox
  
  // Media files (Global Gallery)
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  
  // Digital asset files
  const [digitalFiles, setDigitalFiles] = useState([]);
  const [digitalPreviews, setDigitalPreviews] = useState([]);
  const [existingDigitalFiles, setExistingDigitalFiles] = useState([]);

  // Pagination for Variant Matrix table
  const [currentPage, setCurrentPage] = useState(1);
  const variantsPerPage = 6;

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
      if (data.success) {
        setCategories(data.categories);
      } else {
        setCategories([{ _id: 'cat1', name: 'Groceries' }, { _id: 'cat2', name: 'Spices & Herbs' }]);
      }
    } catch (e) {
      setCategories([{ _id: 'cat1', name: 'Groceries' }, { _id: 'cat2', name: 'Spices & Herbs' }]);
    }
  };

  const fetchAttributes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${API_BASE_URL}/admin/attributes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setGlobalAttrs(data.attributes);
      } else {
        setGlobalAttrs([
          { _id: 'attr1', name: 'Color', values: ['Red', 'Blue', 'Black', 'Yellow'] },
          { _id: 'attr2', name: 'Size', values: ['S', 'M', 'L', 'XL'] },
          { _id: 'attr3', name: 'Weight', values: ['100g', '200g', '500g', '1kg'] }
        ]);
      }
    } catch (e) {
      setGlobalAttrs([
        { _id: 'attr1', name: 'Color', values: ['Red', 'Blue', 'Black', 'Yellow'] },
        { _id: 'attr2', name: 'Size', values: ['S', 'M', 'L', 'XL'] },
        { _id: 'attr3', name: 'Weight', values: ['100g', '200g', '500g', '1kg'] }
      ]);
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
        
        // Populate variants
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
            existingImages: v.images || [],
            status: v.status || 'active'
          })));

          // Extract attributes from loaded variants
          const extracted = [];
          p.variants.forEach(vr => {
            (vr.attributes || []).forEach(attr => {
              let existing = extracted.find(a => a.name === attr.name);
              if (!existing) {
                existing = { attrId: `loaded_${attr.name}`, name: attr.name, values: [], selectedValues: [] };
                extracted.push(existing);
              }
              if (!existing.values.includes(attr.value)) {
                existing.values.push(attr.value);
              }
              if (!existing.selectedValues.includes(attr.value)) {
                existing.selectedValues.push(attr.value);
              }
            });
          });
          setSelectedAttrs(extracted);
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

  // Dynamic attributes management
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

  // Generate combinations
  const generateVariantsFromAttrs = (currentAttrs) => {
    const attrsWithValues = currentAttrs.filter(a => (a.selectedValues || []).length > 0);
    if (attrsWithValues.length === 0) {
      setVariants([]);
      return;
    }

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

    const codePrefix = form.brand ? form.brand.substring(0, 3).toUpperCase() : 'AMR';
    setVariants(combos.map((attrs, i) => {
      const label = attrs.map(a => a.value).join(' / ');
      const code = attrs.map(a => a.value.substring(0, 3).toUpperCase()).join('-');
      return {
        id: `v_${Date.now()}_${i}`,
        attributes: attrs,
        label,
        sku: `${codePrefix}-${code}-${(100 + i)}`,
        barcode: `89060000${100 + i}`,
        price: '599',
        mrp: '899',
        stock: '32',
        taxRate: 0,
        shippingWeight: '100',
        shippingClass: 'standard',
        isFragile: false,
        dimensions: { length: '', width: '', height: '' },
        files: [],
        existingImages: [],
        status: 'active'
      };
    }));
    setCurrentPage(1);
  };

  const handleManualGeneration = () => {
    generateVariantsFromAttrs(selectedAttrs);
  };

  const addManualVariant = () => {
    setVariants([...variants, {
      id: `v_${Date.now()}`,
      attributes: [{ name: 'Option', value: '' }],
      label: 'Custom Option',
      sku: '',
      barcode: '',
      price: '599',
      mrp: '899',
      stock: '10',
      taxRate: 0,
      shippingWeight: '',
      shippingClass: 'standard',
      isFragile: false,
      dimensions: { length: '', width: '', height: '' },
      files: [],
      existingImages: [],
      status: 'active'
    }]);
  };

  const updateVariant = (id, f, v) => setVariants(variants.map(vr => vr.id === id ? { ...vr, [f]: v } : vr));
  const toggleVariantStatus = id => setVariants(variants.map(vr => vr.id === id ? { ...vr, status: vr.status === 'active' ? 'inactive' : 'active' } : vr));
  const removeVariant = id => setVariants(variants.filter(v => v.id !== id));
  const handleVariantFiles = (id, e) => {
    const files = Array.from(e.target.files);
    setVariants(variants.map(v => v.id === id ? { ...v, files } : v));
  };

  // Bulk Actions
  const toggleSelectAllVariants = () => {
    if (selectedVariants.length === variants.length) {
      setSelectedVariants([]);
    } else {
      setSelectedVariants(variants.map(v => v.id));
    }
  };

  const toggleSelectVariant = (id) => {
    if (selectedVariants.includes(id)) {
      setSelectedVariants(selectedVariants.filter(v => v !== id));
    } else {
      setSelectedVariants([...selectedVariants, id]);
    }
  };

  const deleteSelectedVariants = () => {
    setVariants(variants.filter(v => !selectedVariants.includes(v.id)));
    setSelectedVariants([]);
  };

  const bulkEditPrice = () => {
    const newPrice = prompt('Enter new selling price (₹) for selected variants:');
    if (newPrice !== null && !isNaN(newPrice)) {
      setVariants(variants.map(v => selectedVariants.includes(v.id) ? { ...v, price: newPrice } : v));
    }
  };

  // Media Gallery Upload handlers
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
  const handleSubmit = async (publishStatus = 'published') => {
    if (!form.name) return alert('Product title is required');
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const fd = new FormData();
      
      const updatedForm = { ...form, status: publishStatus };
      Object.keys(updatedForm).forEach(k => fd.append(k, updatedForm[k]));
      fd.append('tags', tags.join(','));
      fd.append('specifications', JSON.stringify(specs.filter(s => s.key)));
      fd.append('existingImages', JSON.stringify(existingImages));
      fd.append('existingDigitalFiles', JSON.stringify(existingDigitalFiles));

      if (updatedForm.productType === 'simple' || updatedForm.productType === 'digital') {
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
          images: v.existingImages || [],
          status: v.status
        }));
        fd.append('variants', JSON.stringify(mapped));
      }

      // General images
      images.forEach(img => fd.append('images', img));

      // Digital assets
      digitalFiles.forEach(file => fd.append('digital_assets', file));

      // Variant specific files
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

  if (fetching) return <div className="add-product-page" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading product details...</div>;

  // Pagination helper
  const indexOfLastVariant = currentPage * variantsPerPage;
  const indexOfFirstVariant = indexOfLastVariant - variantsPerPage;
  const currentVariantsList = variants.slice(indexOfFirstVariant, indexOfLastVariant);
  const totalPages = Math.ceil(variants.length / variantsPerPage);

  // Dynamic progress checks for indicator bar
  const isBasicInfoFilled = !!form.name && !!form.category;
  const isTypeSelected = !!form.productType;
  const isAttributesConfigured = selectedAttrs.some(a => a.selectedValues.length > 0);
  const isVariantsGenerated = variants.length > 0;
  const isAdditionalDetailsConfigured = images.length > 0 || existingImages.length > 0 || (form.price && form.stock);
  const isSeoFilled = !!form.seoTitle && !!form.seoDescription;

  const currentPreviewImage = previews[0] || (existingImages[0]?.url) || "https://images.unsplash.com/photo-1596790011462-2410d413e56a?auto=format&fit=crop&w=300&q=80";

  return (
    <div className="add-product-page">
      {/* Page Breadcrumbs & Title bar */}
      <div className="breadcrumbs">
        <span onClick={() => navigate('/dashboard')}>Dashboard</span> / 
        <span onClick={() => navigate('/products')}> Products</span> / 
        <span> Edit Product</span>
      </div>

      <div className="page-header">
        <div>
          <h1>Edit Product: {form.name}</h1>
          <p>Update dynamic settings, attribute variations, specs, and configurations.</p>
        </div>
        <div className="header-actions">
          <button className="btn-draft" onClick={() => handleSubmit('draft')} disabled={loading}>
            Save as Draft
          </button>
          <button className="btn-preview" onClick={() => alert('Opening live catalog preview...')} type="button">
            Preview
          </button>
          <button className="btn-publish" onClick={() => handleSubmit('published')} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="progress-steps-container">
        <div className={`progress-step ${isBasicInfoFilled ? 'completed' : 'active'}`}>
          <div className="step-circle">{isBasicInfoFilled ? '✓' : '1'}</div>
          <div className="step-details">
            <div className="step-title">Basic Information</div>
            <div className="step-subtitle">Product details</div>
          </div>
        </div>
        <div className={`progress-step ${isTypeSelected ? 'completed' : 'active'}`}>
          <div className="step-circle">{isTypeSelected ? '✓' : '2'}</div>
          <div className="step-details">
            <div className="step-title">Product Type</div>
            <div className="step-subtitle">Select product type</div>
          </div>
        </div>
        <div className={`progress-step ${isAttributesConfigured ? 'completed' : 'active'}`}>
          <div className="step-circle">{isAttributesConfigured ? '✓' : '3'}</div>
          <div className="step-details">
            <div className="step-title">Attributes</div>
            <div className="step-subtitle">Add attributes</div>
          </div>
        </div>
        <div className={`progress-step ${isVariantsGenerated ? 'completed' : 'active'}`}>
          <div className="step-circle">{isVariantsGenerated ? '✓' : '4'}</div>
          <div className="step-details">
            <div className="step-title">Variants</div>
            <div className="step-subtitle">Manage variants</div>
          </div>
        </div>
        <div className={`progress-step ${isAdditionalDetailsConfigured ? 'completed' : 'active'}`}>
          <div className="step-circle">{isAdditionalDetailsConfigured ? '✓' : '5'}</div>
          <div className="step-details">
            <div className="step-title">Additional Details</div>
            <div className="step-subtitle">Media, Pricing, Inventory</div>
          </div>
        </div>
        <div className={`progress-step ${isSeoFilled ? 'completed' : 'active'}`}>
          <div className="step-circle">{isSeoFilled ? '✓' : '6'}</div>
          <div className="step-details">
            <div className="step-title">SEO & Publish</div>
            <div className="step-subtitle">Search engine & status</div>
          </div>
        </div>
      </div>

      {/* 3-Column Bento Grid */}
      <div className="shopvista-grid">
        {/* Left Column: Attributes Manager & Tips */}
        <div className="left-panel">
          <div className="bento-card">
            <h2 style={{ borderBottom: 'none', marginBottom: '12px' }}>Attributes Selected</h2>
            {selectedAttrs.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748b' }}>No attributes selected yet.</p>
            ) : (
              selectedAttrs.map(a => (
                <div key={a.attrId} className="attr-card-selected">
                  <div className="attr-info">
                    <span className="attr-name">{a.name}</span>
                    <span className="attr-count">{a.selectedValues.length} Values</span>
                  </div>
                </div>
              ))
            )}
            <button 
              type="button" 
              className="btn-add-row" 
              style={{ marginTop: '12px', border: '1px solid #cbd5e1', color: '#334155' }}
              onClick={() => {
                const name = prompt('Enter Attribute Name (e.g. Size, Material, Weight):');
                if (name) {
                  setSelectedAttrs([...selectedAttrs, {
                    attrId: `custom_${Date.now()}`,
                    name,
                    values: [],
                    selectedValues: []
                  }]);
                }
              }}
            >
              + Add More Attributes
            </button>
          </div>

          <div className="bento-card">
            <h2 style={{ borderBottom: 'none', marginBottom: '8px' }}>Auto Generate Variants</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              {selectedAttrs.filter(a => a.selectedValues.length > 0).map(a => `${a.selectedValues.length} ${a.name}`).join(' × ') || '0 Attributes'} 
              {selectedAttrs.some(a => a.selectedValues.length > 0) && ` = ${selectedAttrs.filter(a => a.selectedValues.length > 0).reduce((acc, a) => acc * a.selectedValues.length, 1)} Variants`}
            </p>
            <button 
              type="button" 
              className="btn-publish" 
              style={{ width: '100%', padding: '10px' }}
              onClick={handleManualGeneration}
            >
              Generate Variants
            </button>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <span 
                style={{ fontSize: '12px', color: '#4f46e5', cursor: 'pointer', fontWeight: '600' }}
                onClick={() => {
                  setVariants([]);
                  generateVariantsFromAttrs(selectedAttrs);
                }}
              >
                Regenerate
              </span>
            </div>
          </div>

          <div className="tips-container">
            <h3>💡 Tips</h3>
            <div className="tip-item">
              <span className="tip-icon-check">✓</span>
              <span>Use Generate Variants to create all combinations automatically.</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon-check">✓</span>
              <span>You can edit or remove any variant manually.</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon-check">✓</span>
              <span>Bulk edit using the action buttons above the table.</span>
            </div>
          </div>
        </div>

        {/* Middle Column: Scrollable Config panels & Variants Table */}
        <div className="middle-panel">
          {/* Card 1: Basic Information */}
          <div className="bento-card">
            <h2>📋 Basic Information</h2>
            <div className="wz-group">
              <label>Product Title *</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => set('name', e.target.value)} 
                required 
              />
            </div>
            <div className="wz-group">
              <label>Description</label>
              <textarea 
                value={form.description} 
                onChange={e => set('description', e.target.value)} 
              />
            </div>
            <div className="wz-row">
              <div className="wz-group">
                <label>Brand</label>
                <input 
                  type="text" 
                  value={form.brand} 
                  onChange={e => set('brand', e.target.value)} 
                />
              </div>
              <div className="wz-group">
                <label>Tags</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={tagInput} 
                    onChange={e => setTagInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} 
                    placeholder="Press Enter" 
                  />
                  <button type="button" onClick={addTag} className="btn-generate" style={{ padding: '8px 14px' }}>Add</button>
                </div>
                <div className="attr-chips-premium" style={{ marginTop: '8px' }}>
                  {tags.map((t, i) => (
                    <span key={i} className="attr-chip-premium" onClick={() => removeTag(i)}>{t} ✕</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Product Type */}
          <div className="bento-card">
            <h2>🏷️ Product Type</h2>
            <div className="type-grid-premium">
              {PRODUCT_TYPES.map(t => (
                <div 
                  key={t.id} 
                  className={`type-card-premium ${form.productType === t.id ? 'selected' : ''}`} 
                  onClick={() => set('productType', t.id)}
                >
                  <span className="type-icon">{t.icon}</span>
                  <div className="type-name">{t.name}</div>
                  <div className="type-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Attributes Editor */}
          {form.productType !== 'simple' && form.productType !== 'digital' && (
            <div className="bento-card">
              <h2>🎨 Configure Attribute Options</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Select system presets or type custom values. (e.g. Weight: 100g, 200g, 500g).
              </p>
              
              <div className="attr-chips-premium" style={{ marginBottom: '16px' }}>
                {globalAttrs.map(a => {
                  const isSel = selectedAttrs.find(s => s.attrId === a._id);
                  return (
                    <span 
                      key={a._id} 
                      className={`attr-chip-premium ${isSel ? 'active' : ''}`} 
                      onClick={() => toggleAttr(a)}
                    >
                      {a.name}
                    </span>
                  );
                })}
              </div>

              {selectedAttrs.map(sa => (
                <div key={sa.attrId} className="attr-section" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px', color: '#1e293b' }}>{sa.name} values:</div>
                  <div className="attr-chips-premium">
                    {(sa.values || []).map((v, i) => {
                      const isValSel = (sa.selectedValues || []).includes(v);
                      return (
                        <span 
                          key={i} 
                          className={`attr-chip-premium ${isValSel ? 'active' : ''}`} 
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
                      placeholder={`Type custom ${sa.name} value and press Enter`} 
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
                      style={{ background: '#4f46e5' }}
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
            </div>
          )}

          {/* Card 4: Variants Table Matrix */}
          <div className="bento-card">
            <h2>📊 Variants ({variants.length})</h2>
            
            {form.productType === 'simple' || form.productType === 'digital' ? (
              <div className="wz-row">
                <div className="wz-group">
                  <label>Selling Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
                <div className="wz-group">
                  <label>Original MRP (₹)</label>
                  <input type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)} />
                </div>
                <div className="wz-group">
                  <label>Stock</label>
                  <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
                </div>
              </div>
            ) : variants.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                No variants configured. Select attributes and generate variants.
              </p>
            ) : (
              <div>
                <div className="variants-header-actions">
                  <div className="variants-bulk-actions">
                    <button type="button" className="btn-bulk" onClick={bulkEditPrice}>✏️ Bulk Edit</button>
                    <button type="button" className="btn-bulk" onClick={() => alert('Import CSV feature starting...')}>📤 Bulk Upload</button>
                    <button type="button" className="btn-bulk" onClick={() => alert('Downloading variant list CSV...')}>📥 Download</button>
                    {selectedVariants.length > 0 && (
                      <button type="button" className="btn-bulk" style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={deleteSelectedVariants}>
                        🗑️ Delete Selected
                      </button>
                    )}
                  </div>
                </div>

                <div className="variant-table-container">
                  <table className="premium-variant-table">
                    <thead>
                      <tr>
                        <th style={{ width: '32px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedVariants.length === variants.length && variants.length > 0} 
                            onChange={toggleSelectAllVariants} 
                          />
                        </th>
                        <th>Variant</th>
                        <th>SKU</th>
                        <th>Price (₹)</th>
                        <th>Stock</th>
                        <th>Images</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVariantsList.map((v) => {
                        const isSel = selectedVariants.includes(v.id);
                        return (
                          <tr key={v.id} style={{ background: isSel ? '#f8fafc' : 'transparent' }}>
                            <td>
                              <input 
                                type="checkbox" 
                                checked={isSel} 
                                onChange={() => toggleSelectVariant(v.id)} 
                              />
                            </td>
                            <td>
                              <div className="variant-meta-cell">
                                <img 
                                  src={v.existingImages?.[0]?.url || currentPreviewImage} 
                                  alt="variant preview" 
                                  className="variant-thumbnail" 
                                />
                                <div className="variant-details-text">
                                  <span className="variant-title-main">{v.label}</span>
                                  <span className="variant-subtitle-sub">{form.brand}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                value={v.sku} 
                                onChange={e => updateVariant(v.id, 'sku', e.target.value)} 
                                style={{ width: '130px', padding: '6px' }} 
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <input 
                                  type="number" 
                                  value={v.price} 
                                  onChange={e => updateVariant(v.id, 'price', e.target.value)} 
                                  style={{ width: '80px', padding: '6px' }} 
                                />
                                <span style={{ fontSize: '10px', color: '#64748b', textDecoration: 'line-through' }}>₹{v.mrp}</span>
                              </div>
                            </td>
                            <td>
                              <input 
                                type="number" 
                                value={v.stock} 
                                onChange={e => updateVariant(v.id, 'stock', e.target.value)} 
                                style={{ width: '60px', padding: '6px' }} 
                              />
                              <span style={{ display: 'block', fontSize: '10px', color: Number(v.stock) > 0 ? '#10b981' : '#ef4444', fontWeight: '600', marginTop: '2px' }}>
                                {Number(v.stock) > 0 ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td>
                              <div className="variant-media-list">
                                {v.existingImages?.slice(0, 2).map((img, idx) => (
                                  <img key={idx} src={img.url} alt="" className="variant-media-thumb" />
                                ))}
                                {previews.slice(0, Math.max(0, 2 - (v.existingImages?.length || 0))).map((p, idx) => (
                                  <img key={idx} src={p} alt="" className="variant-media-thumb" />
                                ))}
                                <input 
                                  type="file" 
                                  multiple 
                                  accept="image/*" 
                                  onChange={e => handleVariantFiles(v.id, e)} 
                                  style={{ display: 'none' }} 
                                  id={`file_v_${v.id}`} 
                                />
                                <span 
                                  style={{ cursor: 'pointer', color: '#4f46e5', fontSize: '12px', alignSelf: 'center', marginLeft: '4px' }}
                                  onClick={() => document.getElementById(`file_v_${v.id}`).click()}
                                >
                                  📸 Add
                                </span>
                              </div>
                            </td>
                            <td>
                              <span 
                                className={`badge-status ${v.status}`} 
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleVariantStatus(v.id)}
                              >
                                {v.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button type="button" className="btn-remove-row" onClick={() => removeVariant(v.id)}>
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Pagination footer */}
                  <div className="table-pagination">
                    <span>Showing {indexOfFirstVariant + 1} to {Math.min(indexOfLastVariant, variants.length)} of {variants.length} variants</span>
                    <div className="pagination-controls">
                      <button 
                        type="button" 
                        className="pagination-btn" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        ‹
                      </button>
                      {Array.from({ length: totalPages }, (_, idx) => (
                        <button 
                          key={idx} 
                          type="button" 
                          className={`pagination-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                          onClick={() => setCurrentPage(idx + 1)}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      <button 
                        type="button" 
                        className="pagination-btn" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>

                <button type="button" className="btn-add-row" onClick={addManualVariant}>
                  + Add Variant Row Manually
                </button>
              </div>
            )}
          </div>

          {/* Card 5: Digital Assets Configurations */}
          {form.productType === 'digital' && (
            <div className="bento-card">
              <h2>💾 Digital Assets Configuration</h2>
              {existingDigitalFiles.length > 0 && (
                <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontWeight: '700', fontSize: '11px', marginBottom: '6px' }}>Current Assets:</div>
                  {existingDigitalFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                      <span>{f.name}</span>
                      <span onClick={() => removeExistingDigitalFile(i)} style={{ color: '#ef4444', cursor: 'pointer' }}>Remove</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="wz-group">
                <label>Attachments (Zip, PDF, Audio, Video, Image, Software)</label>
                <input type="file" multiple onChange={handleDigitalFiles} />
                {digitalPreviews.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '11px', marginBottom: '6px' }}>Pending Upload:</div>
                    {digitalPreviews.map((name, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '4px 0' }}>
                        <span>{name}</span>
                        <span onClick={() => removeDigitalFile(i)} style={{ color: '#ef4444', cursor: 'pointer' }}>Remove</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="wz-row">
                <div className="wz-group">
                  <label>License Key / Code</label>
                  <input type="text" value={form.digitalLicenseKey} onChange={e => set('digitalLicenseKey', e.target.value)} placeholder="e.g. LICENSE-KEY-1234" />
                </div>
                <div className="wz-group">
                  <label>Max Downloads Allowed (-1 for Unlimited)</label>
                  <input type="number" value={form.digitalDownloadLimit} onChange={e => set('digitalDownloadLimit', e.target.value)} />
                </div>
                <div className="wz-group">
                  <label>Expiry Duration (Days, 0 for Unlimited)</label>
                  <input type="number" value={form.digitalExpiryDays} onChange={e => set('digitalExpiryDays', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Card 6: Specs */}
          <div className="bento-card">
            <h2>📐 Specifications</h2>
            {specs.map((s, i) => (
              <div key={i} className="spec-row">
                <input type="text" value={s.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Key" />
                <input type="text" value={s.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value" />
                <button type="button" className="btn-remove-row" onClick={() => removeSpec(i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn-add-row" onClick={addSpec}>+ Add New Spec Row</button>
          </div>

          {/* Card 7: SEO */}
          <div className="bento-card">
            <h2>🔍 SEO Optimization</h2>
            <div className="wz-group">
              <label>Meta Title</label>
              <input type="text" value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)} />
            </div>
            <div className="wz-group">
              <label>Meta Description</label>
              <textarea value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} />
            </div>
            <div className="wz-group">
              <label>Keywords</label>
              <input type="text" value={form.seoKeywords} onChange={e => set('seoKeywords', e.target.value)} />
            </div>
            <div className="wz-group">
              <label>Canonical URL</label>
              <input type="url" value={form.canonicalUrl} onChange={e => set('canonicalUrl', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right Column: Live Product Summary / Preview Card */}
        <div className="right-panel">
          <div className="bento-card sidebar-summary-card">
            <h2 style={{ borderBottom: 'none', marginBottom: '14px' }}>Product Summary</h2>
            <img 
              src={currentPreviewImage} 
              alt="live preview" 
              className="summary-img-preview"
            />
            <div className="summary-title">{form.name || 'Untitled Product'}</div>
            <div className="summary-badge-type">
              {PRODUCT_TYPES.find(t => t.id === form.productType)?.name || 'Variable Product'}
            </div>
            <div className="summary-meta-row">
              <span>SKU:</span>
              <strong>{variants[0]?.sku || 'SKU-001'}</strong>
            </div>
            <div className="summary-meta-row">
              <span>Status:</span>
              <strong style={{ textTransform: 'capitalize', color: form.status === 'draft' ? '#f59e0b' : '#10b981' }}>
                {form.status}
              </strong>
            </div>

            <div className="sidebar-section-title">Attributes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedAttrs.map(a => (
                <div key={a.attrId} style={{ fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>{a.name}: </span>
                  <strong style={{ color: '#0f172a' }}>{a.selectedValues.join(', ') || 'None'}</strong>
                </div>
              ))}
            </div>

            <div className="sidebar-section-title">Media</div>
            {existingImages.length > 0 && (
              <div className="media-previews" style={{ gap: '6px', marginBottom: '8px', marginTop: '0' }}>
                {existingImages.map((img, i) => (
                  <div key={i} className="media-thumb" style={{ width: '48px', height: '48px' }}>
                    <img src={img.url} alt="" />
                    <button type="button" className="remove-btn" style={{ width: '14px', height: '14px', fontSize: '9px' }} onClick={() => removeExistingMedia(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div 
              className="media-drop-zone"
              style={{ padding: '16px 10px', marginTop: '8px' }}
              onClick={() => fileRef.current?.click()}
            >
              <span style={{ fontSize: '12px' }}>➕ Add More Media</span>
              <input type="file" ref={fileRef} style={{ display: 'none' }} multiple accept="image/*,video/*" onChange={handleMedia} />
            </div>
            {previews.length > 0 && (
              <div className="media-previews" style={{ gap: '6px', marginTop: '10px' }}>
                {previews.map((src, i) => (
                  <div key={i} className="media-thumb" style={{ width: '48px', height: '48px' }}>
                    <img src={src} alt="" />
                    <button type="button" className="remove-btn" style={{ width: '14px', height: '14px', fontSize: '9px' }} onClick={() => removeMedia(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="sidebar-section-title">Visibility</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div className="checkbox-group" style={{ padding: '8px 12px', margin: 0 }} onClick={() => set('isFeatured', !form.isFeatured)}>
                <input type="checkbox" checked={form.isFeatured} readOnly />
                <span style={{ fontSize: '12px' }}>Featured on Homepage</span>
              </div>
              <div className="checkbox-group" style={{ padding: '8px 12px', margin: 0 }} onClick={() => set('inTodaysDeal', !form.inTodaysDeal)}>
                <input type="checkbox" checked={form.inTodaysDeal} readOnly />
                <span style={{ fontSize: '12px' }}>Today's Deal Badge</span>
              </div>
              <div className="checkbox-group" style={{ padding: '8px 12px', margin: 0 }} onClick={() => set('inNewArrivals', !form.inNewArrivals)}>
                <input type="checkbox" checked={form.inNewArrivals} readOnly />
                <span style={{ fontSize: '12px' }}>New Arrivals Badge</span>
              </div>
            </div>

            <div className="sidebar-section-title">Classification</div>
            <div className="wz-group" style={{ marginTop: '6px' }}>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="wz-group">
              <input type="text" value={form.subcategory} onChange={e => set('subcategory', e.target.value)} placeholder="Subcategory" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
