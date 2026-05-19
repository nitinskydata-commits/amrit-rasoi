import React, { useState, useEffect } from 'react';
import { 
  FaShippingFast, 
  FaUserCheck, 
  FaPhoneAlt, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaSpinner, 
  FaExclamationTriangle,
  FaKey,
  FaLock,
  FaSignOutAlt
} from 'react-icons/fa';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000/api/v1';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('deliveryToken') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('deliveryUser') || 'null');
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showOtpModal, setShowOtpModal] = useState(false);

  const getAuthHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    if (token) {
      fetchPendingOrders();
    }
  }, [token]);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/orders`, getAuthHeaders());
      // Filter orders that need delivery
      const activeDeliveries = res.data.orders?.filter(o => 
        o.status === 'processing' || o.status === 'out_for_delivery' || o.status === 'pending'
      ) || [];
      setOrders(activeDeliveries);
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
    } finally {
      setLoading(false);
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
        const allowedRoles = ['admin', 'platform_admin', 'delivery_agent', 'delivery_boy'];
        if (!allowedRoles.includes(res.data.user.role)) {
          setAuthError('Unauthorized access level: Only assigned delivery agents can log in.');
          return;
        }
        localStorage.setItem('deliveryToken', res.data.token);
        localStorage.setItem('deliveryUser', JSON.stringify(res.data.user));
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
    localStorage.removeItem('deliveryToken');
    localStorage.removeItem('deliveryUser');
    setToken('');
    setUser(null);
  };

  const handleSendOtp = async (orderId) => {
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/admin/order/${orderId}/send-delivery-otp`, {}, getAuthHeaders());
      setMessage({ type: 'success', text: 'Verification OTP sent to customer successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to dispatch OTP' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenOtpModal = (order) => {
    setSelectedOrder(order);
    setOtp('');
    setShowOtpModal(true);
    // Auto-send OTP on opening
    handleSendOtp(order._id);
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/admin/order/${selectedOrder._id}/verify-delivery`, { otp }, getAuthHeaders());
      setMessage({ type: 'success', text: `Order #${selectedOrder._id.slice(-6)} verified and delivered successfully!` });
      setShowOtpModal(false);
      setSelectedOrder(null);
      fetchPendingOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid or incorrect OTP' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="delivery-app-container">
      {/* Smartphone frame container */}
      <div className="phone-frame">
        <div className="phone-screen">
          
          {/* Header */}
          <header className="app-header">
            <div className="logo-section">
              <FaShippingFast className="logo-icon" />
              <div>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 800 }}>SBMI</span>
                <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: 600 }}>Fulfillment Express</span>
              </div>
            </div>
            {user && <div className="agent-badge">{user.role?.replace('_', ' ').toUpperCase()}</div>}
          </header>

          {message.text && (
            <div className={`alert-box alert-${message.type}`}>
              {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Conditional rendering: Login screen or Deliveries view */}
          {!token || !user ? (
            <div className="phone-login-screen fade-in">
              <FaShippingFast className="logo-icon" />
              <h2>SBMI Fulfillment</h2>
              <p>Sign in to see assigned routes & deliver shipments</p>
              
              {authError && (
                <div className="login-error">
                  <FaExclamationTriangle />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="login-form-group">
                  <label>Agent Email Address</label>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="agent@sbmi.com"
                    required
                  />
                </div>
                <div className="login-form-group">
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
                <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
                  {loading ? <FaSpinner className="spin" /> : <><FaLock /> Open Terminal</>}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Pending deliveries list */}
              <main className="deliveries-content">
                <h2 className="section-title">My Deliveries ({orders.length})</h2>
                
                {loading ? (
                  <div className="spinner-container">
                    <FaSpinner className="spin" />
                    <p>Retrieving assigned route...</p>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="order-list">
                    {orders.map(order => (
                      <div key={order._id} className="order-card">
                        <div className="order-header">
                          <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                          <span className={`status-badge status-${order.status}`}>{order.status}</span>
                        </div>

                        <div className="cust-info">
                          <div className="cust-row">
                            <FaUserCheck />
                            <span>{order.shippingAddress?.fullName || 'Customer'}</span>
                          </div>
                          <div className="cust-row">
                            <FaPhoneAlt />
                            <span>{order.shippingAddress?.phone || 'No phone registered'}</span>
                          </div>
                          <div className="cust-row">
                            <FaMapMarkerAlt />
                            <span className="address-text">
                              {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}
                            </span>
                          </div>
                        </div>

                        <div className="price-tag">
                          Cash to Collect: <strong>₹{order.totalPrice}</strong>
                        </div>

                        <div className="actions">
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleOpenOtpModal(order)}
                          >
                            Verify & Complete Delivery
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-placeholder">
                    <FaCheckCircle className="done-icon" />
                    <h3>All Deliveries Completed!</h3>
                    <p>No pending shipments assigned to your agent profile.</p>
                  </div>
                )}
              </main>

              {/* Agent details and logout in footer */}
              <div className="phone-agent-profile">
                <div className="agent-info">
                  <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
                  <span className="name">{user.name}</span>
                </div>
                <button type="button" className="btn-signout-phone" onClick={handleLogout} title="Sign Out">
                  <FaSignOutAlt />
                </button>
              </div>
            </>
          )}

          {/* Verification OTP Handshake modal */}
          {showOtpModal && selectedOrder && (
            <div className="modal-overlay">
              <div className="modal-content fade-in">
                <h3>
                  <FaKey /> Verify OTP Handshake
                </h3>
                <p className="modal-desc">
                  Enter the 4-digit code dispatched to the registered mobile line of{' '}
                  <strong>{selectedOrder.shippingAddress?.fullName}</strong>.
                </p>

                <form onSubmit={handleVerifyOtpSubmit}>
                  <div className="otp-input-group">
                    <input 
                      type="text" 
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 1234"
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="submit" className="btn btn-success" disabled={actionLoading}>
                      {actionLoading ? <FaSpinner className="spin" /> : 'Confirm Handshake'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowOtpModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
