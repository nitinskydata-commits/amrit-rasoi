import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import './AddProduct.css';

const STEPS = ['Basic Info','Product Type','Category','Attributes','Generate Variants','Variant Details','Media','Specifications','SEO','Publish'];
const PRODUCT_TYPES = [
  { id:'simple', icon:'📦', name:'Simple', desc:'Single item, no variants' },
  { id:'variable', icon:'🔀', name:'Variable', desc:'Multiple variants' },
  { id:'digital', icon:'💾', name:'Digital', desc:'Downloadable files' },
  { id:'subscription', icon:'🔄', name:'Subscription', desc:'Recurring billing' },
  { id:'bundle', icon:'🎁', name:'Bundle', desc:'Combo of products' },
];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const fileRef = useRef(null);

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
  const [selectedAttrs, setSelectedAttrs] = useState([]);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
    fetchProduct();
  }, [id]);

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
  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const {data} = await axios.get(`${API_BASE_URL}/product/${id}`, {headers:{Authorization:`Bearer ${token}`}});
      if(data.success) {
        const p = data.product;
        setForm({
          name: p.name||'', description: p.description||'', brand: p.brand||'Amrit Rasoi',
          productType: p.productType||'variable', category: p.category||'', subcategory: p.subcategory||'',
          status: p.status||'draft', seoTitle: p.seoTitle||'', seoDescription: p.seoDescription||'',
          seoKeywords: (p.seoKeywords||[]).join(', '), canonicalUrl: p.canonicalUrl||'',
          isFeatured: !!p.isFeatured, inTodaysDeal: !!p.inTodaysDeal, inNewArrivals: !!p.inNewArrivals,
          price: p.price||'', mrp: p.mrp||'', stock: p.stock||'',
        });
        setTags(p.tags||[]);
        setSpecs(p.specifications?.length ? p.specifications : [{key:'',value:''}]);
        if(p.images?.length) setExistingImages(p.images);
        if(p.variants?.length) {
          setVariants(p.variants.map((v,i)=>({
            id: v._id || `v_${i}`,
            attributes: v.attributes||[{name:'Variant',value:''}],
            label: (v.attributes||[]).map(a=>a.value).join(' / '),
            sku: v.sku||'', barcode: v.barcode||'', price: v.price||'', mrp: v.mrp||'',
            stock: v.stock!==undefined?v.stock:0, taxRate: v.taxRate||0,
            shippingWeight: v.shippingWeight||'', shippingClass: v.shippingClass||'standard',
            isFragile: v.isFragile||false, dimensions: v.dimensions||{length:'',width:'',height:''},
            files:[], existingImages: v.images||[]
          })));
        }
      }
    } catch(e) { console.error(e); alert('Failed to load product'); }
    finally { setFetching(false); }
  };

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const addTag = () => { if(tagInput.trim()) { setTags([...tags,tagInput.trim()]); setTagInput(''); }};
  const removeTag = i => setTags(tags.filter((_,idx)=>idx!==i));
  const addSpec = () => setSpecs([...specs,{key:'',value:''}]);
  const updateSpec = (i,f,v) => { const s=[...specs]; s[i][f]=v; setSpecs(s); };
  const removeSpec = i => setSpecs(specs.filter((_,idx)=>idx!==i));

  const toggleAttr = (attr) => {
    const exists = selectedAttrs.find(a=>a.attrId===attr._id);
    if(exists) setSelectedAttrs(selectedAttrs.filter(a=>a.attrId!==attr._id));
    else setSelectedAttrs([...selectedAttrs,{attrId:attr._id,name:attr.name,values:attr.values||[],selectedValues:[]}]);
  };
  const toggleAttrValue = (attrId,val) => {
    setSelectedAttrs(selectedAttrs.map(a=>{
      if(a.attrId!==attrId) return a;
      const sv=a.selectedValues||[];
      return {...a,selectedValues:sv.includes(val)?sv.filter(v=>v!==val):[...sv,val]};
    }));
  };
  const addCustomValue = (attrId,val) => {
    if(!val.trim()) return;
    setSelectedAttrs(selectedAttrs.map(a=>{
      if(a.attrId!==attrId) return a;
      return {...a,values:[...a.values,val.trim()],selectedValues:[...(a.selectedValues||[]),val.trim()]};
    }));
  };
  const generateVariants = () => {
    const aw = selectedAttrs.filter(a=>(a.selectedValues||[]).length>0);
    if(!aw.length) return;
    const combos = aw.reduce((acc,attr)=>{
      if(!acc.length) return attr.selectedValues.map(v=>[{name:attr.name,value:v}]);
      const r=[]; acc.forEach(c=>attr.selectedValues.forEach(v=>r.push([...c,{name:attr.name,value:v}]))); return r;
    },[]);
    setVariants(combos.map((attrs,i)=>({
      id:`v_${Date.now()}_${i}`, attributes:attrs, label:attrs.map(a=>a.value).join(' / '),
      sku:`${(form.brand||'SKU').substring(0,3).toUpperCase()}-${attrs.map(a=>a.value.substring(0,3).toUpperCase()).join('-')}-${Math.random().toString(36).substring(2,5).toUpperCase()}`,
      barcode:'',price:'',mrp:'',stock:'',taxRate:0,shippingWeight:'',shippingClass:'standard',isFragile:false,
      dimensions:{length:'',width:'',height:''},files:[],existingImages:[]
    })));
  };
  const addManualVariant = () => {
    setVariants([...variants,{id:`v_${Date.now()}`,attributes:[{name:'Variant',value:''}],label:'',sku:'',barcode:'',price:'',mrp:'',stock:'',taxRate:0,shippingWeight:'',shippingClass:'standard',isFragile:false,dimensions:{length:'',width:'',height:''},files:[],existingImages:[]}]);
  };
  const updateVariant = (id,f,v) => setVariants(variants.map(vr=>vr.id===id?{...vr,[f]:v}:vr));
  const removeVariant = id => setVariants(variants.filter(v=>v.id!==id));
  const handleVariantFiles = (id,e) => { setVariants(variants.map(v=>v.id===id?{...v,files:Array.from(e.target.files)}:v)); };

  const handleMedia = (e) => {
    const files = Array.from(e.dataTransfer?.files||e.target.files);
    setImages(p=>[...p,...files]); setPreviews(p=>[...p,...files.map(f=>URL.createObjectURL(f))]);
  };
  const removeMedia = i => { setImages(images.filter((_,idx)=>idx!==i)); setPreviews(previews.filter((_,idx)=>idx!==i)); };
  const removeExisting = i => setExistingImages(existingImages.filter((_,idx)=>idx!==i));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const fd = new FormData();
      Object.keys(form).forEach(k=>fd.append(k,form[k]));
      fd.append('tags',tags.join(','));
      fd.append('specifications',JSON.stringify(specs.filter(s=>s.key)));
      fd.append('existingImages',JSON.stringify(existingImages));

      if(form.productType==='simple') {
        fd.append('hasVariants','false');
      } else {
        fd.append('hasVariants','true');
        const mapped=variants.map(v=>({
          _id:v._id, attributes:v.attributes, price:v.price, mrp:v.mrp, stock:v.stock,
          sku:v.sku, barcode:v.barcode, taxRate:v.taxRate, shippingWeight:v.shippingWeight,
          shippingClass:v.shippingClass, isFragile:v.isFragile, dimensions:v.dimensions,
          images:v.existingImages||[]
        }));
        fd.append('variants',JSON.stringify(mapped));
      }
      images.forEach(img=>fd.append('images',img));
      variants.forEach((v,i)=>{if(v.files?.length) v.files.forEach(f=>fd.append(`variant_images_${i}`,f));});

      const {data}=await axios.put(`${API_BASE_URL}/admin/product/${id}`,fd,
        {headers:{'Content-Type':'multipart/form-data','Authorization':`Bearer ${token}`}});
      if(data.success) { alert('Product updated!'); navigate('/products'); }
    } catch(e) { alert(e.response?.data?.message||'Failed to update'); }
    finally { setLoading(false); }
  };

  if(fetching) return <div className="product-wizard" style={{textAlign:'center',padding:60,color:'#888'}}>Loading product...</div>;

  const renderStep = () => {
    switch(step) {
      case 0: return (<div className="wizard-card"><h2>📋 Basic Information</h2>
        <div className="wz-form-group"><label>Product Title *</label><input type="text" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
        <div className="wz-form-group"><label>Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} /></div>
        <div className="wz-form-row">
          <div className="wz-form-group"><label>Brand</label><input type="text" value={form.brand} onChange={e=>set('brand',e.target.value)} /></div>
          <div className="wz-form-group"><label>Tags</label>
            <div style={{display:'flex',gap:8}}><input type="text" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTag())} placeholder="Press Enter" />
            <button type="button" onClick={addTag} className="btn-generate" style={{padding:'8px 14px',fontSize:12}}>Add</button></div>
            <div className="attr-chips" style={{marginTop:8}}>{tags.map((t,i)=><span key={i} className="attr-chip" onClick={()=>removeTag(i)}>{t} ✕</span>)}</div>
          </div>
        </div></div>);

      case 1: return (<div className="wizard-card"><h2>🏷️ Product Type</h2>
        <div className="type-grid">{PRODUCT_TYPES.map(t=>(<div key={t.id} className={`type-card ${form.productType===t.id?'selected':''}`} onClick={()=>set('productType',t.id)}>
          <span className="type-icon">{t.icon}</span><div className="type-name">{t.name}</div><div className="type-desc">{t.desc}</div></div>))}</div></div>);

      case 2: return (<div className="wizard-card"><h2>📂 Category</h2><div className="wz-form-row">
        <div className="wz-form-group"><label>Category *</label>
          {categories.length>0?<select value={form.category} onChange={e=>set('category',e.target.value)}><option value="">Select</option>{categories.map(c=><option key={c._id} value={c.name}>{c.name}</option>)}</select>
          :<input type="text" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="Type category" />}
        </div>
        <div className="wz-form-group"><label>Subcategory</label><input type="text" value={form.subcategory} onChange={e=>set('subcategory',e.target.value)} /></div>
        </div></div>);

      case 3: return (<div className="wizard-card"><h2>🎨 Attributes</h2>
        {form.productType==='simple'?<p style={{color:'#4CAF50'}}>✅ Simple product — skip this step.</p>:<>
        <div className="attr-chips">{globalAttrs.map(a=><span key={a._id} className={`attr-chip ${selectedAttrs.find(s=>s.attrId===a._id)?'active':''}`} onClick={()=>toggleAttr(a)}>{a.name}</span>)}
        {globalAttrs.length===0&&<span style={{color:'#999',fontSize:13}}>No global attributes. Add custom values below or create in Settings.</span>}</div>
        {selectedAttrs.map(sa=>(<div key={sa.attrId} style={{marginTop:16,padding:16,background:'#fafafa',borderRadius:8,border:'1px solid #eee'}}>
          <label style={{fontWeight:600}}>{sa.name}:</label>
          <div className="attr-chips" style={{marginTop:8}}>{(sa.values||[]).map((v,i)=><span key={i} className={`attr-chip ${(sa.selectedValues||[]).includes(v)?'active':''}`} onClick={()=>toggleAttrValue(sa.attrId,v)}>{v}</span>)}</div>
          <div style={{display:'flex',gap:8,marginTop:8}}><input type="text" placeholder={`Custom ${sa.name}...`} id={`c_${sa.attrId}`} style={{flex:1,border:'1px solid #ddd',borderRadius:4,padding:'6px 10px',fontSize:13}} />
          <button type="button" className="btn-generate" style={{padding:'6px 12px',fontSize:12}} onClick={()=>{const el=document.getElementById(`c_${sa.attrId}`);addCustomValue(sa.attrId,el.value);el.value='';}}>Add</button></div>
        </div>))}</>}</div>);

      case 4: return (<div className="wizard-card"><h2>⚡ Generate Variants</h2>
        {form.productType==='simple'?<p style={{color:'#4CAF50'}}>✅ Simple product — skip.</p>:<>
        {selectedAttrs.filter(a=>(a.selectedValues||[]).length>0).length>0&&<div style={{marginBottom:16}}>
          <p style={{fontSize:13,color:'#555'}}>Combinations: <strong>{selectedAttrs.filter(a=>(a.selectedValues||[]).length>0).reduce((acc,a)=>acc*(a.selectedValues||[]).length,1)}</strong></p>
          <button type="button" className="btn-generate" onClick={generateVariants}>⚡ Generate All</button></div>}
        {variants.length>0&&<div>{variants.map((v,i)=><div key={v.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#f9f9f9',borderRadius:6,marginTop:4,border:'1px solid #eee'}}>
          <span style={{fontSize:13,fontWeight:500}}>{v.label||`V${i+1}`}</span><button type="button" className="btn-remove-row" onClick={()=>removeVariant(v.id)}>✕</button></div>)}</div>}
        <button type="button" className="btn-add-row" onClick={addManualVariant} style={{marginTop:12}}>+ Add Manual Variant</button></>}</div>);

      case 5: return (<div className="wizard-card"><h2>📊 Variant Details</h2>
        {form.productType==='simple'?<div><div className="wz-form-row">
          <div className="wz-form-group"><label>Price ₹</label><input type="number" value={form.price} onChange={e=>set('price',e.target.value)} /></div>
          <div className="wz-form-group"><label>MRP ₹</label><input type="number" value={form.mrp} onChange={e=>set('mrp',e.target.value)} /></div>
          <div className="wz-form-group"><label>Stock</label><input type="number" value={form.stock} onChange={e=>set('stock',e.target.value)} /></div></div></div>
        :variants.length===0?<p style={{color:'#e53935'}}>No variants. Go back to generate.</p>
        :<div style={{overflowX:'auto'}}><table className="variant-matrix"><thead><tr><th>Variant</th><th>SKU</th><th>Barcode</th><th>MRP</th><th>Price</th><th>Stock</th><th>Wt</th><th>Media</th><th></th></tr></thead><tbody>
        {variants.map((v,i)=>{const sav=v.mrp&&v.price&&Number(v.mrp)>Number(v.price)?Math.round(((v.mrp-v.price)/v.mrp)*100):0;return(
        <tr key={v.id}><td style={{fontWeight:500,fontSize:13}}>{v.label||`V${i+1}`}</td>
        <td><input value={v.sku} onChange={e=>updateVariant(v.id,'sku',e.target.value)} style={{width:110}} /></td>
        <td><input value={v.barcode} onChange={e=>updateVariant(v.id,'barcode',e.target.value)} style={{width:90}} /></td>
        <td><input type="number" value={v.mrp} onChange={e=>updateVariant(v.id,'mrp',e.target.value)} style={{width:70}} /></td>
        <td><input type="number" value={v.price} onChange={e=>updateVariant(v.id,'price',e.target.value)} style={{width:70}} />{sav>0&&<span className="savings-badge">{sav}%</span>}</td>
        <td><input type="number" value={v.stock} onChange={e=>updateVariant(v.id,'stock',e.target.value)} style={{width:55}} /></td>
        <td><input type="number" value={v.shippingWeight} onChange={e=>updateVariant(v.id,'shippingWeight',e.target.value)} style={{width:55}} /></td>
        <td><input type="file" multiple accept="image/*,video/*" onChange={e=>handleVariantFiles(v.id,e)} style={{width:110,fontSize:11}} /></td>
        <td><button type="button" className="btn-remove-row" onClick={()=>removeVariant(v.id)}>✕</button></td></tr>);})}
        </tbody></table><button type="button" className="btn-add-row" onClick={addManualVariant}>+ Add Variant</button></div>}</div>);

      case 6: return (<div className="wizard-card"><h2>🖼️ Media</h2>
        {existingImages.length>0&&<div style={{marginBottom:16}}><p style={{fontSize:13,fontWeight:500,color:'#555'}}>Current Images:</p>
        <div className="media-previews">{existingImages.map((img,i)=><div key={i} className="media-thumb"><img src={img.url} alt="" /><button type="button" className="remove-btn" onClick={()=>removeExisting(i)}>✕</button></div>)}</div></div>}
        <div className="media-drop-zone" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleMedia(e);}}>
          <div className="upload-icon">📤</div><p><strong>Click or drag</strong> to upload</p>
          <input type="file" ref={fileRef} style={{display:'none'}} multiple accept="image/*,video/*" onChange={handleMedia} /></div>
        {previews.length>0&&<div className="media-previews">{previews.map((s,i)=><div key={i} className="media-thumb"><img src={s} alt="" /><button type="button" className="remove-btn" onClick={()=>removeMedia(i)}>✕</button></div>)}</div>}</div>);

      case 7: return (<div className="wizard-card"><h2>📐 Specifications</h2>
        {specs.map((s,i)=><div key={i} className="spec-row"><input type="text" value={s.key} onChange={e=>updateSpec(i,'key',e.target.value)} placeholder="Key" />
        <input type="text" value={s.value} onChange={e=>updateSpec(i,'value',e.target.value)} placeholder="Value" />
        <button type="button" className="btn-remove-row" onClick={()=>removeSpec(i)}>✕</button></div>)}
        <button type="button" className="btn-add-row" onClick={addSpec}>+ Add Spec</button></div>);

      case 8: return (<div className="wizard-card"><h2>🔍 SEO</h2>
        <div className="wz-form-group"><label>Meta Title</label><input type="text" value={form.seoTitle} onChange={e=>set('seoTitle',e.target.value)} /></div>
        <div className="wz-form-group"><label>Meta Description</label><textarea value={form.seoDescription} onChange={e=>set('seoDescription',e.target.value)} style={{minHeight:60}} /></div>
        <div className="wz-form-row"><div className="wz-form-group"><label>Keywords</label><input type="text" value={form.seoKeywords} onChange={e=>set('seoKeywords',e.target.value)} /></div>
        <div className="wz-form-group"><label>Canonical URL</label><input type="url" value={form.canonicalUrl} onChange={e=>set('canonicalUrl',e.target.value)} /></div></div></div>);

      case 9: return (<div className="wizard-card"><h2>🚀 Review & Publish</h2>
        <div className="wz-form-group"><label>Status</label><select value={form.status} onChange={e=>set('status',e.target.value)}>
          <option value="draft">📝 Draft</option><option value="published">✅ Published</option><option value="scheduled">📅 Scheduled</option><option value="hidden">🙈 Hidden</option></select></div>
        <div className="wz-toggle"><input type="checkbox" checked={form.isFeatured} onChange={e=>set('isFeatured',e.target.checked)} /><span>Featured</span></div>
        <div className="wz-toggle"><input type="checkbox" checked={form.inTodaysDeal} onChange={e=>set('inTodaysDeal',e.target.checked)} /><span>Today's Deals</span></div>
        <div className="wz-toggle"><input type="checkbox" checked={form.inNewArrivals} onChange={e=>set('inNewArrivals',e.target.checked)} /><span>New Arrivals</span></div>
        <div style={{marginTop:20,padding:16,background:'#f1f8f1',borderRadius:8,border:'1px solid #c8e6c9'}}>
          <h3 style={{fontSize:15,color:'#2e7d32',margin:0}}>📋 Summary</h3>
          <p style={{fontSize:13,color:'#555',marginTop:8}}><strong>{form.name||'Untitled'}</strong> — {form.productType}<br/>
          Category: {form.category} | Brand: {form.brand}<br/>Variants: {variants.length} | Status: {form.status}</p></div></div>);
      default: return null;
    }
  };

  return (
    <div className="product-wizard">
      <div className="wizard-header">
        <div><h1>Edit Product</h1><p>Enterprise Product Editor</p></div>
        <button className="btn-prev" onClick={()=>navigate('/products')}>← Back to Catalog</button>
      </div>
      <div className="step-progress">
        {STEPS.map((s,i)=><div key={i} className={`step-item ${i===step?'active':''} ${i<step?'completed':''}`} onClick={()=>setStep(i)}>
          <span className="step-num">{i+1}</span>{s}</div>)}
      </div>
      <form onSubmit={e=>e.preventDefault()}>
        {renderStep()}
        <div className="wizard-nav">
          {step>0?<button type="button" className="btn-prev" onClick={()=>setStep(step-1)}>← Previous</button>:<div/>}
          {step<STEPS.length-1?<button type="button" className="btn-next" onClick={()=>setStep(step+1)}>Next →</button>
          :<button type="button" className="btn-publish" disabled={loading} onClick={handleSubmit}>{loading?'Saving...':'💾 Save Changes'}</button>}
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
