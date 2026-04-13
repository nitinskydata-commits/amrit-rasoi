import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, changeAdminPassword } from '../utils/api';
import { FaUpload, FaLock } from 'react-icons/fa';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'security'
  
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
    gstNumber: '',
    fssaiNumber: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

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
        setFormData(response.data.settings);
        if (response.data.settings.logo?.url) {
          setLogoPreview(response.data.settings.logo.url);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'logo') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append logo if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

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

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
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
    <div>
      <div className="page-header">
        <h1>Site Settings</h1>
        <p>Configure your website settings and security</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('general')}
        >
          General Settings
        </button>
        <button
          className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('security')}
        >
          <FaLock /> Security
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit}>
          {/* Logo Upload */}
          <div className="card">
            <h2 className="card-title">Brand Logo</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div>
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    style={{ 
                      width: '150px', 
                      height: '150px', 
                      objectFit: 'contain',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      padding: '10px'
                    }} 
                  />
                ) : (
                  <div style={{ 
                    width: '150px', 
                    height: '150px', 
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    No Logo
                  </div>
                )}
              </div>
              <div>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <FaUpload /> Choose Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  Recommended: 200x200px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          {/* Site Information */}
          <div className="card">
            <h2 className="card-title">Site Information</h2>
            <div className="form-group">
              <label>Site Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Tagline</label>
              <input
                type="text"
                className="form-control"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <h2 className="card-title">Contact Information</h2>
            <div className="form-group">
              <label>Support Email *</label>
              <input
                type="email"
                className="form-control"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Support Phone *</label>
              <input
                type="tel"
                className="form-control"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Company Address</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              />
            </div>
          </div>

          {/* Payment Settings */}
          <div className="card">
            <h2 className="card-title">Payment Settings</h2>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.codEnabled}
                  onChange={(e) => setFormData({ ...formData, codEnabled: e.target.checked })}
                />
                Enable Cash on Delivery (COD)
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.onlinePaymentsEnabled}
                  onChange={(e) => setFormData({ ...formData, onlinePaymentsEnabled: e.target.checked })}
                />
                Enable Online Payments
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>COD Min Order (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.codMinOrder}
                  onChange={(e) => setFormData({ ...formData, codMinOrder: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>COD Max Order (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.codMaxOrder}
                  onChange={(e) => setFormData({ ...formData, codMaxOrder: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>COD Extra Fee (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.codExtraFee}
                  onChange={(e) => setFormData({ ...formData, codExtraFee: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="card">
            <h2 className="card-title">Legal Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>FSSAI Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.fssaiNumber}
                  onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange}>
          <div className="card">
            <h2 className="card-title">Change Admin Password</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Update your admin password to keep your account secure
            </p>

            <div className="form-group">
              <label>Current Password *</label>
              <input
                type="password"
                className="form-control"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                className="form-control"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength="6"
              />
              <small style={{ color: '#666' }}>Minimum 6 characters</small>
            </div>

            <div className="form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                className="form-control"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
