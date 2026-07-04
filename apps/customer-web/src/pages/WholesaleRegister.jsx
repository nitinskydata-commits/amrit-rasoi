import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile } from '../redux/slices/authSlice';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { FaBuilding, FaFileInvoice, FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import './WholesaleRegister.css';

const WholesaleRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    companyName: '',
    gstin: '',
    tradeLicense: '',
    businessAddress: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserProfile());
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return <div className="wholesale-loading">Loading B2B profile files...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/wholesale/apply" replace />;
  }

  const wholesaleStatus = user?.wholesaleStatus || 'none';

  if (wholesaleStatus === 'approved') {
    return (
      <div className="wholesale-status-page">
        <div className="status-box">
          <div className="badge-approved">Verified Wholesaler</div>
          <h2>B2B Wholesale Account Active</h2>
          <p>Your B2B account is verified! You now automatically receive a <strong>15% volume discount</strong> applied directly at checkout on all products.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Start Buying</button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyName: formData.companyName,
      gstin: formData.gstin,
      tradeLicense: formData.tradeLicense,
      businessAddress: formData.businessAddress
    };

    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
      await axios.post(`${API_BASE_URL}/register/wholesale`, payload, config);
      setSuccessMsg('Your B2B Wholesale account application has been submitted successfully for verification!');
      dispatch(getUserProfile());
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Application failed. Please verify details.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="wholesale-register-page">
      <div className="wholesale-wizard-card">
        <div className="wholesale-header">
          <div className="wholesale-logo-icon">
            <FaBuilding />
          </div>
          <h1>Apply for Wholesale Account</h1>
          <p>Register your corporate firm to save up to 18% GST inputs plus volume pricing discounts.</p>
        </div>

        {successMsg ? (
          <div className="wholesale-success-box">
            <div className="success-icon">✓</div>
            <h3>Application Received</h3>
            <p>{successMsg}</p>
            <div className="checklist-box">
              <h4>Review Progress</h4>
              <ul>
                <li className="checked">✓ Application files uploaded</li>
                <li className="progressing">⚡ GSTIN & Trade validation in progress</li>
              </ul>
            </div>
            <button className="btn btn-outline" onClick={() => dispatch(getUserProfile())}><FaSync /> Sync Status</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="wholesale-form">
            {errorMsg && <div className="auth-alert-danger">{errorMsg}</div>}
            
            {wholesaleStatus === 'pending' ? (
              <div className="wholesale-success-box">
                <div className="success-icon pending">⌛</div>
                <h3>Compliance Review in Progress</h3>
                <p>We are validating your GSTIN registration and license files. This normally takes 12-24 business hours.</p>
                <button className="btn btn-outline" style={{ marginTop: '20px' }} onClick={() => dispatch(getUserProfile())}><FaSync /> Check Status Again</button>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Company / Firm Legal Name *</label>
                  <input 
                    type="text" 
                    name="companyName"
                    required 
                    placeholder="e.g. Acme Retailers Private Limited" 
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>GSTIN Tax Registration ID *</label>
                  <div className="input-icon-wrapper">
                    <FaFileInvoice />
                    <input 
                      type="text" 
                      name="gstin"
                      required 
                      placeholder="e.g. 07AAAAA1111A1Z1" 
                      value={formData.gstin}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Trade License / Business Registration Number *</label>
                  <input 
                    type="text" 
                    name="tradeLicense"
                    required 
                    placeholder="e.g. LIC-B2B-9872" 
                    value={formData.tradeLicense}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Registered Business Address *</label>
                  <div className="input-icon-wrapper">
                    <FaMapMarkerAlt />
                    <textarea 
                      name="businessAddress"
                      required 
                      rows="3"
                      placeholder="Enter billing & logistics address..." 
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      className="form-control text-area"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-next-submit" disabled={formLoading} style={{ width: '100%', marginTop: '16px' }}>
                  {formLoading ? 'Submitting File...' : 'Apply for Wholesale Profile'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default WholesaleRegister;
