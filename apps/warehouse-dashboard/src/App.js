import React, { useState, useEffect } from 'react';
import { 
  FaWarehouse, 
  FaPlusCircle, 
  FaExchangeAlt, 
  FaHistory, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaBoxes,
  FaSignOutAlt,
  FaUserShield,
  FaLock
} from 'react-icons/fa';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000/api/v1';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('warehouseToken') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('warehouseUser') || 'null');
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('inventory');
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  
  // Search state filters for products & warehouses
  const [intakeSearch, setIntakeSearch] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [warehouseSearchIntake, setWarehouseSearchIntake] = useState('');
  const [warehouseSearchSource, setWarehouseSearchSource] = useState('');
  const [warehouseSearchDest, setWarehouseSearchDest] = useState('');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState('');

  // Form states
  const [intakeData, setIntakeData] = useState({
    warehouseId: '',
    productId: '',
    quantity: ''
  });
  
  const [transferData, setTransferData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getAuthHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    if (token) {
      fetchWarehouses();
      fetchProducts();
      fetchLedger();
    }
  }, [token]);

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/warehouses`, getAuthHeaders());
      const whList = res.data.warehouses || res.data.data || [];
      setWarehouses(whList);
      if (whList.length > 0) {
        setIntakeData(prev => ({ ...prev, warehouseId: whList[0]._id }));
        setTransferData(prev => ({ 
          ...prev, 
          fromWarehouseId: whList[0]._id,
          toWarehouseId: whList[1]?._id || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/products`, getAuthHeaders());
      setProducts(res.data.products || []);
      if (res.data.products?.length > 0) {
        setIntakeData(prev => ({ ...prev, productId: res.data.products[0]._id }));
        setTransferData(prev => ({ ...prev, productId: res.data.products[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await axios.get(`${API_BASE}/warehouses/ledger`, getAuthHeaders());
      setLedger(res.data.ledger || res.data.data || []);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const res = await axios.post(`${API_BASE}/login`, {
        email: loginEmail,
        password: loginPassword
      });
      if (res.data.success) {
        const allowedRoles = [
          'admin', 
          'platform_admin', 
          'warehouse_manager', 
          'warehouse_staff', 
          'inventory_manager',
          'staff',
          'regional_manager'
        ];
        if (!allowedRoles.includes(res.data.user.role)) {
          setAuthError('Unauthorized access score: Only authorized operators can access SBMI Logistics Hub.');
          return;
        }
        localStorage.setItem('warehouseToken', res.data.token);
        localStorage.setItem('warehouseUser', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('warehouseToken');
    localStorage.removeItem('warehouseUser');
    setToken('');
    setUser(null);
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    const finalProductId = isCustomProduct ? customProductName.trim() : intakeData.productId;
    if (!intakeData.warehouseId || !finalProductId || !intakeData.quantity) {
      alert('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/warehouses/intake`, {
        ...intakeData,
        productId: finalProductId,
        quantity: Number(intakeData.quantity)
      }, getAuthHeaders());
      setMessage({ type: 'success', text: 'Stock intake completed successfully!' });
      setIntakeData(prev => ({ ...prev, quantity: '', productId: '' }));
      setIsCustomProduct(false);
      setCustomProductName('');
      fetchWarehouses();
      fetchLedger();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Stock intake failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferData.fromWarehouseId || !transferData.toWarehouseId || !transferData.productId || !transferData.quantity) return;
    if (transferData.fromWarehouseId === transferData.toWarehouseId) {
      setMessage({ type: 'error', text: 'Source and destination warehouses must be different' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post(`${API_BASE}/warehouses/transfer`, {
        ...transferData,
        quantity: Number(transferData.quantity)
      }, getAuthHeaders());
      setMessage({ type: 'success', text: 'Inter-warehouse transfer completed successfully!' });
      setTransferData(prev => ({ ...prev, quantity: '' }));
      fetchWarehouses();
      fetchLedger();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Stock transfer failed' });
    } finally {
      setLoading(false);
    }
  };

  // Render Login overlay if not authenticated
  if (!token || !user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <FaWarehouse className="logo-icon" />
            <h2>SBMI Logistics Hub</h2>
            <p>Enter credentials to access Fulfillment Center Systems</p>
          </div>
          
          {authError && (
            <div className="login-error">
              <FaExclamationTriangle />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Operator Email Address</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
                placeholder="e.g. manager@sbmi.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Security Access Password</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
            </div>
            <div className="sandbox-hint" style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '10px 0', textAlign: 'center' }}>
              💡 Admin Credentials: <strong>admin@sbmi.com</strong> / <strong>admin123</strong>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? <FaSpinner className="spin" /> : <><FaLock style={{ marginRight: '8px' }} /> Verify Identity</>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="warehouse-app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-logo">
          <FaWarehouse className="logo-icon" />
          <div>
            <h2>SBMI</h2>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Logistics Hub</span>
          </div>
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <FaBoxes /> Warehouses Stock
          </button>
          <button 
            className={`nav-item ${activeTab === 'intake' ? 'active' : ''}`}
            onClick={() => setActiveTab('intake')}
          >
            <FaPlusCircle /> Stock Procurement
          </button>
          <button 
            className={`nav-item ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            <FaExchangeAlt /> Inter-Warehouse Transfer
          </button>
          <button 
            className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <FaHistory /> Transfer Ledger
          </button>
        </nav>

        {/* User status and signout */}
        <div className="staff-profile">
          <div className="staff-info">
            <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <div className="details">
              <span className="name">{user.name}</span>
              <span className="role">{user.role?.toUpperCase()}</span>
            </div>
          </div>
          <button type="button" className="btn-signout" onClick={handleLogout}>
            <FaSignOutAlt style={{ marginRight: '6px' }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div>
            <h1 style={{ fontSize: '26px' }}>Fulfillment Center Logistics</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>SBMI Global Logistics Network</p>
          </div>
          <div className="status-badge">Supervised Operational Mode</div>
        </header>

        {message.text && (
          <div className={`alert-box alert-${message.type}`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab views */}
        {activeTab === 'inventory' && (
          <div className="tab-pane fade-in">
            <div className="warehouses-grid">
              {warehouses.map(wh => {
                const occupancyPct = wh.capacity > 0 ? Math.min(100, Math.round(((wh.stockItems?.reduce((a, b) => a + b.quantity, 0) || 0) / wh.capacity) * 100)) : 0;
                return (
                  <div key={wh._id} className="wh-card">
                    <div className="wh-header">
                      <h3>{wh.name}</h3>
                      <span className="location">{wh.city || wh.location || 'Central Hub'}</span>
                    </div>
                    
                    <div className="gauge-container">
                      <div className="gauge-label">
                        <span>Occupancy</span>
                        <span>{occupancyPct}%</span>
                      </div>
                      <div className="gauge-track">
                        <div className="gauge-bar" style={{ width: `${occupancyPct}%`, backgroundColor: occupancyPct > 85 ? '#dc2626' : occupancyPct > 60 ? '#f59e0b' : '#10b981' }}></div>
                      </div>
                    </div>

                    <div className="wh-stats">
                      <div>
                        <span className="stat-label">Capacity</span>
                        <span className="stat-val">{wh.capacity} units</span>
                      </div>
                      <div>
                        <span className="stat-label">Unique Items</span>
                        <span className="stat-val">{wh.stockItems?.length || 0} items</span>
                      </div>
                    </div>

                    <div className="stock-breakdown">
                      <h4>Stock Levels</h4>
                      <ul>
                        {wh.stockItems?.map(item => {
                          const prodName = products.find(p => p._id === item.productId)?.name || 'Unknown Product';
                          return (
                            <li key={item.productId}>
                              <span>{prodName}</span>
                              <strong>{item.quantity} units</strong>
                            </li>
                          );
                        })}
                        {(!wh.stockItems || wh.stockItems.length === 0) && (
                          <li className="no-items">No stock currently stored here.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
              {warehouses.length === 0 && (
                <div className="no-warehouses-placeholder">
                  <p>No active warehouses connected. Add warehouses in the Admin Dashboard to link them here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'intake' && (
          <div className="tab-pane fade-in">
            <div className="card form-container-card">
              <h2>Procurement Intake Entry</h2>
              <p>Log incoming deliveries from supplier partners directly into the inventory system.</p>
              
              <form onSubmit={handleIntakeSubmit}>
                <div className="form-group">
                  <label>Destination Fulfillment Center</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="🔍 Type to filter warehouses..."
                    value={warehouseSearchIntake}
                    onChange={(e) => setWarehouseSearchIntake(e.target.value)}
                    style={{ marginBottom: '8px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <select 
                    value={intakeData.warehouseId} 
                    onChange={e => setIntakeData({...intakeData, warehouseId: e.target.value})}
                    required
                  >
                    <option value="">-- Select Destination Warehouse --</option>
                    {warehouses
                      .filter(wh => 
                        wh.name.toLowerCase().includes(warehouseSearchIntake.toLowerCase()) || 
                        (wh.city || wh.location || '').toLowerCase().includes(warehouseSearchIntake.toLowerCase())
                      )
                      .map(wh => (
                        <option key={wh._id} value={wh._id}>{wh.name} ({wh.city || wh.location})</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="isCustomProductCheckLogistics"
                      checked={isCustomProduct}
                      onChange={(e) => {
                        setIsCustomProduct(e.target.checked);
                        setIntakeData({ ...intakeData, productId: '' });
                      }}
                    />
                    <label htmlFor="isCustomProductCheckLogistics" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>
                      Enter a new product (Not listed in catalog)
                    </label>
                  </div>

                  {isCustomProduct ? (
                    <div>
                      <label>New Product Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Premium Kashmiri Saffron"
                        required
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                      />
                      <small style={{ color: '#888', display: 'block', marginTop: '4px' }}>
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
                        style={{ marginBottom: '8px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
                      />
                      <select 
                        value={intakeData.productId} 
                        onChange={e => setIntakeData({...intakeData, productId: e.target.value})}
                        required
                      >
                        <option value="">-- Select Product --</option>
                        {products.filter(p => p.name.toLowerCase().includes(intakeSearch.toLowerCase())).map(p => (
                          <option key={p._id} value={p._id}>{p.name} (Price: ₹{p.price})</option>
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

                <div className="form-group">
                  <label>Intake Quantity</label>
                  <input 
                    type="number"
                    value={intakeData.quantity}
                    onChange={e => setIntakeData({...intakeData, quantity: e.target.value})}
                    placeholder="e.g. 50"
                    required
                    min="1"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <FaSpinner className="spin" /> : 'Execute Procurement Entry'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="tab-pane fade-in">
            <div className="card form-container-card">
              <h2>Inter-Warehouse Transfer</h2>
              <p>Relocate product stock between fulfillment nodes to maintain optimal supply levels.</p>
              
              <form onSubmit={handleTransferSubmit}>
                <div className="form-group">
                  <label>Source Warehouse (From)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="🔍 Type to filter source warehouses..."
                    value={warehouseSearchSource}
                    onChange={(e) => setWarehouseSearchSource(e.target.value)}
                    style={{ marginBottom: '8px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <select 
                    value={transferData.fromWarehouseId} 
                    onChange={e => setTransferData({...transferData, fromWarehouseId: e.target.value})}
                    required
                  >
                    <option value="">-- Select Source --</option>
                    {warehouses
                      .filter(wh => 
                        wh.name.toLowerCase().includes(warehouseSearchSource.toLowerCase()) || 
                        (wh.city || wh.location || '').toLowerCase().includes(warehouseSearchSource.toLowerCase())
                      )
                      .map(wh => (
                        <option key={wh._id} value={wh._id}>{wh.name} ({wh.city || wh.location})</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label>Destination Warehouse (To)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="🔍 Type to filter destination warehouses..."
                    value={warehouseSearchDest}
                    onChange={(e) => setWarehouseSearchDest(e.target.value)}
                    style={{ marginBottom: '8px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <select 
                    value={transferData.toWarehouseId} 
                    onChange={e => setTransferData({...transferData, toWarehouseId: e.target.value})}
                    required
                  >
                    <option value="">-- Select Destination --</option>
                    {warehouses
                      .filter(wh => 
                        wh.name.toLowerCase().includes(warehouseSearchDest.toLowerCase()) || 
                        (wh.city || wh.location || '').toLowerCase().includes(warehouseSearchDest.toLowerCase())
                      )
                      .map(wh => (
                        <option key={wh._id} value={wh._id}>{wh.name} ({wh.city || wh.location})</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label>Product Item to Transfer</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="🔍 Type to filter products..."
                    value={transferSearch}
                    onChange={(e) => setTransferSearch(e.target.value)}
                    style={{ marginBottom: '8px', padding: '8px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <select 
                    value={transferData.productId} 
                    onChange={e => setTransferData({...transferData, productId: e.target.value})}
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.filter(p => p.name.toLowerCase().includes(transferSearch.toLowerCase())).map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Transfer Quantity</label>
                  <input 
                    type="number"
                    value={transferData.quantity}
                    onChange={e => setTransferData({...transferData, quantity: e.target.value})}
                    placeholder="e.g. 20"
                    required
                    min="1"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <FaSpinner className="spin" /> : 'Initiate Stock Transfer'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="tab-pane fade-in">
            <div className="card ledger-card">
              <h2>Fulfillment Audit Log Ledger</h2>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Time Logged</th>
                      <th>Activity Type</th>
                      <th>Warehouse</th>
                      <th>Product</th>
                      <th>Quantity Change</th>
                      <th>Reference ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map(log => {
                      const whName = warehouses.find(w => w._id === log.warehouseId)?.name || 'Warehouse';
                      const prodName = products.find(p => p._id === log.productId)?.name || 'Unknown Product';
                      return (
                        <tr key={log._id}>
                          <td>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`badge badge-${log.type === 'in' ? 'success' : log.type === 'out' ? 'danger' : 'info'}`}>
                              {log.type === 'in' ? 'Procurement IN' : log.type === 'out' ? 'Delivery OUT' : 'Transfer ADJUST'}
                            </span>
                          </td>
                          <td>{whName}</td>
                          <td><strong>{prodName}</strong></td>
                          <td className={`qty-cell ${log.type === 'in' ? 'qty-in' : 'qty-out'}`}>
                            {log.type === 'in' ? '+' : '-'}{log.quantity}
                          </td>
                          <td><code>{log._id}</code></td>
                        </tr>
                      );
                    })}
                    {ledger.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center">No transactions recorded in the logistics ledger.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
