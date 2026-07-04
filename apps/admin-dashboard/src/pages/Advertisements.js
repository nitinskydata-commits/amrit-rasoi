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
    theme: 'light',
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await getAllAds();
      setAds(response.data.ads || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description || '');
    submitData.append('link', formData.link || '');
    submitData.append('position', formData.position);
    submitData.append('theme', formData.theme || 'light');
    submitData.append('startDate', formData.startDate);
    submitData.append('endDate', formData.endDate);
    submitData.append('paymentReceived', formData.paymentReceived || 0);
    submitData.append('paymentStatus', formData.paymentStatus);
    submitData.append('isActive', formData.isActive);
    
    // Send advertiser info flat for simple controller mapping
    submitData.append('advertiserName', formData.advertiser.name || '');
    submitData.append('advertiserEmail', formData.advertiser.email || '');
    submitData.append('advertiserPhone', formData.advertiser.phone || '');

    if (imageFile) {
      submitData.append('image', imageFile);
    } else if (formData.image?.url) {
      submitData.append('image[url]', formData.image.url);
    }

    try {
      if (editingAd) {
        await updateAd(editingAd._id, submitData);
        alert('Advertisement updated successfully');
      } else {
        await createAd(submitData);
        alert('Advertisement created successfully');
      }
      resetForm();
      fetchAds();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      alert(error.response?.data?.message || 'Error saving advertisement');
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
      theme: 'light',
      startDate: '',
      endDate: '',
      advertiser: { name: '', email: '', phone: '' },
      paymentReceived: 0,
      paymentStatus: 'pending',
      isActive: true
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image: ad.image || { url: '' },
      link: ad.link || '',
      position: ad.position,
      theme: ad.theme || 'light',
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
      advertiser: ad.advertiser || { name: '', email: '', phone: '' },
      paymentReceived: ad.paymentReceived || 0,
      paymentStatus: ad.paymentStatus || 'pending',
      isActive: ad.isActive !== undefined ? ad.isActive : true
    });
    setImagePreview(ad.image?.url || '');
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

  // Calculate stats
  const totalCampaigns = ads.length;
  const activeCampaigns = ads.filter(a => a.isActive).length;
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalRevenue = ads.reduce((sum, a) => sum + (Number(a.paymentReceived) || 0), 0);

  if (loading) return <div className="loading">Loading advertisements...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Advertisements Management</h1>
          <p>Manage promotional ads and campaigns on your website</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Advertisement
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Campaigns</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{totalCampaigns}</p>
        </div>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Campaigns</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#10b981', margin: 0 }}>{activeCampaigns}</p>
        </div>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Clicks / Imps</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6', margin: 0 }}>{totalClicks} <span style={{ fontSize: '16px', color: '#9ca3af', fontWeight: '400' }}>/ {totalImpressions}</span></p>
        </div>
        <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Ad Revenue</h3>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b', margin: 0 }}>₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Banner</th>
                <th>Title</th>
                <th>Position</th>
                <th>Theme</th>
                <th>Advertiser</th>
                <th>Duration</th>
                <th>Clicks / Imps</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad._id}>
                  <td>
                    {ad.image?.url ? (
                      <img src={ad.image.url} alt={ad.title} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                    ) : (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>No Image</span>
                    )}
                  </td>
                  <td>
                    <div><strong>{ad.title}</strong></div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{ad.description ? ad.description.substring(0, 40) + '...' : ''}</div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {ad.position.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>
                      {ad.theme || 'Light'}
                    </span>
                  </td>
                  <td>
                    <div>{ad.advertiser?.name || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{ad.advertiser?.email || ''}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>{new Date(ad.startDate).toLocaleDateString()} -</div>
                    <div style={{ fontSize: '12px' }}>{new Date(ad.endDate).toLocaleDateString()}</div>
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
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(ad._id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
          <p className="no-data">No advertisements found. Create your first campaign!</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
              </h2>
              <button className="close-btn" onClick={() => resetForm()}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                  <label>Link URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://example.com/offer"
                  />
                </div>
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

              {/* Advertisement Image upload block */}
              <div className="form-group" style={{ background: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>Ad Banner Media *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'block', marginBottom: '10px' }}
                  required={!editingAd && !imagePreview}
                />
                
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Banner Preview:</span>
                    <img src={imagePreview} alt="Ad Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Position *</label>
                  <select
                    className="form-control"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  >
                    <option value="home-top">Home Top Banner</option>
                    <option value="home-middle">Home Middle Banner</option>
                    <option value="home-sidebar">Home Sidebar</option>
                    <option value="home-overlay">Home Grid Overlay Card</option>
                    <option value="product-banner">Product Banner</option>
                    <option value="checkout-banner">Checkout Banner</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Theme Customizer *</label>
                  <select
                    className="form-control"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    required
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                    <option value="minimal">Minimalist Theme</option>
                    <option value="accent">Accent Color Theme</option>
                  </select>
                </div>
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
