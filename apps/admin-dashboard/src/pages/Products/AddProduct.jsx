import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './AddProduct.css';

const STEPS = ['Basic Info','Product Type','Category','Attributes','Generate Variants','Variant Details','Media','Specifications','SEO','Publish'];
const PRODUCT_TYPES = [
  { id:'simple', icon:'📦', name:'Simple', desc:'Single item, no variants' },
  { id:'variable', icon:'🔀', name:'Variable', desc:'Multiple variants (size, color)' },
  { id:'digital', icon:'💾', name:'Digital', desc:'Downloadable files' },
  { id:'subscription', icon:'🔄', name:'Subscription', desc:'Recurring billing' },
  { id:'bundle', icon:'🎁', name:'Bundle', desc:'Combo of products' },
];

const AddProduct = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  // Data
  const [form, setForm] = useState({
    name:'', description:'', brand:'Amrit Rasoi', productType:'variable',
    category:'', subcategory:'', status:'draft',
    seoTitle:'', seoDescription:'', seoKeywords:'', canonicalUrl:'',
    isFeatured:false, inTodaysDeal:false, inNewArrivals:false,
    price:'', mrp:'', stock:'',
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [specs, setSpecs] = useState([{key:'',value:''}]);
  const [categories, setCategories] = useState([]);
  const [globalAttrs, setGlobalAttrs] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState([]); // [{attrId, name, values:[]}]
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const {data} = await axios.get(`${API_BASE_URL}/admin/categories`, {headers:{Authorization:`Bearer ${token}`}});
      if(data.success) setCategories(data.categories);
    } catch(e) { console.error(e); }
  };
  const fetchAttributes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const {data} = await axios.get(`${API_BASE_URL}/admin/attributes`, {headers:{Authorization:`Bearer ${token}`}});
      if(data.success) setGlobalAttrs(data.attributes);
    } catch(e) { console.error(e); }
  };

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const addTag = () => { if(tagInput.trim()) { setTags([...tags, tagInput.trim()]); setTagInput(''); }};
  const removeTag = i => setTags(tags.filter((_,idx)=>idx!==i));
  const addSpec = () => setSpecs([...specs, {key:'',value:''}]);
  const updateSpec = (i,f,v) => { const s=[...specs]; s[i][f]=v; setSpecs(s); };
  const removeSpec = i => setSpecs(specs.filter((_,idx)=>idx!==i));

  // Attribute selection
  const toggleAttr = (attr) => {
    const exists = selectedAttrs.find(a=>a.attrId===attr._id);
    if(exists) {
      setSelectedAttrs(selectedAttrs.filter(a=>a.attrId!==attr._id));
    } else {
      setSelectedAttrs([...selectedAttrs, {attrId:attr._id, name:attr.name, values:attr.values||[], selectedValues:[]}]);
    }
  };
  const toggleAttrValue = (attrId, val) => {
    setSelectedAttrs(selectedAttrs.map(a => {
      if(a.attrId!==attrId) return a;
      const sv = a.selectedValues||[];
      return {...a, selectedValues: sv.includes(val) ? sv.filter(v=>v!==val) : [...sv, val]};
    }));
  };
  const addCustomValue = (attrId, val) => {
    if(!val.trim()) return;
    setSelectedAttrs(selectedAttrs.map(a => {
      if(a.attrId!==attrId) return a;
      return {...a, values:[...a.values,val.trim()], selectedValues:[...(a.selectedValues||[]),val.trim()]};
    }));
  };

  // Generate variant matrix
  const generateVariants = () => {
    const attrsWithValues = selectedAttrs.filter(a=>(a.selectedValues||[]).length>0);
    if(attrsWithValues.length===0) return;
    const combos = attrsWithValues.reduce((acc, attr) => {
      if(acc.length===0) return attr.selectedValues.map(v=>[{name:attr.name, value:v}]);
      const result=[];
      acc.forEach(combo => attr.selectedValues.forEach(v => result.push([...combo, {name:attr.name, value:v}])));
      return result;
    }, []);
    setVariants(combos.map((attrs,i) => ({
      id: `v_${Date.now()}_${i}`,
      attributes: attrs,
      label: attrs.map(a=>a.value).join(' / '),
      sku: `${(form.brand||'SKU').substring(0,3).toUpperCase()}-${attrs.map(a=>a.value.substring(0,3).toUpperCase()).join('-')}-${Math.random().toString(36).substring(2,5).toUpperCase()}`,
      barcode:'', price:'', mrp:'', stock:'', taxRate:0,
      shippingWeight:'', shippingClass:'standard', isFragile:false,
      dimensions:{length:'',width:'',height:''},
      files:[]
    })));
  };

  const addManualVariant = () => {
    setVariants([...variants, {
      id:`v_${Date.now()}`, attributes:[{name:'Variant',value:''}], label:'',
      sku:'', barcode:'', price:'', mrp:'', stock:'', taxRate:0,
      shippingWeight:'', shippingClass:'standard', isFragile:false,
      dimensions:{length:'',width:'',height:''}, files:[]
    }]);
  };
  const updateVariant = (id,f,v) => setVariants(variants.map(vr=>vr.id===id?{...vr,[f]:v}:vr));
  const removeVariant = id => setVariants(variants.filter(v=>v.id!==id));
  const handleVariantFiles = (id,e) => {
    const files = Array.from(e.target.files);
    setVariants(variants.map(v=>v.id===id?{...v,files}:v));
  };

  // Global media
  const handleMedia = (e) => {
    const files = Array.from(e.dataTransfer?.files||e.target.files);
    setImages(p=>[...p,...files]);
    setPreviews(p=>[...p,...files.map(f=>URL.createObjectURL(f))]);
  };
  const removeMedia = i => { setImages(images.filter((_,idx)=>idx!==i)); setPreviews(previews.filter((_,idx)=>idx!==i)); };

  // Submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      fd.append('tags', tags.join(','));
      fd.append('specifications', JSON.stringify(specs.filter(s=>s.key)));

      if(form.productType==='simple') {
        fd.append('hasVariants','false');
      } else {
        fd.append('hasVariants','true');
        const mapped = variants.map(v=>({
          attributes: v.attributes,
          price: v.price, mrp: v.mrp, stock: v.stock,
          sku: v.sku, barcode: v.barcode,
          taxRate: v.taxRate, shippingWeight: v.shippingWeight,
          shippingClass: v.shippingClass, isFragile: v.isFragile,
          dimensions: v.dimensions
        }));
        fd.append('variants', JSON.stringify(mapped));
      }

      images.forEach(img => fd.append('images', img));
      variants.forEach((v,i) => {
        if(v.files?.length) v.files.forEach(f => fd.append(`variant_images_${i}`, f));
      });

      const {data} = await axios.post(`${API_BASE_URL}/admin/product/new`, fd,
        {headers:{'Content-Type':'multipart/form-data','Authorization':`Bearer ${token}`}});
      if(data.success) { alert('Product created!'); navigate('/products'); }
    } catch(e) {
      alert(e.response?.data?.message||'Failed to create product');
    } finally { setLoading(false); }
  };

  // Render Steps
  const renderStep = () => {
    switch(step) {
      case 0: return renderBasicInfo();
      case 1: return renderProductType();
      case 2: return renderCategory();
      case 3: return renderAttributes();
      case 4: return renderGenerateVariants();
      case 5: return renderVariantDetails();
      case 6: return renderMedia();
      case 7: return renderSpecifications();
      case 8: return renderSEO();
      case 9: return renderPublish();
      default: return null;
    }
  };

  const renderBasicInfo = () => (
    <div className="wizard-card">
      <h2>📋 Basic Information</h2>
      <div className="wz-form-group">
        <label>Product Title *</label>
        <input type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g., Premium Kashmiri Saffron" required />
      </div>
      <div className="wz-form-group">
        <label>Full Description</label>
        <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Detailed product description..." />
      </div>
      <div className="wz-form-row">
        <div className="wz-form-group">
          <label>Brand</label>
          <input type="text" value={form.brand} onChange={e=>set('brand',e.target.value)} />
        </div>
        <div className="wz-form-group">
          <label>Tags</label>
          <div style={{display:'flex',gap:8}}>
            <input type="text" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} placeholder="Press Enter to add" />
            <button type="button" onClick={addTag} className="btn-generate" style={{padding:'8px 14px',fontSize:12}}>Add</button>
          </div>
          <div className="attr-chips" style={{marginTop:8}}>
            {tags.map((t,i)=><span key={i} className="attr-chip" onClick={()=>removeTag(i)}>{t} ✕</span>)}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductType = () => (
    <div className="wizard-card">
      <h2>🏷️ Product Type</h2>
      <p style={{color:'#888',fontSize:13,marginBottom:16}}>Select the type that best describes your product.</p>
      <div className="type-grid">
        {PRODUCT_TYPES.map(t=>(
          <div key={t.id} className={`type-card ${form.productType===t.id?'selected':''}`} onClick={()=>set('productType',t.id)}>
            <span className="type-icon">{t.icon}</span>
            <div className="type-name">{t.name}</div>
            <div className="type-desc">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategory = () => (
    <div className="wizard-card">
      <h2>📂 Category & Classification</h2>
      <div className="wz-form-row">
        <div className="wz-form-group">
          <label>Category *</label>
          {categories.length > 0 ? (
            <select value={form.category} onChange={e=>set('category',e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(c=><option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          ) : (
            <input type="text" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="Type category name (e.g. Spices, Electronics)" />
          )}
        </div>
        <div className="wz-form-group">
          <label>Subcategory</label>
          <input type="text" value={form.subcategory} onChange={e=>set('subcategory',e.target.value)} placeholder="e.g., Whole Spices, Smartphones" />
        </div>
      </div>
    </div>
  );

  const renderAttributes = () => (
    <div className="wizard-card">
      <h2>🎨 Product Attributes</h2>
      <p style={{color:'#888',fontSize:13,marginBottom:12}}>Select attributes to create product variations. Click an attribute, then choose values.</p>
      {form.productType==='simple' ? (
        <p style={{color:'#4CAF50',fontWeight:500}}>✅ Simple products don't need variant attributes. You can skip this step.</p>
      ) : (<>
        <div className="attr-chips">
          {globalAttrs.map(a=>(
            <span key={a._id} className={`attr-chip ${selectedAttrs.find(s=>s.attrId===a._id)?'active':''}`} onClick={()=>toggleAttr(a)}>
              {a.name}
            </span>
          ))}
          {globalAttrs.length===0 && <span style={{color:'#999',fontSize:13}}>No global attributes found. Type custom attribute values below or create attributes in Settings.</span>}
        </div>
        {selectedAttrs.map(sa=>(
          <div key={sa.attrId} style={{marginTop:16,padding:16,background:'#fafafa',borderRadius:8,border:'1px solid #eee'}}>
            <label style={{fontWeight:600,color:'#333',fontSize:14}}>{sa.name} — select values:</label>
            <div className="attr-chips" style={{marginTop:8}}>
              {(sa.values||[]).map((v,i)=>(
                <span key={i} className={`attr-chip ${(sa.selectedValues||[]).includes(v)?'active':''}`} onClick={()=>toggleAttrValue(sa.attrId,v)}>
                  {v}
                </span>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <input type="text" placeholder={`Add custom ${sa.name} value...`} id={`custom_${sa.attrId}`} style={{flex:1,border:'1px solid #ddd',borderRadius:4,padding:'6px 10px',fontSize:13}} />
              <button type="button" className="btn-generate" style={{padding:'6px 12px',fontSize:12}} onClick={()=>{
                const el=document.getElementById(`custom_${sa.attrId}`);
                addCustomValue(sa.attrId, el.value); el.value='';
              }}>Add</button>
            </div>
          </div>
        ))}
      </>)}
    </div>
  );

  const renderGenerateVariants = () => (
    <div className="wizard-card">
      <h2>⚡ Generate Variant Combinations</h2>
      {form.productType==='simple' ? (
        <p style={{color:'#4CAF50',fontWeight:500}}>✅ Simple product — no variants needed. Skip to Media.</p>
      ) : (<>
        {selectedAttrs.filter(a=>(a.selectedValues||[]).length>0).length>0 && (
          <div style={{marginBottom:16}}>
            <p style={{fontSize:13,color:'#555',marginBottom:8}}>
              Selected: {selectedAttrs.filter(a=>(a.selectedValues||[]).length>0).map(a=>`${a.name} (${a.selectedValues.length})`).join(' × ')}
              {' = '}<strong>{selectedAttrs.filter(a=>(a.selectedValues||[]).length>0).reduce((acc,a)=>acc*(a.selectedValues||[]).length,1)} combinations</strong>
            </p>
            <button type="button" className="btn-generate" onClick={generateVariants}>
              ⚡ Auto-Generate All Combinations
            </button>
          </div>
        )}
        {variants.length>0 && (
          <div style={{marginTop:12}}>
            <p style={{fontSize:13,color:'#4CAF50',fontWeight:600}}>{variants.length} variant(s) generated</p>
            {variants.map((v,i)=>(
              <div key={v.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:'#f9f9f9',borderRadius:6,marginTop:4,border:'1px solid #eee'}}>
                <span style={{fontSize:13,fontWeight:500}}>{v.label || `Variant ${i+1}`}</span>
                <button type="button" className="btn-remove-row" onClick={()=>removeVariant(v.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn-add-row" onClick={addManualVariant} style={{marginTop:12}}>
          + Add Manual Variant
        </button>
      </>)}
    </div>
  );

  const renderVariantDetails = () => (
    <div className="wizard-card">
      <h2>📊 Variant Details</h2>
      {form.productType==='simple' ? (
        <div>
          <p style={{color:'#555',fontSize:13,marginBottom:12}}>Set pricing and stock for your simple product.</p>
          <div className="wz-form-row">
            <div className="wz-form-group"><label>Selling Price (₹) *</label><input type="number" value={form.price} onChange={e=>set('price',e.target.value)} /></div>
            <div className="wz-form-group"><label>MRP (₹) *</label><input type="number" value={form.mrp} onChange={e=>set('mrp',e.target.value)} /></div>
            <div className="wz-form-group"><label>Stock *</label><input type="number" value={form.stock} onChange={e=>set('stock',e.target.value)} /></div>
          </div>
        </div>
      ) : variants.length===0 ? (
        <p style={{color:'#e53935'}}>No variants generated. Go back to Step 5 to generate variants.</p>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="variant-matrix">
            <thead><tr>
              <th>Variant</th><th>SKU</th><th>Barcode</th><th>MRP (₹)</th><th>Price (₹)</th><th>Stock</th><th>Wt (g)</th><th>Media</th><th></th>
            </tr></thead>
            <tbody>
              {variants.map((v,i)=>{
                const sav = v.mrp&&v.price&&Number(v.mrp)>Number(v.price) ? Math.round(((v.mrp-v.price)/v.mrp)*100) : 0;
                return (
                <tr key={v.id}>
                  <td style={{fontWeight:500,fontSize:13,minWidth:100}}>{v.label||`V${i+1}`}</td>
                  <td><input value={v.sku} onChange={e=>updateVariant(v.id,'sku',e.target.value)} style={{width:120}} /></td>
                  <td><input value={v.barcode} onChange={e=>updateVariant(v.id,'barcode',e.target.value)} style={{width:100}} /></td>
                  <td><input type="number" value={v.mrp} onChange={e=>updateVariant(v.id,'mrp',e.target.value)} style={{width:80}} /></td>
                  <td>
                    <input type="number" value={v.price} onChange={e=>updateVariant(v.id,'price',e.target.value)} style={{width:80}} />
                    {sav>0 && <span className="savings-badge">{sav}% off</span>}
                  </td>
                  <td><input type="number" value={v.stock} onChange={e=>updateVariant(v.id,'stock',e.target.value)} style={{width:60}} /></td>
                  <td><input type="number" value={v.shippingWeight} onChange={e=>updateVariant(v.id,'shippingWeight',e.target.value)} style={{width:60}} /></td>
                  <td><input type="file" multiple accept="image/*,video/*" onChange={e=>handleVariantFiles(v.id,e)} style={{width:120,fontSize:11}} />
                    {v.files?.length>0&&<span style={{fontSize:10,color:'#4CAF50'}}>{v.files.length} files</span>}
                  </td>
                  <td><button type="button" className="btn-remove-row" onClick={()=>removeVariant(v.id)}>✕</button></td>
                </tr>
              )})}
            </tbody>
          </table>
          <button type="button" className="btn-add-row" onClick={addManualVariant}>+ Add Variant Row</button>
        </div>
      )}
    </div>
  );

  const renderMedia = () => (
    <div className="wizard-card">
      <h2>🖼️ Product Media</h2>
      <div className="media-drop-zone" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleMedia(e);}}>
        <div className="upload-icon">📤</div>
        <p><strong>Click or drag</strong> to upload product images</p>
        <p style={{fontSize:11,color:'#bbb'}}>Recommended: 800×800px, JPG/PNG, max 10 files</p>
        <input type="file" ref={fileRef} style={{display:'none'}} multiple accept="image/*,video/*" onChange={handleMedia} />
      </div>
      {previews.length>0 && (
        <div className="media-previews">
          {previews.map((src,i)=>(
            <div key={i} className="media-thumb">
              <img src={src} alt="" />
              <button type="button" className="remove-btn" onClick={()=>removeMedia(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSpecifications = () => (
    <div className="wizard-card">
      <h2>📐 Technical Specifications</h2>
      <p style={{color:'#888',fontSize:13,marginBottom:12}}>Add key-value specs like Ingredients, Material, Battery, etc.</p>
      {specs.map((s,i)=>(
        <div key={i} className="spec-row">
          <input type="text" value={s.key} onChange={e=>updateSpec(i,'key',e.target.value)} placeholder="Key (e.g. Ingredients)" />
          <input type="text" value={s.value} onChange={e=>updateSpec(i,'value',e.target.value)} placeholder="Value" />
          <button type="button" className="btn-remove-row" onClick={()=>removeSpec(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="btn-add-row" onClick={addSpec}>+ Add Specification</button>
    </div>
  );

  const renderSEO = () => (
    <div className="wizard-card">
      <h2>🔍 SEO & Search Optimization</h2>
      <div className="wz-form-group"><label>Meta Title</label><input type="text" value={form.seoTitle} onChange={e=>set('seoTitle',e.target.value)} placeholder="SEO Title (60 chars recommended)" /></div>
      <div className="wz-form-group"><label>Meta Description</label><textarea value={form.seoDescription} onChange={e=>set('seoDescription',e.target.value)} placeholder="SEO description (160 chars recommended)" style={{minHeight:60}} /></div>
      <div className="wz-form-row">
        <div className="wz-form-group"><label>Keywords (comma separated)</label><input type="text" value={form.seoKeywords} onChange={e=>set('seoKeywords',e.target.value)} placeholder="spices, masala, organic" /></div>
        <div className="wz-form-group"><label>Canonical URL</label><input type="url" value={form.canonicalUrl} onChange={e=>set('canonicalUrl',e.target.value)} placeholder="https://..." /></div>
      </div>
    </div>
  );

  const renderPublish = () => (
    <div className="wizard-card">
      <h2>🚀 Review & Publish</h2>
      <div className="wz-form-row">
        <div className="wz-form-group">
          <label>Publish Status</label>
          <select value={form.status} onChange={e=>set('status',e.target.value)}>
            <option value="draft">📝 Draft</option>
            <option value="published">✅ Published</option>
            <option value="scheduled">📅 Scheduled</option>
            <option value="hidden">🙈 Hidden</option>
          </select>
        </div>
      </div>
      <div className="wz-toggle"><input type="checkbox" checked={form.isFeatured} onChange={e=>set('isFeatured',e.target.checked)} /><span>Feature on Homepage</span></div>
      <div className="wz-toggle"><input type="checkbox" checked={form.inTodaysDeal} onChange={e=>set('inTodaysDeal',e.target.checked)} /><span>Today's Deals</span></div>
      <div className="wz-toggle"><input type="checkbox" checked={form.inNewArrivals} onChange={e=>set('inNewArrivals',e.target.checked)} /><span>New Arrivals</span></div>

      <div style={{marginTop:20,padding:16,background:'#f1f8f1',borderRadius:8,border:'1px solid #c8e6c9'}}>
        <h3 style={{fontSize:15,color:'#2e7d32',margin:0}}>📋 Summary</h3>
        <p style={{fontSize:13,color:'#555',marginTop:8}}>
          <strong>{form.name||'Untitled'}</strong> — {form.productType} product<br/>
          Category: {form.category||'None'} | Brand: {form.brand}<br/>
          Variants: {variants.length} | Images: {images.length} | Specs: {specs.filter(s=>s.key).length}<br/>
          Status: {form.status}
        </p>
      </div>
    </div>
  );

  return (
    <div className="product-wizard">
      <div className="wizard-header">
        <div><h1>Add Product</h1><p>Enterprise Product Creation Wizard</p></div>
        <button className="btn-prev" onClick={()=>navigate('/products')}>← Back to Catalog</button>
      </div>

      <div className="step-progress">
        {STEPS.map((s,i)=>(
          <div key={i} className={`step-item ${i===step?'active':''} ${i<step?'completed':''}`} onClick={()=>setStep(i)}>
            <span className="step-num">{i+1}</span>{s}
          </div>
        ))}
      </div>

      <form onSubmit={e=>e.preventDefault()}>
        {renderStep()}
        <div className="wizard-nav">
          {step>0 ? <button type="button" className="btn-prev" onClick={()=>setStep(step-1)}>← Previous</button> : <div/>}
          {step<STEPS.length-1 ? (
            <button type="button" className="btn-next" onClick={()=>setStep(step+1)}>Next →</button>
          ) : (
            <button type="button" className="btn-publish" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Publishing...' : '🚀 Publish Product'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
