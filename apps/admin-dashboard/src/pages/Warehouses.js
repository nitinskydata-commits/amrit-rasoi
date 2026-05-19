import React, { useState, useEffect } from 'react';
import { 
  getAllWarehouses, 
  createWarehouse, 
  intakeStock, 
  transferStock, 
  getStockLedger,
  getAllProducts 
} from '../utils/api';
import { 
  FaWarehouse, 
  FaPlus, 
  FaExchangeAlt, 
  FaArrowDown, 
  FaHistory, 
  FaTimes, 
  FaUser
} from 'react-icons/fa';
import './Warehouses.css';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Drawers State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [intakeSearch, setIntakeSearch] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [warehouseSearchIntake, setWarehouseSearchIntake] = useState('');
  const [warehouseSearchSource, setWarehouseSearchSource] = useState('');
  const [warehouseSearchDest, setWarehouseSearchDest] = useState('');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  
  // Form State
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    capacity: 1000
  });

  const [intakeData, setIntakeData] = useState({
    warehouseId: '',
    productId: '',
    variantId: '',
    quantity: 1,
    operatorName: '',
    reason: 'Regular Procurement'
  });

  const [transferData, setTransferData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    productId: '',
    variantId: '',
    quantity: 1,
    operatorName: '',
    reason: 'Inter-warehouse stock balancing'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [whRes, ledgerRes, prodRes] = await Promise.all([
        getAllWarehouses(),
        getStockLedger(),
        getAllProducts()
      ]);
      
      if (whRes.data.success) {
        setWarehouses(whRes.data.warehouses || whRes.data.data || []);
      }
      if (ledgerRes.data.success) {
        setLedger(ledgerRes.data.ledger || ledgerRes.data.data || []);
      }
      // Populate products dropdown
      if (prodRes.data.success) {
        setProducts(prodRes.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      const res = await createWarehouse(newWarehouse);
      if (res.data.success) {
        setShowCreateModal(false);
        setNewWarehouse({ name: '', code: '', address: '', city: '', capacity: 1000 });
        fetchInitialData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating warehouse');
    }
  };

  const handleIntakeStock = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...intakeData };
      if (isCustomProduct) {
        if (!customProductName.trim()) {
          alert('Please enter a product name');
          return;
        }
        payload.productId = customProductName.trim();
        payload.variantId = undefined;
      } else {
        // Find selected product to check if it has variants
        const product = products.find(p => p._id === intakeData.productId);
        // If it doesn't have variants, clear variantId
        if (product && !product.hasVariants) {
          payload.variantId = undefined;
        }
      }

      const res = await intakeStock(payload);
      if (res.data.success) {
        setShowIntakeModal(false);
        setIntakeData({ warehouseId: '', productId: '', variantId: '', quantity: 1, operatorName: '', reason: 'Regular Procurement' });
        setIsCustomProduct(false);
        setCustomProductName('');
        fetchInitialData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error executing stock intake');
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    try {
      const product = products.find(p => p._id === transferData.productId);
      const payload = { ...transferData };
      if (product && !product.hasVariants) {
        payload.variantId = undefined;
      }

      const res = await transferStock(payload);
      if (res.data.success) {
        setShowTransferModal(false);
        setTransferData({ sourceWarehouseId: '', destinationWarehouseId: '', productId: '', variantId: '', quantity: 1, operatorName: '', reason: 'Inter-warehouse stock balancing' });
        fetchInitialData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error transferring stock');
    }
  };

  // Get selected product's variants
  const getSelectedProductVariants = (productId) => {
    const prod = products.find(p => p._id === productId);
    return prod?.variants || [];
  };

  if (loading) {
    return <div className="loading">Querying logistics network data...</div>;
  }

  return (
    <div className="warehouses-page">
      <div className="page-header">
        <div>
          <h1>📦 Warehouse Management & Hub Systems</h1>
          <p>Real-time location occupancy, automated stock intake routes, and secure ledger audits.</p>
        </div>
        <div className="actions-bar">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <FaPlus style={{ marginRight: '8px' }} /> Create Warehouse
          </button>
          <button className="btn btn-secondary" onClick={() => setShowIntakeModal(true)}>
            <FaArrowDown style={{ marginRight: '8px' }} /> Stock Intake
          </button>
          <button className="btn btn-warning" onClick={() => setShowTransferModal(true)}>
            <FaExchangeAlt style={{ marginRight: '8px' }} /> Stock Transfer
          </button>
        </div>
      </div>

      {/* WAREHOUSE CARDS GRID WITH PROGRESS RADIALS */}
      <div className="warehouses-grid">
        {warehouses.map((wh) => {
          const currentStock = wh.currentStockSize || 0;
          const capacity = wh.capacity || 1000;
          const occupancyPercent = Math.min(100, Math.round((currentStock / capacity) * 100));
          
          let occupancyColor = '#059669'; // Green (under 75%)
          if (occupancyPercent > 90) occupancyColor = '#dc2626'; // Red (over 90%)
          else if (occupancyPercent > 75) occupancyColor = '#d97706'; // Orange (75-90%)

          return (
            <div key={wh._id} className="wh-card">
              <div className="wh-card-header">
                <div className="wh-icon-box">
                  <FaWarehouse />
                </div>
                <div>
                  <h3>{wh.name}</h3>
                  <span className="wh-code">{wh.code}</span>
                </div>
              </div>

              <div className="wh-card-body">
                <p><strong>Location:</strong> {wh.city}, {wh.address}</p>
                
                {/* Occupancy Indicator */}
                <div className="occupancy-section">
                  <div className="occupancy-labels">
                    <span>Occupancy Capacity</span>
                    <strong>{currentStock} / {capacity} units ({occupancyPercent}%)</strong>
                  </div>
                  <div className="occupancy-track">
                    <div 
                      className="occupancy-bar" 
                      style={{ 
                        width: `${occupancyPercent}%`,
                        backgroundColor: occupancyColor
                      }}
                    ></div>
                  </div>
                </div>

                <div className="wh-card-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setIntakeData(prev => ({ ...prev, warehouseId: wh._id }));
                      setWarehouseSearchIntake(wh.name);
                      setShowIntakeModal(true);
                    }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', padding: '6px' }}
                  >
                    <FaArrowDown /> Record Intake
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => {
                      setTransferData(prev => ({ ...prev, sourceWarehouseId: wh._id }));
                      setWarehouseSearchSource(wh.name);
                      setShowTransferModal(true);
                    }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', padding: '6px' }}
                  >
                    <FaExchangeAlt /> Transfer Stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TRANSACTION LEDGER AUDIT SECTION */}
      <div className="card ledger-card">
        <div className="card-header-flex">
          <h2><FaHistory style={{ marginRight: '10px' }} /> Stock Transfer Audit Ledger</h2>
          <button className="btn btn-sm btn-secondary" onClick={fetchInitialData}>Refresh Ledger</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product / Variant</th>
                <th>Quantity</th>
                <th>Sender Location</th>
                <th>Receiver Location</th>
                <th>Reference Reason</th>
                <th>Authorized Operator</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((item) => (
                <tr key={item._id}>
                  <td className="time-col">
                    {new Date(item.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <strong>{item.productName || (item.product && item.product.name) || 'N/A'}</strong>
                    {item.variantLabel && <span className="variant-lbl">({item.variantLabel})</span>}
                  </td>
                  <td className="qty-col">
                    <span className="badge badge-info">{item.quantity} units</span>
                  </td>
                  <td>{item.sourceWarehouseName || 'External Intake'}</td>
                  <td>{item.destinationWarehouseName || 'Stock Output'}</td>
                  <td>{item.reason}</td>
                  <td>
                    <div className="operator-cell">
                      <FaUser className="icon" /> {item.operatorName || 'System'}
                    </div>
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan="7" className="no-data">No warehouse transactions recorded in the audit ledger.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DRAWERS */}
      
      {/* 1. Create Warehouse Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create Location Hub</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateWarehouse}>
              <div className="form-group">
                <label>Warehouse Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  placeholder="e.g. Mumbai Regional Hub"
                />
              </div>
              <div className="form-group">
                <label>Warehouse Code (Unique Prefix)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={newWarehouse.code}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                  placeholder="e.g. WH-MUM-01"
                />
              </div>
              <div className="form-group">
                <label>City Location</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={newWarehouse.city}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="form-group">
                <label>Full Address</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={newWarehouse.address}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                  placeholder="e.g. Lane 4, Industrial Area East"
                />
              </div>
              <div className="form-group">
                <label>Max Storage Capacity Units</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  value={newWarehouse.capacity}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: parseInt(e.target.value) })}
                  placeholder="1000"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Initialize Location</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Stock Intake Modal */}
      {showIntakeModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Record Stock Intake Procurement</h3>
              <button className="close-btn" onClick={() => setShowIntakeModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleIntakeStock}>
              <div className="form-group">
                <label>Target Warehouse Location</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="🔍 Type to filter warehouses..."
                  value={warehouseSearchIntake}
                  onChange={(e) => setWarehouseSearchIntake(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <select 
                  className="form-control"
                  required
                  value={intakeData.warehouseId}
                  onChange={(e) => setIntakeData({ ...intakeData, warehouseId: e.target.value })}
                >
                  <option value="">-- Select Destination --</option>
                  {warehouses
                    .filter(w => 
                      w.name.toLowerCase().includes(warehouseSearchIntake.toLowerCase()) || 
                      w.code.toLowerCase().includes(warehouseSearchIntake.toLowerCase())
                    )
                    .map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="isCustomProductCheck"
                    checked={isCustomProduct}
                    onChange={(e) => {
                      setIsCustomProduct(e.target.checked);
                      setIntakeData({ ...intakeData, productId: '', variantId: '' });
                    }}
                  />
                  <label htmlFor="isCustomProductCheck" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>
                    Enter a new product (Not listed in catalog)
                  </label>
                </div>

                {isCustomProduct ? (
                  <div>
                    <label>New Product Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Premium Kashmiri Saffron"
                      required
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                    />
                    <small style={{ color: '#888' }}>
                      This product will be auto-registered in the database upon executing intake.
                    </small>
                  </div>
                ) : (
                  <div>
                    <label>Product Item</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="🔍 Type to filter products..."
                      value={intakeSearch}
                      onChange={(e) => setIntakeSearch(e.target.value)}
                      style={{ marginBottom: '8px' }}
                    />
                    <select 
                      className="form-control"
                      required
                      value={intakeData.productId}
                      onChange={(e) => setIntakeData({ ...intakeData, productId: e.target.value, variantId: '' })}
                    >
                      <option value="">-- Select Product --</option>
                      {products.filter(p => p.name.toLowerCase().includes(intakeSearch.toLowerCase())).map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    {products.filter(p => p.name.toLowerCase().includes(intakeSearch.toLowerCase())).length === 0 && intakeSearch.trim().length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            setIsCustomProduct(true);
                            setCustomProductName(intakeSearch);
                          }}
                        >
                          ➕ Add "{intakeSearch}" as a new product
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {intakeData.productId && getSelectedProductVariants(intakeData.productId).length > 0 && (
                <div className="form-group">
                  <label>Product Variant</label>
                  <select 
                    className="form-control"
                    required
                    value={intakeData.variantId}
                    onChange={(e) => setIntakeData({ ...intakeData, variantId: e.target.value })}
                  >
                    <option value="">-- Select Variant --</option>
                    {getSelectedProductVariants(intakeData.productId).map(v => (
                      <option key={v._id} value={v._id}>
                        {v.attributes.map(a => a.value).join(' / ')} (SKU: {v.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Intake Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  required
                  value={intakeData.quantity}
                  onChange={(e) => setIntakeData({ ...intakeData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Authorized Operator Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={intakeData.operatorName}
                  onChange={(e) => setIntakeData({ ...intakeData, operatorName: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div className="form-group">
                <label>Procurement Reason / Reference ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={intakeData.reason}
                  onChange={(e) => setIntakeData({ ...intakeData, reason: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">Execute Intake</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Stock Transfer Modal */}
      {showTransferModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Execute Inter-Warehouse Stock Transfer</h3>
              <button className="close-btn" onClick={() => setShowTransferModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleTransferStock}>
              <div className="form-group">
                <label>Source Warehouse (Origin)</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="🔍 Type to filter source warehouses..."
                  value={warehouseSearchSource}
                  onChange={(e) => setWarehouseSearchSource(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <select 
                  className="form-control"
                  required
                  value={transferData.sourceWarehouseId}
                  onChange={(e) => setTransferData({ ...transferData, sourceWarehouseId: e.target.value })}
                >
                  <option value="">-- Select Origin Location --</option>
                  {warehouses
                    .filter(w => 
                      w.name.toLowerCase().includes(warehouseSearchSource.toLowerCase()) || 
                      w.code.toLowerCase().includes(warehouseSearchSource.toLowerCase())
                    )
                    .map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label>Destination Warehouse (Target)</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="🔍 Type to filter target warehouses..."
                  value={warehouseSearchDest}
                  onChange={(e) => setWarehouseSearchDest(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <select 
                  className="form-control"
                  required
                  value={transferData.destinationWarehouseId}
                  onChange={(e) => setTransferData({ ...transferData, destinationWarehouseId: e.target.value })}
                >
                  <option value="">-- Select Target Location --</option>
                  {warehouses
                    .filter(w => 
                      w.name.toLowerCase().includes(warehouseSearchDest.toLowerCase()) || 
                      w.code.toLowerCase().includes(warehouseSearchDest.toLowerCase())
                    )
                    .map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                    ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label>Product Item</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="🔍 Type to filter products..."
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <select 
                  className="form-control"
                  required
                  value={transferData.productId}
                  onChange={(e) => setTransferData({ ...transferData, productId: e.target.value, variantId: '' })}
                >
                  <option value="">-- Select Product --</option>
                  {products.filter(p => p.name.toLowerCase().includes(transferSearch.toLowerCase())).map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {transferData.productId && getSelectedProductVariants(transferData.productId).length > 0 && (
                <div className="form-group">
                  <label>Product Variant</label>
                  <select 
                    className="form-control"
                    required
                    value={transferData.variantId}
                    onChange={(e) => setTransferData({ ...transferData, variantId: e.target.value })}
                  >
                    <option value="">-- Select Variant --</option>
                    {getSelectedProductVariants(transferData.productId).map(v => (
                      <option key={v._id} value={v._id}>
                        {v.attributes.map(a => a.value).join(' / ')} (SKU: {v.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Transfer Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  required
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Authorized Operator Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={transferData.operatorName}
                  onChange={(e) => setTransferData({ ...transferData, operatorName: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div className="form-group">
                <label>Transfer Reason / Compliance Notes</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">Execute Transfer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;