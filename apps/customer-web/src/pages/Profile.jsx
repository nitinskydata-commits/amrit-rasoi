import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaStore } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title">My Profile</h1>

        <div className="profile-grid">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <button
              className="btn btn-outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              <FaEdit /> {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Profile Details */}
          <div className="profile-details">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="edit-form">
                <h3>Edit Profile</h3>
                <div className="form-group">
                  <label>
                    <FaUser /> Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaEnvelope /> Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaPhone /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="info-display">
                <h3>Profile Information</h3>
                <div className="info-item">
                  <FaUser className="icon" />
                  <div>
                    <label>Full Name</label>
                    <p>{user?.name}</p>
                  </div>
                </div>
                <div className="info-item">
                  <FaEnvelope className="icon" />
                  <div>
                    <label>Email Address</label>
                    <p>{user?.email}</p>
                  </div>
                </div>
                <div className="info-item">
                  <FaPhone className="icon" />
                  <div>
                    <label>Phone Number</label>
                    <p>{user?.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <h3>Quick Links</h3>
          <div className="links-grid">
            <Link to="/orders" className="link-card">
              <i className="fas fa-box"></i>
              <h4>My Orders</h4>
              <p>Track, return or buy again</p>
            </Link>
            <Link to="/addresses" className="link-card">
              <i className="fas fa-map-marker-alt"></i>
              <h4>Addresses</h4>
              <p>Manage delivery addresses</p>
            </Link>
            <Link to="/cart" className="link-card">
              <i className="fas fa-shopping-cart"></i>
              <h4>Shopping Cart</h4>
              <p>View items in cart</p>
            </Link>
            {user?.role === 'vendor_owner' || user?.sellerStatus === 'approved' ? (
              <Link to="/seller/dashboard" className="link-card" style={{ border: '1px solid #f59e0b' }}>
                <FaStore style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '8px' }} />
                <h4 style={{ color: '#f59e0b' }}>Seller Dashboard</h4>
                <p>Manage products, orders and earnings</p>
              </Link>
            ) : (
              <Link to="/seller/apply" className="link-card">
                <FaStore style={{ color: '#64748b', fontSize: '24px', marginBottom: '8px' }} />
                <h4>Apply to Sell</h4>
                <p>Register as a verified merchant</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
