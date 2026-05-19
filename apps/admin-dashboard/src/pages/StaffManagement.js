import React, { useState, useEffect } from 'react';
import { 
  getAllStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  getActiveCollaborations 
} from '../utils/api';
import { 
  FaUserShield, 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes, 
  FaCheck, 
  FaTimesCircle, 
  FaKey, 
  FaBuilding 
} from 'react-icons/fa';
import './StaffManagement.css';

const ROLE_DEFAULT_PERMISSIONS = {
  admin: {
    manageProducts: true,
    manageOrders: true,
    manageReviews: true,
    manageNewsletters: true,
    manageInventory: true
  },
  inventory_manager: {
    manageProducts: true,
    manageInventory: true,
    manageOrders: false,
    manageReviews: false,
    manageNewsletters: false
  },
  order_manager: {
    manageProducts: false,
    manageInventory: true,
    manageOrders: true,
    manageReviews: false,
    manageNewsletters: false
  },
  marketing_manager: {
    manageProducts: false,
    manageInventory: false,
    manageOrders: false,
    manageReviews: false,
    manageNewsletters: true
  },
  moderator: {
    manageProducts: false,
    manageInventory: false,
    manageOrders: false,
    manageReviews: true,
    manageNewsletters: false
  },
  partner_admin: {
    manageProducts: true,
    manageReviews: true,
    manageInventory: true,
    manageOrders: false,
    manageNewsletters: false
  },
  staff: {
    manageProducts: false,
    manageOrders: false,
    manageReviews: false,
    manageNewsletters: false,
    manageInventory: false
  }
};

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    permissions: {
      manageProducts: false,
      manageOrders: false,
      manageReviews: false,
      manageNewsletters: false,
      manageInventory: false
    },
    collaborationId: ''
  });

  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStaffData();
    fetchCollaborations();
  }, []);

  const fetchStaffData = async () => {
    try {
      const response = await getAllStaff();
      setStaffList(response.data.staff);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborations = async () => {
    try {
      const response = await getActiveCollaborations();
      setCollaborations(response.data.collaborations || []);
    } catch (error) {
      console.error('Error fetching active collaborations:', error);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedStaffId(null);
    setFormError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'staff',
      permissions: {
        manageProducts: false,
        manageOrders: false,
        manageReviews: false,
        manageNewsletters: false,
        manageInventory: false
      },
      collaborationId: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setIsEditMode(true);
    setSelectedStaffId(staff._id);
    setFormError('');
    setFormData({
      name: staff.name,
      email: staff.email || '',
      phone: staff.phone || '',
      password: '', // blank by default (only updated if filled)
      role: staff.role,
      permissions: staff.permissions || {
        manageProducts: false,
        manageOrders: false,
        manageReviews: false,
        manageNewsletters: false,
        manageInventory: false
      },
      collaborationId: staff.collaboration?._id || staff.collaboration || ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      const defaultPerms = ROLE_DEFAULT_PERMISSIONS[value] || ROLE_DEFAULT_PERMISSIONS.staff;
      setFormData({ 
        ...formData, 
        role: value,
        permissions: { ...defaultPerms }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePermissionToggle = (permissionName) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permissionName]: !formData.permissions[permissionName]
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    try {
      if (isEditMode) {
        await updateStaff(selectedStaffId, formData);
      } else {
        if (!formData.password || formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        await createStaff(formData);
      }
      setShowModal(false);
      fetchStaffData();
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (window.confirm(`Are you absolutely sure you want to revoke access and delete ${name}?`)) {
      try {
        await deleteStaff(staffId);
        fetchStaffData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting staff account');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Staff & Collaborators...</p>
      </div>
    );
  }

  return (
    <div className="staff-management-page">
      <div className="page-header">
        <div>
          <h1>Staff & Collaboration Partners</h1>
          <p>Configure team members, dynamic module permission flags, and whitelist collaborative brand panels.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <FaUserPlus style={{ marginRight: '8px' }} /> Add Staff / Partner
        </button>
      </div>

      <div className="card staff-table-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Contact Details</th>
                <th>User Role</th>
                <th>Linked Collaboration</th>
                <th>Permitted Modules</th>
                <th>Joined On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff._id}>
                  <td>
                    <div className="staff-identity">
                      <div className="staff-avatar">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{staff.name}</strong>
                        {staff.isSuperAdmin && <span className="super-admin-tag">Owner</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="staff-contact">
                      <div className="contact-email">{staff.email}</div>
                      <div className="contact-phone">{staff.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${staff.role}`}>
                      {staff.role === 'partner_admin' ? 'Collaboration Partner' : staff.role}
                    </span>
                  </td>
                  <td>
                    {staff.role === 'partner_admin' && staff.collaboration ? (
                      <span className="partner-company">
                        <FaBuilding style={{ marginRight: '6px' }} />
                        {staff.collaboration.partnerName || 'Associated Brand'}
                      </span>
                    ) : (
                      <span className="text-muted">— Global Access</span>
                    )}
                  </td>
                  <td>
                    <div className="permissions-matrix">
                      {staff.isSuperAdmin || staff.role === 'admin' ? (
                        <span className="permission-tag full-access">
                          <FaCheck style={{ marginRight: '4px' }} /> Unlimited Access
                        </span>
                      ) : (
                        Object.keys(staff.permissions || {}).map((perm) => {
                          const hasPerm = staff.permissions[perm];
                          const label = perm.replace('manage', '');
                          if (!hasPerm) return null;
                          return (
                            <span key={perm} className="permission-tag allowed">
                              {label}
                            </span>
                          );
                        })
                      )}
                      {!staff.isSuperAdmin && staff.role !== 'admin' && Object.values(staff.permissions || {}).every(v => !v) && (
                        <span className="permission-tag restricted">
                          <FaTimesCircle style={{ marginRight: '4px' }} /> No Modules
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{new Date(staff.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td>
                    <div className="action-buttons-group">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleOpenEditModal(staff)}
                        disabled={staff.isSuperAdmin}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteStaff(staff._id, staff.name)}
                        disabled={staff.isSuperAdmin}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛡️ MODAL FOR CREATION / EDITING */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                <FaUserShield style={{ marginRight: '8px', color: '#1a5276' }} />
                {isEditMode ? 'Edit Permissions & Details' : 'Invite Staff & Partners'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && <div className="alert alert-error">{formError}</div>}

              <div className="form-row">
                <div className="form-group col-6">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group col-6">
                  <label>Role / Portal Level</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="staff">Staff Sub-Admin (Custom)</option>
                    <option value="inventory_manager">Inventory & Products Manager</option>
                    <option value="order_manager">Orders Desk Manager</option>
                    <option value="marketing_manager">Marketing & Campaigns Manager</option>
                    <option value="moderator">Reviews & Testimonials Moderator</option>
                    <option value="partner_admin">Collaboration Brand Partner</option>
                    <option value="admin">Full Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="name@comp.com"
                  />
                </div>
                <div className="form-group col-6">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FaKey style={{ marginRight: '6px' }} />
                  {isEditMode ? 'New Password (Leave empty to keep current)' : 'Account Password'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isEditMode ? "Password unchanged" : "Minimum 6 characters"}
                  required={!isEditMode}
                />
              </div>

              {/* 🏢 PARTNER SCOPING FIELDS */}
              {formData.role === 'partner_admin' && (
                <div className="form-group border-highlight">
                  <label>Select Associated Brand / Collaboration</label>
                  <select
                    name="collaborationId"
                    value={formData.collaborationId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Choose Active Brand Partnership --</option>
                    {collaborations.map(collab => (
                      <option key={collab._id} value={collab._id}>
                        {collab.partnerName}
                      </option>
                    ))}
                  </select>
                  <small className="help-text">
                    This account will be whitelisted and restricted ONLY to products and reviews matching this company.
                  </small>
                </div>
              )}

              {/* ⚙️ GRANULAR STAFF PERMISSION CHECKBOXES */}
              {['staff', 'inventory_manager', 'order_manager', 'marketing_manager', 'moderator'].includes(formData.role) && (
                <div className="form-group permissions-selector-group">
                  <label className="group-label">
                    Toggle Accessible Administrative Modules
                    {formData.role !== 'staff' && (
                      <span className="badge-premanaged" style={{ marginLeft: '10px', fontSize: '11px', color: '#c0392b', background: '#fadbd8', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Auto-Managed by Role
                      </span>
                    )}
                  </label>
                  <div className="permissions-checkbox-grid">
                    <div 
                      className={`permission-checkbox-card ${formData.permissions.manageProducts ? 'selected' : ''} ${formData.role !== 'staff' ? 'disabled-card' : ''}`}
                      onClick={() => formData.role === 'staff' && handlePermissionToggle('manageProducts')}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.manageProducts} 
                        readOnly 
                      />
                      <div>
                        <strong>Product Directory</strong>
                        <span>Modify items, images & variants catalog</span>
                      </div>
                    </div>

                    <div 
                      className={`permission-checkbox-card ${formData.permissions.manageInventory ? 'selected' : ''} ${formData.role !== 'staff' ? 'disabled-card' : ''}`}
                      onClick={() => formData.role === 'staff' && handlePermissionToggle('manageInventory')}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.manageInventory} 
                        readOnly 
                      />
                      <div>
                        <strong>Flat Inventory</strong>
                        <span>Update stock quantities and levels</span>
                      </div>
                    </div>

                    <div 
                      className={`permission-checkbox-card ${formData.permissions.manageOrders ? 'selected' : ''} ${formData.role !== 'staff' ? 'disabled-card' : ''}`}
                      onClick={() => formData.role === 'staff' && handlePermissionToggle('manageOrders')}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.manageOrders} 
                        readOnly 
                      />
                      <div>
                        <strong>Orders Desk</strong>
                        <span>View sales, update statuses & refunds</span>
                      </div>
                    </div>

                    <div 
                      className={`permission-checkbox-card ${formData.permissions.manageReviews ? 'selected' : ''} ${formData.role !== 'staff' ? 'disabled-card' : ''}`}
                      onClick={() => formData.role === 'staff' && handlePermissionToggle('manageReviews')}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.manageReviews} 
                        readOnly 
                      />
                      <div>
                        <strong>Reviews Vault</strong>
                        <span>Monitor and delete user ratings & photos</span>
                      </div>
                    </div>

                    <div 
                      className={`permission-checkbox-card ${formData.permissions.manageNewsletters ? 'selected' : ''} ${formData.role !== 'staff' ? 'disabled-card' : ''}`}
                      onClick={() => formData.role === 'staff' && handlePermissionToggle('manageNewsletters')}
                    >
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.manageNewsletters} 
                        readOnly 
                      />
                      <div>
                        <strong>Newsletter Manager</strong>
                        <span>View campaigns and list subscribers</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving Settings...' : isEditMode ? 'Update Account' : 'Invite Member'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
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

export default StaffManagement;
