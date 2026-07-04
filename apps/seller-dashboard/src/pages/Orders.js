import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderItemStatus } from '../utils/api';
import { FaInfoCircle, FaShippingFast, FaCheck, FaTimes, FaBarcode } from 'react-icons/fa';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipStatus, setShipStatus] = useState('Shipped');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders({ status: statusFilter || undefined });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, tracking = '') => {
    setActionLoading(true);
    try {
      await updateOrderItemStatus(orderId, {
        itemStatus: newStatus,
        trackingNumber: tracking || undefined
      });
      alert(`Order item status updated to ${newStatus} successfully.`);
      setShowShipModal(false);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div>
          <h1>Order Settlements</h1>
          <p>Review customer orders containing your products and manage shipment dispatches.</p>
        </div>
        <div className="status-filter-box">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Orders</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="seller-loading">Retrieving orders...</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer Info</th>
                  <th>My Items Count</th>
                  <th>My Subtotal</th>
                  <th>Shipping Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  // Determine status representing seller's items (assume first item's status is indicator)
                  const sampleItem = order.orderItems[0];
                  const itemStatus = sampleItem?.itemStatus || 'Processing';
                  const trackingNum = sampleItem?.trackingNumber || '';

                  return (
                    <tr key={order._id}>
                      <td>
                        <div className="order-id-cell">
                          <strong>#{order._id.substring(0, 12)}...</strong>
                          <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td>
                        <div className="customer-info-cell">
                          <strong>{order.user?.name || 'Customer'}</strong>
                          <span>{order.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="items-count-badge">
                          {order.orderItems.length} items
                        </span>
                      </td>
                      <td><strong>${order.sellerSubtotal?.toFixed(2)}</strong></td>
                      <td>
                        <span className={`order-status-badge badge-${itemStatus.toLowerCase()}`}>
                          {itemStatus}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button 
                            className="btn btn-sm btn-info"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            title="View Full Invoice Details"
                          >
                            <FaInfoCircle /> Details
                          </button>

                          {itemStatus === 'Processing' && (
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => {
                                setSelectedOrder(order);
                                setTrackingNumber('');
                                setShipStatus('Shipped');
                                setShowShipModal(true);
                              }}
                              title="Mark Shipped"
                            >
                              <FaShippingFast /> Ship
                            </button>
                          )}

                          {itemStatus === 'Shipped' && (
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => {
                                if (window.confirm('Mark this item as Delivered to customer? This triggers payout eligibility.')) {
                                  handleUpdateStatus(order._id, 'Delivered', trackingNum);
                                }
                              }}
                              title="Mark Delivered"
                            >
                              <FaCheck /> Deliver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <p className="no-data-msg">
              No orders found under this status.
            </p>
          )}
        </div>
      )}

      {/* INVOICE DETAILS MODAL */}
      {showDetailsModal && selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box wide">
            <div className="modal-header-section">
              <h3>Order details: #{selectedOrder._id}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><FaTimes /></button>
            </div>

            <div className="details-content-grid">
              {/* Shipping details */}
              <div className="detail-section">
                <h4>Recipient Delivery Details</h4>
                <div className="detail-row"><span>Name:</span> <strong>{selectedOrder.shippingInfo?.name || selectedOrder.shippingAddress?.name || 'Customer'}</strong></div>
                <div className="detail-row"><span>Phone:</span> <span>{selectedOrder.shippingInfo?.phoneNo || selectedOrder.shippingAddress?.phone || 'N/A'}</span></div>
                <div className="detail-row"><span>City:</span> <span>{selectedOrder.shippingInfo?.city || selectedOrder.shippingAddress?.city || 'N/A'}</span></div>
                <div className="detail-row">
                  <span>Address:</span> 
                  <p>
                    {selectedOrder.shippingInfo?.address || selectedOrder.shippingAddress?.line1 || 'N/A'},<br />
                    {selectedOrder.shippingInfo?.pincode || selectedOrder.shippingAddress?.pincode || ''}
                  </p>
                </div>
              </div>

              {/* General Order Details */}
              <div className="detail-section">
                <h4>Order Summary</h4>
                <div className="detail-row"><span>Placed On:</span> <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
                <div className="detail-row"><span>Payment Status:</span> <strong className="text-success">{selectedOrder.paymentInfo?.status || 'Paid'}</strong></div>
                <div className="detail-row"><span>Payment Method:</span> <span>{selectedOrder.paymentMethod || 'Online Payment'}</span></div>
              </div>

              {/* Items List */}
              <div className="detail-section full-width">
                <h4>Itemized Store Items</h4>
                <div className="table-container inline-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Item Total</th>
                        <th>Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.orderItems.map((item, index) => (
                        <tr key={index}>
                          <td><strong>{item.name}</strong></td>
                          <td>${item.price?.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td><strong>${(item.price * item.quantity).toFixed(2)}</strong></td>
                          <td>
                            <span className={`order-status-badge badge-${(item.itemStatus || 'Processing').toLowerCase()}`}>
                              {item.itemStatus || 'Processing'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="order-total-callout">
                  <span>Store Total Payout:</span>
                  <h2>${selectedOrder.sellerSubtotal?.toFixed(2)}</h2>
                </div>
              </div>
            </div>

            <div className="modal-actions border-top">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close Summary</button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH SHIPPING DETAILS MODAL */}
      {showShipModal && selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h3>Dispatch & Shipping Information</h3>
            <p>Specify the courier details for shipping items in Order <strong>#{selectedOrder._id.substring(0, 12)}...</strong></p>

            <div className="form-group">
              <label>Tracking Number / AWB Code</label>
              <div className="input-with-icon">
                <FaBarcode />
                <input 
                  type="text" 
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. IN-9821-39A"
                  className="form-control"
                />
              </div>
              <small className="help-text">Add tracking ID to let customers monitor order shipment status.</small>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowShipModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                onClick={() => handleUpdateStatus(selectedOrder._id, 'Shipped', trackingNumber)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Mark as Shipped'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
