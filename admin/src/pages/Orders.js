import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../utils/api';
import { FaEye } from 'react-icons/fa';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null); // Track which order is being updated

  useEffect(() => {
    fetchOrders();
  }, [filter]); // ✅ Refetch when filter changes

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await getAllOrders(params);
      console.log('✅ Orders fetched:', response.data);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdating(orderId); // Show loading state
      console.log('🔄 Updating order:', orderId, 'to', newStatus);
      
      const response = await updateOrderStatus(orderId, { orderStatus: newStatus });
      
      console.log('✅ Update response:', response);
      
      if (response.data.success) {
        alert('Order status updated successfully');
        
        // ✅ Update the order in local state immediately
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, orderStatus: newStatus }
              : order
          )
        );
      }
    } catch (error) {
      console.error('❌ Error updating order:', error.response?.data || error);
      alert(error.response?.data?.message || 'Error updating order status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus === filter);

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Orders Management</h1>
        <p>View and manage customer orders</p>
      </div>

      <div className="card">
        <div className="filters-bar">
          <select 
            className="form-control" 
            style={{ width: '200px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="Processing">Processing</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td><strong>#{order._id.slice(-8)}</strong></td>
                  <td>{order.user?.name}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>{order.orderItems.length}</td>
                  <td>₹{order.totalPrice}</td>
                  <td>
                    <span className="badge badge-info">
                      {order.paymentInfo?.method || order.paymentMethod || 'COD'}
                    </span>
                  </td>
                  <td>
                    <select
                      className={`badge badge-${getStatusColor(order.orderStatus)}`}
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      style={{ 
                        border: 'none', 
                        cursor: updating === order._id ? 'wait' : 'pointer',
                        opacity: updating === order._id ? 0.6 : 1
                      }}
                      disabled={updating === order._id}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary">
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <p className="no-data">No orders found</p>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    'Processing': 'warning',
    'Confirmed': 'info',
    'Shipped': 'info',
    'Delivered': 'success',
    'Cancelled': 'danger'
  };
  return colors[status] || 'info';
};

export default Orders;
