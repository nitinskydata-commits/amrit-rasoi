import React, { useState, useEffect } from 'react';
import { 
  FaTerminal, 
  FaUserShield, 
  FaClipboardList, 
  FaUsers, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaShieldAlt,
  FaLock,
  FaSignOutAlt
} from 'react-icons/fa';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000/api/v1';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('opsToken') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('opsUser') || 'null');
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    if (token) {
      fetchAuditLogs();
      fetchStaff();
      fetchUsers();
    }
  }, [token]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/audit-logs`, getAuthHeaders());
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/staff`, getAuthHeaders());
      setStaff(res.data.staff || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/users`, getAuthHeaders());
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
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
        const allowedRoles = ['admin', 'platform_admin', 'staff', 'moderator'];
        if (!allowedRoles.includes(res.data.user.role)) {
          setAuthError('Unauthorized: Only internal operations staff and administrators can access this panel.');
          return;
        }
        localStorage.setItem('opsToken', res.data.token);
        localStorage.setItem('opsUser', JSON.stringify(res.data.user));
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
    localStorage.removeItem('opsToken');
    localStorage.removeItem('opsUser');
    setToken('');
    setUser(null);
  };

  const handleUpdateRole = async (userId, newRole) => {
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.put(`${API_BASE}/admin/user/${userId}`, { role: newRole }, getAuthHeaders());
      setMessage({ type: 'success', text: 'User security level updated successfully.' });
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update user security level' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render Login overlay if not authenticated
  if (!token || !user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <FaTerminal className="logo-icon" />
            <h2>SBMI Ops Terminal</h2>
            <p>Enter credentials to access Compliance & Operations panel</p>
          </div>
          
          {authError && (
            <div className="login-error">
              <FaExclamationTriangle />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Staff Email Address</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
                placeholder="ops@sbmi.com"
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
    <div className="ops-panel">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-logo">
          <FaTerminal className="logo-icon" />
          <div>
            <h2>SBMI</h2>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Ops Terminal</span>
          </div>
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FaClipboardList /> Compliance Audit
          </button>
          <button 
            className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <FaUserShield /> Staff Sub-Admins
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> User Security Scope
          </button>
        </nav>

        {/* User status and signout */}
        <div className="staff-profile">
          <div className="staff-info">
            <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <div className="details">
              <span className="name">{user.name}</span>
              <span className="role">{user.role?.toUpperCase()}</span>
            </div>
          </div>
          <button type="button" className="btn-signout" onClick={handleLogout}>
            <FaSignOutAlt style={{ marginRight: '6px' }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main panel body */}
      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>Internal Ops Compliance Panel</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>SBMI Global Operations & Security Command</p>
          </div>
          <div className="status-badge">Operator Scopes Active</div>
        </header>

        {message.text && (
          <div className={`alert-box alert-${message.type}`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab display */}
        {activeTab === 'audit' && (
          <div className="tab-pane fade-in">
            <div className="card full-width-card">
              <div className="card-header-flex">
                <h2>Compliance Audit Logging</h2>
                <div className="search-box">
                  <input 
                    type="text" 
                    placeholder="Filter logs..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="loading-center">
                  <FaSpinner className="spin" />
                  <p>Streaming security feed...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Time Logged</th>
                        <th>User Ref ID</th>
                        <th>Action Logged</th>
                        <th>IP Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map(log => (
                        <tr key={log._id}>
                          <td>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                          <td><code>{log.userId || 'SYSTEM'}</code></td>
                          <td><strong>{log.action}</strong></td>
                          <td><code>{log.ipAddress || '127.0.0.1'}</code></td>
                          <td>
                            <span className="badge badge-success">Audit Verified</span>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center">No compliance actions logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="tab-pane fade-in">
            <div className="card full-width-card">
              <h2>Active Staff & Delegated Sub-Admins</h2>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Email ID</th>
                      <th>Phone Line</th>
                      <th>System Role</th>
                      <th>Catalog Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(member => (
                      <tr key={member._id}>
                        <td><strong>{member.name}</strong></td>
                        <td>{member.email}</td>
                        <td>{member.phone || '—'}</td>
                        <td>
                          <span className={`badge badge-info`}>
                            {member.role}
                          </span>
                        </td>
                        <td>
                          {member.collaboration ? 'Brand Whitelist' : 'Global Workspace'}
                        </td>
                      </tr>
                    ))}
                    {staff.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center">No active sub-admin staff.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-pane fade-in">
            <div className="card full-width-card">
              <h2>User Security Scope Overrides</h2>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>User ID</th>
                      <th>Role Scope</th>
                      <th>Update Permission Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td><strong>{user.name || 'Anonymous User'}</strong></td>
                        <td><code>{user._id}</code></td>
                        <td>
                          <span className={`role-text ${user.role === 'admin' ? 'role-admin' : 'role-customer'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                            disabled={actionLoading}
                            className="role-selector"
                          >
                            <option value="customer">Customer Access</option>
                            <option value="admin">Administrator Access</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center">No registered user entries found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
