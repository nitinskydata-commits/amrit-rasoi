import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../utils/api';
import { FaEnvelope, FaLock, FaStore } from 'react-icons/fa';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await login({ email, password });
      const { token, user } = response.data;

      // Access verification: check if this is a seller user
      if (user.role !== 'vendor_owner') {
        setErrorMsg('Access Denied: This credentials set is not linked to a seller account.');
        setLoading(false);
        return;
      }

      // Store credentials & context
      localStorage.setItem('sellerToken', token);
      localStorage.setItem('sellerUser', JSON.stringify(user));
      localStorage.setItem('sellerShopName', user.sellerProfile?.shopName || 'Store');
      localStorage.setItem('sellerStatus', user.sellerStatus);

      // Invoke state parent callbacks
      onLogin(user);

      // Branch redirect routes depending on authorization state
      if (user.sellerStatus === 'approved') {
        navigate('/dashboard');
      } else {
        navigate('/pending-approval');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <FaStore />
          </div>
          <h1>Seller Portal</h1>
          <p>Sign in to manage your marketplace store.</p>
        </div>

        {errorMsg && <div className="auth-alert-danger">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <FaEnvelope />
              <input 
                type="email" 
                required 
                placeholder="vendor@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <FaLock />
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="auth-footer-links">
          <span>New to SBMI Marketplace?</span>
          <Link to="/register" className="auth-link">Apply for Seller Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
