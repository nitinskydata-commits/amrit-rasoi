import React, { useState, useEffect } from 'react';
import { getAllAds, createAd, updateAd, deleteAd, toggleAdStatus } from '../utils/api';
import { FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa';

const Advertisements = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: { url: '' },
    link: '',
    position: 'home-top',
    startDate: '',
    endDate: '',
    advertiser: {
      name: '',
      email: '',
      phone: ''
    },
    paymentReceived: 0,
    paymentStatus: 'pending',
    isActive: true
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await getAllAds();
      setAds(response.data.ads);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await updateAd(editingAd._id, formData);
        alert('Advertisement updated successfully');
      } else {
        await createAd(formData);
        alert('Advertisement created successfully');
      }
      resetForm();
      fetchAds();
    } catch (error) {
      alert('Error saving advertisement');
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingAd(null);
    setFormData({
      title: '',
      description: '',
      image: { url: '' },
      link: '',
      position: 'home-top',
      startDate: '',
      endDate: '',
      advertiser: { name: '', email: '', phone: '' },
      paymentReceived: 0,
      paymentStatus: 'pending',
      isActive: true
    });
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image: ad.image,
      link: ad.link || '',
      position: ad.position,
      startDate: new Date(ad.startDate).toISOString().split('T')[0],
      endDate: new Date(ad.endDate).toISOString().split('T')[0],
      advertiser: ad.advertiser || { name: '', email: '', phone: '' },
      paymentReceived: ad.paymentReceived || 0,
      paymentStatus: ad.paymentStatus,
      isActive: ad.isActive
    });
    setShowModal(true);
  };

  const handleToggle = async (id) => {
    try {
      await toggleAdStatus(id);
      alert('Ad status toggled successfully');
      fetchAds();
    } catch (error) {
      alert('Error toggling ad status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this advertisement?')) {
      try {
        await deleteAd(id);
        alert('Advertisement deleted successfully');
        fetchAds();
      } catch (error) {
        alert('Error deleting advertisement');
      }
    }
  };

  if (loading) return <div className="loading">Loading advertisements...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Advertisements Management</h1>
          <p>Manage promotional ads on your website</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Advertisement
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Position</th>
                <th>Advertiser</th>
                <th>Duration</th>
                <th>Clicks</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad._id}>
                  <td><strong>{ad.title}</strong></td>
                  <td>
                    <span className="badge badge-info">
                      {ad.position.replace('-', ' ')}
                    </span>
                  </td>
                  <td>{ad.advertiser?.name || 'N/A'}</td>
                  <td>
                    {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                  </td>
                  <td>{ad.clicks || 0} / {ad.impressions || 0}</td>
                  <td>
                    <div>₹{ad.paymentReceived || 0}</div>
                    <span className={`badge badge-${getPaymentColor(ad.paymentStatus)}`}>
                      {ad.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(ad._id)}
                      className={`badge ${ad.isActive ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {ad.isActive ? <><FaEye /> Active</> : <><FaEyeSlash /> Inactive</>}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(ad)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(ad._id)}
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

        {ads.length === 0 && (
          <p className="no-data">No advertisements found. Create your first ad!</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
              </h2>
              <button className="close-btn" onClick={() => resetForm()}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Ad Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Image URL *</label>
                <input
                  type="url"
                  className="form-control"
                  value={formData.image.url}
                  onChange={(e) => setFormData({ ...formData, image: { url: e.target.value } })}
                  placeholder="https://example.com/ad-image.jpg"
                  required
                />
              </div>
              <div className="form-group">
                <label>Link URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com/offer"
                />
              </div>
              <div className="form-group">
                <label>Position *</label>
                <select
                  className="form-control"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                >
                  <option value="home-top">Home Top</option>
                  <option value="home-sidebar">Home Sidebar</option>
                  <option value="product-banner">Product Banner</option>
                  <option value="checkout-banner">Checkout Banner</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
              </div>
              <div className="form-group">
                <label>Advertiser Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.advertiser.name}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    advertiser: { ...formData.advertiser, name: e.target.value }
                  })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Advertiser Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.advertiser.email}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      advertiser: { ...formData.advertiser, email: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Advertiser Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.advertiser.phone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      advertiser: { ...formData.advertiser, phone: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Payment Received (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.paymentReceived}
                    onChange={(e) => setFormData({ ...formData, paymentReceived: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select
                    className="form-control"
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => resetForm()}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAd ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const getPaymentColor = (status) => {
  const colors = {
    'pending': 'warning',
    'partial': 'info',
    'paid': 'success'
  };
  return colors[status] || 'info';
};

export default Advertisements;
