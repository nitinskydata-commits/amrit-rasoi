import React, { useState } from 'react';
import { loginAdmin } from '../utils/api';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginAdmin({ email, password });
      
      const allowedRoles = [
            'admin', 'platform_admin', 'staff', 'partner_admin',
            'vendor_owner', 'vendor_staff', 'inventory_manager',
            'order_manager', 'warehouse_manager', 'warehouse_staff',
            'delivery_agent', 'delivery_boy', 'finance_staff',
            'support_staff', 'marketing_manager', 'moderator',
            'regional_manager', 'franchise_manager', 'branch_manager'
          ];
      if (response.data.success && allowedRoles.includes(response.data.user.role)) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        onLogin();
      } else {
        setError('Access denied. Admin or staff privileges required.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (!err.response) {
        setError('Server unreachable. Please ensure the backend is running on port 5002.');
      } else if (err.response.status === 503) {
        setError('Database connection error. The server is up but cannot reach MongoDB.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>SBMI Admin</h1>
          <p>Sign in to manage your store</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@sbmi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 SBMI - Amrit Rasoi. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
