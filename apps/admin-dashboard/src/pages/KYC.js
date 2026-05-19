import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserShield, FaCheckCircle, FaTimesCircle, FaClock, FaFileUpload, FaBuilding, FaSpinner } from 'react-icons/fa';
import './KYC.css';

const KYC = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kycDetails, setKycDetails] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [reviewRemarks, setReviewRemarks] = useState({});
  const [submittingReview, setSubmittingReview] = useState({});

  // Submission Form State
  const [formData, setFormData] = useState({
    gstin: '',
    pan: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    accountHolderName: '',
    documentUrl: ''
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get logged in user details
      const userRes = await axios.get('/api/v1/me', { headers });
      setUser(userRes.data.user);

      const isAdmin = ['admin', 'platform_admin'].includes(userRes.data.user.role);

      if (isAdmin) {
        // Fetch all organizations to show pending KYC list to Admin
        const orgsRes = await axios.get('/api/v1/organizations', { headers });
        const list = orgsRes.data.organizations || [];
        setPendingList(list);
      } else {
        // Fetch current organization's KYC details for Vendor
        const kycRes = await axios.get('/api/v1/kyc', { headers });
        setKycDetails(kycRes.data.kycDetails);
        if (kycRes.data.kycDetails) {
          const details = kycRes.data.kycDetails;
          setFormData({
            gstin: details.gstin || '',
            pan: details.pan || '',
            bankName: details.payoutAccount?.bankName || '',
            accountNumber: details.payoutAccount?.accountNumber || '',
            ifscCode: details.payoutAccount?.ifscCode || '',
            upiId: details.payoutAccount?.upiId || '',
            accountHolderName: details.payoutAccount?.accountHolderName || '',
            documentUrl: details.documentUrl || ''
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load KYC information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmittingForm(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('/api/v1/kyc', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('KYC details submitted successfully!');
      setKycDetails({
        ...kycDetails,
        kycStatus: 'pending',
        gstin: formData.gstin,
        pan: formData.pan,
        bankVerificationStatus: 'pending',
        documentUrl: formData.documentUrl,
        payoutAccount: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId,
          accountHolderName: formData.accountHolderName
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleReviewAction = async (orgId, action) => {
    setSubmittingReview(prev => ({ ...prev, [orgId]: true }));
    try {
      const token = localStorage.getItem('token');
      const remarks = reviewRemarks[orgId] || '';

      const { data } = await axios.put(`/api/v1/admin/kyc/${orgId}/review`, {
        action,
        remarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`KYC request ${action}d successfully`);
      setPendingList(pendingList.map(org => org._id === orgId ? data.organization : org));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Review processing failed');
    } finally {
      setSubmittingReview(prev => ({ ...prev, [orgId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved"><FaCheckCircle /> Approved</span>;
      case 'rejected':
        return <span className="status-badge rejected"><FaTimesCircle /> Rejected</span>;
      case 'pending':
        return <span className="status-badge pending"><FaClock /> Pending Review</span>;
      default:
        return <span className="status-badge not-submitted"><FaClock /> Not Submitted</span>;
    }
  };

  if (loading) {
    return (
      <div className="kyc-loading-screen">
        <FaSpinner className="spinner" />
        <p>Loading KYC Verification Center...</p>
      </div>
    );
  }

  const isAdmin = ['admin', 'platform_admin'].includes(user?.role);

  return (
    <div className="kyc-container">
      <div className="kyc-header-banner">
        <h1><FaUserShield /> Seller KYC Verification</h1>
        <p>{isAdmin ? 'Manage and approve merchant authenticity and bank credentials' : 'Submit your business registrations and bank accounts for platform payouts'}</p>
      </div>

      {isAdmin ? (
        // ADMIN DASHBOARD VIEW
        <div className="kyc-admin-workspace">
          <h2>Pending & Active Seller Profiles</h2>
          {pendingList.length === 0 ? (
            <div className="empty-kyc-state">
              <FaBuilding />
              <p>No registered organizations or sellers found on the platform.</p>
            </div>
          ) : (
            <div className="kyc-orgs-grid">
              {pendingList.map(org => (
                <div key={org._id} className="kyc-org-card">
                  <div className="org-card-header">
                    <h3>{org.name}</h3>
                    <span className="org-type-badge">{org.type?.toUpperCase()}</span>
                  </div>
                  
                  <div className="org-card-body">
                    <p><strong>Owner ID:</strong> {org.owner || 'N/A'}</p>
                    <p><strong>GSTIN:</strong> {org.gstin || 'Not Provided'}</p>
                    <p><strong>PAN:</strong> {org.pan || 'Not Provided'}</p>
                    <p><strong>Status:</strong> {getStatusBadge(org.kycStatus || 'not_submitted')}</p>

                    {org.payoutAccount && (
                      <div className="bank-details-box">
                        <h4>Bank Payout Account</h4>
                        <p><strong>Holder:</strong> {org.payoutAccount.accountHolderName || 'N/A'}</p>
                        <p><strong>Bank:</strong> {org.payoutAccount.bankName || 'N/A'}</p>
                        <p><strong>A/C Number:</strong> {org.payoutAccount.accountNumber || 'N/A'}</p>
                        <p><strong>IFSC:</strong> {org.payoutAccount.ifscCode || 'N/A'}</p>
                      </div>
                    )}

                    {org.documentUrl && (
                      <a href={org.documentUrl} target="_blank" rel="noopener noreferrer" className="document-link-btn">
                        View Uploaded Document
                      </a>
                    )}
                  </div>

                  {org.kycStatus === 'pending' && (
                    <div className="org-card-actions">
                      <textarea
                        placeholder="Add review remarks..."
                        value={reviewRemarks[org._id] || ''}
                        onChange={(e) => setReviewRemarks({ ...reviewRemarks, [org._id]: e.target.value })}
                      ></textarea>
                      <div className="action-buttons-row">
                        <button
                          className="btn-approve"
                          disabled={submittingReview[org._id]}
                          onClick={() => handleReviewAction(org._id, 'approve')}
                        >
                          {submittingReview[org._id] ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          className="btn-reject"
                          disabled={submittingReview[org._id]}
                          onClick={() => handleReviewAction(org._id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {org.kycRemarks && (
                    <div className="kyc-remarks-box">
                      <strong>Remarks:</strong> {org.kycRemarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // VENDOR PROFILE VIEW
        <div className="kyc-vendor-workspace">
          <div className="kyc-status-summary-card">
            <h3>Verification Status</h3>
            <div className="status-badge-row">
              {getStatusBadge(kycDetails?.kycStatus || 'not_submitted')}
            </div>
            {kycDetails?.kycRemarks && (
              <div className="remarks-notice-box">
                <strong>Moderator Remarks:</strong> {kycDetails.kycRemarks}
              </div>
            )}
          </div>

          {kycDetails?.kycStatus !== 'approved' && (
            <form onSubmit={handleFormSubmit} className="kyc-submission-form">
              <h3>Submit KYC Document & Credentials</h3>
              
              <div className="form-group-row">
                <div className="form-input-item">
                  <label>GSTIN (Tax ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                </div>
                <div className="form-input-item">
                  <label>PAN (Business Card)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                  />
                </div>
              </div>

              <div className="bank-info-form-section">
                <h4>Settlement Account Details</h4>
                <div className="form-group-row">
                  <div className="form-input-item">
                    <label>Account Holder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="As listed on bank statement"
                      value={formData.accountHolderName}
                      onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    />
                  </div>
                  <div className="form-input-item">
                    <label>Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. State Bank of India"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-input-item">
                    <label>Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter account number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-input-item">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBIN0001234"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-input-item">
                  <label>UPI ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. merchant@ybl"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-input-item">
                <label>Business Registration Document Link (PDF / image URL)</label>
                <div className="document-upload-mock">
                  <input
                    type="text"
                    placeholder="Provide hosted document URL (GSTIN certificate/cheque)"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={submittingForm} className="btn-submit-kyc">
                {submittingForm ? <FaSpinner className="spinner" /> : <FaFileUpload />} Submit KYC Details
              </button>
            </form>
          )}

          {kycDetails?.kycStatus === 'approved' && (
            <div className="kyc-approved-notice">
              <FaCheckCircle />
              <h3>Your KYC Verification is Approved!</h3>
              <p>Your bank payouts are verified, and you are eligible to sell products and receive settlements automatically.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KYC;
