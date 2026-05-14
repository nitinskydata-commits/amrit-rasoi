import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, changeAdminPassword } from '../utils/api';
import { FaUpload, FaLock, FaGlobe, FaCogs, FaPhone, FaShieldAlt } from 'react-icons/fa';

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
    linkedin: ''
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
          linkedin: s.socialLinks?.linkedin || ''
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
      
      // Append all form fields except files and nested objects
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append files
      if (logoFile) formDataToSend.append('logo', logoFile);
      if (favIconFile) formDataToSend.append('favIcon', favIconFile);

      await updateSettings(formDataToSend);
      alert('Settings updated successfully');
      fetchSettings();
    } catch (error) {
      alert('Error updating settings');
      console.error(error);
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
