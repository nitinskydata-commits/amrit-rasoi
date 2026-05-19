import React, { useState } from 'react';
import { 
  FaDownload, 
  FaCalendarAlt, 
  FaDatabase, 
  FaFileCsv, 
  FaCheckCircle, 
  FaSpinner, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import { 
  getAllOrders, 
  getAuditLogs, 
  getAllProducts, 
  getAllUsers, 
  getAllReviews, 
  getInventory, 
  getTransactions 
} from '../utils/api';
import './ExportCenter.css';

const ExportCenter = () => {
  const [dataType, setDataType] = useState('orders');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const dataOptions = [
    { value: 'orders', label: '📦 Orders Details', desc: 'Customer orders, transaction values, status, items' },
    { value: 'audit-logs', label: '🛡️ Audit Compliance Logs', desc: 'Operator actions, state changes, IP logs' },
    { value: 'products', label: '🏷️ Products Catalog', desc: 'Product info, current price, SKU list, variants' },
    { value: 'users', label: '👥 User & Staff Directory', desc: 'Customers, staff profiles, registrations' },
    { value: 'reviews', label: '⭐ Customer Reviews', desc: 'Product ratings, comments, verified status' },
    { value: 'inventory', label: '📊 Inventory Records', desc: 'Stock quantities, product pricing, replenishment status' },
    { value: 'finance', label: '💼 Financial Transactions', desc: 'Revenues, commission splits, CGST/SGST details' }
  ];

  const handleExport = async () => {
    setExporting(true);
    setErrorMsg(null);
    setStatusMsg('Initializing secure connection to ledger database...');

    try {
      let data = [];
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      setStatusMsg('Retrieving data records from API...');

      switch (dataType) {
        case 'orders': {
          const res = await getAllOrders({ limit: 10000 });
          if (res.data?.success) {
            data = (res.data.orders || []).filter(item => {
              const d = new Date(item.createdAt);
              return d >= start && d <= end;
            });
          }
          break;
        }
        case 'audit-logs': {
          const res = await getAuditLogs({ limit: 20000 });
          if (res.data?.success) {
            data = (res.data.logs || []).filter(item => {
              const d = new Date(item.createdAt);
              return d >= start && d <= end;
            });
          }
          break;
        }
        case 'products': {
          const res = await getAllProducts({ limit: 10000 });
          if (res.data?.success) {
            data = (res.data.products || []).filter(item => {
              const d = new Date(item.createdAt || Date.now());
              return d >= start && d <= end;
            });
          }
          break;
        }
        case 'users': {
          const res = await getAllUsers();
          if (res.data?.success) {
            data = (res.data.users || []).filter(item => {
              const d = new Date(item.createdAt || Date.now());
              return d >= start && d <= end;
            });
          }
          break;
        }
        case 'reviews': {
          const res = await getAllReviews();
          if (res.data?.success) {
            data = (res.data.reviews || []).filter(item => {
              const d = new Date(item.createdAt || Date.now());
              return d >= start && d <= end;
            });
          }
          break;
        }
        case 'inventory': {
          const res = await getInventory();
          if (res.data?.success) {
            data = (res.data.products || []).filter(item => {
              const d = new Date(item.createdAt || Date.now());
              return d >= start && d <= end;
            });
          }
          break;
        }
        case 'finance': {
          const res = await getTransactions();
          if (res.data?.success) {
            data = (res.data.transactions || []).filter(item => {
              const d = new Date(item.createdAt || Date.now());
              return d >= start && d <= end;
            });
          }
          break;
        }
        default:
          throw new Error('Unsupported data type');
      }

      if (data.length === 0) {
        setErrorMsg(`No ${dataType} records found within the selected calendar duration.`);
        setExporting(false);
        setStatusMsg(null);
        return;
      }

      setStatusMsg(`Compiling ${data.length} records into CSV format...`);

      let headers = [];
      let rows = [];

      if (dataType === 'orders') {
        headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Total Price (INR)', 'Order Status', 'Payment Method', 'Delivery Status', 'Items Count'];
        rows = data.map(item => [
          item._id,
          new Date(item.createdAt).toLocaleDateString('en-IN'),
          item.shippingInfo?.name || item.user?.name || 'N/A',
          item.user?.email || 'N/A',
          item.totalPrice,
          item.orderStatus,
          item.paymentInfo?.method || 'N/A',
          item.deliveryStatus || 'N/A',
          item.orderItems?.length || 0
        ]);
      } else if (dataType === 'audit-logs') {
        headers = ['Log ID', 'Timestamp', 'Operator Name', 'Role', 'Action Triggered', 'Target Model', 'Target ID', 'IP Address'];
        rows = data.map(item => [
          item._id,
          new Date(item.createdAt).toISOString(),
          item.userName || 'System',
          item.role || 'System',
          item.action,
          item.targetModel,
          item.targetId,
          item.ipAddress
        ]);
      } else if (dataType === 'products') {
        headers = ['Product ID', 'Name', 'Brand', 'SKU', 'Selling Price (INR)', 'MRP (INR)', 'Stock', 'Category', 'Rating', 'Reviews Count', 'Created At'];
        rows = data.map(item => [
          item._id,
          item.name,
          item.brand || 'Amrit Rasoi',
          item.variants?.[0]?.sku || 'N/A',
          item.price,
          item.mrp,
          item.stock,
          item.category,
          item.ratings || 0,
          item.numOfReviews || 0,
          new Date(item.createdAt).toLocaleDateString('en-IN')
        ]);
      } else if (dataType === 'users') {
        headers = ['User ID', 'Name', 'Email', 'Role', 'Created At'];
        rows = data.map(item => [
          item._id,
          item.name,
          item.email,
          item.role,
          new Date(item.createdAt).toLocaleDateString('en-IN')
        ]);
      } else if (dataType === 'reviews') {
        headers = ['Review ID', 'Product Name', 'Reviewer', 'Rating', 'Title', 'Comment', 'Verified Purchase', 'Created At'];
        rows = data.map(item => [
          item._id,
          item.productName || 'N/A',
          item.name,
          item.rating,
          item.title,
          item.comment,
          item.verifiedPurchase ? 'Yes' : 'No',
          new Date(item.createdAt).toLocaleDateString('en-IN')
        ]);
      } else if (dataType === 'inventory') {
        headers = ['Product Name', 'SKU', 'Stock Level', 'Selling Price (INR)', 'MRP (INR)', 'Status'];
        rows = data.map(item => [
          item.name,
          item.variants?.[0]?.sku || 'N/A',
          item.stock,
          item.price,
          item.mrp,
          item.stock > 0 ? 'In Stock' : 'Out of Stock'
        ]);
      } else if (dataType === 'finance') {
        headers = ['Transaction ID', 'Order ID', 'Date', 'Amount (INR)', 'Commission (10%)', 'Net Payout (90%)', 'CGST (9%)', 'SGST (9%)', 'Total GST Collected'];
        rows = data.map(item => [
          item._id,
          item.orderId || 'N/A',
          new Date(item.createdAt).toLocaleDateString('en-IN'),
          item.amount || 0,
          (item.amount || 0) * 0.1,
          (item.amount || 0) * 0.9,
          (item.amount || 0) * 0.09,
          (item.amount || 0) * 0.09,
          (item.amount || 0) * 0.18
        ]);
      }

      // Convert JSON array to CSV string safely
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(val => {
            const clean = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
            return `"${clean}"`;
          }).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${dataType}_export_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMsg(`Successfully exported ${data.length} records to CSV!`);
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process data export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-page">
      <div className="page-header">
        <div>
          <h1>📊 Secure Data Export Center</h1>
          <p>Download filtered compliance, order, financial, and catalog ledgers to CSV by calendar duration.</p>
        </div>
      </div>

      <div className="export-container">
        <div className="card export-card">
          <div className="export-sections-grid">
            
            {/* Left Column: Data Type Choice */}
            <div className="export-choices-section">
              <h3>1. Select Dataset to Export</h3>
              <p className="section-subtitle">Select the ledger or catalog you wish to download</p>
              <div className="options-list">
                {dataOptions.map((opt) => (
                  <div 
                    key={opt.value} 
                    className={`option-item ${dataType === opt.value ? 'selected' : ''}`}
                    onClick={() => setDataType(opt.value)}
                  >
                    <div className="option-radio">
                      <div className="radio-circle"></div>
                    </div>
                    <div className="option-details">
                      <span className="option-label">{opt.label}</span>
                      <span className="option-desc">{opt.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Time Duration (Calendar Selection) */}
            <div className="export-filters-section">
              <h3>2. Select Calendar Duration</h3>
              <p className="section-subtitle">Select the exact date range for the data export</p>
              
              <div className="calendar-inputs-row">
                <div className="date-input-group">
                  <label><FaCalendarAlt /> Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    max={endDate}
                  />
                </div>
                <div className="date-input-group">
                  <label><FaCalendarAlt /> End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="export-status-area">
                {exporting && (
                  <div className="status-box status-loading">
                    <FaSpinner className="spinner" />
                    <span>{statusMsg}</span>
                  </div>
                )}
                {statusMsg && !exporting && (
                  <div className="status-box status-success">
                    <FaCheckCircle />
                    <span>{statusMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="status-box status-error">
                    <FaExclamationTriangle />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <div className="action-button-container">
                <button 
                  onClick={handleExport} 
                  className="btn-export-trigger"
                  disabled={exporting}
                >
                  <FaDownload /> {exporting ? 'Processing Export...' : 'Generate & Download CSV'}
                </button>
              </div>

              <div className="export-notes">
                <h4>⚠️ Security & Compliance Notice</h4>
                <p>Data exported from Amrit Rasoi contains private customer detail structures. All downloads are logged in the Compliance Audit Vault under your operator credentials.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;
