import React, { useState, useEffect } from 'react';
import {
  getAllSellers, updateSellerStatus, updateSellerProfile,
  initiateKYC, completeKYC, finalApproveSeller
} from '../utils/api';
import {
  FaStore, FaCheck, FaTimes, FaBan, FaInfoCircle, FaPercentage,
  FaIdCard, FaCheckCircle, FaTimesCircle, FaSpinner, FaHandHoldingUsd,
  FaRocket, FaExclamationTriangle, FaEdit, FaSync
} from 'react-icons/fa';
import './SellerManagement.css';

// Pipeline tab definitions
const TABS = [
  { key: 'pending',          label: 'New Applications',    icon: <FaStore />,              color: '#f59e0b' },
  { key: 'kyc_in_progress',  label: 'KYC In Review',       icon: <FaIdCard />,             color: '#3b82f6' },
  { key: 'kyc_approved',     label: 'Awaiting Payment Setup', icon: <FaHandHoldingUsd />,  color: '#8b5cf6' },
  { key: 'kyc_failed',       label: 'KYC Failed',          icon: <FaTimesCircle />,        color: '#ef4444' },
  { key: 'payment_pending',  label: 'Final Review',        icon: <FaCheckCircle />,        color: '#10b981' },
  { key: 'approved',         label: 'Active Sellers',      icon: <FaRocket />,             color: '#22c55e' },
  { key: 'rejected',         label: 'Rejected',            icon: <FaTimes />,              color: '#6b7280' },
  { key: 'suspended',        label: 'Suspended',           icon: <FaBan />,                color: '#ef4444' },
];

const STATUS_BADGE = {
  pending:         { label: 'Pending',           bg: '#f59e0b22', color: '#f59e0b' },
  kyc_in_progress: { label: 'KYC In Progress',   bg: '#3b82f622', color: '#60a5fa' },
  kyc_approved:    { label: 'KYC Approved',      bg: '#8b5cf622', color: '#a78bfa' },
  kyc_failed:      { label: 'KYC Failed',        bg: '#ef444422', color: '#f87171' },
  payment_pending: { label: 'Payment Review',    bg: '#10b98122', color: '#34d399' },
  approved:        { label: 'Active',            bg: '#22c55e22', color: '#4ade80' },
  rejected:        { label: 'Rejected',          bg: '#6b728022', color: '#9ca3af' },
  suspended:       { label: 'Suspended',         bg: '#ef444422', color: '#f87171' },
};

const SellerManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal visibility
  const [showDetails, setShowDetails] = useState(false);
  const [showKYCFailModal, setShowKYCFailModal] = useState(false);
  const [showFinalApproveModal, setShowFinalApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form inputs
  const [kycFailReason, setKycFailReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [commissionRate, setCommissionRate] = useState(10);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => { fetchSellers(); }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await getAllSellers();
      setSellers(res.data.sellers || []);
    } catch (e) {
      console.error('Failed to fetch sellers:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(s => s.sellerStatus === activeTab);

  const tabCounts = {};
  sellers.forEach(s => { tabCounts[s.sellerStatus] = (tabCounts[s.sellerStatus] || 0) + 1; });

  // ==================== ACTIONS ====================

  const handleInitiateKYC = async (seller) => {
    if (!window.confirm(`Start KYC review for ${seller.name}?`)) return;
    setActionLoading(true);
    try {
      await initiateKYC(seller._id);
      alert(`KYC review initiated for ${seller.name}. Seller will be notified.`);
      fetchSellers();
    } catch (e) {
      alert(e.response?.data?.message || 'Error initiating KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKYCApprove = async (seller) => {
    if (!window.confirm(`Approve KYC for ${seller.name}?`)) return;
    setActionLoading(true);
    try {
      await completeKYC(seller._id, { result: 'approved' });
      alert(`KYC approved! ${seller.name} will now set up their payment gateway.`);
      fetchSellers();
    } catch (e) {
      alert(e.response?.data?.message || 'Error approving KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKYCFail = async () => {
    if (!selectedSeller || !kycFailReason.trim()) {
      alert('Please enter a reason for KYC failure.');
      return;
    }
    setActionLoading(true);
    try {
      await completeKYC(selectedSeller._id, { result: 'failed', failedReason: kycFailReason });
      alert(`KYC marked as failed. Seller notified: "${kycFailReason}"`);
      setShowKYCFailModal(false);
      setKycFailReason('');
      fetchSellers();
    } catch (e) {
      alert(e.response?.data?.message || 'Error failing KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalApprove = async () => {
    if (!selectedSeller) return;
    setActionLoading(true);
    try {
      await finalApproveSeller(selectedSeller._id, { commissionRate: Number(commissionRate) });
      alert(`${selectedSeller.name} is now a fully approved seller!`);
      setShowFinalApproveModal(false);
      fetchSellers();
    } catch (e) {
      alert(e.response?.data?.message || 'Error final approving seller');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSeller || !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await updateSellerStatus(selectedSeller._id, { status: 'rejected', rejectionReason });
      alert('Seller application rejected and seller notified.');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchSellers();
    } catch (e) {
      alert(e.response?.data?.message || 'Error rejecting seller');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedSeller) return;
    setActionLoading(true);
    try {
      await updateSellerStatus(selectedSeller._id, { status: 'suspended', rejectionReason: suspendReason });
      alert(`${selectedSeller.name}'s account has been suspended.`);
      setShowSuspendModal(false);
      setSuspendReason('');
      fetchSellers();
    } catch (e) {
      alert(e.response?.data?.message || 'Error suspending seller');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedSeller) return;
    setActionLoading(true);
    try {
      await updateSellerProfile(selectedSeller._id, editFormData);
      alert('Seller profile updated successfully.');
      setShowEditModal(false);
      fetchSellers();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating seller profile');
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (seller) => {
    setSelectedSeller(seller);
    setEditFormData({
      commissionRate: seller.sellerProfile?.commissionRate || 10,
      shopName: seller.sellerProfile?.shopName || '',
      shopDescription: seller.sellerProfile?.shopDescription || '',
      gstin: seller.sellerProfile?.gstin || '',
      pan: seller.sellerProfile?.pan || '',
      bankName: seller.sellerProfile?.bankDetails?.bankName || '',
      accountNumber: seller.sellerProfile?.bankDetails?.accountNumber || '',
      ifscCode: seller.sellerProfile?.bankDetails?.ifscCode || '',
      accountHolderName: seller.sellerProfile?.bankDetails?.accountHolderName || '',
      upiId: seller.sellerProfile?.bankDetails?.upiId || '',
    });
    setShowEditModal(true);
  };

  // ==================== RENDER HELPERS ====================

  const Badge = ({ status }) => {
    const b = STATUS_BADGE[status] || { label: status, bg: '#27272a', color: '#a1a1aa' };
    return (
      <span style={{
        background: b.bg, color: b.color, padding: '3px 10px',
        borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap'
      }}>{b.label}</span>
    );
  };

  const renderActions = (seller) => {
    const s = seller.sellerStatus;
    return (
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button className="sm-btn sm-btn-info" onClick={() => { setSelectedSeller(seller); setShowDetails(true); }}>
          <FaInfoCircle /> Details
        </button>
        {s === 'pending' && (
          <>
            <button className="sm-btn sm-btn-primary" onClick={() => handleInitiateKYC(seller)} disabled={actionLoading}>
              <FaIdCard /> Start KYC
            </button>
            <button className="sm-btn sm-btn-danger" onClick={() => { setSelectedSeller(seller); setRejectionReason(''); setShowRejectModal(true); }}>
              <FaTimes /> Reject
            </button>
          </>
        )}
        {s === 'kyc_in_progress' && (
          <>
            <button className="sm-btn sm-btn-success" onClick={() => handleKYCApprove(seller)} disabled={actionLoading}>
              <FaCheck /> Approve KYC
            </button>
            <button className="sm-btn sm-btn-danger" onClick={() => { setSelectedSeller(seller); setKycFailReason(''); setShowKYCFailModal(true); }}>
              <FaTimesCircle /> Fail KYC
            </button>
          </>
        )}
        {s === 'kyc_approved' && (
          <span style={{ color: '#a78bfa', fontSize: '12px', padding: '4px 8px' }}>⏳ Awaiting seller payment setup</span>
        )}
        {s === 'kyc_failed' && (
          <>
            <span style={{ color: '#f87171', fontSize: '12px' }}>
              Reason: {seller.sellerProfile?.kycFailedReason || '—'}
            </span>
            <button className="sm-btn sm-btn-primary" onClick={() => handleInitiateKYC(seller)} disabled={actionLoading}>
              <FaSync /> Re-initiate KYC
            </button>
          </>
        )}
        {s === 'payment_pending' && (
          <>
            <button className="sm-btn sm-btn-success"
              onClick={() => { setSelectedSeller(seller); setCommissionRate(seller.sellerProfile?.commissionRate || 10); setShowFinalApproveModal(true); }}
              disabled={actionLoading}>
              <FaRocket /> Final Approve
            </button>
            <button className="sm-btn sm-btn-danger" onClick={() => { setSelectedSeller(seller); setRejectionReason(''); setShowRejectModal(true); }}>
              <FaTimes /> Reject
            </button>
          </>
        )}
        {s === 'approved' && (
          <>
            <button className="sm-btn sm-btn-warning" onClick={() => openEdit(seller)}>
              <FaEdit /> Edit
            </button>
            <button className="sm-btn sm-btn-danger" onClick={() => { setSelectedSeller(seller); setSuspendReason(''); setShowSuspendModal(true); }}>
              <FaBan /> Suspend
            </button>
          </>
        )}
        {(s === 'rejected' || s === 'suspended') && (
          <button className="sm-btn sm-btn-warning" onClick={() => openEdit(seller)}>
            <FaEdit /> Edit
          </button>
        )}
      </div>
    );
  };

  // ==================== PIPELINE STEPS (top of page) ====================

  const PipelineSteps = () => (
    <div className="sm-pipeline">
      {[
        { key: 'pending', label: '1. Application' },
        { key: 'kyc_in_progress', label: '2. KYC Review' },
        { key: 'kyc_approved', label: '3. Payment Setup' },
        { key: 'payment_pending', label: '4. Final Review' },
        { key: 'approved', label: '5. Active' },
      ].map((step, i, arr) => {
        const isActive = step.key === activeTab || (activeTab === 'kyc_failed' && step.key === 'kyc_in_progress');
        const isDone = arr.slice(0, i).some(s => s.key === activeTab);
        return (
          <React.Fragment key={step.key}>
            <div
              className={`sm-pipeline-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              onClick={() => setActiveTab(step.key)}
            >
              <div className="sm-pipeline-dot">{isDone ? '✓' : (tabCounts[step.key] || 0)}</div>
              <span>{step.label}</span>
            </div>
            {i < arr.length - 1 && <div className={`sm-pipeline-line ${isDone ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ==================== RETURN ====================

  return (
    <div className="sm-container">
      <div className="sm-header">
        <div>
          <h1 className="sm-title"><FaStore /> Seller Account Management</h1>
          <p className="sm-subtitle">Manage the full onboarding pipeline — from application to active seller.</p>
        </div>
        <button className="sm-btn sm-btn-outline" onClick={fetchSellers}>
          <FaSync /> Refresh
        </button>
      </div>

      <PipelineSteps />

      {/* Tab bar */}
      <div className="sm-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`sm-tab ${activeTab === tab.key ? 'active' : ''}`}
            style={activeTab === tab.key ? { borderBottomColor: tab.color, color: tab.color } : {}}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span className="sm-tab-badge" style={{ background: tab.color }}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="sm-loading"><FaSpinner className="spin" /> Loading sellers...</div>
      ) : filteredSellers.length === 0 ? (
        <div className="sm-empty">
          <FaStore style={{ fontSize: '40px', opacity: 0.3 }} />
          <p>No sellers in this stage.</p>
        </div>
      ) : (
        <div className="sm-table-wrapper">
          <table className="sm-table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Shop</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map(seller => (
                <tr key={seller._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e4e4e7' }}>{seller.name}</div>
                    <div style={{ fontSize: '12px', color: '#71717a' }}>{seller.email}</div>
                  </td>
                  <td>
                    <div style={{ color: '#e4e4e7' }}>{seller.sellerProfile?.shopName || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#71717a' }}>
                      {seller.sellerProfile?.gstin ? `GSTIN: ${seller.sellerProfile.gstin}` : ''}
                    </div>
                  </td>
                  <td style={{ color: '#a1a1aa', fontSize: '13px' }}>{seller.phone || '—'}</td>
                  <td><Badge status={seller.sellerStatus} /></td>
                  <td style={{ color: '#71717a', fontSize: '12px' }}>
                    {seller.sellerProfile?.appliedAt
                      ? new Date(seller.sellerProfile.appliedAt).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td>{renderActions(seller)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== DETAILS MODAL ===== */}
      {showDetails && selectedSeller && (
        <div className="sm-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="sm-modal" onClick={e => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h3><FaInfoCircle /> Seller Details</h3>
              <button className="sm-close" onClick={() => setShowDetails(false)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <div className="sm-detail-grid">
                <div><label>Full Name</label><span>{selectedSeller.name}</span></div>
                <div><label>Email</label><span>{selectedSeller.email || '—'}</span></div>
                <div><label>Phone</label><span>{selectedSeller.phone || '—'}</span></div>
                <div><label>Pipeline Status</label><span><Badge status={selectedSeller.sellerStatus} /></span></div>
                <div><label>Shop Name</label><span>{selectedSeller.sellerProfile?.shopName || '—'}</span></div>
                <div><label>GSTIN</label><span>{selectedSeller.sellerProfile?.gstin || '—'}</span></div>
                <div><label>PAN</label><span>{selectedSeller.sellerProfile?.pan || '—'}</span></div>
                <div><label>Commission Rate</label><span>{selectedSeller.sellerProfile?.commissionRate || 10}%</span></div>
                <div><label>Bank Name</label><span>{selectedSeller.sellerProfile?.bankDetails?.bankName || '—'}</span></div>
                <div><label>Account No.</label><span>{selectedSeller.sellerProfile?.bankDetails?.accountNumber || '—'}</span></div>
                <div><label>IFSC Code</label><span>{selectedSeller.sellerProfile?.bankDetails?.ifscCode || '—'}</span></div>
                <div><label>UPI ID</label><span>{selectedSeller.sellerProfile?.bankDetails?.upiId || '—'}</span></div>
                <div><label>Applied At</label><span>{selectedSeller.sellerProfile?.appliedAt ? new Date(selectedSeller.sellerProfile.appliedAt).toLocaleString() : '—'}</span></div>
                <div><label>KYC Started</label><span>{selectedSeller.sellerProfile?.kycStartedAt ? new Date(selectedSeller.sellerProfile.kycStartedAt).toLocaleString() : '—'}</span></div>
                <div><label>KYC Approved</label><span>{selectedSeller.sellerProfile?.kycApprovedAt ? new Date(selectedSeller.sellerProfile.kycApprovedAt).toLocaleString() : '—'}</span></div>
                {selectedSeller.sellerProfile?.kycFailedReason && (
                  <div className="full-width"><label>KYC Fail Reason</label><span style={{ color: '#f87171' }}>{selectedSeller.sellerProfile.kycFailedReason}</span></div>
                )}
                {selectedSeller.sellerProfile?.paymentGateway?.submittedAt && (
                  <>
                    <div><label>Payment Provider</label><span>{selectedSeller.sellerProfile.paymentGateway.paymentGatewayProvider || '—'}</span></div>
                    <div><label>Merchant ID</label><span>{selectedSeller.sellerProfile.paymentGateway.merchantId || '—'}</span></div>
                    <div><label>Payment UPI</label><span>{selectedSeller.sellerProfile.paymentGateway.upiId || '—'}</span></div>
                    <div><label>Payment Bank</label><span>{selectedSeller.sellerProfile.paymentGateway.bankName || '—'}</span></div>
                    <div><label>Payment Acct</label><span>{selectedSeller.sellerProfile.paymentGateway.accountNumber || '—'}</span></div>
                  </>
                )}
                {selectedSeller.sellerProfile?.rejectionReason && (
                  <div className="full-width"><label>Rejection Reason</label><span style={{ color: '#f87171' }}>{selectedSeller.sellerProfile.rejectionReason}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== KYC FAIL MODAL ===== */}
      {showKYCFailModal && selectedSeller && (
        <div className="sm-modal-overlay">
          <div className="sm-modal sm-modal-narrow">
            <div className="sm-modal-header">
              <h3><FaTimesCircle style={{ color: '#ef4444' }} /> Fail KYC Verification</h3>
              <button className="sm-close" onClick={() => setShowKYCFailModal(false)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
                You are failing the KYC verification for <strong style={{ color: '#e4e4e7' }}>{selectedSeller.name}</strong>.
                The seller will be notified with the reason below.
              </p>
              <label className="sm-label">Reason for KYC Failure *</label>
              <textarea
                className="sm-input"
                rows={4}
                placeholder="e.g. PAN document is blurry, GSTIN mismatch, Address proof expired..."
                value={kycFailReason}
                onChange={e => setKycFailReason(e.target.value)}
              />
              <div className="sm-modal-actions">
                <button className="sm-btn sm-btn-outline" onClick={() => setShowKYCFailModal(false)}>Cancel</button>
                <button className="sm-btn sm-btn-danger" onClick={handleKYCFail} disabled={actionLoading || !kycFailReason.trim()}>
                  {actionLoading ? <FaSpinner className="spin" /> : <FaTimesCircle />} Confirm KYC Failed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FINAL APPROVE MODAL ===== */}
      {showFinalApproveModal && selectedSeller && (
        <div className="sm-modal-overlay">
          <div className="sm-modal sm-modal-narrow">
            <div className="sm-modal-header">
              <h3><FaRocket style={{ color: '#10b981' }} /> Final Approval</h3>
              <button className="sm-close" onClick={() => setShowFinalApproveModal(false)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
                Fully onboard <strong style={{ color: '#e4e4e7' }}>{selectedSeller.name}</strong> as an active seller.
              </p>
              <label className="sm-label"><FaPercentage /> Commission Rate (%)</label>
              <input
                type="number"
                className="sm-input"
                value={commissionRate}
                min={0} max={100}
                onChange={e => setCommissionRate(e.target.value)}
              />
              <div className="sm-info-box">
                <FaHandHoldingUsd style={{ color: '#34d399' }} />
                <span>Payment Gateway: {selectedSeller.sellerProfile?.paymentGateway?.paymentGatewayProvider || 'Direct Bank'} — 
                  UPI: {selectedSeller.sellerProfile?.paymentGateway?.upiId || '—'} / 
                  Account: {selectedSeller.sellerProfile?.paymentGateway?.accountNumber || '—'}</span>
              </div>
              <div className="sm-modal-actions">
                <button className="sm-btn sm-btn-outline" onClick={() => setShowFinalApproveModal(false)}>Cancel</button>
                <button className="sm-btn sm-btn-success" onClick={handleFinalApprove} disabled={actionLoading}>
                  {actionLoading ? <FaSpinner className="spin" /> : <FaRocket />} Activate Seller
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== REJECT MODAL ===== */}
      {showRejectModal && selectedSeller && (
        <div className="sm-modal-overlay">
          <div className="sm-modal sm-modal-narrow">
            <div className="sm-modal-header">
              <h3><FaExclamationTriangle style={{ color: '#ef4444' }} /> Reject Application</h3>
              <button className="sm-close" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
                Rejecting <strong style={{ color: '#e4e4e7' }}>{selectedSeller.name}</strong>'s seller application.
              </p>
              <label className="sm-label">Rejection Reason *</label>
              <textarea className="sm-input" rows={3} placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
              <div className="sm-modal-actions">
                <button className="sm-btn sm-btn-outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="sm-btn sm-btn-danger" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
                  {actionLoading ? <FaSpinner className="spin" /> : <FaTimes />} Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUSPEND MODAL ===== */}
      {showSuspendModal && selectedSeller && (
        <div className="sm-modal-overlay">
          <div className="sm-modal sm-modal-narrow">
            <div className="sm-modal-header">
              <h3><FaBan style={{ color: '#f59e0b' }} /> Suspend Seller</h3>
              <button className="sm-close" onClick={() => setShowSuspendModal(false)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
                Suspending <strong style={{ color: '#e4e4e7' }}>{selectedSeller.name}</strong>'s seller account.
              </p>
              <label className="sm-label">Reason (optional)</label>
              <textarea className="sm-input" rows={3} placeholder="Reason for suspension..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
              <div className="sm-modal-actions">
                <button className="sm-btn sm-btn-outline" onClick={() => setShowSuspendModal(false)}>Cancel</button>
                <button className="sm-btn sm-btn-danger" onClick={handleSuspend} disabled={actionLoading}>
                  {actionLoading ? <FaSpinner className="spin" /> : <FaBan />} Suspend Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedSeller && (
        <div className="sm-modal-overlay">
          <div className="sm-modal">
            <div className="sm-modal-header">
              <h3><FaEdit /> Edit Seller Profile</h3>
              <button className="sm-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="sm-modal-body">
              <div className="sm-edit-grid">
                {[
                  { key: 'shopName', label: 'Shop Name', type: 'text' },
                  { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number' },
                  { key: 'gstin', label: 'GSTIN', type: 'text' },
                  { key: 'pan', label: 'PAN', type: 'text' },
                  { key: 'bankName', label: 'Bank Name', type: 'text' },
                  { key: 'accountNumber', label: 'Account Number', type: 'text' },
                  { key: 'ifscCode', label: 'IFSC Code', type: 'text' },
                  { key: 'accountHolderName', label: 'Account Holder', type: 'text' },
                  { key: 'upiId', label: 'UPI ID', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="sm-label">{field.label}</label>
                    <input
                      type={field.type}
                      className="sm-input"
                      value={editFormData[field.key] || ''}
                      onChange={e => setEditFormData({ ...editFormData, [field.key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="full-width">
                  <label className="sm-label">Shop Description</label>
                  <textarea className="sm-input" rows={3}
                    value={editFormData.shopDescription || ''}
                    onChange={e => setEditFormData({ ...editFormData, shopDescription: e.target.value })}
                  />
                </div>
              </div>
              <div className="sm-modal-actions">
                <button className="sm-btn sm-btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="sm-btn sm-btn-success" onClick={handleSaveEdit} disabled={actionLoading}>
                  {actionLoading ? <FaSpinner className="spin" /> : <FaCheck />} Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerManagement;
