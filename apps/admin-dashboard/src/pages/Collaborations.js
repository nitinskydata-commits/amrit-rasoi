import React, { useState, useEffect } from 'react';
import { getAllCollaborations, createCollaboration, deleteCollaboration } from '../utils/api';
import { FaTrash, FaPlus } from 'react-icons/fa';

const Collaborations = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    partnerName: '',
    partnerEmail: '',
    partnerPhone: '',
    description: '',
    startDate: '',
    endDate: '',
    revenueShare: 0,
    terms: ''
  });

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const fetchCollaborations = async () => {
    try {
      const response = await getAllCollaborations();
      setCollaborations(response.data.collaborations);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCollaboration(formData);
      alert('Collaboration created successfully');
      resetForm();
      fetchCollaborations();
    } catch (error) {
      alert('Error creating collaboration');
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setFormData({
      partnerName: '',
      partnerEmail: '',
      partnerPhone: '',
      description: '',
      startDate: '',
      endDate: '',
      revenueShare: 0,
      terms: ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this collaboration?')) {
      try {
        await deleteCollaboration(id);
        alert('Collaboration deleted successfully');
        fetchCollaborations();
      } catch (error) {
        alert('Error deleting collaboration');
      }
    }
  };

  if (loading) return <div className="loading">Loading collaborations...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Collaborations Management</h1>
          <p>Manage partnerships with other companies</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Collaboration
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Partner Name</th>
                <th>Contact</th>
                <th>Duration</th>
                <th>Revenue Share</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collaborations.map((collab) => (
                <tr key={collab._id}>
                  <td><strong>{collab.partnerName}</strong></td>
                  <td>
                    <div>{collab.partnerEmail}</div>
                    <div style={{ fontSize: '12px', color: '#757575' }}>{collab.partnerPhone}</div>
                  </td>
                  <td>
                    {new Date(collab.startDate).toLocaleDateString()} - {new Date(collab.endDate).toLocaleDateString()}
                  </td>
                  <td>{collab.revenueShare}%</td>
                  <td>{collab.productsListed?.length || 0}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(collab.status)}`}>
                      {collab.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(collab._id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {collaborations.length === 0 && (
          <p className="no-data">No collaborations found. Create your first partnership!</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Collaboration</h2>
              <button className="close-btn" onClick={() => resetForm()}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Partner Company Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.partnerName}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Partner Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.partnerEmail}
                    onChange={(e) => setFormData({ ...formData, partnerEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Partner Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.partnerPhone}
                    onChange={(e) => setFormData({ ...formData, partnerPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Revenue Share (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.revenueShare}
                    onChange={(e) => setFormData({ ...formData, revenueShare: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Terms & Conditions</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => resetForm()}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    'pending': 'warning',
    'active': 'success',
    'completed': 'info',
    'cancelled': 'danger'
  };
  return colors[status] || 'info';
};

export default Collaborations;
