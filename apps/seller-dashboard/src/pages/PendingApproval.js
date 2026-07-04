import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSellerStatus } from '../utils/api';
import { FaClock, FaTimesCircle, FaBan, FaSignOutAlt, FaSync } from 'react-icons/fa';
import './PendingApproval.css';

const PendingApproval = ({ onLogout }) => {
  const [status, setStatus] = useState('pending');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await getSellerStatus();
      setStatus(response.data.sellerStatus);
      setProfile(response.data.sellerProfile);
      
      // If approved, redirect immediately to dashboard
      if (response.data.sellerStatus === 'approved') {
        const cachedUser = JSON.parse(localStorage.getItem('sellerUser') || '{}');
        cachedUser.sellerStatus = 'approved';
        cachedUser.organizationId = response.data.organizationId;
        localStorage.setItem('sellerUser', JSON.stringify(cachedUser));
        localStorage.setItem('sellerStatus', 'approved');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching seller status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="status-spinner-box">
          <div className="spinner"></div>
          <p>Syncing application file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-container">
      <div className="status-card">
        {status === 'pending' && (
          <div className="status-content">
            <div className="status-icon pending">
              <FaClock />
            </div>
            <h2>Application Under Review</h2>
            <p className="status-desc">
              Your registration request for <strong>{profile?.shopName || 'your store'}</strong> has been received. 
              Our administrative compliance team is reviewing the business documentation.
            </p>
            <div className="checklist-box">
              <h4>Review Checklist Progress</h4>
              <ul>
                <li className="checked">✓ Basic login credentials created</li>
                <li className="checked">✓ Shop details submitted</li>
                <li className="checked">✓ Settlement bank details linked</li>
                <li className="progressing">⚡ Admin validation of PAN/GSTIN in progress</li>
              </ul>
            </div>
            <p className="status-footer-text">
              We usually complete the verification process within 24-48 business hours. You'll gain portal access once approved.
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="status-content">
            <div className="status-icon rejected">
              <FaTimesCircle />
            </div>
            <h2 className="text-danger">Application Rejected</h2>
            <p className="status-desc">
              Unfortunately, your application to sell on the SBMI platform was not approved.
            </p>
            {profile?.rejectionReason && (
              <div className="reason-container">
                <h4>Rejection Reason:</h4>
                <p>{profile.rejectionReason}</p>
              </div>
            )}
            <p className="status-footer-text">
              Please review the reason above, make corrections, and contact support if you believe this is a misunderstanding.
            </p>
          </div>
        )}

        {status === 'suspended' && (
          <div className="status-content">
            <div className="status-icon suspended">
              <FaBan />
            </div>
            <h2 className="text-warning">Merchant Account Suspended</h2>
            <p className="status-desc">
              Your merchant account access has been suspended due to platform compliance or settlement issues.
            </p>
            <p className="status-footer-text">
              Please contact the platform partner administration to resolve your account hold.
            </p>
          </div>
        )}

        <div className="status-actions">
          <button className="btn btn-outline" onClick={checkStatus}>
            <FaSync /> Check Status Again
          </button>
          <button className="btn btn-danger" onClick={handleLogoutClick}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
