import React, { useState, useEffect } from 'react';
import { getAllBrands, createBrand, updateBrand, deleteBrand } from '../utils/api';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isMainBrand: false,
    isActive: true
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await getAllBrands();
      setBrands(response.data.brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await updateBrand(editingBrand._id, formData);
        alert('Brand updated successfully');
      } else {
        await createBrand(formData);
        alert('Brand created successfully');
      }
      setShowModal(false);
      setEditingBrand(null);
      setFormData({ name: '', description: '', isMainBrand: false, isActive: true });
      fetchBrands();
    } catch (error) {
      alert('Error saving brand');
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description,
      isMainBrand: brand.isMainBrand,
      isActive: brand.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        await deleteBrand(id);
        alert('Brand deleted successfully');
        fetchBrands();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting brand');
      }
    }
  };

  if (loading) return <div className="loading">Loading brands...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Brands Management</h1>
          <p>Manage your product brands</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Brand
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Products</th>
                <th>Main Brand</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand._id}>
                  <td><strong>{brand.name}</strong></td>
                  <td>{brand.description}</td>
                  <td>{brand.productCount || 0}</td>
                  <td>
                    {brand.isMainBrand ? (
                      <span className="badge badge-success">Yes</span>
                    ) : (
                      <span className="badge badge-secondary">No</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${brand.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(brand)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(brand._id)}
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

        {brands.length === 0 && (
          <p className="no-data">No brands found. Create your first brand!</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Brand Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
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
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isMainBrand}
                    onChange={(e) => setFormData({ ...formData, isMainBrand: e.target.checked })}
                  />
                  Main Brand (SBMI)
                </label>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;
