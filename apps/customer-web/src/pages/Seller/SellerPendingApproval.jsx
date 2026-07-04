import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile, logout } from '../../redux/slices/authSlice';
import axios from 'axios';
import './SellerPendingApproval.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api/v1';

const PIPELINE_STEPS = [
  { key: 'application', label: 'Application Submitted', desc: 'Your seller application has been received.' },
  { key: 'kyc', label: 'KYC Verification', desc: 'Identity & documents are being verified.' },
  { key: 'payment', label: 'Payment Gateway', desc: 'Set up your payout account.' },
  { key: 'approval', label: 'Final Approval', desc: 'Admin completes final review.' },
  { key: 'active', label: 'Active Seller', desc: 'You are now a verified seller!' },
];

function getStepIndex(status) {
  switch (status) {
    case 'pending':          return 0;
    case 'kyc_in_progress':  return 1;
    case 'kyc_approved':     return 2;
    case 'kyc_failed':       return 1; // stuck at KYC
    case 'payment_pending':  return 3;
    case 'approved':         return 4;
    default: return 0;
  }
}

const SellerPendingApproval = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector(state => state.auth);
  const [syncing, setSyncing] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    paymentGatewayProvider: 'Direct Bank',
    merchantId: '',
  });

  useEffect(() => {
    if (isAuthenticated) dispatch(getUserProfile());
  }, [dispatch, isAuthenticated]);

  const handleSyncStatus = async () => {
    setSyncing(true);
    try {
      const result = await dispatch(getUserProfile()).unwrap();
      const s = result.user?.sellerStatus;
      if (s === 'approved') {
        navigate('/seller/dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.upiId && !paymentForm.accountNumber) {
      setPaymentError('Please provide at least one payment method (UPI or bank account).');
      return;
    }
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/seller/payment-setup`, paymentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentSuccess(true);
      await dispatch(getUserProfile());
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to submit payment details. Try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spa-container">
        <div className="spa-spinner-box"><div className="spa-spinner" /><p>Syncing your account...</p></div>
      </div>
    );
  }

  const status = user?.sellerStatus || 'pending';
  const profile = user?.sellerProfile || {};
  const stepIndex = getStepIndex(status);

  const isKYCFailed = status === 'kyc_failed';
  const isKYCApproved = status === 'kyc_approved';
  const isPaymentPending = status === 'payment_pending';
  const isApproved = status === 'approved';

  return (
    <div className="spa-container">
      <div className="spa-card">
        {/* Header */}
        <div className="spa-card-header">
          <div className="spa-brand">SBMI Marketplace</div>
          <h1 className="spa-card-title">Seller Onboarding</h1>
          <p className="spa-card-sub">
            {isApproved ? '🎉 Welcome to the SBMI seller network!' : `Application for: ${profile.shopName || 'Your Store'}`}
          </p>
        </div>

        {/* Pipeline Stepper */}
        <div className="spa-pipeline">
          {PIPELINE_STEPS.map((step, i) => {
            const isDone = i < stepIndex;
            const isActive = i === stepIndex;
            const isFailed = isKYCFailed && i === 1;
            return (
              <React.Fragment key={step.key}>
                <div className={`spa-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isFailed ? 'failed' : ''}`}>
                  <div className="spa-step-dot">
                    {isFailed ? '✕' : isDone ? '✓' : i + 1}
                  </div>
                  <div className="spa-step-info">
                    <span className="spa-step-label">{step.label}</span>
                    {(isActive || isFailed) && <span className="spa-step-desc">{step.desc}</span>}
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className={`spa-step-line ${isDone ? 'done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Status Content */}
        <div className="spa-status-body">

          {/* PENDING */}
          {status === 'pending' && (
            <div className="spa-status-panel pending">
              <div className="spa-status-icon">⏳</div>
              <h2>Application Under Review</h2>
              <p>Our compliance team has received your application and is beginning the initial review. You will be notified when KYC verification starts.</p>
              <div className="spa-checklist">
                <div className="spa-check done">✓ Application submitted</div>
                <div className="spa-check done">✓ Shop details recorded</div>
                <div className="spa-check pending">⌛ Admin review pending</div>
              </div>
            </div>
          )}

          {/* KYC IN PROGRESS */}
          {status === 'kyc_in_progress' && (
            <div className="spa-status-panel kyc">
              <div className="spa-status-icon">🔍</div>
              <h2>KYC Verification In Progress</h2>
              <p>Our team is actively reviewing your submitted PAN, GSTIN, and address documents. This typically takes 24–48 hours.</p>
              <div className="spa-checklist">
                <div className="spa-check done">✓ Application approved for KYC</div>
                <div className="spa-check active">🔍 PAN / GSTIN verification ongoing</div>
                <div className="spa-check pending">⌛ Document review pending</div>
              </div>
            </div>
          )}

          {/* KYC FAILED */}
          {isKYCFailed && (
            <div className="spa-status-panel failed">
              <div className="spa-status-icon">❌</div>
              <h2>KYC Verification Failed</h2>
              <p>Unfortunately, your KYC documents could not be verified. Please review the reason and contact support.</p>
              {profile.kycFailedReason && (
                <div className="spa-reason-box error">
                  <strong>Reason:</strong> {profile.kycFailedReason}
                </div>
              )}
              <p className="spa-hint">Please contact <a href="mailto:support@sbmi.com">support@sbmi.com</a> to resubmit documents.</p>
            </div>
          )}

          {/* KYC APPROVED → Payment Setup */}
          {isKYCApproved && !paymentSuccess && (
            <div className="spa-status-panel payment">
              <div className="spa-status-icon">💳</div>
              <h2>Set Up Your Payment Gateway</h2>
              <p>Your KYC has been approved! Now add your payout details so SBMI can settle your earnings.</p>

              <form className="spa-payment-form" onSubmit={handlePaymentSubmit}>
                <div className="spa-payment-section">
                  <h4>UPI Payment (Recommended)</h4>
                  <div className="spa-form-row">
                    <div className="spa-form-group">
                      <label>UPI ID</label>
                      <input type="text" placeholder="yourname@upi" value={paymentForm.upiId}
                        onChange={e => setPaymentForm({ ...paymentForm, upiId: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="spa-payment-section">
                  <h4>Bank Account</h4>
                  <div className="spa-form-row">
                    <div className="spa-form-group">
                      <label>Bank Name</label>
                      <input type="text" placeholder="State Bank of India" value={paymentForm.bankName}
                        onChange={e => setPaymentForm({ ...paymentForm, bankName: e.target.value })} />
                    </div>
                    <div className="spa-form-group">
                      <label>Account Number</label>
                      <input type="text" placeholder="1234567890123" value={paymentForm.accountNumber}
                        onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} />
                    </div>
                    <div className="spa-form-group">
                      <label>IFSC Code</label>
                      <input type="text" placeholder="SBIN0001234" value={paymentForm.ifscCode}
                        onChange={e => setPaymentForm({ ...paymentForm, ifscCode: e.target.value })} />
                    </div>
                    <div className="spa-form-group">
                      <label>Account Holder Name</label>
                      <input type="text" placeholder="Your full name" value={paymentForm.accountHolderName}
                        onChange={e => setPaymentForm({ ...paymentForm, accountHolderName: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="spa-payment-section">
                  <h4>Payment Gateway (Optional)</h4>
                  <div className="spa-form-row">
                    <div className="spa-form-group">
                      <label>Provider</label>
                      <select value={paymentForm.paymentGatewayProvider}
                        onChange={e => setPaymentForm({ ...paymentForm, paymentGatewayProvider: e.target.value })}>
                        <option value="Direct Bank">Direct Bank Transfer</option>
                        <option value="Razorpay">Razorpay</option>
                        <option value="Stripe">Stripe</option>
                        <option value="PayU">PayU</option>
                        <option value="Cashfree">Cashfree</option>
                        <option value="Paytm">Paytm</option>
                      </select>
                    </div>
                    <div className="spa-form-group">
                      <label>Merchant ID (if any)</label>
                      <input type="text" placeholder="Your merchant ID" value={paymentForm.merchantId}
                        onChange={e => setPaymentForm({ ...paymentForm, merchantId: e.target.value })} />
                    </div>
                  </div>
                </div>

                {paymentError && <div className="spa-error">{paymentError}</div>}

                <button type="submit" className="spa-btn-primary" disabled={paymentLoading}>
                  {paymentLoading ? '⏳ Submitting...' : '✓ Submit Payment Details'}
                </button>
              </form>
            </div>
          )}

          {/* Payment submitted, waiting */}
          {(isKYCApproved && paymentSuccess) || isPaymentPending ? (
            <div className="spa-status-panel pending">
              <div className="spa-status-icon">🕐</div>
              <h2>Payment Details Submitted</h2>
              <p>Your payment gateway details have been received. Our admin team will complete the final review and activate your account soon.</p>
              <div className="spa-checklist">
                <div className="spa-check done">✓ KYC Verified</div>
                <div className="spa-check done">✓ Payment details submitted</div>
                <div className="spa-check pending">⌛ Final admin approval pending</div>
              </div>
            </div>
          ) : null}

          {/* APPROVED */}
          {isApproved && (
            <div className="spa-status-panel approved">
              <div className="spa-status-icon">🚀</div>
              <h2>Account Approved!</h2>
              <p>Congratulations! Your seller account is fully verified and active. Start selling on SBMI today.</p>
              <button className="spa-btn-primary" onClick={() => navigate('/seller/dashboard')}>
                Go to Seller Dashboard →
              </button>
            </div>
          )}

          {/* REJECTED */}
          {status === 'rejected' && (
            <div className="spa-status-panel failed">
              <div className="spa-status-icon">❌</div>
              <h2>Application Rejected</h2>
              {profile.rejectionReason && (
                <div className="spa-reason-box error">
                  <strong>Reason:</strong> {profile.rejectionReason}
                </div>
              )}
              <p>Please contact <a href="mailto:support@sbmi.com">support@sbmi.com</a> for further assistance.</p>
            </div>
          )}

          {/* SUSPENDED */}
          {status === 'suspended' && (
            <div className="spa-status-panel failed">
              <div className="spa-status-icon">🚫</div>
              <h2>Account Suspended</h2>
              <p>Your seller account has been temporarily suspended. Contact support to resolve this.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="spa-footer">
          {!isApproved && (
            <button className="spa-btn-outline" onClick={handleSyncStatus} disabled={syncing}>
              {syncing ? '⏳ Syncing...' : '↻ Check Status'}
            </button>
          )}
          <button className="spa-btn-ghost" onClick={() => { dispatch(logout()); navigate('/'); }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerPendingApproval;
