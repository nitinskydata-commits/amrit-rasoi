import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMyOrders } from '../redux/slices/orderSlice';
import { FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Orders.css';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.order); // ✅ FIXED: state.order NOT state.orders

  useEffect(() => {
    console.log('📦 Fetching orders...');
    dispatch(getMyOrders());
  }, [dispatch]);

  // ✅ ADDED ERROR LOGGING
  useEffect(() => {
    if (error) {
      console.error('❌ Orders Error:', error);
    }
    if (orders) {
      console.log('✅ Orders loaded:', orders);
    }
  }, [orders, error]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processing':
      case 'Confirmed':
        return <FaBox className="status-icon processing" />;
      case 'Shipped':
        return <FaTruck className="status-icon shipped" />;
      case 'Delivered':
        return <FaCheckCircle className="status-icon delivered" />;
      default:
        return <FaBox className="status-icon" />;
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replace(' ', '-');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="loading-text">Loading orders...</p>
      </div>
    );
  }

  // ✅ SHOW ERROR IF EXISTS
  if (error) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="error-message">
            <h2>Error Loading Orders</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => dispatch(getMyOrders())}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <motion.div
            className="no-orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FaBox className="empty-icon" />
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here</p>
            <Link to="/" className="btn btn-primary">
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <motion.div
                key={order._id}
                className="order-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
              >
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                    <p className="order-date">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={`order-status ${getStatusClass(order.orderStatus)}`}>
                    {getStatusIcon(order.orderStatus)}
                    <span>{order.orderStatus}</span>
                  </div>
                </div>

                <div className="order-items">
                  {order.orderItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="order-item">
                      <img src={item.image} alt={item.name} />
                      <div className="item-details">
                        <p className="item-name">{item.name}</p>
                        <p className="item-qty">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <div className="more-items">
                      +{order.orderItems.length - 3} more items
                    </div>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <span>Total Amount:</span>
                    <strong>₹{order.totalPrice.toFixed(2)}</strong>
                  </div>
                  <Link to={`/order/${order._id}`} className="btn btn-outline">
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
