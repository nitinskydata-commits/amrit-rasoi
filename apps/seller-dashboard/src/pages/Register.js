import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerSeller } from '../utils/api';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaStore, FaFileAlt, FaMapMarkerAlt, FaUniversity } from 'react-icons/fa';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
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

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1); // Step 1: Owner, Step 2: Shop Details, Step 3: Bank & Address
  const navigate = useNavigate();

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

    setLoading(true);
    setErrorMsg('');

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
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

    try {
      const response = await registerSeller(payload);
      const { token, user } = response.data;

      localStorage.setItem('sellerToken', token);
      localStorage.setItem('sellerUser', JSON.stringify(user));
      localStorage.setItem('sellerShopName', user.sellerProfile?.shopName || 'Store');
      localStorage.setItem('sellerStatus', user.sellerStatus);

      navigate('/pending-approval');
    } catch (error) {
      console.error('Registration error details:', error);
      setErrorMsg(error.response?.data?.message || error.message || 'Registration failed. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-auth-page">
      <div className="auth-card wide">
        <div className="auth-header">
          <div className="auth-logo">
            <FaStore />
          </div>
          <h1>Apply to Sell on SBMI</h1>
          <p>Join our premium marketplace hub and start growing today.</p>
        </div>

        {/* Step tracker indicators */}
        <div className="step-indicator">
          <div className={`step-node ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-node ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-node ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {errorMsg && <div className="auth-alert-danger">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <div className="step-content">
              <h3>Step 1: Account Login Details</h3>
              
              <div className="auth-form-group">
                <label>Full Owner Name</label>
                <div className="auth-input-wrapper">
                  <FaUser />
                  <input 
                    type="text" 
                    name="name"
                    required 
                    placeholder="Enter owner/representative name" 
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Business Email Address</label>
                <div className="auth-input-wrapper">
                  <FaEnvelope />
                  <input 
                    type="email" 
                    name="email"
                    required 
                    placeholder="vendor@company.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Business Contact Number</label>
                <div className="auth-input-wrapper">
                  <FaPhone />
                  <input 
                    type="tel" 
                    name="phone"
                    required 
                    placeholder="Enter contact phone number" 
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Account Password</label>
                <div className="auth-input-wrapper">
                  <FaLock />
                  <input 
                    type="password" 
                    name="password"
                    required 
                    placeholder="Create a strong account password" 
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h3>Step 2: Shop & Document Details</h3>

              <div className="auth-form-group">
                <label>Shop / Store Name</label>
                <div className="auth-input-wrapper">
                  <FaStore />
                  <input 
                    type="text" 
                    name="shopName"
                    required 
                    placeholder="Enter customer-facing store name" 
                    value={formData.shopName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Shop / Business Description</label>
                <div className="auth-input-wrapper">
                  <textarea 
                    name="shopDescription"
                    rows="3"
                    required 
                    placeholder="Briefly describe products you plan to sell" 
                    value={formData.shopDescription}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>GSTIN ID</label>
                <div className="auth-input-wrapper">
                  <FaFileAlt />
                  <input 
                    type="text" 
                    name="gstin"
                    required 
                    placeholder="Enter 15-digit GSTIN number" 
                    value={formData.gstin}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Permanent Account Number (PAN)</label>
                <div className="auth-input-wrapper">
                  <FaFileAlt />
                  <input 
                    type="text" 
                    name="pan"
                    required 
                    placeholder="Enter 10-character PAN card number" 
                    value={formData.pan}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h3>Step 3: Settlements & Address Info</h3>
              
              <div className="form-grid">
                <div className="grid-col full">
                  <h4>Settlement Account Details</h4>
                </div>
                
                <div className="grid-col">
                  <label>Bank Name</label>
                  <div className="auth-input-wrapper">
                    <FaUniversity />
                    <input 
                      type="text" 
                      name="bankName"
                      required 
                      placeholder="e.g. State Bank of India" 
                      value={formData.bankName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid-col">
                  <label>Account Number</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="accountNumber"
                      required 
                      placeholder="Enter account number" 
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="grid-col">
                  <label>IFSC Code</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="ifscCode"
                      required 
                      placeholder="Enter bank branch IFSC" 
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="grid-col">
                  <label>Account Holder Name</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="accountHolderName"
                      required 
                      placeholder="Name on bank account" 
                      value={formData.accountHolderName}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="grid-col full">
                  <label>UPI ID (Optional)</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="upiId"
                      placeholder="e.g. storename@okaxis" 
                      value={formData.upiId}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="grid-col full">
                  <h4 style={{ marginTop: '14px' }}>Registered Business Address</h4>
                </div>

                <div className="grid-col full">
                  <label>Address Line 1</label>
                  <div className="auth-input-wrapper">
                    <FaMapMarkerAlt />
                    <input 
                      type="text" 
                      name="addressLine1"
                      required 
                      placeholder="Building number, street name" 
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid-col full">
                  <label>Address Line 2 (Optional)</label>
                  <div className="auth-input-wrapper">
                    <FaMapMarkerAlt />
                    <input 
                      type="text" 
                      name="addressLine2"
                      placeholder="Locality, landmark" 
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid-col">
                  <label>City</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="city"
                      required 
                      placeholder="City" 
                      value={formData.city}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="grid-col">
                  <label>State</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="state"
                      required 
                      placeholder="State" 
                      value={formData.state}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="grid-col full">
                  <label>Pincode / Postal Code</label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      name="pincode"
                      required 
                      placeholder="Enter 6-digit pin code" 
                      value={formData.pincode}
                      onChange={handleInputChange}
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="wizard-actions">
            {step > 1 && (
              <button 
                type="button" 
                className="btn-wizard-back" 
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Back
              </button>
            )}
            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? 'Submitting Application...' : step === 3 ? 'Submit Application' : 'Next Step'}
            </button>
          </div>
        </form>

        <div className="auth-footer-links">
          <span>Already registered?</span>
          <Link to="/login" className="auth-link">Sign In here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
