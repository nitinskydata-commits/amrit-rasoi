import React, { useState, useEffect } from 'react';
import { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../utils/api';
import { FaPlus, FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import './Testimonials.css';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    review: '',
    productName: '',
    isApproved: false,
    isVisible: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data } = await getAllTestimonials();
      if (data.success) {
        setTestimonials(data.testimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
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
      submitData.append('customerImage', imageFile);
    }

    try {
      if (editingId) {
        await updateTestimonial(editingId, submitData);
        alert('Testimonial updated successfully!');
      } else {
        await createTestimonial(submitData);
        alert('Testimonial created successfully!');
      }

      fetchTestimonials();
      closeModal();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      alert(error.response?.data?.message || 'Failed to save testimonial');
    }
  };

  const handleEdit = (testimonial) => {
    setEditingId(testimonial._id);
    setFormData({
      customerName: testimonial.customerName,
      rating: testimonial.rating,
      review: testimonial.review,
      productName: testimonial.productName || '',
      isApproved: testimonial.isApproved,
      isVisible: testimonial.isVisible
    });
    setImagePreview(testimonial.customerImage?.url || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    try {
      await deleteTestimonial(id);
      alert('Testimonial deleted successfully!');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      customerName: '',
      rating: 5,
      review: '',
      productName: '',
      isApproved: false,
      isVisible: true
    });
    setImageFile(null);
    setImagePreview('');
  };

  if (loading) {
    return <div className="loading">Loading testimonials...</div>;
  }

  return (
    <div className="testimonials-page">
      <div className="page-header">
        <h1>Testimonials Management</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add New Testimonial
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Reviews</h3>
          <p className="stat-number">{testimonials.length}</p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p className="stat-number">
            {testimonials.filter(t => t.isApproved).length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">
            {testimonials.filter(t => !t.isApproved).length}
          </p>
        </div>
      </div>

      <div className="testimonials-table">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Product</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.map(testimonial => (
              <tr key={testimonial._id}>
                <td>
                  <div className="customer-info">
                    {testimonial.customerImage?.url && (
                      <img src={testimonial.customerImage.url} alt={testimonial.customerName} />
                    )}
                    <span>{testimonial.customerName}</span>
                  </div>
                </td>
                <td>
                  <div className="rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="star-filled" />
                    ))}
                  </div>
                </td>
                <td className="review-text">{testimonial.review}</td>
                <td>{testimonial.productName || '-'}</td>
                <td>
                  <span className={`status-badge ${testimonial.isApproved ? 'approved' : 'pending'}`}>
                    {testimonial.isApproved ? 'Approved' : 'Pending'}
                  </span>
                  {!testimonial.isVisible && (
                    <span className="status-badge hidden">Hidden</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEdit(testimonial)}>
                      <FaEdit />
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(testimonial._id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Customer Image</label>
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
                <label>Rating *</label>
                <select name="rating" value={formData.rating} onChange={handleInputChange} required>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div className="form-group">
                <label>Review *</label>
                <textarea
                  name="review"
                  value={formData.review}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isApproved"
                    checked={formData.isApproved}
                    onChange={handleInputChange}
                  />
                  Approved
                </label>
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

export default Testimonials;
