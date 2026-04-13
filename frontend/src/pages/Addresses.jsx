import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../redux/slices/addressSlice';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaHome, FaBriefcase } from 'react-icons/fa';
import './Addresses.css';

const Addresses = () => {
  const dispatch = useDispatch();
  const { addresses, loading } = useSelector(state => state.address);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home',
    isDefault: false
  });

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await dispatch(updateAddress({ id: editingId, addressData: formData })).unwrap();
        alert('Address updated successfully!');
      } else {
        await dispatch(addAddress(formData)).unwrap();
        alert('Address added successfully!');
      }
      
      resetForm();
      dispatch(fetchAddresses());
    } catch (error) {
      alert(error.message || 'Failed to save address');
    }
  };

  const handleEdit = (address) => {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      addressType: address.addressType || 'Home',
      isDefault: address.isDefault || false
    });
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await dispatch(deleteAddress(id)).unwrap();
        alert('Address deleted successfully!');
        dispatch(fetchAddresses());
      } catch (error) {
        alert(error.message || 'Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await dispatch(setDefaultAddress(id)).unwrap();
      alert('Default address updated!');
      dispatch(fetchAddresses());
    } catch (error) {
      alert(error.message || 'Failed to set default address');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Home',
      isDefault: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="addresses-page">
      <div className="container">
        <div className="addresses-header">
          <h1>My Addresses</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <FaPlus /> {showForm ? 'Cancel' : 'Add New Address'}
          </button>
        </div>

        {/* Add/Edit Address Form */}
        {showForm && (
          <div className="address-form-container">
            <h2>{editingId ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleSubmit} className="address-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  required
                  placeholder="House No., Building Name"
                />
              </div>

              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Road Name, Area, Colony"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="Baliali"
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="Punjab"
                  />
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    placeholder="6-digit pincode"
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Address Type</label>
                  <select
                    name="addressType"
                    value={formData.addressType}
                    onChange={handleInputChange}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                    />
                    Set as default address
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        <div className="addresses-grid">
          {loading && !showForm ? (
            <p>Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <div className="no-addresses">
              <FaMapMarkerAlt className="empty-icon" />
              <h2>No addresses saved</h2>
              <p>Add an address to make checkout faster</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                <FaPlus /> Add Your First Address
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div 
                key={address._id} 
                className={`address-card ${address.isDefault ? 'default' : ''}`}
              >
                {address.isDefault && (
                  <span className="default-badge">Default</span>
                )}
                <div className="address-header">
                  {address.addressType === 'Home' && <FaHome className="location-icon" />}
                  {address.addressType === 'Work' && <FaBriefcase className="location-icon" />}
                  {address.addressType === 'Other' && <FaMapMarkerAlt className="location-icon" />}
                  <h3>{address.addressType}</h3>
                </div>
                
                <div className="address-details">
                  <h4>{address.fullName}</h4>
                  <p className="address-text">{address.addressLine1}</p>
                  {address.addressLine2 && <p className="address-text">{address.addressLine2}</p>}
                  <p className="address-text">{address.city}, {address.state} - {address.pincode}</p>
                  <p className="address-phone">Phone: {address.phone}</p>
                </div>

                <div className="address-actions">
                  {!address.isDefault && (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleSetDefault(address._id)}
                    >
                      Set as Default
                    </button>
                  )}
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => handleEdit(address)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="btn btn-outline btn-sm delete"
                    onClick={() => handleDelete(address._id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Addresses;
