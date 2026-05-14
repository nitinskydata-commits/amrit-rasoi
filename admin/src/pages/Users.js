import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../utils/api';
import { FaTrash, FaUserShield } from 'react-icons/fa';

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

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      alert('User role updated successfully');
      fetchUsers();
    } catch (error) {
      alert('Error updating user role');
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
                    {currentAdmin?.isSuperAdmin ? (
                      <select
                        className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                        {user.role}
                      </span>
                    )}
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
    </div>
  );
};

export default Users;
