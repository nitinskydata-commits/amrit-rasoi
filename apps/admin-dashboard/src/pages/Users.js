import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllUsers, deleteUser, secureRoleUpdate } from '../utils/api';
import { FaTrash, FaUserShield, FaShieldAlt, FaTimes } from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const activeSubTab = searchParams.get('group') || 'customers';
  const currentAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data.users || []);
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
      newRole: user.role || 'user'
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

  const handleDelete = async (user) => {
    const isExecutiveOrAdmin = ['admin', 'platform_admin', 'board_member', 'director'].includes(user.role);
    if (isExecutiveOrAdmin) {
      alert(`Security Protocol: Administrative and Executive Board accounts (${user.role}) cannot be deleted directly. You must first demote this user to a regular User role using "Adjust Role" (which requires Super-Admin Verification) before deletion is permitted.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      try {
        await deleteUser(user._id);
        alert('User deleted successfully');
        fetchUsers();
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  // Roles partition mapping
  const customersList = users.filter(u => !u.role || u.role === 'user' || u.role === 'customer');
  const boardList = users.filter(u => ['board_member', 'director', 'executive_board'].includes(u.role));
  const hrList = users.filter(u => ['hr', 'hr_manager', 'recruiter', 'hr_staff'].includes(u.role));
  const managersList = users.filter(u => ['regional_manager', 'inventory_manager', 'order_manager', 'marketing_manager', 'warehouse_manager', 'manager'].includes(u.role));
  const staffList = users.filter(u => ['warehouse_staff', 'delivery_agent', 'delivery_boy', 'staff', 'moderator', 'driver'].includes(u.role));
  const partnersList = users.filter(u => ['vendor_owner', 'partner_admin', 'seller', 'collaborator'].includes(u.role));
  const adminsList = users.filter(u => ['admin', 'platform_admin'].includes(u.role));

  const getFilteredUsers = () => {
    switch (activeSubTab) {
      case 'customers': return customersList;
      case 'board_members': return boardList;
      case 'hr_management': return hrList;
      case 'managers': return managersList;
      case 'staff': return staffList;
      case 'partners': return partnersList;
      case 'admins': return adminsList;
      default: return customersList;
    }
  };

  const getHeaderInfo = () => {
    switch (activeSubTab) {
      case 'customers': 
        return { title: 'Customers Directory', desc: 'Manage registered store customers and buyers.' };
      case 'board_members': 
        return { title: 'Board Members', desc: 'SBMI Executive Board and Directors.' };
      case 'hr_management': 
        return { title: 'HR Management', desc: 'Human Resources team, recruiters, and personnel staff.' };
      case 'managers': 
        return { title: 'All Managers', desc: 'Inventory, Order, Warehouse, Marketing, and Regional Managers.' };
      case 'staff': 
        return { title: 'Staff Directory', desc: 'Fulfillment operations, warehouse staff, delivery agents, and moderators.' };
      case 'partners': 
        return { title: 'Partners & Collaborators', desc: 'Authorized brand partners, vendors, and seller account owners.' };
      case 'admins': 
        return { title: 'Administrators Vault', desc: 'Super-admins and platform administrators.' };
      default: 
        return { title: 'Users Directory', desc: 'SBMI Platform Directory.' };
    }
  };

  const filteredUsers = getFilteredUsers();
  const headerInfo = getHeaderInfo();

  if (loading) return <div className="loading">Loading directory...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{headerInfo.title}</h1>
        <p>{headerInfo.desc}</p>
        {!currentAdmin?.isSuperAdmin && (
          <div className="alert alert-warning">
            Role modifications are restricted. Only the super-admin may adjust roles.
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
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${
                        user.role === 'admin' || user.role === 'platform_admin' ? 'badge-danger' : 
                        ['vendor_owner', 'partner_admin'].includes(user.role) ? 'badge-warning' : 'badge-info'
                      }`}>
                        {user.role || 'customer'}
                      </span>
                      {currentAdmin?.isSuperAdmin && (
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openSecureModal(user)}
                          title="Secure Role Management"
                          style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FaShieldAlt /> Adjust Role
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(user)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <p className="no-data" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            No accounts match this category directory.
          </p>
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
              Security verification is required.
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
                  <option value="user">User (Customer)</option>
                  <option value="board_member">Board Member</option>
                  <option value="director">Director</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="hr">HR Staff</option>
                  <option value="regional_manager">Regional Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="order_manager">Order Manager</option>
                  <option value="marketing_manager">Marketing Manager</option>
                  <option value="warehouse_manager">Warehouse Manager</option>
                  <option value="warehouse_staff">Warehouse Staff</option>
                  <option value="delivery_agent">Delivery Agent</option>
                  <option value="delivery_boy">Delivery Boy</option>
                  <option value="staff">General Staff</option>
                  <option value="moderator">Moderator</option>
                  <option value="vendor_owner">Partner / Vendor Owner</option>
                  <option value="partner_admin">Partner Admin</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1, padding: '12px' }}>
                  Authorize Role Override
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
