import React, { useState, useEffect } from 'react';
import { 
  getPayouts, 
  processPayout 
} from '../utils/api';
import { 
  FaHandHoldingUsd, 
  FaCalendarAlt, 
  FaUniversity, 
  FaCheckCircle, 
  FaClock, 
  FaMoneyCheckAlt,
  FaArrowRight
} from 'react-icons/fa';
import './VendorPayouts.css';

const VendorPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayouts: 0,
    pendingPayouts: 0,
    processedPayouts: 0
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await getPayouts();
      if (res.data.success) {
        const payoutsList = res.data.payouts || res.data.data || [];
        setPayouts(payoutsList);

        // Calculate Stats
        let total = 0;
        let pending = 0;
        let processed = 0;
        payoutsList.forEach(p => {
          total += p.amount;
          if (p.status === 'processed' || p.status === 'completed' || p.status === 'Paid') {
            processed += p.amount;
          } else {
            pending += p.amount;
          }
        });
        setStats({
          totalPayouts: total,
          pendingPayouts: pending,
          processedPayouts: processed
        });
      }
    } catch (error) {
      console.error('Error fetching payouts list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (id) => {
    if (!window.confirm('Are you sure you want to approve and process this merchant payout? This action will initiate a ledger transfer.')) {
      return;
    }
    
    try {
      const res = await processPayout(id);
      if (res.data.success) {
        alert('Payout successfully marked as processed.');
        fetchPayouts();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing payout');
    }
  };

  if (loading) {
    return <div className="loading">Querying merchant payouts ledger...</div>;
  }

  return (
    <div className="payouts-page">
      <div className="page-header">
        <div>
          <h1>🏪 Merchant & Vendor Payout Settlements</h1>
          <p>Reconcile merchant disbursements, verify banking routes, and authorize settlement schedules.</p>
        </div>
      </div>

      {/* STATS HIGHLIGHT OVERVIEW */}
      <div className="payouts-stats-grid">
        <div className="stat-card total-payouts">
          <div className="icon-wrapper">
            <FaMoneyCheckAlt />
          </div>
          <div className="content">
            <span className="label">Total Settlements Requested</span>
            <h2>₹{stats.totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="stat-card pending-payouts">
          <div className="icon-wrapper">
            <FaClock />
          </div>
          <div className="content">
            <span className="label">Pending Vendor Approvals</span>
            <h2>₹{stats.pendingPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="stat-card processed-payouts">
          <div className="icon-wrapper">
            <FaCheckCircle />
          </div>
          <div className="content">
            <span className="label">Settled (Disbursed) Payouts</span>
            <h2>₹{stats.processedPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      {/* LIST OF SETTLEMENT PAYOUTS */}
      <div className="card payouts-list-card">
        <div className="card-header-flex">
          <h2><FaHandHoldingUsd style={{ marginRight: '10px' }} /> Active Payout Requests</h2>
          <button className="btn btn-secondary btn-sm" onClick={fetchPayouts}>Refresh List</button>
        </div>

        <div className="payouts-list">
          {payouts.map((payout) => {
            const isProcessed = payout.status === 'processed' || payout.status === 'completed' || payout.status === 'Paid';
            return (
              <div key={payout._id} className={`payout-item-card ${isProcessed ? 'settled' : 'pending'}`}>
                <div className="payout-row">
                  
                  {/* Left Column: Requested User/Org and Date */}
                  <div className="payout-col vendor-info">
                    <strong>{payout.organizationName || payout.organization?.name || payout.user?.name || 'Vendor Partner'}</strong>
                    <div className="payout-date">
                      <FaCalendarAlt className="icon" />
                      <span>
                        Requested:{' '}
                        {new Date(payout.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Bank Details */}
                  <div className="payout-col bank-info">
                    <div className="info-title">
                      <FaUniversity className="icon" />
                      <span>Bank Route Details</span>
                    </div>
                    {payout.bankDetails || payout.organization?.bankDetails ? (
                      <div className="bank-details-mini">
                        <span>
                          <strong>Holder:</strong> {payout.bankDetails?.accountHolderName || payout.organization?.bankDetails?.accountHolderName}
                        </span>
                        <span>
                          <strong>Account:</strong> •••• {payout.bankDetails?.accountNumber?.slice(-4) || payout.organization?.bankDetails?.accountNumber?.slice(-4) || 'N/A'}
                        </span>
                        <span>
                          <strong>IFSC:</strong> {payout.bankDetails?.ifscCode || payout.organization?.bankDetails?.ifscCode || 'N/A'}
                        </span>
                      </div>
                    ) : (
                      <span className="no-bank-alert">No bank account linked</span>
                    )}
                  </div>

                  {/* Right Column: Amount, Status and Action */}
                  <div className="payout-col amount-action-info">
                    <div className="amount-section">
                      <span className="lbl">Payout Amount</span>
                      <h3 className="amount">₹{payout.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                    </div>

                    <div className="action-wrapper">
                      <span className={`status-badge ${payout.status}`}>
                        {payout.status.toUpperCase()}
                      </span>

                      {!isProcessed && (
                        <button 
                          className="btn btn-primary btn-sm btn-approve"
                          onClick={() => handleProcessPayout(payout._id)}
                        >
                          Approve <FaArrowRight style={{ marginLeft: '4px' }} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                {payout.notes && (
                  <div className="payout-notes">
                    <strong>Settlement Note:</strong> {payout.notes}
                  </div>
                )}
              </div>
            );
          })}
          {payouts.length === 0 && (
            <div className="no-payouts">
              <FaHandHoldingUsd style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }} />
              <p>No vendor payout settlement requests registered.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorPayouts;