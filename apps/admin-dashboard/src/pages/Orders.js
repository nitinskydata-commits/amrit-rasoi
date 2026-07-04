import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus, getSettings, getAllWarehouses } from '../utils/api';
import { FaSearch, FaBox, FaCheckCircle, FaTruck, FaGift, FaTimesCircle, FaFileInvoice, FaPrint, FaTag } from 'react-icons/fa';
import './Orders.css';

const ORDER_STEPS = ['Processing', 'Confirmed', 'Shipped', 'Delivered'];

const getStatusClass = (status) => {
  return (status || '').toLowerCase();
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [companyInfo, setCompanyInfo] = useState({});
  const [warehouses, setWarehouses] = useState([]);

  // Helper: resolve the origin/seller address for an order
  const getSellerAddress = (order) => {
    // Try to find the warehouse that fulfilled this order
    const whId = order.orderItems?.[0]?.warehouseId;
    if (whId) {
      const wh = warehouses.find(w => w._id === whId || w._id === whId?.toString());
      if (wh) {
        return {
          name: companyInfo.siteName || 'Amrit Rasoi',
          line1: wh.name + (wh.code ? ` (${wh.code})` : ''),
          line2: `${wh.address || ''}`,
          city: wh.city || '',
          state: wh.state || '',
          phone: companyInfo.supportPhone || '',
          email: companyInfo.supportEmail || '',
          gstin: companyInfo.companyGSTIN || '',
          pan: companyInfo.companyPAN || '',
        };
      }
    }
    // Fallback to company settings
    return {
      name: companyInfo.siteName || 'Amrit Rasoi',
      line1: 'A Brand of SBMI',
      line2: companyInfo.companyAddress || 'Sikar, Rajasthan, India',
      city: '',
      state: '',
      phone: companyInfo.supportPhone || '',
      email: companyInfo.supportEmail || '',
      gstin: companyInfo.companyGSTIN || '',
      pan: companyInfo.companyPAN || '',
    };
  };

  // ── Print Invoice ──
  const printInvoice = (order) => {
    const seller = getSellerAddress(order);
    const itemsHtml = order.orderItems.map((item, i) => {
      const taxableVal = item.price * item.quantity;
      const gstAmt = (taxableVal * (item.gstRate || 18)) / (100 + (item.gstRate || 18));
      return `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${item.name}${item.variantLabel ? `<br/><small style="color:#888">${item.variantLabel}</small>` : ''}</td>
        <td style="text-align:right">₹${item.price.toFixed(2)}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:center">${item.gstRate || 18}%</td>
        <td style="text-align:right">₹${(taxableVal - gstAmt).toFixed(2)}</td>
        <td style="text-align:right">₹${gstAmt.toFixed(2)}</td>
        <td style="text-align:right">₹${taxableVal.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const invoiceHtml = `<!DOCTYPE html><html><head><title>Invoice #${order._id.slice(-8).toUpperCase()}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 0; font-size: 13px; background: #f8fafc; }
      .invoice { max-width: 800px; margin: 20px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
      .inv-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 30px 30px 20px; border-bottom: 3px solid #4f46e5; }
      .inv-brand { font-size: 24px; font-weight: 800; color: #4f46e5; }
      .inv-brand small { display: block; font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px; }
      .inv-title { text-align: right; }
      .inv-title h2 { font-size: 20px; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; }
      .inv-title .meta { font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.6; }
      .inv-addresses { display: flex; gap: 20px; padding: 20px 30px; }
      .inv-addresses .box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; }
      .inv-addresses .box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #4f46e5; margin-bottom: 8px; font-weight: 700; }
      .inv-addresses .box p { font-size: 12px; line-height: 1.6; color: #334155; }
      .inv-table { width: 100%; border-collapse: collapse; }
      .inv-table th { background: #1e293b; color: #fff; padding: 10px 12px; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
      .inv-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
      .inv-table tr:nth-child(even) td { background: #fafbfc; }
      .inv-summary { padding: 20px 30px; display: flex; justify-content: flex-end; }
      .inv-summary table { width: 280px; }
      .inv-summary td { padding: 6px 10px; font-size: 12px; }
      .inv-summary .lbl { text-align: right; color: #64748b; }
      .inv-summary .val { text-align: right; font-weight: 600; width: 100px; }
      .inv-summary .grand td { border-top: 2px solid #1e293b; font-size: 15px; font-weight: 800; padding-top: 10px; color: #1e293b; }
      .inv-footer { text-align: center; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.6; }
      .no-print { text-align: center; padding: 15px; }
      .no-print button { background: #4f46e5; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; margin: 0 6px; }
      .no-print button.secondary { background: #64748b; }
      @media print { .no-print { display: none; } body { background: #fff; padding: 0; } .invoice { border: none; margin: 0; border-radius: 0; } .inv-header { border-bottom-width: 2px; } }
    </style></head><body>
      <div class="no-print">
        <button onclick="window.print()">🖨️ Print Invoice</button>
        <button class="secondary" onclick="window.close()">Close</button>
      </div>
      <div class="invoice">
        <div class="inv-header">
          <div><div class="inv-brand">Amrit Rasoi<small>A Brand of SBMI</small></div></div>
          <div class="inv-title">
            <h2>Tax Invoice</h2>
            <div class="meta">
              <strong>Invoice:</strong> INV-${order._id.slice(-8).toUpperCase()}<br/>
              <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
              <strong>Order:</strong> #${order._id.slice(-8).toUpperCase()}<br/>
              <strong>Payment:</strong> ${order.paymentMethod} — ${order.paymentStatus}
            </div>
          </div>
        </div>
        <div class="inv-addresses">
          <div class="box"><h4>Seller / Dispatched From</h4><p>
            <strong>${seller.name}</strong><br/>
            ${seller.line1}<br/>
            ${seller.line2}${seller.city ? '<br/>' + seller.city : ''}${seller.state ? ', ' + seller.state : ''}<br/>
            ${seller.phone ? 'Phone: ' + seller.phone + '<br/>' : ''}
            ${seller.email ? 'Email: ' + seller.email + '<br/>' : ''}
            ${seller.gstin ? '<strong>GSTIN:</strong> ' + seller.gstin + '<br/>' : ''}
            ${seller.pan ? '<strong>PAN:</strong> ' + seller.pan : ''}
          </p></div>
          <div class="box"><h4>Ship To</h4><p>
            <strong>${order.shippingAddress?.name || order.user?.name || ''}</strong><br/>
            ${order.shippingAddress?.address || ''}<br/>
            ${order.shippingAddress?.city || ''}${order.shippingAddress?.state ? ', ' + order.shippingAddress.state : ''}${order.shippingAddress?.pincode ? ' — ' + order.shippingAddress.pincode : ''}<br/>
            Phone: ${order.shippingAddress?.phone || order.user?.phone || '—'}
          </p></div>
        </div>
        <table class="inv-table">
          <thead><tr><th style="width:5%;text-align:center">#</th><th style="text-align:left">Item</th><th style="text-align:right">Price</th><th style="text-align:center">Qty</th><th style="text-align:center">GST</th><th style="text-align:right">Taxable</th><th style="text-align:right">Tax</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="inv-summary"><table>
          <tr><td class="lbl">Subtotal:</td><td class="val">₹${order.itemsPrice?.toFixed(2)}</td></tr>
          <tr><td class="lbl">Shipping:</td><td class="val">${order.shippingPrice > 0 ? '₹' + order.shippingPrice.toFixed(2) : 'FREE'}</td></tr>
          <tr><td class="lbl">Tax (GST):</td><td class="val">₹${order.taxPrice?.toFixed(2)}</td></tr>
          ${order.codFee > 0 ? `<tr><td class="lbl">COD Fee:</td><td class="val">₹${order.codFee.toFixed(2)}</td></tr>` : ''}
          <tr class="grand"><td class="lbl">Grand Total:</td><td class="val">₹${order.totalPrice?.toFixed(2)}</td></tr>
        </table></div>
        <div class="inv-footer">Thank you for shopping with Amrit Rasoi!<br/>For queries, contact customer support.<br/><strong>Shree Bhanwal Mata Industries (SBMI)</strong></div>
      </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(invoiceHtml);
    win.document.close();
  };

  // ── Print Shipping Label ──
  const printShippingLabel = (order) => {
    const seller = getSellerAddress(order);
    const labelHtml = `<!DOCTYPE html><html><head><title>Shipping Label — #${order._id.slice(-8).toUpperCase()}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; padding: 20px; }
      .label { width: 400px; margin: 0 auto; background: #fff; border: 2px solid #1e293b; border-radius: 4px; overflow: hidden; }
      .label-header { background: #1e293b; color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
      .label-header .brand { font-weight: 800; font-size: 16px; }
      .label-header .order-id { font-size: 12px; font-family: monospace; }
      .label-body { padding: 16px; }
      .label-section { margin-bottom: 14px; }
      .label-section:last-child { margin-bottom: 0; }
      .label-section h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 6px; font-weight: 700; }
      .label-section .content { font-size: 13px; line-height: 1.5; color: #1e293b; }
      .label-section .content strong { font-size: 15px; }
      .label-divider { border: none; border-top: 1px dashed #cbd5e1; margin: 0; }
      .label-items { font-size: 11px; color: #475569; margin-top: 8px; }
      .label-items .item { display: flex; justify-content: space-between; padding: 3px 0; }
      .label-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
      .label-footer .payment { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; }
      .label-footer .payment.cod { background: #fef3c7; color: #92400e; }
      .label-footer .payment.paid { background: #d1fae5; color: #065f46; }
      .label-footer .total { font-size: 16px; font-weight: 800; color: #1e293b; }
      .barcode { text-align: center; padding: 10px 16px; border-top: 1px dashed #cbd5e1; font-family: monospace; font-size: 14px; letter-spacing: 3px; color: #334155; }
      .no-print { text-align: center; margin: 20px auto; width: 400px; }
      .no-print button { background: #1e293b; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; margin: 0 6px; }
      .no-print button.secondary { background: #94a3b8; }
      @media print { .no-print { display: none; } body { background: #fff; padding: 0; } }
    </style></head><body>
      <div class="no-print">
        <button onclick="window.print()">🖨️ Print Label</button>
        <button class="secondary" onclick="window.close()">Close</button>
      </div>
      <div class="label">
        <div class="label-header">
          <span class="brand">AMRIT RASOI</span>
          <span class="order-id">#${order._id.slice(-8).toUpperCase()}</span>
        </div>
        <div class="label-body">
          <div class="label-section">
            <h4>Ship To</h4>
            <div class="content">
              <strong>${order.shippingAddress?.name || order.user?.name || 'Customer'}</strong><br/>
              ${order.shippingAddress?.address || ''}<br/>
              ${order.shippingAddress?.city || ''}${order.shippingAddress?.state ? ', ' + order.shippingAddress.state : ''}<br/>
              <strong>${order.shippingAddress?.pincode || ''}</strong><br/>
              📞 ${order.shippingAddress?.phone || order.user?.phone || '—'}
            </div>
          </div>
          <hr class="label-divider" />
          <div class="label-section">
            <h4>From</h4>
            <div class="content" style="font-size: 11px; color: #64748b;">${seller.name}, ${seller.line1}, ${seller.line2}${seller.city ? ', ' + seller.city : ''}${seller.state ? ', ' + seller.state : ''}${seller.phone ? '<br/>📞 ' + seller.phone : ''}</div>
          </div>
          <hr class="label-divider" />
          <div class="label-section">
            <h4>Package Contents (${order.orderItems.length} item${order.orderItems.length > 1 ? 's' : ''})</h4>
            <div class="label-items">
              ${order.orderItems.map(item => `<div class="item"><span>${item.name}${item.variantLabel ? ' (' + item.variantLabel + ')' : ''}</span><span>×${item.quantity}</span></div>`).join('')}
            </div>
          </div>
        </div>
        ${order.trackingId ? `<div class="barcode">AWB: ${order.trackingId}</div>` : ''}
        <div class="label-footer">
          <span class="payment ${order.paymentMethod === 'COD' ? 'cod' : 'paid'}">${order.paymentMethod === 'COD' ? 'COD — COLLECT ₹' + order.totalPrice : 'PREPAID'}</span>
          <span class="total">₹${order.totalPrice?.toLocaleString()}</span>
        </div>
      </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=500,height=700');
    win.document.write(labelHtml);
    win.document.close();
  };

  useEffect(() => {
    fetchOrders();
    // Fetch company settings and warehouses for invoice/label generation
    getSettings().then(res => {
      if (res.data?.settings) setCompanyInfo(res.data.settings);
    }).catch(() => {});
    getAllWarehouses().then(res => {
      if (res.data?.data) setWarehouses(res.data.data);
    }).catch(() => {});
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus, extraData = {}) => {
    try {
      setUpdating(orderId);
      const payload = { orderStatus: newStatus, ...extraData };
      const response = await updateOrderStatus(orderId, payload);

      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? { ...order, orderStatus: newStatus, ...(newStatus === 'Delivered' ? { deliveredAt: new Date().toISOString() } : {}), ...(extraData.trackingId ? { trackingId: extraData.trackingId } : {}) }
              : order
          )
        );
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({
            ...prev,
            orderStatus: newStatus,
            ...(newStatus === 'Delivered' ? { deliveredAt: new Date().toISOString() } : {}),
            ...(extraData.trackingId ? { trackingId: extraData.trackingId } : {})
          }));
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  // Derived data
  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.orderStatus === 'Processing').length,
    confirmed: orders.filter(o => o.orderStatus === 'Confirmed').length,
    shipped: orders.filter(o => o.orderStatus === 'Shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
    cancelled: orders.filter(o => o.orderStatus === 'Cancelled').length,
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.orderStatus === filter;
    const matchesSearch = !searchQuery || 
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Orders Management</h1>
        <p>Process, track, and fulfill customer orders</p>
      </div>

      {/* Stats Overview */}
      <div className="order-stats">
        <div className="order-stat-card" onClick={() => setFilter('all')}>
          <div className="order-stat-icon" style={{background: '#eef2ff', color: '#4f46e5'}}>
            <FaBox />
          </div>
          <div className="order-stat-info">
            <h3>{stats.total}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="order-stat-card" onClick={() => setFilter('Processing')}>
          <div className="order-stat-icon" style={{background: '#fef3c7', color: '#d97706'}}>
            <FaBox />
          </div>
          <div className="order-stat-info">
            <h3>{stats.processing}</h3>
            <p>Awaiting Action</p>
          </div>
        </div>
        <div className="order-stat-card" onClick={() => setFilter('Shipped')}>
          <div className="order-stat-icon" style={{background: '#e0e7ff', color: '#4338ca'}}>
            <FaTruck />
          </div>
          <div className="order-stat-info">
            <h3>{stats.shipped}</h3>
            <p>In Transit</p>
          </div>
        </div>
        <div className="order-stat-card" onClick={() => setFilter('Delivered')}>
          <div className="order-stat-icon" style={{background: '#d1fae5', color: '#059669'}}>
            <FaGift />
          </div>
          <div className="order-stat-info">
            <h3>{stats.delivered}</h3>
            <p>Delivered</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-wrapper">
        <div className="orders-toolbar">
          <div className="search-box">
            <FaSearch style={{color: '#94a3b8', fontSize: '13px'}} />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {[
              { key: 'all', label: 'All' },
              { key: 'Processing', label: 'New' },
              { key: 'Confirmed', label: 'Confirmed' },
              { key: 'Shipped', label: 'Shipped' },
              { key: 'Delivered', label: 'Delivered' },
              { key: 'Cancelled', label: 'Cancelled' },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== 'all' && stats[f.key.toLowerCase()] > 0 && (
                  <span style={{marginLeft: '4px', opacity: 0.6}}>({stats[f.key.toLowerCase()]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order._id} className="order-row" onClick={() => { setSelectedOrder(order); setTrackingId(order.trackingId || ''); }}>
                  <td>
                    <span className="order-id-cell">#{order._id.slice(-8).toUpperCase()}</span>
                  </td>
                  <td>
                    <div className="order-customer-cell">
                      <span className="name">{order.user?.name || 'Guest'}</span>
                      <span className="email">{order.user?.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="order-items-preview">
                      {order.orderItems.slice(0, 3).map((item, i) => (
                        <img key={i} className="item-thumb" src={item.image} alt={item.name} />
                      ))}
                      {order.orderItems.length > 3 && (
                        <div className="more-items">+{order.orderItems.length - 3}</div>
                      )}
                    </div>
                  </td>
                  <td><strong>₹{order.totalPrice?.toLocaleString()}</strong></td>
                  <td>
                    <span className={`status-pill ${order.paymentStatus === 'Paid' ? 'delivered' : 'processing'}`}>
                      <span className="dot"></span>
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusClass(order.orderStatus)}`}>
                      <span className="dot"></span>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td style={{fontSize: '12px', color: '#64748b'}}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>
            <FaBox style={{fontSize: '32px', marginBottom: '12px', opacity: 0.4}} />
            <p>No orders match your current filters.</p>
          </div>
        )}
      </div>

      {/* ──────── ORDER DETAIL SLIDE-OVER PANEL ──────── */}
      {selectedOrder && (
        <div className="order-detail-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-detail-panel" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="detail-header">
              <div>
                <h2>Order #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
                <span style={{fontSize: '12px', color: '#94a3b8'}}>
                  Placed {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <button className="close-panel" onClick={() => printInvoice(selectedOrder)} title="Print Invoice" style={{color: '#4f46e5'}}>
                  <FaFileInvoice />
                </button>
                <button className="close-panel" onClick={() => printShippingLabel(selectedOrder)} title="Print Shipping Label" style={{color: '#d97706'}}>
                  <FaTag />
                </button>
                <button className="close-panel" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>
            </div>

            <div className="detail-body">

              {/* ── Process Stepper ── */}
              <div className="process-stepper">
                <div className="stepper-track">
                  <div
                    className="stepper-progress"
                    style={{
                      width: selectedOrder.orderStatus === 'Cancelled' ? '0%' :
                        ORDER_STEPS.indexOf(selectedOrder.orderStatus) === 0 ? '0%' :
                        ORDER_STEPS.indexOf(selectedOrder.orderStatus) === 1 ? '26%' :
                        ORDER_STEPS.indexOf(selectedOrder.orderStatus) === 2 ? '53%' : '80%'
                    }}
                  ></div>

                  {ORDER_STEPS.map((step, index) => {
                    const currentIdx = ORDER_STEPS.indexOf(selectedOrder.orderStatus);
                    const isCancelled = selectedOrder.orderStatus === 'Cancelled';
                    let state = 'pending';
                    if (isCancelled) state = 'cancelled';
                    else if (index < currentIdx) state = 'done';
                    else if (index === currentIdx) state = 'current';

                    const icons = [<FaBox key="b" />, <FaCheckCircle key="c" />, <FaTruck key="t" />, <FaGift key="g" />];

                    return (
                      <div className="step-node" key={step}>
                        <div className={`step-circle ${state}`}>
                          {state === 'done' ? '✓' : icons[index]}
                        </div>
                        <span className={`step-label ${state}`}>{step}</span>
                        {state === 'done' && index === 0 && (
                          <span className="step-time">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        )}
                        {state === 'current' && step === 'Delivered' && selectedOrder.deliveredAt && (
                          <span className="step-time">{new Date(selectedOrder.deliveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Action Panel ── */}
              <div className="action-panel">
                <h4 className="action-panel-title">
                  <span className="icon">⚡</span>
                  {selectedOrder.orderStatus === 'Processing' ? 'New Order — Action Required' :
                   selectedOrder.orderStatus === 'Confirmed' ? 'Ready to Ship' :
                   selectedOrder.orderStatus === 'Shipped' ? 'Awaiting Delivery Confirmation' :
                   selectedOrder.orderStatus === 'Delivered' ? 'Order Completed' :
                   'Order Cancelled'}
                </h4>

                {selectedOrder.orderStatus === 'Processing' && (
                  <div className="action-row">
                    <button
                      className="action-btn primary"
                      onClick={() => handleStatusChange(selectedOrder._id, 'Confirmed')}
                      disabled={updating === selectedOrder._id}
                    >
                      <FaCheckCircle />
                      {updating === selectedOrder._id ? 'Accepting...' : 'Accept Order'}
                    </button>
                    <button
                      className="action-btn cancel"
                      onClick={() => {
                        if (window.confirm('Reject this order? Stock will be restored automatically.')) {
                          handleStatusChange(selectedOrder._id, 'Cancelled');
                        }
                      }}
                      disabled={updating === selectedOrder._id}
                    >
                      <FaTimesCircle />
                      Reject
                    </button>
                  </div>
                )}

                {selectedOrder.orderStatus === 'Confirmed' && (
                  <>
                    <div className="tracking-input-row">
                      <input
                        type="text"
                        placeholder="Enter tracking ID / AWB number (optional)"
                        value={trackingId}
                        onChange={e => setTrackingId(e.target.value)}
                      />
                    </div>
                    <div className="action-row">
                      <button
                        className="action-btn ship"
                        onClick={() => handleStatusChange(selectedOrder._id, 'Shipped', trackingId ? { trackingId } : {})}
                        disabled={updating === selectedOrder._id}
                      >
                        <FaTruck />
                        {updating === selectedOrder._id ? 'Shipping...' : 'Ship Order'}
                      </button>
                      <button
                        className="action-btn cancel"
                        onClick={() => {
                          if (window.confirm('Cancel this order? Stock will be restored.')) {
                            handleStatusChange(selectedOrder._id, 'Cancelled');
                          }
                        }}
                        disabled={updating === selectedOrder._id}
                      >
                        <FaTimesCircle />
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {selectedOrder.orderStatus === 'Shipped' && (
                  <div>
                    {selectedOrder.trackingId && (
                      <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#f1f5f9', borderRadius: '6px', fontSize: '13px' }}>
                        <strong>Tracking ID:</strong> <span style={{fontFamily: 'monospace', color: '#4f46e5'}}>{selectedOrder.trackingId}</span>
                      </div>
                    )}
                    <div className="action-row">
                      <button
                        className="action-btn deliver"
                        onClick={() => handleStatusChange(selectedOrder._id, 'Delivered')}
                        disabled={updating === selectedOrder._id}
                      >
                        <FaGift />
                        {updating === selectedOrder._id ? 'Confirming...' : 'Confirm Delivery'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.orderStatus === 'Delivered' && (
                  <div className="action-completed success">
                    <FaCheckCircle style={{fontSize: '18px'}} />
                    Order delivered successfully
                    {selectedOrder.deliveredAt && (
                      <span style={{fontSize: '12px', opacity: 0.8, marginLeft: '4px'}}>
                        on {new Date(selectedOrder.deliveredAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                    )}
                  </div>
                )}

                {selectedOrder.orderStatus === 'Cancelled' && (
                  <div className="action-completed error">
                    <FaTimesCircle style={{fontSize: '18px'}} />
                    This order has been cancelled. Stock was automatically restored.
                  </div>
                )}
              </div>

              {/* ── Documents ── */}
              {['Confirmed', 'Shipped', 'Delivered'].includes(selectedOrder.orderStatus) && (
                <div className="detail-section" style={{marginBottom: '20px'}}>
                  <div className="detail-section-header"><FaFileInvoice style={{fontSize: '12px'}} /> Documents & Labels</div>
                  <div className="detail-section-body" style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                    <button
                      className="action-btn primary"
                      style={{flex: '1', minWidth: '160px', padding: '12px 16px', fontSize: '13px'}}
                      onClick={() => printInvoice(selectedOrder)}
                    >
                      <FaPrint /> Print Invoice
                    </button>
                    <button
                      className="action-btn ship"
                      style={{flex: '1', minWidth: '160px', padding: '12px 16px', fontSize: '13px'}}
                      onClick={() => printShippingLabel(selectedOrder)}
                    >
                      <FaTag /> Print Shipping Label
                    </button>
                  </div>
                </div>
              )}

              {/* ── Customer & Shipping ── */}
              <div className="detail-section">
                <div className="detail-section-header">👤 Customer & Shipping</div>
                <div className="detail-section-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Customer Name</label>
                      <span>{selectedOrder.user?.name || 'Guest'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <span>{selectedOrder.user?.email || '—'}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <span>{selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone || '—'}</span>
                    </div>
                    <div className="info-item">
                      <label>Payment</label>
                      <span>
                        <span className={`status-pill ${selectedOrder.paymentStatus === 'Paid' ? 'delivered' : 'processing'}`} style={{fontSize: '11px'}}>
                          <span className="dot"></span>
                          {selectedOrder.paymentMethod} — {selectedOrder.paymentStatus}
                        </span>
                      </span>
                    </div>
                  </div>
                  {selectedOrder.shippingAddress && (
                    <div style={{marginTop: '14px', padding: '12px 14px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', lineHeight: '1.6', color: '#334155'}}>
                      <strong style={{fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px'}}>SHIP TO</strong>
                      {selectedOrder.shippingAddress.name && <div>{selectedOrder.shippingAddress.name}</div>}
                      <div>{selectedOrder.shippingAddress.address}</div>
                      <div>
                        {selectedOrder.shippingAddress.city}
                        {selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                        {selectedOrder.shippingAddress.pincode ? ` — ${selectedOrder.shippingAddress.pincode}` : ''}
                      </div>
                      {selectedOrder.shippingAddress.landmark && <div style={{color: '#64748b'}}>Landmark: {selectedOrder.shippingAddress.landmark}</div>}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Order Items ── */}
              <div className="detail-section">
                <div className="detail-section-header">
                  <FaBox style={{fontSize: '12px'}} /> Items ({selectedOrder.orderItems.length})
                </div>
                <div className="detail-section-body" style={{padding: '10px 18px'}}>
                  {selectedOrder.orderItems.map(item => (
                    <div className="order-item-row" key={item._id}>
                      <img className="order-item-img" src={item.image} alt={item.name} />
                      <div className="order-item-info">
                        <div className="name">{item.name}</div>
                        {item.variantLabel && <div className="variant">{item.variantLabel}</div>}
                        <div className="warehouse">WH: {item.warehouseCode || 'Unassigned'}</div>
                      </div>
                      <div className="order-item-qty">×{item.quantity}</div>
                      <div className="order-item-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="price-summary" style={{borderTop: '1px solid #e2e8f0'}}>
                  <div className="price-row">
                    <span className="label">Subtotal</span>
                    <span className="value">₹{selectedOrder.itemsPrice?.toLocaleString()}</span>
                  </div>
                  <div className="price-row">
                    <span className="label">Shipping</span>
                    <span className="value">{selectedOrder.shippingPrice > 0 ? `₹${selectedOrder.shippingPrice?.toLocaleString()}` : 'Free'}</span>
                  </div>
                  <div className="price-row">
                    <span className="label">Tax (GST)</span>
                    <span className="value">₹{selectedOrder.taxPrice?.toLocaleString()}</span>
                  </div>
                  {selectedOrder.codFee > 0 && (
                    <div className="price-row">
                      <span className="label">COD Fee</span>
                      <span className="value">₹{selectedOrder.codFee}</span>
                    </div>
                  )}
                  <div className="price-row total">
                    <span className="label">Total</span>
                    <span className="value">₹{selectedOrder.totalPrice?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ── Activity Timeline ── */}
              <div className="detail-section">
                <div className="detail-section-header">📋 Order Activity</div>
                <div className="detail-section-body">
                  <div className="timeline">
                    {selectedOrder.orderStatus === 'Delivered' && selectedOrder.deliveredAt && (
                      <div className="timeline-item">
                        <div className="timeline-dot active"></div>
                        <div className="timeline-content">Order delivered to customer</div>
                        <div className="timeline-time">{new Date(selectedOrder.deliveredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                      </div>
                    )}
                    {['Shipped', 'Delivered'].includes(selectedOrder.orderStatus) && (
                      <div className="timeline-item">
                        <div className={`timeline-dot ${selectedOrder.orderStatus === 'Shipped' ? 'active' : 'past'}`}></div>
                        <div className="timeline-content">
                          Order shipped out
                          {selectedOrder.trackingId && <span style={{color: '#4f46e5'}}> — Tracking: {selectedOrder.trackingId}</span>}
                        </div>
                      </div>
                    )}
                    {['Confirmed', 'Shipped', 'Delivered'].includes(selectedOrder.orderStatus) && (
                      <div className="timeline-item">
                        <div className={`timeline-dot ${selectedOrder.orderStatus === 'Confirmed' ? 'active' : 'past'}`}></div>
                        <div className="timeline-content">Order accepted & confirmed</div>
                      </div>
                    )}
                    {selectedOrder.orderStatus === 'Cancelled' && (
                      <div className="timeline-item">
                        <div className="timeline-dot" style={{background: '#ef4444', boxShadow: '0 0 0 2px #ef4444'}}></div>
                        <div className="timeline-content" style={{color: '#ef4444'}}>Order cancelled</div>
                      </div>
                    )}
                    <div className="timeline-item">
                      <div className={`timeline-dot ${selectedOrder.orderStatus === 'Processing' ? 'active' : 'past'}`}></div>
                      <div className="timeline-content">Order placed by {selectedOrder.user?.name || 'customer'}</div>
                      <div className="timeline-time">{new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
