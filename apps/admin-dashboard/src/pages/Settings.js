import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, changeAdminPassword } from '../utils/api';
import { FaUpload, FaLock, FaGlobe, FaCogs, FaPhone, FaShieldAlt, FaTrash, FaPlus } from 'react-icons/fa';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    siteName: '',
    tagline: '',
    supportEmail: '',
    supportPhone: '',
    companyAddress: '',
    deliveryAreaLabel: '',
    codEnabled: true,
    onlinePaymentsEnabled: true,
    codMinOrder: 0,
    codMaxOrder: 50000,
    codExtraFee: 0,
    refundPolicyText: '',
    shippingPolicyText: '',
    privacyPolicyText: '',
    termsAndConditionsText: '',
    gstNumber: '',
    fssaiNumber: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    googleAnalyticsId: '',
    footerText: '',
    maintenanceMode: false,
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    linkedin: '',
    homepageDealsHeader: '',
    homepageRecommendationMode: 'personalized',
    homepageCategories: [],
    bulkBusinessCard: {
      title: 'SBMI Bulk Business',
      description: 'Register your business and save up to 18% GST input tax credit plus volume discounts on bulk masala ordering!',
      badge1: '⚡ GST Invoice',
      badge2: '📦 Catering Packs',
      buttonText: 'Register Wholesale Account',
      link: '/login',
      isActive: true
    },
    homepageCards: {
      card1: { title: 'Continue Shopping Deals', isActive: true },
      card2: { title: 'SBMI Hot Deals', isActive: true },
      dealOfDay: { title: 'Deal of the Day', isActive: true }
    },
    defaultHeroGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    footerLinks: [
      { title: 'Get to Know Us', links: [ { label: 'About Us', url: '/about' }, { label: 'Careers', url: '/careers' }, { label: 'Press Releases', url: '/press' }, { label: 'SBMI Science', url: '/about' } ] },
      { title: 'Make Money with Us', links: [ { label: 'Sell on SBMI', url: '/login' }, { label: 'Sell under Accelerator', url: '/login' }, { label: 'Protect & Build Your Brand', url: '/login' }, { label: 'Global Trade Supply', url: '/login' } ] },
      { title: 'Let Us Help You', links: [ { label: 'Your Account', url: '/profile' }, { label: 'Returns Centre', url: '/orders' }, { label: 'Help & Support', url: '/support' }, { label: '100% Purchase Protection', url: '/terms' } ] }
    ],
    featureBadges: [
      { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders above ₹500', isActive: true },
      { icon: '✓', title: '100% Authentic', subtitle: 'Premium quality guaranteed', isActive: true },
      { icon: '↻', title: 'Easy Returns', subtitle: '7-day return policy', isActive: true },
      { icon: '🔒', title: 'Secure Payments', subtitle: 'Safe & encrypted checkout', isActive: true }
    ],
    sectionHeadings: {
      dealsSubtitle: 'AI-calibrated loss-proof discounts based on stock levels, seller ratings, and trust reviews',
      browsingHistoryTitle: '🍂 Based on your browsing history',
      browsingHistorySubtitle: 'Top recommendations curated dynamically by your trust patterns',
      newsletterTitle: 'Stay Updated!',
      newsletterSubtitle: 'Subscribe to our newsletter for exclusive offers and updates'
    },
    footerLegalLinks: [
      { label: 'Conditions of Use', url: '/terms' },
      { label: 'Privacy Notice', url: '/privacy' },
      { label: 'Shipping & Returns', url: '/shipping' }
    ],
    aboutPageContent: {
      storyText: '',
      missionText: '',
      whyChooseUs: [
        { icon: '🌿', title: '100% Pure', description: 'No artificial colors, preservatives, or additives' },
        { icon: '✓', title: 'Quality Tested', description: 'Every batch undergoes rigorous quality checks' },
        { icon: '🚚', title: 'Fast Delivery', description: 'Quick and reliable delivery across India' },
        { icon: '💰', title: 'Best Prices', description: 'Premium quality at affordable prices' }
      ]
    },
    aiAssistantEnabled: true,
    aiAssistantGreeting: 'Hi! I\'m your SBMI shopping assistant. How can I help you find the perfect spices today?'
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [favIconFile, setFavIconFile] = useState(null);
  const [favIconPreview, setFavIconPreview] = useState('');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      if (response.data.settings) {
        const s = response.data.settings;
        setFormData({
          ...s,
          facebook: s.socialLinks?.facebook || '',
          instagram: s.socialLinks?.instagram || '',
          twitter: s.socialLinks?.twitter || '',
          youtube: s.socialLinks?.youtube || '',
          linkedin: s.socialLinks?.linkedin || '',
          homepageDealsHeader: s.homepageDealsHeader || '🔥 SBMI Smart Deals | Spices & Pantry',
          homepageRecommendationMode: s.homepageRecommendationMode || 'personalized',
          homepageCategories: (Array.isArray(s.homepageCategories) && s.homepageCategories.length > 0 && typeof s.homepageCategories[0] === 'object') ? s.homepageCategories : (
            Array.isArray(s.homepageCategories) ? s.homepageCategories.map(cat => ({ title: typeof cat === 'string' ? cat : '', badge: '🔥 Popular', category: typeof cat === 'string' ? cat : '', img: '' })) : []
          ),
          bulkBusinessCard: s.bulkBusinessCard || {
            title: 'SBMI Bulk Business',
            description: 'Register your business and save up to 18% GST input tax credit plus volume discounts on bulk masala ordering!',
            badge1: '⚡ GST Invoice',
            badge2: '📦 Catering Packs',
            buttonText: 'Register Wholesale Account',
            link: '/login',
            isActive: true
          },
          homepageCards: s.homepageCards || {
            card1: { title: 'Continue Shopping Deals', isActive: true },
            card2: { title: 'SBMI Hot Deals', isActive: true },
            dealOfDay: { title: 'Deal of the Day', isActive: true }
          },
          defaultHeroGradient: s.defaultHeroGradient || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          footerLinks: s.footerLinks && s.footerLinks.length > 0 ? s.footerLinks : [
            {
              title: 'Get to Know Us',
              links: [ { label: 'About Us', url: '/about' }, { label: 'Careers', url: '/careers' }, { label: 'Press Releases', url: '/press' }, { label: 'SBMI Science', url: '/about' } ]
            },
            {
              title: 'Make Money with Us',
              links: [ { label: 'Sell on SBMI', url: '/login' }, { label: 'Sell under Accelerator', url: '/login' }, { label: 'Protect & Build Your Brand', url: '/login' }, { label: 'Global Trade Supply', url: '/login' } ]
            },
            {
              title: 'Let Us Help You',
              links: [ { label: 'Your Account', url: '/profile' }, { label: 'Returns Centre', url: '/orders' }, { label: 'Help & Support', url: '/support' }, { label: '100% Purchase Protection', url: '/terms' } ]
            }
          ],
          featureBadges: s.featureBadges && s.featureBadges.length > 0 ? s.featureBadges : [
            { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders above ₹500', isActive: true },
            { icon: '✓', title: '100% Authentic', subtitle: 'Premium quality guaranteed', isActive: true },
            { icon: '↻', title: 'Easy Returns', subtitle: '7-day return policy', isActive: true },
            { icon: '🔒', title: 'Secure Payments', subtitle: 'Safe & encrypted checkout', isActive: true }
          ],
          sectionHeadings: s.sectionHeadings || {
            dealsSubtitle: 'AI-calibrated loss-proof discounts based on stock levels, seller ratings, and trust reviews',
            browsingHistoryTitle: '🍂 Based on your browsing history',
            browsingHistorySubtitle: 'Top recommendations curated dynamically by your trust patterns',
            newsletterTitle: 'Stay Updated!',
            newsletterSubtitle: 'Subscribe to our newsletter for exclusive offers and updates'
          },
          footerLegalLinks: s.footerLegalLinks && s.footerLegalLinks.length > 0 ? s.footerLegalLinks : [
            { label: 'Conditions of Use', url: '/terms' },
            { label: 'Privacy Notice', url: '/privacy' },
            { label: 'Shipping & Returns', url: '/shipping' }
          ],
          aboutPageContent: s.aboutPageContent || {
            storyText: '', missionText: '',
            whyChooseUs: [
              { icon: '🌿', title: '100% Pure', description: 'No artificial colors, preservatives, or additives' },
              { icon: '✓', title: 'Quality Tested', description: 'Every batch undergoes rigorous quality checks' },
              { icon: '🚚', title: 'Fast Delivery', description: 'Quick and reliable delivery across India' },
              { icon: '💰', title: 'Best Prices', description: 'Premium quality at affordable prices' }
            ]
          },
          aiAssistantEnabled: s.aiAssistantEnabled !== undefined ? s.aiAssistantEnabled : true,
          aiAssistantGreeting: s.aiAssistantGreeting || 'Hi! I\'m your SBMI shopping assistant. How can I help you find the perfect spices today?'
        });
        
        if (s.companyLogo?.url) setLogoPreview(s.companyLogo.url);
        if (s.favIcon?.url) setFavIconPreview(s.favIcon.url);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setFavIconFile(file);
        setFavIconPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields except files and nested objects (logo, favicon, etc.)
      Object.keys(formData).forEach(key => {
        // Exclude the actual logo/favIcon objects if they exist in state
        if (key === 'homepageCategories' || key === 'bulkBusinessCard' || key === 'homepageCards' || key === 'footerLinks' || key === 'featureBadges' || key === 'sectionHeadings' || key === 'footerLegalLinks' || key === 'aboutPageContent') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key !== 'companyLogo' && key !== 'favIcon' && key !== 'socialLinks') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      if (logoFile) formDataToSend.append('logo', logoFile);
      if (favIconFile) formDataToSend.append('favIcon', favIconFile);

      await updateSettings(formDataToSend);
      alert('Settings updated successfully');
      fetchSettings();
    } catch (error) {
      console.error('❌ Settings Update Error:', error);
      alert(error.response?.data?.message || 'Error updating settings. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error changing password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="settings-container">
      <div className="page-header">
        <h1>Site Settings</h1>
        <p>A-to-Z control over branding, contact details, SEO, and legal policies</p>
      </div>

      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}><FaCogs /> General</button>
        <button className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}><FaUpload /> Branding</button>
        <button className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}><FaPhone /> Contact & Social</button>
        <button className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`} onClick={() => setActiveTab('seo')}><FaGlobe /> SEO & Analytics</button>
        <button className={`tab-btn ${activeTab === 'legal' ? 'active' : ''}`} onClick={() => setActiveTab('legal')}><FaShieldAlt /> Policies</button>
        <button className={`tab-btn ${activeTab === 'homepage' ? 'active' : ''}`} onClick={() => setActiveTab('homepage')}><FaGlobe /> Homepage</button>
        <button className={`tab-btn ${activeTab === 'footer' ? 'active' : ''}`} onClick={() => setActiveTab('footer')}><FaGlobe /> Footer</button>
        <button className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}><FaGlobe /> About Page</button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}><FaLock /> Security</button>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        {activeTab === 'general' && (
          <div className="settings-card">
            <h2>General Configuration</h2>
            <div className="form-group">
              <label>Site Name *</label>
              <input type="text" className="form-control" value={formData.siteName} onChange={(e) => setFormData({...formData, siteName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tagline</label>
              <input type="text" className="form-control" value={formData.tagline} onChange={(e) => setFormData({...formData, tagline: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Footer Text</label>
              <input type="text" className="form-control" value={formData.footerText} onChange={(e) => setFormData({...formData, footerText: e.target.value})} />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" checked={formData.maintenanceMode} onChange={(e) => setFormData({...formData, maintenanceMode: e.target.checked})} />
              <label>Enable Maintenance Mode</label>
            </div>
            <hr />
            <h3 style={{ marginTop: '20px' }}>AI Shopping Assistant</h3>
            <div className="form-group checkbox-group">
              <input type="checkbox" checked={formData.aiAssistantEnabled} onChange={(e) => setFormData({...formData, aiAssistantEnabled: e.target.checked})} />
              <label>Enable AI Shopping Assistant (floating chatbot on website)</label>
            </div>
            {formData.aiAssistantEnabled && (
              <div className="form-group">
                <label>Assistant Greeting Message</label>
                <textarea className="form-control" rows="2" value={formData.aiAssistantGreeting} onChange={(e) => setFormData({...formData, aiAssistantGreeting: e.target.value})} placeholder="Hi! How can I help you today?" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="settings-card">
            <h2>Site Branding</h2>
            <div className="branding-grid">
              <div className="branding-item">
                <label>Company Logo</label>
                <div className="preview-box">
                  {logoPreview ? <img src={logoPreview} alt="Logo" /> : <span>No Logo</span>}
                </div>
                <label className="upload-btn"><FaUpload /> Choose Logo<input type="file" onChange={(e) => handleFileChange(e, 'logo')} style={{display:'none'}}/></label>
              </div>
              <div className="branding-item">
                <label>Favicon (Tab Icon)</label>
                <div className="preview-box icon">
                  {favIconPreview ? <img src={favIconPreview} alt="Favicon" /> : <span>No Icon</span>}
                </div>
                <label className="upload-btn"><FaUpload /> Choose Icon<input type="file" onChange={(e) => handleFileChange(e, 'favicon')} style={{display:'none'}}/></label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="settings-card">
            <h2>Contact & Social Media</h2>
            <div className="grid-2">
              <div className="form-group">
                <label>Support Email</label>
                <input type="email" className="form-control" value={formData.supportEmail} onChange={(e) => setFormData({...formData, supportEmail: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Support Phone</label>
                <input type="text" className="form-control" value={formData.supportPhone} onChange={(e) => setFormData({...formData, supportPhone: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Company Address</label>
              <textarea className="form-control" rows="2" value={formData.companyAddress} onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>Default delivery line (no customer address yet)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ships across India · Dispatch from Punjab"
                value={formData.deliveryAreaLabel || ''}
                onChange={(e) => setFormData({ ...formData, deliveryAreaLabel: e.target.value })}
              />
              <small style={{ color: '#666' }}>Shown in the site header until the customer signs in and adds an address.</small>
            </div>
            <h3>Social Media Links</h3>
            <div className="grid-2">
              <div className="form-group"><label>Facebook</label><input type="text" className="form-control" value={formData.facebook} onChange={(e) => setFormData({...formData, facebook: e.target.value})} /></div>
              <div className="form-group"><label>Instagram</label><input type="text" className="form-control" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} /></div>
              <div className="form-group"><label>Twitter</label><input type="text" className="form-control" value={formData.twitter} onChange={(e) => setFormData({...formData, twitter: e.target.value})} /></div>
              <div className="form-group"><label>LinkedIn</label><input type="text" className="form-control" value={formData.linkedin} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} /></div>
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="settings-card">
            <h2>SEO & Analytics</h2>
            <div className="form-group">
              <label>Meta Title (Browser Tab Title)</label>
              <input type="text" className="form-control" value={formData.metaTitle} onChange={(e) => setFormData({...formData, metaTitle: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea className="form-control" rows="3" value={formData.metaDescription} onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>Meta Keywords (Comma separated)</label>
              <input type="text" className="form-control" value={formData.metaKeywords} onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})} />
            </div>
            <hr/>
            <div className="form-group">
              <label>Google Analytics Tracking ID</label>
              <input type="text" className="form-control" placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX" value={formData.googleAnalyticsId} onChange={(e) => setFormData({...formData, googleAnalyticsId: e.target.value})} />
            </div>
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="settings-card">
            <h2>Policies & Legal</h2>
            <div className="form-group">
              <label>Refund Policy</label>
              <textarea className="form-control" rows="3" value={formData.refundPolicyText} onChange={(e) => setFormData({...formData, refundPolicyText: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>Shipping Policy</label>
              <textarea className="form-control" rows="3" value={formData.shippingPolicyText} onChange={(e) => setFormData({...formData, shippingPolicyText: e.target.value})}></textarea>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>GST Number</label><input type="text" className="form-control" value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} /></div>
              <div className="form-group"><label>FSSAI Number</label><input type="text" className="form-control" value={formData.fssaiNumber} onChange={(e) => setFormData({...formData, fssaiNumber: e.target.value})} /></div>
            </div>
          </div>
        )}

        {activeTab === 'homepage' && (
          <>
          <div className="settings-card">
            <h2>Homepage Customization</h2>
            <div className="form-group">
              <label>Deals Section Header Text</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.homepageDealsHeader} 
                onChange={(e) => setFormData({...formData, homepageDealsHeader: e.target.value})} 
                placeholder="e.g. 🔥 SBMI Smart Deals | Spices & Pantry"
              />
            </div>
            <div className="form-group">
              <label>Recommendations Display Mode</label>
              <select 
                className="form-control" 
                value={formData.homepageRecommendationMode} 
                onChange={(e) => setFormData({...formData, homepageRecommendationMode: e.target.value})}
              >
                <option value="personalized">Personalized Feed (Recommended for You)</option>
                <option value="latest">Latest Products First</option>
              </select>
            </div>
            <div className="form-group">
              <label>Default Hero Background Gradient</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.defaultHeroGradient} 
                onChange={(e) => setFormData({...formData, defaultHeroGradient: e.target.value})} 
                placeholder="e.g. linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
              />
              <small style={{ color: '#666' }}>Shown behind the cards when there are no active advertisement slides.</small>
            </div>
            <div className="form-group" style={{ marginTop: '30px' }}>
              <label style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Homepage Deals Cards</label>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', marginTop: '10px' }}>
                Manage the titles and visibility of the default Deals cards.
              </p>
              
              {['card1', 'card2', 'dealOfDay'].map((cardKey, index) => {
                const cardNames = {
                  'card1': 'First Card (Continue Shopping)',
                  'card2': 'Second Card (Hot Deals)',
                  'dealOfDay': 'Fifth Card (Deal of the Day)'
                };
                return (
                  <div key={cardKey} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.homepageCards[cardKey].isActive} 
                          onChange={(e) => setFormData({
                            ...formData,
                            homepageCards: {
                              ...formData.homepageCards,
                              [cardKey]: { ...formData.homepageCards[cardKey], isActive: e.target.checked }
                            }
                          })}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <strong style={{ color: formData.homepageCards[cardKey].isActive ? '#0f172a' : '#64748b' }}>
                          {cardNames[cardKey]} - {formData.homepageCards[cardKey].isActive ? 'Enabled' : 'Disabled'}
                        </strong>
                      </label>
                    </div>
                    {formData.homepageCards[cardKey].isActive && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Card Title</label>
                        <input type="text" className="form-control" value={formData.homepageCards[cardKey].title} onChange={(e) => setFormData({
                          ...formData,
                          homepageCards: {
                            ...formData.homepageCards,
                            [cardKey]: { ...formData.homepageCards[cardKey], title: e.target.value }
                          }
                        })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="form-group" style={{ marginTop: '30px' }}>
              <label style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Homepage Category Cards</label>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', marginTop: '10px' }}>
                These cards appear on the homepage under the "Shop by Category" section.
              </p>
              
              {formData.homepageCategories.map((cat, idx) => (
                <div key={idx} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <strong style={{ color: '#0f172a' }}>Card {idx + 1}</strong>
                    <button type="button" onClick={() => {
                      const newCats = [...formData.homepageCategories];
                      newCats.splice(idx, 1);
                      setFormData({...formData, homepageCategories: newCats});
                    }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                      <FaTrash /> Remove
                    </button>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Title</label>
                      <input type="text" className="form-control" value={cat.title || ''} onChange={(e) => {
                        const newCats = [...formData.homepageCategories];
                        newCats[idx].title = e.target.value;
                        setFormData({...formData, homepageCategories: newCats});
                      }} placeholder="e.g. Premium Spices" />
                    </div>
                    <div className="form-group">
                      <label>Badge Text</label>
                      <input type="text" className="form-control" value={cat.badge || ''} onChange={(e) => {
                        const newCats = [...formData.homepageCategories];
                        newCats[idx].badge = e.target.value;
                        setFormData({...formData, homepageCategories: newCats});
                      }} placeholder="e.g. 🌶️ Hot Deals" />
                    </div>
                    <div className="form-group">
                      <label>Target Search Category</label>
                      <input type="text" className="form-control" value={cat.category || ''} onChange={(e) => {
                        const newCats = [...formData.homepageCategories];
                        newCats[idx].category = e.target.value;
                        setFormData({...formData, homepageCategories: newCats});
                      }} placeholder="e.g. Spices" />
                    </div>
                    <div className="form-group">
                      <label>Background Image URL</label>
                      <input type="url" className="form-control" value={cat.img || ''} onChange={(e) => {
                        const newCats = [...formData.homepageCategories];
                        newCats[idx].img = e.target.value;
                        setFormData({...formData, homepageCategories: newCats});
                      }} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
              
              <button type="button" onClick={() => {
                setFormData({...formData, homepageCategories: [...formData.homepageCategories, { title: '', badge: '', category: '', img: '' }]});
              }} style={{ background: '#f8fafc', color: '#0f172a', padding: '10px 15px', border: '1px dashed #cbd5e1', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', fontWeight: '600', transition: '0.2s' }}>
                <FaPlus style={{ color: '#0ea5e9' }} /> Add New Category Card
              </button>
            </div>
            
            {/* Bulk Business Card Editor */}
            <div className="form-group" style={{ marginTop: '30px' }}>
              <label style={{ fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Bulk Business Card</label>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', marginTop: '10px' }}>
                This is the partner benefits card shown on the homepage grid.
              </p>
              
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.bulkBusinessCard.isActive} 
                      onChange={(e) => setFormData({
                        ...formData,
                        bulkBusinessCard: { ...formData.bulkBusinessCard, isActive: e.target.checked }
                      })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <strong style={{ color: formData.bulkBusinessCard.isActive ? '#0f172a' : '#64748b' }}>
                      {formData.bulkBusinessCard.isActive ? 'Card is Enabled (Visible on Homepage)' : 'Card is Disabled (Hidden)'}
                    </strong>
                  </label>
                </div>
                
                {formData.bulkBusinessCard.isActive && (
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Card Title</label>
                      <input type="text" className="form-control" value={formData.bulkBusinessCard.title} onChange={(e) => setFormData({
                        ...formData,
                        bulkBusinessCard: { ...formData.bulkBusinessCard, title: e.target.value }
                      })} placeholder="e.g. SBMI Bulk Business" />
                    </div>
                    <div className="form-group">
                      <label>Description Text</label>
                      <textarea className="form-control" rows="2" value={formData.bulkBusinessCard.description} onChange={(e) => setFormData({
                        ...formData,
                        bulkBusinessCard: { ...formData.bulkBusinessCard, description: e.target.value }
                      })} placeholder="Enter promotional text..." />
                    </div>
                    <div className="form-group">
                      <label>Badge 1</label>
                      <input type="text" className="form-control" value={formData.bulkBusinessCard.badge1} onChange={(e) => setFormData({
                        ...formData,
                        bulkBusinessCard: { ...formData.bulkBusinessCard, badge1: e.target.value }
                      })} placeholder="e.g. ⚡ GST Invoice" />
                    </div>
                    <div className="form-group">
                      <label>Badge 2</label>
                      <input type="text" className="form-control" value={formData.bulkBusinessCard.badge2} onChange={(e) => setFormData({
                        ...formData,
                        bulkBusinessCard: { ...formData.bulkBusinessCard, badge2: e.target.value }
                      })} placeholder="e.g. 📦 Catering Packs" />
                    </div>
                    <div className="form-group">
                      <label>Button Text</label>
                      <input type="text" className="form-control" value={formData.bulkBusinessCard.buttonText} onChange={(e) => setFormData({
                        ...formData,
                        bulkBusinessCard: { ...formData.bulkBusinessCard, buttonText: e.target.value }
                      })} placeholder="e.g. Register Wholesale Account" />
                    </div>
                    <div className="form-group">
                      <label>Button Link URL</label>
                      <input type="text" className="form-control" value={formData.bulkBusinessCard.link} onChange={(e) => setFormData({
                        ...formData,
                        bulkBusinessCard: { ...formData.bulkBusinessCard, link: e.target.value }
                      })} placeholder="e.g. /login" />
                    </div>
                  </div>
                )}
          </div>
            </div>
          </div>

          {/* Feature Trust Badges */}
          <div className="settings-card" style={{ marginTop: '20px' }}>
            <h2>Homepage Feature Trust Bar</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              The 4 trust badges shown at the bottom of the homepage (e.g. Free Delivery, 100% Authentic).
            </p>
            {formData.featureBadges.map((badge, idx) => (
              <div key={idx} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="checkbox" checked={badge.isActive} onChange={(e) => {
                    const updated = [...formData.featureBadges];
                    updated[idx].isActive = e.target.checked;
                    setFormData({...formData, featureBadges: updated});
                  }} style={{ width: '18px', height: '18px' }} />
                  <input type="text" className="form-control" style={{ maxWidth: '80px' }} placeholder="Icon" value={badge.icon} onChange={(e) => {
                    const updated = [...formData.featureBadges];
                    updated[idx].icon = e.target.value;
                    setFormData({...formData, featureBadges: updated});
                  }} />
                  <input type="text" className="form-control" placeholder="Title" value={badge.title} onChange={(e) => {
                    const updated = [...formData.featureBadges];
                    updated[idx].title = e.target.value;
                    setFormData({...formData, featureBadges: updated});
                  }} />
                  <input type="text" className="form-control" placeholder="Subtitle" value={badge.subtitle} onChange={(e) => {
                    const updated = [...formData.featureBadges];
                    updated[idx].subtitle = e.target.value;
                    setFormData({...formData, featureBadges: updated});
                  }} />
                  <button type="button" onClick={() => {
                    const updated = [...formData.featureBadges];
                    updated.splice(idx, 1);
                    setFormData({...formData, featureBadges: updated});
                  }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '5px', padding: '0 12px', cursor: 'pointer' }}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => {
              setFormData({...formData, featureBadges: [...formData.featureBadges, { icon: '⭐', title: '', subtitle: '', isActive: true }]});
            }} style={{ background: 'none', color: '#0ea5e9', border: '1px dashed #0ea5e9', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              + Add Badge
            </button>
          </div>

          {/* Section Headings */}
          <div className="settings-card" style={{ marginTop: '20px' }}>
            <h2>Section Headings & Copy</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Edit the marketing copy and headings shown across the homepage sections.
            </p>
            <div className="form-group">
              <label>Deals Section Subtitle</label>
              <input type="text" className="form-control" value={formData.sectionHeadings.dealsSubtitle} onChange={(e) => setFormData({
                ...formData, sectionHeadings: { ...formData.sectionHeadings, dealsSubtitle: e.target.value }
              })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Browsing History Title</label>
                <input type="text" className="form-control" value={formData.sectionHeadings.browsingHistoryTitle} onChange={(e) => setFormData({
                  ...formData, sectionHeadings: { ...formData.sectionHeadings, browsingHistoryTitle: e.target.value }
                })} />
              </div>
              <div className="form-group">
                <label>Browsing History Subtitle</label>
                <input type="text" className="form-control" value={formData.sectionHeadings.browsingHistorySubtitle} onChange={(e) => setFormData({
                  ...formData, sectionHeadings: { ...formData.sectionHeadings, browsingHistorySubtitle: e.target.value }
                })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Newsletter Title</label>
                <input type="text" className="form-control" value={formData.sectionHeadings.newsletterTitle} onChange={(e) => setFormData({
                  ...formData, sectionHeadings: { ...formData.sectionHeadings, newsletterTitle: e.target.value }
                })} />
              </div>
              <div className="form-group">
                <label>Newsletter Subtitle</label>
                <input type="text" className="form-control" value={formData.sectionHeadings.newsletterSubtitle} onChange={(e) => setFormData({
                  ...formData, sectionHeadings: { ...formData.sectionHeadings, newsletterSubtitle: e.target.value }
                })} />
              </div>
            </div>
          </div>
          </>
        )}

        {activeTab === 'footer' && (
          <>
          <div className="settings-card">
            <h2>Footer Directory Links</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Manage the 3 directory columns in the website footer.
            </p>
            {formData.footerLinks.map((column, colIdx) => (
              <div key={colIdx} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Column {colIdx + 1} Title</label>
                  <input type="text" className="form-control" value={column.title} onChange={(e) => {
                    const newLinks = [...formData.footerLinks];
                    newLinks[colIdx].title = e.target.value;
                    setFormData({...formData, footerLinks: newLinks});
                  }} />
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Links</label>
                  {column.links.map((link, linkIdx) => (
                    <div key={linkIdx} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <input type="text" className="form-control" placeholder="Link Label" value={link.label} onChange={(e) => {
                        const newLinks = [...formData.footerLinks];
                        newLinks[colIdx].links[linkIdx].label = e.target.value;
                        setFormData({...formData, footerLinks: newLinks});
                      }} />
                      <input type="text" className="form-control" placeholder="URL (e.g. /about)" value={link.url} onChange={(e) => {
                        const newLinks = [...formData.footerLinks];
                        newLinks[colIdx].links[linkIdx].url = e.target.value;
                        setFormData({...formData, footerLinks: newLinks});
                      }} />
                      <button type="button" onClick={() => {
                        const newLinks = [...formData.footerLinks];
                        newLinks[colIdx].links.splice(linkIdx, 1);
                        setFormData({...formData, footerLinks: newLinks});
                      }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '5px', padding: '0 15px', cursor: 'pointer' }}>
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const newLinks = [...formData.footerLinks];
                    newLinks[colIdx].links.push({ label: '', url: '' });
                    setFormData({...formData, footerLinks: newLinks});
                  }} style={{ background: 'none', color: '#0ea5e9', border: '1px dashed #0ea5e9', padding: '8px 15px', borderRadius: '5px', marginTop: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    + Add Link
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Legal Links */}
          <div className="settings-card" style={{ marginTop: '20px' }}>
            <h2>Footer Legal Links</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Manage the bottom-bar legal links (e.g. Conditions of Use, Privacy Notice).
            </p>
            {formData.footerLegalLinks.map((link, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input type="text" className="form-control" placeholder="Link Label" value={link.label} onChange={(e) => {
                  const newLinks = [...formData.footerLegalLinks];
                  newLinks[idx].label = e.target.value;
                  setFormData({...formData, footerLegalLinks: newLinks});
                }} />
                <input type="text" className="form-control" placeholder="URL (e.g. /terms)" value={link.url} onChange={(e) => {
                  const newLinks = [...formData.footerLegalLinks];
                  newLinks[idx].url = e.target.value;
                  setFormData({...formData, footerLegalLinks: newLinks});
                }} />
                <button type="button" onClick={() => {
                  const newLinks = [...formData.footerLegalLinks];
                  newLinks.splice(idx, 1);
                  setFormData({...formData, footerLegalLinks: newLinks});
                }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '5px', padding: '0 15px', cursor: 'pointer' }}>
                  <FaTrash />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => {
              setFormData({...formData, footerLegalLinks: [...formData.footerLegalLinks, { label: '', url: '' }]});
            }} style={{ background: 'none', color: '#0ea5e9', border: '1px dashed #0ea5e9', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              + Add Legal Link
            </button>
          </div>
          </>
        )}

        {activeTab === 'about' && (
          <div className="settings-card">
            <h2>About Page Content</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Edit the content displayed on the public About page.
            </p>
            <div className="form-group">
              <label>Our Story</label>
              <textarea className="form-control" rows="4" value={formData.aboutPageContent.storyText} onChange={(e) => setFormData({
                ...formData, aboutPageContent: { ...formData.aboutPageContent, storyText: e.target.value }
              })} placeholder="Tell your brand's story..." />
            </div>
            <div className="form-group">
              <label>Our Mission</label>
              <textarea className="form-control" rows="3" value={formData.aboutPageContent.missionText} onChange={(e) => setFormData({
                ...formData, aboutPageContent: { ...formData.aboutPageContent, missionText: e.target.value }
              })} placeholder="Describe your mission..." />
            </div>
            <div className="form-group" style={{ marginTop: '30px' }}>
              <label style={{ fontSize: '16px', fontWeight: '600' }}>Why Choose Us Cards</label>
              {formData.aboutPageContent.whyChooseUs.map((card, idx) => (
                <div key={idx} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" className="form-control" style={{ maxWidth: '80px' }} placeholder="Icon" value={card.icon} onChange={(e) => {
                      const updated = [...formData.aboutPageContent.whyChooseUs];
                      updated[idx].icon = e.target.value;
                      setFormData({...formData, aboutPageContent: { ...formData.aboutPageContent, whyChooseUs: updated }});
                    }} />
                    <input type="text" className="form-control" placeholder="Title" value={card.title} onChange={(e) => {
                      const updated = [...formData.aboutPageContent.whyChooseUs];
                      updated[idx].title = e.target.value;
                      setFormData({...formData, aboutPageContent: { ...formData.aboutPageContent, whyChooseUs: updated }});
                    }} />
                    <input type="text" className="form-control" placeholder="Description" value={card.description} onChange={(e) => {
                      const updated = [...formData.aboutPageContent.whyChooseUs];
                      updated[idx].description = e.target.value;
                      setFormData({...formData, aboutPageContent: { ...formData.aboutPageContent, whyChooseUs: updated }});
                    }} />
                    <button type="button" onClick={() => {
                      const updated = [...formData.aboutPageContent.whyChooseUs];
                      updated.splice(idx, 1);
                      setFormData({...formData, aboutPageContent: { ...formData.aboutPageContent, whyChooseUs: updated }});
                    }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '5px', padding: '0 12px', cursor: 'pointer' }}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => {
                const updated = [...formData.aboutPageContent.whyChooseUs, { icon: '⭐', title: '', description: '' }];
                setFormData({...formData, aboutPageContent: { ...formData.aboutPageContent, whyChooseUs: updated }});
              }} style={{ background: 'none', color: '#0ea5e9', border: '1px dashed #0ea5e9', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                + Add Card
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-card">
            <h2>Change Admin Password</h2>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} className="form-control" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="form-control" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="form-control" />
            </div>
            <button type="button" onClick={handlePasswordChange} className="btn-save" style={{background:'#dc3545'}}>Update Password</button>
          </div>
        )}

        {activeTab !== 'security' && (
          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save All Settings'}
            </button>
          </div>
        )}
      </form>

      <style jsx>{`
        .settings-container { padding: 40px; background: #f8f9fa; min-height: 100vh; }
        .page-header h1 { margin: 0; font-size: 28px; color: #333; }
        .page-header p { color: #666; margin-top: 5px; }
        .settings-tabs { display: flex; gap: 10px; margin: 30px 0; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .tab-btn { padding: 10px 20px; border: none; background: none; cursor: pointer; font-weight: 600; color: #666; display: flex; alignItems: center; gap: 8px; }
        .tab-btn.active { color: #007bff; border-bottom: 2px solid #007bff; }
        .settings-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; }
        .settings-card h2 { margin-top: 0; font-size: 20px; color: #444; margin-bottom: 25px; border-left: 4px solid #007bff; padding-left: 15px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #555; }
        .form-control { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .checkbox-group { display: flex; align-items: center; gap: 10px; }
        .checkbox-group input { width: 20px; height: 20px; }
        .branding-grid { display: flex; gap: 40px; }
        .branding-item { text-align: center; }
        .preview-box { width: 200px; height: 200px; border: 2px dashed #ddd; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 15px 0; overflow: hidden; }
        .preview-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .preview-box.icon { width: 100px; height: 100px; }
        .upload-btn { display: inline-block; padding: 10px 20px; background: #6c757d; color: white; border-radius: 5px; cursor: pointer; transition: 0.3s; }
        .upload-btn:hover { background: #5a6268; }
        .form-actions { display: flex; justify-content: flex-end; margin-top: 20px; }
        .btn-save { padding: 15px 40px; background: #007bff; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(0,123,255,0.3); }
        .btn-save:hover { background: #0056b3; transform: translateY(-2px); }
        .btn-save:disabled { background: #ccc; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default Settings;
