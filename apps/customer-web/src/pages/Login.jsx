import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, sendOTP, verifyOTP } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error, otpSent } = useSelector(state => state.auth);

  const [authMode, setAuthMode] = useState('login');
  const [loginMethod, setLoginMethod] = useState('email');

  // Email Login
  const [emailLoginData, setEmailLoginData] = useState({
    email: '',
    password: ''
  });

  // Register
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // OTP Login
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Show error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Email Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(emailLoginData)).unwrap();
      toast.success('Login successful!');
    } catch (err) {
      toast.error(err || 'Login failed');
    }
  };

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (registerData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      await dispatch(register(registerData)).unwrap();
      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err || 'Registration failed');
    }
  };

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const result = await dispatch(sendOTP(phone)).unwrap();
      toast.success('OTP sent successfully!');
      setCountdown(60);
      
      // Show OTP in development
      if (result.otp) {
        toast.info(`Your OTP: ${result.otp}`, { autoClose: 15000 });
        console.log(`📱 OTP: ${result.otp}`);
      }
    } catch (err) {
      toast.error(err || 'Failed to send OTP');
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await dispatch(verifyOTP({ phone, otp })).unwrap();
      toast.success('Login successful!');
    } catch (err) {
      toast.error(err || 'Invalid OTP');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/logo.png" alt="SBMI" className="login-logo" />
            <h2>Welcome to SBMI</h2>
            <p>SBMI Platform - Authentic Indian Spices</p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="auth-mode-toggle">
            <button
              className={`mode-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setPhone('');
                setOtp('');
              }}
            >
              Login
            </button>
            <button
              className={`mode-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          {/* LOGIN MODE */}
          {authMode === 'login' && (
            <>
              <div className="auth-mode-toggle" style={{ marginBottom: '20px' }}>
                <button
                  className={`mode-btn ${loginMethod === 'email' ? 'active' : ''}`}
                  onClick={() => {
                    setLoginMethod('email');
                    setPhone('');
                    setOtp('');
                  }}
                >
                  📧 Email
                </button>
                <button
                  className={`mode-btn ${loginMethod === 'otp' ? 'active' : ''}`}
                  onClick={() => {
                    setLoginMethod('otp');
                    setPhone('');
                    setOtp('');
                  }}
                >
                  📱 OTP
                </button>
              </div>

              {loginMethod === 'email' ? (
                <form onSubmit={handleEmailLogin} className="login-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={emailLoginData.email}
                      onChange={(e) => setEmailLoginData({ ...emailLoginData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={emailLoginData.password}
                      onChange={(e) => setEmailLoginData({ ...emailLoginData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sandbox-hint" style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px', textAlign: 'center' }}>
                    💡 Sandbox Access: <strong>admin@sbmi.com</strong> / <strong>admin123</strong>
                  </div>

                  <div className="seller-callout" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', fontSize: '13px' }}>
                    🏪 <strong>Are you a merchant?</strong> <Link to="/seller/dashboard" style={{ color: '#15803d', fontWeight: 'bold', textDecoration: 'underline' }}>Sign In to Seller Dashboard</Link> or <Link to="/seller/apply" style={{ color: '#15803d', fontWeight: 'bold', textDecoration: 'underline' }}>Apply Here &rarr;</Link>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              ) : (
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="login-form">
                      <div className="form-group">
                        <label>Mobile Number</label>
                        <div className="phone-input">
                          <span className="country-code">+91</span>
                          <input
                            type="tel"
                            placeholder="Enter 10-digit mobile"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            maxLength="10"
                            required
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="login-form">
                      <div className="form-group">
                        <label>Enter OTP</label>
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength="6"
                          style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                          required
                        />
                        <small>OTP sent to +91 {phone}</small>
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify & Login'}
                      </button>

                      <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        {countdown > 0 ? (
                          <p style={{ color: '#666' }}>Resend in {countdown}s</p>
                        ) : (
                          <button
                            type="button"
                            className="resend-btn"
                            onClick={() => {
                              setPhone('');
                              setOtp('');
                            }}
                          >
                            Change Number / Resend OTP
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {/* REGISTER MODE */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <div className="phone-input">
                  <span className="country-code">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ 
                      ...registerData, 
                      phone: e.target.value.replace(/\D/g, '').slice(0, 10) 
                    })}
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Create password (min 6 characters)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="seller-callout" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}>
                🏢 <strong>Want to sell on SBMI?</strong> Apply for a merchant partner account. <Link to="/seller/apply" style={{ color: '#15803d', fontWeight: 'bold', textDecoration: 'underline' }}>Create Seller Account &rarr;</Link>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Partner & Administration Gateways */}
          <div className="partner-gateways">
            <h4>SBMI Operations & Partner Gateways</h4>
            <div className="gateway-links">
              <Link to="/seller/dashboard" className="gateway-btn">
                🏪 Seller Hub
              </Link>
              <a href="http://localhost:3003" target="_blank" rel="noopener noreferrer" className="gateway-btn">
                📦 Warehouse Terminal
              </a>
              <a href="http://localhost:3006" target="_blank" rel="noopener noreferrer" className="gateway-btn">
                🛡️ Ops Compliance
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
