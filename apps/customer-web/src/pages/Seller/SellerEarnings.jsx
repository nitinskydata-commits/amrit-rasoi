import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { FaDollarSign, FaUniversity, FaHistory, FaCalendarCheck } from 'react-icons/fa';
import './SellerPages.css';

const SellerEarnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/seller/earnings`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="seller-loading">Calculating settlements ledger...</div>;
  }

  const { earnings = {}, payoutAccount = {}, payoutLedger = [] } = data || {};

  return (
    <div className="earnings-container">
      <div className="earnings-header">
        <h1>Settlement Ledger</h1>
        <p>Monitor completed order earnings, platform commissions, and payout schedules.</p>
      </div>

      {/* Summary Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gross"><FaDollarSign /></div>
          <div className="stat-info">
            <span>Gross Sales (Delivered)</span>
            <h2>${earnings.totalEarned?.toFixed(2) || '0.00'}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon commission"><FaDollarSign /></div>
          <div className="stat-info">
            <span>Marketplace Commission ({earnings.commissionRate || 10}%)</span>
            <h2>-${earnings.totalCommission?.toFixed(2) || '0.00'}</h2>
          </div>
        </div>

        <div className="stat-cardHighlight">
          <div className="stat-icon payout"><FaDollarSign /></div>
          <div className="stat-info">
            <span>Net Paid/Eligible Settlement</span>
            <h2>${earnings.totalPayout?.toFixed(2) || '0.00'}</h2>
            <small className="net-sub text-success">Transferred to Settlement Account</small>
          </div>
        </div>
      </div>

      <div className="earnings-grid-layout">
        {/* Settlement Ledger Table */}
        <div className="earnings-card-left">
          <div className="card-header">
            <h3><FaHistory /> Payout Ledger</h3>
            <span className="info-badge">Delivered Orders</span>
          </div>
          
          <div className="card-body">
            {payoutLedger.length > 0 ? (
              <div className="table-container inline-table">
                <table>
                  <thead>
                    <tr>
                      <th>Delivered Date</th>
                      <th>Order ID</th>
                      <th>Gross Price</th>
                      <th>Commission</th>
                      <th>Net Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutLedger.map((ledgerItem, index) => (
                      <tr key={index}>
                        <td>
                          <div className="delivered-date-cell">
                            <FaCalendarCheck />
                            <span>{new Date(ledgerItem.deliveredAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td><span className="order-link-ref">#{ledgerItem.orderId.substring(0, 14)}...</span></td>
                        <td>${ledgerItem.orderRevenue?.toFixed(2)}</td>
                        <td><span className="text-danger">-${ledgerItem.orderCommission?.toFixed(2)}</span></td>
                        <td><strong className="text-success">${ledgerItem.orderPayout?.toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No completed delivery transactions in ledger.</p>
            )}
          </div>
        </div>

        {/* Bank Details Panel */}
        <div className="earnings-card-right">
          <div className="card-header">
            <h3><FaUniversity /> Payout Account</h3>
          </div>
          <div className="card-body">
            {payoutAccount.bankName ? (
              <div className="bank-profile-box">
                <div className="bank-profile-row">
                  <span>Bank Name:</span>
                  <strong>{payoutAccount.bankName}</strong>
                </div>
                <div className="bank-profile-row">
                  <span>Account Number:</span>
                  <span>{payoutAccount.accountNumber}</span>
                </div>
                <div className="bank-profile-row">
                  <span>IFSC Code:</span>
                  <span>{payoutAccount.ifscCode}</span>
                </div>
                <div className="bank-profile-row">
                  <span>Holder Name:</span>
                  <span>{payoutAccount.accountHolderName}</span>
                </div>
                {payoutAccount.upiId && (
                  <div className="bank-profile-row">
                    <span>UPI ID:</span>
                    <span>{payoutAccount.upiId}</span>
                  </div>
                )}
                <div className="settlement-frequency-alert">
                  <p>Settlements are executed weekly on Wednesday direct to this bank file.</p>
                </div>
              </div>
            ) : (
              <div className="no-bank-alert">
                <p>⚠️ No bank details found. Please update settlement settings in your Shop Profile to enable order payouts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerEarnings;
