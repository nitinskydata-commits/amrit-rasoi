import React, { useEffect, useState } from 'react';
import { getInventory, updateBulkInventory } from '../utils/api';
import { FaSearch, FaSave, FaUndo, FaExclamationTriangle, FaBox, FaTags } from 'react-icons/fa';
import './Inventory.css';

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Track changes: { [uniqueKey]: newStockValue }
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventoryList();
  }, []);

  const fetchInventoryList = async () => {
    setLoading(true);
    try {
      const { data } = await getInventory();
      if (data.success) {
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
      alert('Error fetching inventory details');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueKey = (item) => {
    return item.type === 'variant' 
      ? `variant_${item.productId}_${item.variantId}`
      : `product_${item.productId}`;
  };

  const handleStockChange = (item, newValue) => {
    const val = Math.max(0, parseInt(newValue) || 0);
    const key = getUniqueKey(item);
    
    if (val === item.stock) {
      const updated = { ...pendingChanges };
      delete updated[key];
      setPendingChanges(updated);
    } else {
      setPendingChanges(prev => ({ ...prev, [key]: val }));
    }
  };

  const adjustStock = (item, delta) => {
    const key = getUniqueKey(item);
    const currentVal = key in pendingChanges ? pendingChanges[key] : item.stock;
    const newVal = Math.max(0, currentVal + delta);
    handleStockChange(item, newVal);
  };

  const discardChanges = () => {
    setPendingChanges({});
  };

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    
    setSaving(true);
    try {
      const updates = Object.keys(pendingChanges).map(key => {
        if (key.startsWith('variant_')) {
          const parts = key.split('_');
          return {
            type: 'variant',
            productId: parts[1],
            variantId: parts[2],
            stock: pendingChanges[key]
          };
        } else {
          const parts = key.split('_');
          return {
            type: 'product',
            productId: parts[1],
            variantId: null,
            stock: pendingChanges[key]
          };
        }
      });

      const { data } = await updateBulkInventory(updates);
      if (data.success) {
        // Refresh inventory list and reset pending
        await fetchInventoryList();
        setPendingChanges({});
        alert('Stock updated successfully!');
      }
    } catch (error) {
      console.error('Failed to save bulk inventory:', error);
      alert('Error updating inventory stock levels');
    } finally {
      setSaving(false);
    }
  };

  // Categories present in dataset
  const categories = ['All', ...new Set(inventory.map(item => item.category).filter(Boolean))];

  // Filtering logic
  const filteredInventory = inventory.filter(item => {
    const matchSearch = 
      item.productName?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.label?.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;

    // Get current stock (including pending changes if any)
    const key = getUniqueKey(item);
    const currentStock = key in pendingChanges ? pendingChanges[key] : item.stock;

    let matchStatus = true;
    if (statusFilter === 'out') matchStatus = currentStock === 0;
    else if (statusFilter === 'low') matchStatus = currentStock > 0 && currentStock < 10;
    else if (statusFilter === 'instock') matchStatus = currentStock >= 10;

    return matchSearch && matchCategory && matchStatus;
  });

  // Summary counts
  const totalSKUs = inventory.length;
  const outOfStockCount = inventory.filter(item => {
    const key = getUniqueKey(item);
    const stock = key in pendingChanges ? pendingChanges[key] : item.stock;
    return stock === 0;
  }).length;

  const lowStockCount = inventory.filter(item => {
    const key = getUniqueKey(item);
    const stock = key in pendingChanges ? pendingChanges[key] : item.stock;
    return stock > 0 && stock < 10;
  }).length;

  return (
    <div className="inventory-manager-page">
      <div className="page-header">
        <div>
          <h1>Bulk Inventory Management</h1>
          <p className="subtitle">View and update stock levels for all products and variation SKUs in real-time.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="inventory-summary-cards">
        <div className="summary-card total">
          <div className="card-icon"><FaBox /></div>
          <div className="card-info">
            <h3>{totalSKUs}</h3>
            <p>Total Active SKUs</p>
          </div>
        </div>
        <div className="summary-card warning">
          <div className="card-icon"><FaExclamationTriangle /></div>
          <div className="card-info">
            <h3>{lowStockCount}</h3>
            <p>Low Stock Warning (&lt; 10)</p>
          </div>
        </div>
        <div className="summary-card out">
          <div className="card-icon"><FaExclamationTriangle style={{ color: '#d9534f' }} /></div>
          <div className="card-info">
            <h3>{outOfStockCount}</h3>
            <p>Temporarily Out of Stock</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="inventory-controls card">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search by Product name, SKU, or variant details..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filters-group">
          <div className="filter-item">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Stock Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Items</option>
              <option value="instock">In Stock (&gt;= 10)</option>
              <option value="low">Low Stock (&lt; 10)</option>
              <option value="out">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Flat Table */}
      <div className="inventory-table-container card">
        {loading ? (
          <div className="table-loader">
            <div className="spinner"></div>
            <p>Loading catalog items...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="no-results">
            <p>No inventory items match your search filters.</p>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product / Image</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price / MRP</th>
                <th>Current Stock</th>
                <th>Adjust Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const key = getUniqueKey(item);
                const isChanged = key in pendingChanges;
                const displayStock = isChanged ? pendingChanges[key] : item.stock;
                const delta = isChanged ? pendingChanges[key] - item.stock : 0;

                return (
                  <tr key={key} className={isChanged ? 'row-changed' : ''}>
                    {/* Product & Variant Detail */}
                    <td className="product-cell">
                      <img src={item.image} alt={item.productName} className="prod-thumb" />
                      <div className="prod-meta">
                        <span className="prod-name">{item.productName}</span>
                        {item.type === 'variant' ? (
                          <span className="variant-badge">{item.label}</span>
                        ) : (
                          <span className="single-badge">Single Variant</span>
                        )}
                      </div>
                    </td>
                    {/* SKU */}
                    <td className="sku-cell"><code>{item.sku || 'N/A'}</code></td>
                    {/* Category */}
                    <td><span className="category-tag">{item.category}</span></td>
                    {/* Price / MRP */}
                    <td className="price-cell">
                      <span className="selling-price">₹{item.price}</span>
                      <span className="mrp-crossed">₹{item.mrp}</span>
                    </td>
                    {/* Current Stock */}
                    <td className="stock-cell">
                      <div className="stock-status-wrapper">
                        <span className={`stock-number ${displayStock === 0 ? 'text-danger' : displayStock < 10 ? 'text-warning' : 'text-success'}`}>
                          {displayStock}
                        </span>
                        {isChanged && (
                          <span className={`delta-badge ${delta >= 0 ? 'delta-positive' : 'delta-negative'}`}>
                            {delta >= 0 ? `+${delta}` : delta}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Adjust Stock Controls */}
                    <td className="adjust-cell">
                      <div className="quick-adjust-buttons">
                        <button type="button" className="btn-adj minus-ten" onClick={() => adjustStock(item, -10)}>-10</button>
                        <button type="button" className="btn-adj minus-one" onClick={() => adjustStock(item, -1)}>-1</button>
                        <input 
                          type="number" 
                          className={`stock-direct-input ${isChanged ? 'input-modified' : ''}`}
                          value={displayStock}
                          min="0"
                          onChange={(e) => handleStockChange(item, e.target.value)}
                        />
                        <button type="button" className="btn-adj plus-one" onClick={() => adjustStock(item, 1)}>+1</button>
                        <button type="button" className="btn-adj plus-ten" onClick={() => adjustStock(item, 10)}>+10</button>
                      </div>
                    </td>
                    {/* Actions */}
                    <td>
                      {isChanged && (
                        <button 
                          type="button" 
                          className="btn-undo" 
                          title="Undo changes" 
                          onClick={() => {
                            const updated = { ...pendingChanges };
                            delete updated[key];
                            setPendingChanges(updated);
                          }}
                        >
                          <FaUndo /> Undo
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Footer for Pending Changes */}
      {Object.keys(pendingChanges).length > 0 && (
        <div className="pending-footer-bar">
          <div className="pending-info">
            <span className="pending-badge">{Object.keys(pendingChanges).length}</span>
            <span>Unsaved stock changes pending.</span>
          </div>
          <div className="pending-actions">
            <button type="button" className="btn btn-outline" onClick={discardChanges} disabled={saving}>
              Discard
            </button>
            <button type="button" className="btn btn-primary" onClick={saveChanges} disabled={saving}>
              {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
