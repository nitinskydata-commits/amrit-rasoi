import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, secureRoleUpdate } from '../utils/api';
import { FaTrash, FaUserShield, FaShieldAlt, FaTimes } from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showSecureModal, setShowSecureModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [securityData, setSecurityData] = useState({
    adminPassword: '',
    targetPhone: '',
    newRole: 'user'
  });

  const openSecureModal = (user) => {
    setTargetUser(user);
    setSecurityData({
      adminPassword: '',
      targetPhone: '',
      newRole: user.role === 'admin' ? 'user' : 'admin'
    });
    setShowSecureModal(true);
  };

  const handleSecureRoleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await secureRoleUpdate(targetUser._id, securityData);
      alert(response.data.message);
      setShowSecureModal(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Security Verification Failed. Action blocked.');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        alert('User deleted successfully');
        fetchUsers();
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Users Management</h1>
        <p>Dedicated user management hub. Only the super-admin can promote regular users to admin.</p>
        {!currentAdmin?.isSuperAdmin && (
          <div className="alert alert-warning">
            Role changes are hidden for this admin account. Only the dedicated super-admin may make users admin.
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                        {user.role}
                      </span>
                      {currentAdmin?.isSuperAdmin && (
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openSecureModal(user)}
                          title="Secure Role Management"
                          style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FaShieldAlt /> Secure Manage
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(user._id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <p className="no-data">No users found</p>
        )}
      </div>

      {/* 🔐 SECURE ROLE MANAGEMENT MODAL */}
      {showSecureModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '15px',
            width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            borderTop: '5px solid #dc3545'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#dc3545', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUserShield /> Secure Role Vault
              </h3>
              <button onClick={() => setShowSecureModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                <FaTimes />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              You are performing a <strong>Critical Action</strong> on <strong>{targetUser?.email}</strong>. 
              Multiple security verifications are required.
            </p>

            <form onSubmit={handleSecureRoleUpdate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  STEP 1: RE-VERIFY ADMIN PASSWORD
                </label>
                <input 
                  type="password" 
                  className="form-control"
                  placeholder="Enter your login password"
                  value={securityData.adminPassword}
                  onChange={(e) => setSecurityData({...securityData, adminPassword: e.target.value})}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  STEP 2: CONFIRM TARGET PHONE NUMBER
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Enter target user's registered phone"
                  value={securityData.targetPhone}
                  onChange={(e) => setSecurityData({...securityData, targetPhone: e.target.value})}
                  required
                />
                <small style={{ color: '#888' }}>Must match the phone number listed in the table.</small>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  STEP 3: SELECT NEW ROLE
                </label>
                <select 
                  className="form-control"
                  value={securityData.newRole}
                  onChange={(e) => setSecurityData({...securityData, newRole: e.target.value})}
                  required
                >
                  <option value="user">User (Demote to Regular User)</option>
                  <option value="admin">Admin (Promote to Partner Status)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1, padding: '12px' }}>
                  Authorize Critical Change
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSecureModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
