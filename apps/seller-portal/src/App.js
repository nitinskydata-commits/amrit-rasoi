import React, { useState, useEffect } from 'react';
import { 
  FaStore, 
  FaMoneyBillWave, 
  FaHistory, 
  FaUser, 
  FaPlusCircle, 
  FaArrowUp, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUniversity,
  FaSpinner,
  FaLock,
  FaSignOutAlt
} from 'react-icons/fa';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000/api/v1';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('sellerToken') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sellerUser') || 'null');
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState({
    totalEarnings: 84320,
    pendingPayout: 12400,
    activeProducts: 0,
    completedOrders: 154
  });

  const [bankDetails, setBankDetails] = useState({
    beneficiaryName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payouts, setPayouts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getAuthHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    if (token) {
      fetchPayouts();
      fetchProducts();
    }
  }, [token]);

  const fetchPayouts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/finance/payouts`, getAuthHeaders());
      setPayouts(res.data.payouts || res.data.data || []);
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/products`, getAuthHeaders());
      setProducts(res.data.products || []);
      setMetrics(prev => ({
        ...prev,
        activeProducts: res.data.products?.length || 0
      }));
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        email: loginEmail,
        password: loginPassword
      });
      if (res.data.success) {
        const allowedRoles = ['admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'finance_staff'];
        if (!allowedRoles.includes(res.data.user.role)) {
          setAuthError('Unauthorized: Only authorized sellers and finance administrators can access this portal.');
          return;
        }
        localStorage.setItem('sellerToken', res.data.token);
        localStorage.setItem('sellerUser', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    setToken('');
    setUser(null);
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put(`${API_BASE}/finance/bank-details`, bankDetails, getAuthHeaders());
      setMessage({ type: 'success', text: 'Bank details updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update bank details' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/finance/payouts/request`, {
        amount: Number(payoutAmount),
        bankDetails
      }, getAuthHeaders());
      setMessage({ type: 'success', text: `Payout request for ₹${payoutAmount} submitted successfully!` });
      setPayoutAmount('');
      fetchPayouts();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Payout request failed' });
    } finally {
      setLoading(false);
    }
  };

  // Render Login screen if not authenticated
  if (!token || !user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <FaStore className="logo-icon" />
            <h2>SBMI Seller Hub</h2>
            <p>Enter credentials to access Merchant Control Portal</p>
          </div>
          
          {authError && (
            <div className="login-error">
              <FaExclamationTriangle />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Merchant Email Address</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
                placeholder="seller@sbmi.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Security Password</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
            </div>
            <div className="sandbox-hint" style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '10px 0', textAlign: 'center' }}>
              💡 Admin Credentials: <strong>admin@sbmi.com</strong> / <strong>admin123</strong>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? <FaSpinner className="spin" /> : <><FaLock style={{ marginRight: '8px' }} /> Verify Identity</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-portal">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-logo">
          <FaStore className="logo-icon" />
          <div>
            <h2>SBMI</h2>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Seller Hub</span>
          </div>
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaStore /> Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('payouts')}
          >
            <FaMoneyBillWave /> Payouts & Settlements
          </button>
          <button 
            className={`nav-item ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            <FaUniversity /> Bank Settings
          </button>
        </nav>
        
        {/* User status and signout */}
        <div className="staff-profile">
          <div className="staff-info">
            <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <div className="details">
              <span className="name">{user.name}</span>
              <span className="role">{user.role?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
          <button type="button" className="btn-signout" onClick={handleLogout}>
            <FaSignOutAlt style={{ marginRight: '6px' }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>Vendor Control Portal</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Amrit Rasoi Brand Partner Platform</p>
          </div>
          <div className="status-badge">Connected to Core API</div>
        </header>

        {message.text && (
          <div className={`alert-box alert-${message.type}`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="tab-pane fade-in">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Earnings</h3>
                <div className="value">₹{metrics.totalEarnings.toLocaleString('en-IN')}</div>
                <span className="subtitle">Cleared and settled</span>
              </div>
              <div className="stat-card">
                <h3>Pending Payout</h3>
                <div className="value warning">₹{metrics.pendingPayout.toLocaleString('en-IN')}</div>
                <span className="subtitle">Locked in transit</span>
              </div>
              <div className="stat-card">
                <h3>Active Products</h3>
                <div className="value info">{metrics.activeProducts}</div>
                <span className="subtitle">Published catalog items</span>
              </div>
              <div className="stat-card">
                <h3>Completed Orders</h3>
                <div className="value success">{metrics.completedOrders}</div>
                <span className="subtitle">All-time fulfillment</span>
              </div>
            </div>

            {/* Product Directory Summary */}
            <div className="card product-card-section">
              <div className="card-header">
                <h2>Active Listings ({products.length})</h2>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Inventory</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map(prod => (
                      <tr key={prod._id}>
                        <td><strong>{prod.name}</strong></td>
                        <td>{prod.category || 'General'}</td>
                        <td>₹{prod.price}</td>
                        <td>{prod.stock || 0} left</td>
                        <td><span className="badge badge-success">Live</span></td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center">No products found. Start publishing!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="tab-pane fade-in">
            <div className="payout-container">
              {/* Request Payout Form */}
              <div className="card payout-request-card">
                <h2>Request Settlement Payout</h2>
                <p>Transfer accumulated earnings to your linked bank account securely.</p>
                <form onSubmit={handlePayoutRequest}>
                  <div className="form-group">
                    <label>Withdrawal Amount (INR)</label>
                    <input 
                      type="number" 
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      min="100"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <FaSpinner className="spin" /> : <FaArrowUp />} Request Transfer
                  </button>
                </form>
              </div>

              {/* Payout History Ledger */}
              <div className="card payout-history-card">
                <h2><FaHistory /> Payout History Ledger</h2>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date Requested</th>
                        <th>Transaction Reference</th>
                        <th>Settled Bank Account</th>
                        <th>Amount</th>
                        <th>Verification Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map(pay => (
                        <tr key={pay._id}>
                          <td>{new Date(pay.createdAt).toLocaleDateString('en-IN')}</td>
                          <td><code>{pay._id}</code></td>
                          <td>{pay.bankDetails?.bankName || 'Linked Bank'} - {pay.bankDetails?.accountNumber?.slice(-4) || 'XXXX'}</td>
                          <td className="amount-cell">₹{pay.amount}</td>
                          <td>
                            <span className={`badge badge-${pay.status === 'processed' ? 'success' : 'warning'}`}>
                              {pay.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {payouts.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center">No payout history logged yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="tab-pane fade-in">
            <div className="card bank-settings-card">
              <h2><FaUniversity /> Settlement Bank Details Configuration</h2>
              <p>Ensure these details match your commercial registration to prevent settlement rejection.</p>
              
              <form onSubmit={handleBankSubmit} className="bank-form">
                <div className="form-group">
                  <label>Beneficiary / Company Name</label>
                  <input 
                    type="text"
                    value={bankDetails.beneficiaryName}
                    onChange={(e) => setBankDetails({...bankDetails, beneficiaryName: e.target.value})}
                    placeholder="Enter registered entity name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input 
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    placeholder="e.g. State Bank of India"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input 
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    placeholder="Enter full bank account number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input 
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                    placeholder="e.g. SBIN0001234"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <FaSpinner className="spin" /> : 'Register Beneficiary Details'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
