import React, { useState, useEffect } from 'react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '../utils/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discount: '',
    minPrice: 0,
    maxDiscount: '',
    maxUses: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await getAllCoupons();
      setCoupons(response.data.coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, formData);
        alert('Coupon updated successfully');
      } else {
        await createCoupon(formData);
        alert('Coupon created successfully');
      }
      resetForm();
      fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving coupon');
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discount: '',
      minPrice: 0,
      maxDiscount: '',
      maxUses: '',
      endDate: '',
      isActive: true
    });
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discount: coupon.discount,
      minPrice: coupon.minPrice,
      maxDiscount: coupon.maxDiscount || '',
      maxUses: coupon.maxUses || '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id);
        alert('Coupon deleted successfully');
        fetchCoupons();
      } catch (error) {
        alert('Error deleting coupon');
      }
    }
  };

  if (loading) return <div className="loading">Loading coupons...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Coupons Management</h1>
          <p>Create and manage discount coupons</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Coupon
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Discount</th>
                <th>Min Purchase</th>
                <th>Used/Max</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td><strong>{coupon.code}</strong></td>
                  <td>{coupon.description}</td>
                  <td>
                    {coupon.discountType === 'percentage' 
                      ? `${coupon.discount}%` 
                      : `₹${coupon.discount}`
                    }
                  </td>
                  <td>₹{coupon.minPrice}</td>
                  <td>{coupon.usedCount || 0}/{coupon.maxUses || '∞'}</td>
                  <td>{new Date(coupon.endDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${coupon.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(coupon)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(coupon._id)}
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

        {coupons.length === 0 && (
          <p className="no-data">No coupons found. Create your first coupon!</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
              </h2>
              <button className="close-btn" onClick={() => resetForm()}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Get 20% off on all products"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select
                    className="form-control"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Min Purchase (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.minPrice}
                    onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Max Discount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Max Uses</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
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
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
