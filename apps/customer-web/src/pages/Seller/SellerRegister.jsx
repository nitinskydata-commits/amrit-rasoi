import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile } from '../../redux/slices/authSlice';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FaStore } from 'react-icons/fa';
import './SellerRegister.css';

const SellerRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    gstin: '',
    pan: '',
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

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1); // Step 1: Shop, Step 2: Bank, Step 3: Address

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserProfile());
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return <div className="seller-loading">Synchronizing account file...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/seller/apply" replace />;
  }

  // If already applied and reviewed, redirect to correct routes
  if (user?.sellerStatus === 'approved') {
    return <Navigate to="/seller/dashboard" replace />;
  } else if (user?.sellerStatus && user.sellerStatus !== 'none') {
    return <Navigate to="/seller/status" replace />;
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setFormLoading(true);
    setErrorMsg('');

    const payload = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      shopName: formData.shopName,
      shopDescription: formData.shopDescription,
      gstin: formData.gstin,
      pan: formData.pan,
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

    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
      await axios.post(`${API_BASE_URL}/register/seller`, payload, config);
      alert('Your seller account application has been submitted successfully for review.');
      
      // Reload profile to update redux status
      dispatch(getUserProfile());
      navigate('/seller/status');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Registration failed. Please verify details.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="seller-register-page">
      <div className="register-wizard-card">
        <div className="register-header">
          <div className="register-logo-icon">
            <FaStore />
          </div>
          <h1>Become a Seller on SBMI</h1>
          <p>Complete the merchant compliance file to start selling premium spices.</p>
        </div>

        {/* Step Indicators */}
        <div className="step-indicator">
          <div className={`step-node ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-node ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-node ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {errorMsg && <div className="auth-alert-danger">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="register-wizard-form">
          {step === 1 && (
            <div className="step-content animate-slide">
              <h3>Step 1: Store & Document Verification</h3>
              
              <div className="form-group">
                <label>Shop / Store Name *</label>
                <input 
                  type="text" 
                  name="shopName"
                  required 
                  placeholder="e.g. Spiceland Organic Store" 
                  value={formData.shopName}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Shop Description *</label>
                <textarea 
                  name="shopDescription"
                  rows="3"
                  required 
                  placeholder="Describe your brand values and organic/masala products" 
                  value={formData.shopDescription}
                  onChange={handleInputChange}
                  className="form-control text-area"
                />
              </div>

              <div className="form-group">
                <label>GSTIN ID Number *</label>
                <input 
                  type="text" 
                  name="gstin"
                  required 
                  placeholder="Enter 15-digit business GSTIN" 
                  value={formData.gstin}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Permanent Account Number (PAN) *</label>
                <input 
                  type="text" 
                  name="pan"
                  required 
                  placeholder="Enter 10-character PAN number" 
                  value={formData.pan}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animate-slide">
              <h3>Step 2: Bank Settlement Details</h3>
              
              <div className="form-group">
                <label>Bank Name *</label>
                <input 
                  type="text" 
                  name="bankName"
                  required 
                  placeholder="e.g. State Bank of India" 
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Account Number *</label>
                <input 
                  type="text" 
                  name="accountNumber"
                  required 
                  placeholder="Enter Bank Account Number" 
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>IFSC Code *</label>
                <input 
                  type="text" 
                  name="ifscCode"
                  required 
                  placeholder="Enter Bank Branch IFSC Code" 
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Account Holder Name *</label>
                <input 
                  type="text" 
                  name="accountHolderName"
                  required 
                  placeholder="Must match name on bank passbook" 
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>UPI ID (Optional Alternative Settlement)</label>
                <input 
                  type="text" 
                  name="upiId"
                  placeholder="e.g. storename@okaxis" 
                  value={formData.upiId}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content animate-slide">
              <h3>Step 3: Registered Business Address</h3>
              
              <div className="form-group">
                <label>Address Line 1 *</label>
                <input 
                  type="text" 
                  name="addressLine1"
                  required 
                  placeholder="Flat/Building No, Street Name" 
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  name="addressLine2"
                  placeholder="Landmark, locality details" 
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label>City *</label>
                  <input 
                    type="text" 
                    name="city"
                    required 
                    placeholder="City" 
                    value={formData.city}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input 
                    type="text" 
                    name="state"
                    required 
                    placeholder="State" 
                    value={formData.state}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pincode *</label>
                <input 
                  type="text" 
                  name="pincode"
                  required 
                  placeholder="Enter 6-digit PIN code" 
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
          )}

          <div className="wizard-navigation-actions">
            {step > 1 && (
              <button 
                type="button" 
                className="btn-back" 
                onClick={() => setStep(step - 1)}
                disabled={formLoading}
              >
                Back
              </button>
            )}
            <button type="submit" className="btn-next-submit" disabled={formLoading}>
              {formLoading ? 'Submitting File...' : step === 3 ? 'Submit Application' : 'Next Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerRegister;
