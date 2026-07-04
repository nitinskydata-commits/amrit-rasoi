import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FaStore, FaUniversity, FaMapMarkerAlt, FaSave, FaEdit } from 'react-icons/fa';
import './SellerPages.css';

const SellerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    shopLogo: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/profile`);
      const user = response.data.user;
      setProfile(user);
      
      setFormData({
        shopName: user.sellerProfile?.shopName || '',
        shopDescription: user.sellerProfile?.shopDescription || '',
        shopLogo: user.sellerProfile?.shopLogo || '',
        bankName: user.sellerProfile?.bankDetails?.bankName || '',
        accountNumber: user.sellerProfile?.bankDetails?.accountNumber || '',
        ifscCode: user.sellerProfile?.bankDetails?.ifscCode || '',
        accountHolderName: user.sellerProfile?.bankDetails?.accountHolderName || '',
        upiId: user.sellerProfile?.bankDetails?.upiId || '',
        addressLine1: user.sellerProfile?.businessAddress?.line1 || '',
        addressLine2: user.sellerProfile?.businessAddress?.line2 || '',
        city: user.sellerProfile?.businessAddress?.city || '',
        state: user.sellerProfile?.businessAddress?.state || '',
        pincode: user.sellerProfile?.businessAddress?.pincode || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    const payload = {
      shopName: formData.shopName,
      shopDescription: formData.shopDescription,
      shopLogo: formData.shopLogo,
      bankDetails: {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        accountHolderName: formData.accountHolderName,
        upiId: formData.upiId
      },
      businessAddress: {
        line1: formData.addressLine1,
        line2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      }
    };

    try {
      await axios.put(`${API_BASE_URL}/seller/profile`, payload);
      alert('Shop profile updated successfully.');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Error updating profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className="seller-loading">Retrieving shop file...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <div>
          <h1>Merchant Shop Settings</h1>
          <p>Configure shop logo, customize buyer description, and update settlements ledger accounts.</p>
        </div>
        <div>
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <FaEdit /> Edit Shop Profile
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSave} disabled={submitLoading}>
              <FaSave /> {submitLoading ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="profile-form-grid">
        {/* Left column: Shop Settings */}
        <div className="profile-column-left">
          <div className="profile-card">
            <div className="card-header">
              <h3><FaStore /> Shop Details</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Registered Store Name</label>
                <input 
                  type="text" 
                  name="shopName" 
                  value={formData.shopName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Merchant Logo URL</label>
                <input 
                  type="url" 
                  name="shopLogo" 
                  value={formData.shopLogo}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://example.com/logo.png"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Shop Description (Buyer Facing)</label>
                <textarea 
                  name="shopDescription" 
                  rows="5"
                  value={formData.shopDescription}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter store description..."
                  className="form-control text-area"
                />
              </div>
            </div>
          </div>
          
          {/* Tax Information */}
          <div className="profile-card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h3>Government Compliance & Tax Registration</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>GSTIN Number (Read-only)</label>
                <input 
                  type="text" 
                  value={profile?.sellerProfile?.gstin || 'N/A'} 
                  disabled
                  className="form-control disabled-input"
                />
              </div>
              <div className="form-group">
                <label>PAN Card Number (Read-only)</label>
                <input 
                  type="text" 
                  value={profile?.sellerProfile?.pan || 'N/A'} 
                  disabled
                  className="form-control disabled-input"
                />
              </div>
              <small className="help-text">Tax registrations are locked after compliance validation. Contact support to request adjustments.</small>
            </div>
          </div>
        </div>

        {/* Right column: Bank Settlements & Address */}
        <div className="profile-column-right">
          {/* Bank Settlements */}
          <div className="profile-card">
            <div className="card-header">
              <h3><FaUniversity /> Bank Settlement Account</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  name="bankName" 
                  value={formData.bankName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Account Holder Name</label>
                <input 
                  type="text" 
                  name="accountHolderName" 
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Settlement Account Number</label>
                <input 
                  type="text" 
                  name="accountNumber" 
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input 
                  type="text" 
                  name="ifscCode" 
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>UPI ID (Alternative Settlement)</label>
                <input 
                  type="text" 
                  name="upiId" 
                  value={formData.upiId}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="profile-card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h3><FaMapMarkerAlt /> Registered Business Address</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Address Line 1</label>
                <input 
                  type="text" 
                  name="addressLine1" 
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  name="addressLine2" 
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>

              <div className="form-grid-inner">
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    name="state" 
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pincode / Postal Code</label>
                <input 
                  type="text" 
                  name="pincode" 
                  value={formData.pincode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SellerProfile;
