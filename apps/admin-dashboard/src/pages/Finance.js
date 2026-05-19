import React, { useState, useEffect } from 'react';
import { 
  getTransactions, 
  updateBankDetails, 
  requestPayout 
} from '../utils/api';
import { 
  FaUniversity, 
  FaCreditCard, 
  FaExchangeAlt, 
  FaArrowUp, 
  FaArrowDown, 
  FaTimes, 
  FaWallet,
  FaCheckCircle,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import './Finance.css';

const Finance = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    walletBalance: 0,
    totalReceived: 0,
    totalPayout: 0,
    pendingPayout: 0
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    branchName: ''
  });

  const [payoutRequest, setPayoutRequest] = useState({
    amount: '',
    notes: 'Weekly vendor settlement request'
  });

  // Modal displays
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const res = await getTransactions();
      if (res.data.success) {
        setTransactions(res.data.transactions || res.data.data || []);
        
        // Populate stats & bank details if available
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          // Fallback dummy statistics calculations if not returned by server
          const txs = res.data.transactions || [];
          let balance = 0;
          let creditTotal = 0;
          let debitTotal = 0;
          txs.forEach(t => {
            if (t.type === 'credit') {
              balance += t.amount;
              creditTotal += t.amount;
            } else {
              balance -= t.amount;
              debitTotal += t.amount;
            }
          });
          setStats({
            walletBalance: balance,
            totalReceived: creditTotal,
            totalPayout: debitTotal,
            pendingPayout: 0
          });
        }

        if (res.data.bankDetails) {
          setBankDetails(res.data.bankDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    try {
      const res = await updateBankDetails(bankDetails);
      if (res.data.success) {
        setShowBankModal(false);
        alert('Bank beneficiary credentials successfully updated.');
        fetchFinanceData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating bank details');
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    try {
      const res = await requestPayout({
        amount: parseFloat(payoutRequest.amount),
        notes: payoutRequest.notes
      });
      if (res.data.success) {
        setShowPayoutModal(false);
        setPayoutRequest({ amount: '', notes: 'Weekly vendor settlement request' });
        alert('Payout request successfully created.');
        fetchFinanceData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error requesting payout');
    }
  };

  if (loading) {
    return <div className="loading">Loading financial ledger stats...</div>;
  }

  return (
    <div className="finance-page">
      <div className="page-header">
        <div>
          <h1>💰 Double-Entry Cashflow & Payout Ledger</h1>
          <p>Reconciliation checks, merchant settlement pathways, and ledger cashflows.</p>
        </div>
        <div className="actions-bar">
          <button className="btn btn-secondary" onClick={() => setShowBankModal(true)}>
            <FaUniversity style={{ marginRight: '8px' }} /> Update Bank Details
          </button>
          <button className="btn btn-primary" onClick={() => setShowPayoutModal(true)}>
            <FaArrowUp style={{ marginRight: '8px' }} /> Request Payout Settlement
          </button>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW CARDS */}
      <div className="finance-stats-grid">
        <div className="stat-card">
          <div className="card-icon wallet">
            <FaWallet />
          </div>
          <div className="card-info">
            <span className="label">Available Account Balance</span>
            <h2>₹{stats.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon credit">
            <FaArrowDown />
          </div>
          <div className="card-info">
            <span className="label">Total Lifetime Receipts (Credits)</span>
            <h2>₹{stats.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="card-icon debit">
            <FaArrowUp />
          </div>
          <div className="card-info">
            <span className="label">Total Payouts Settled (Debits)</span>
            <h2>₹{stats.totalPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {stats.pendingPayout > 0 && (
          <div className="stat-card">
            <div className="card-icon pending">
              <FaExchangeAlt />
            </div>
            <div className="card-info">
              <span className="label">Payout Settlements Processing</span>
              <h2>₹{stats.pendingPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID FOR LEDGER AND CREDENTIALS */}
      <div className="finance-grid-layout">
        
        {/* LEDGER TRANSACTIONS */}
        <div className="card ledger-card">
          <div className="card-header-flex">
            <h2><FaFileInvoiceDollar style={{ marginRight: '10px' }} /> Double-Entry Audit Ledger</h2>
            <button className="btn btn-sm btn-secondary" onClick={fetchFinanceData}>Refresh</button>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Transaction Reference</th>
                  <th>Source / Channel</th>
                  <th>Cashflow Action</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <tr key={tx._id}>
                      <td className="time-col">
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <strong>{tx.referenceId || tx._id.substring(0, 12)}</strong>
                        <span className="tx-reason">{tx.description || tx.reason}</span>
                      </td>
                      <td>
                        <span className="channel-lbl">{tx.paymentMethod || tx.channel || 'Internal Settlement'}</span>
                      </td>
                      <td>
                        <span className={`flow-badge ${isCredit ? 'credit' : 'debit'}`}>
                          {isCredit ? 'CREDIT' : 'DEBIT'}
                        </span>
                      </td>
                      <td className={`amount-col ${isCredit ? 'credit-text' : 'debit-text'}`}>
                        {isCredit ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-data">No account transactions registered in this ledger.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BENEFICIARY BANK DETAILS */}
        <div className="card credentials-card">
          <div className="card-header">
            <h2><FaCreditCard style={{ marginRight: '10px' }} /> Beneficiary Bank Credentials</h2>
          </div>
          
          <div className="card-body">
            {bankDetails.accountNumber ? (
              <div className="bank-details-list">
                <div className="bank-detail-item">
                  <span className="lbl">Beneficiary Name</span>
                  <span className="val">{bankDetails.accountHolderName}</span>
                </div>
                <div className="bank-detail-item">
                  <span className="lbl">Bank Name</span>
                  <span className="val">{bankDetails.bankName}</span>
                </div>
                <div className="bank-detail-item">
                  <span className="lbl">Account Number</span>
                  <span className="val">•••• •••• {bankDetails.accountNumber.slice(-4)}</span>
                </div>
                <div className="bank-detail-item">
                  <span className="lbl">IFSC Routing Code</span>
                  <span className="val">{bankDetails.ifscCode}</span>
                </div>
                <div className="bank-detail-item">
                  <span className="lbl">Branch Name</span>
                  <span className="val">{bankDetails.branchName || 'Main Branch'}</span>
                </div>
                <div className="verification-status">
                  <FaCheckCircle className="icon" />
                  <span>Verified Payout Route Active</span>
                </div>
              </div>
            ) : (
              <div className="empty-bank-details">
                <p>No verified bank credentials linked. Update details to configure settlement transfers.</p>
                <button className="btn btn-primary" onClick={() => setShowBankModal(true)}>
                  Configure Account
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL WINDOWS */}
      
      {/* 1. Update Bank Details Modal */}
      {showBankModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Configure Bank Beneficiary Credentials</h3>
              <button className="close-btn" onClick={() => setShowBankModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleUpdateBankDetails}>
              <div className="form-group">
                <label>Beneficiary Account Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  placeholder="e.g. Amrit Rasoi Private Limited"
                />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  placeholder="e.g. 50100293847561"
                />
              </div>
              <div className="form-group">
                <label>IFSC Code (11-Digit Code)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  placeholder="e.g. HDFC0000240"
                />
              </div>
              <div className="form-group">
                <label>Branch Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={bankDetails.branchName}
                  onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                  placeholder="e.g. Bandra East"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Confirm Credentials</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Request Payout Modal */}
      {showPayoutModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Initiate Payout Settlement</h3>
              <button className="close-btn" onClick={() => setShowPayoutModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleRequestPayout}>
              <div className="payout-balance-summary">
                <span>Maximum Settlement Limit</span>
                <h3>₹{stats.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
              </div>
              
              <div className="form-group">
                <label>Settlement Transfer Amount (INR)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="100"
                  max={stats.walletBalance}
                  className="form-control" 
                  required
                  value={payoutRequest.amount}
                  onChange={(e) => setPayoutRequest({ ...payoutRequest, amount: e.target.value })}
                  placeholder="₹ Min. 100.00"
                />
              </div>

              <div className="form-group">
                <label>Settlement Notes</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={payoutRequest.notes}
                  onChange={(e) => setPayoutRequest({ ...payoutRequest, notes: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">Dispatch Request</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;