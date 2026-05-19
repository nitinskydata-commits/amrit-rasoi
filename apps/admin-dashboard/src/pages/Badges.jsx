import React, { useState, useEffect } from 'react';
import { getAllBadges, createBadge, updateBadge, deleteBadge } from '../utils/api';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './Badges.css';

const Badges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    emoji: '✓',
    order: 0,
    isVisible: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const { data } = await getAllBadges();
      if (data.success) {
        setBadges(data.badges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });

    if (imageFile) {
      submitData.append('icon', imageFile);
    }

    try {
      if (editingId) {
        await updateBadge(editingId, submitData);
        alert('Badge updated successfully!');
      } else {
        await createBadge(submitData);
        alert('Badge created successfully!');
      }

      fetchBadges();
      closeModal();
    } catch (error) {
      console.error('Error saving badge:', error);
      alert(error.response?.data?.message || 'Failed to save badge');
    }
  };

  const handleEdit = (badge) => {
    setEditingId(badge._id);
    setFormData({
      title: badge.title,
      description: badge.description || '',
      emoji: badge.emoji,
      order: badge.order,
      isVisible: badge.isVisible
    });
    setImagePreview(badge.icon?.url || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) {
      return;
    }

    try {
      await deleteBadge(id);
      alert('Badge deleted successfully!');
      fetchBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      alert('Failed to delete badge');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      emoji: '✓',
      order: 0,
      isVisible: true
    });
    setImageFile(null);
    setImagePreview('');
  };

  if (loading) {
    return <div className="loading">Loading badges...</div>;
  }

  return (
    <div className="badges-page">
      <div className="page-header">
        <h1>Trust Badges Management</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add New Badge
        </button>
      </div>

      <div className="badges-grid">
        {badges.map(badge => (
          <div key={badge._id} className="badge-card">
            <div className="badge-preview">
              {badge.icon?.url ? (
                <img src={badge.icon.url} alt={badge.title} />
              ) : (
                <span className="badge-emoji">{badge.emoji}</span>
              )}
            </div>
            <h3>{badge.title}</h3>
            {badge.description && <p>{badge.description}</p>}
            <div className="badge-meta">
              <span className="order-badge">Order: {badge.order}</span>
              <span className={`status-badge ${badge.isVisible ? 'visible' : 'hidden'}`}>
                {badge.isVisible ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <div className="badge-actions">
              <button className="btn-edit" onClick={() => handleEdit(badge)}>
                <FaEdit />
              </button>
              <button className="btn-delete" onClick={() => handleDelete(badge._id)}>
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Badge' : 'Add New Badge'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., ISO Certified"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Brief description of the badge"
                />
              </div>

              <div className="form-group">
                <label>Emoji (if no icon)</label>
                <input
                  type="text"
                  name="emoji"
                  value={formData.emoji}
                  onChange={handleInputChange}
                  placeholder="✓"
                />
              </div>

              <div className="form-group">
                <label>Icon Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                )}
              </div>

              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isVisible"
                    checked={formData.isVisible}
                    onChange={handleInputChange}
                  />
                  Visible on Website
                </label>
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Badges;
