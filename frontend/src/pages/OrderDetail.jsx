import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails } from '../redux/slices/orderSlice';
import { FaCheckCircle, FaBox, FaTruck, FaHome } from 'react-icons/fa';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order, loading } = useSelector(state => state.order);  // ✅ FIXED: Changed from state.orders to state.order

  useEffect(() => {
    dispatch(getOrderDetails(id));
  }, [dispatch, id]);

  if (loading || !order) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="loading-text">Loading order details...</p>
      </div>
    );
  }

  const getProgressStep = (status) => {
    switch (status) {
      case 'Processing':
        return 1;
      case 'Confirmed':
        return 2;
      case 'Shipped':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getProgressStep(order.orderStatus);

  return (
    <div className="order-detail-page">
      <div className="container">
        <div className="order-detail-header">
          <div>
            <h1>Order Details</h1>
            <p className="order-id">Order ID: #{order._id.slice(-8).toUpperCase()}</p>
            <p className="order-date">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <Link to="/orders" className="btn btn-outline">
            Back to Orders
          </Link>
        </div>

        {/* Order Progress */}
        <div className="order-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-icon">
              <FaCheckCircle />
            </div>
            <p>Order Placed</p>
          </div>
          <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-icon">
              <FaBox />
            </div>
            <p>Confirmed</p>
          </div>
          <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-icon">
              <FaTruck />
            </div>
            <p>Shipped</p>
          </div>
          <div className={`progress-line ${currentStep >= 4 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-icon">
              <FaHome />
            </div>
            <p>Delivered</p>
          </div>
        </div>

        <div className="order-detail-grid">
          {/* Order Items */}
          <div className="order-items-section">
            <h2>Order Items</h2>
            <div className="items-list">
              {order.orderItems.map((item, index) => (
                <div key={index} className="order-item-card">
                  <img src={item.image} alt={item.name} />
                  <div className="item-info">
                    <Link to={`/product/${item.product}`} className="item-name">
                      {item.name}
                    </Link>
                    <p className="item-price">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="item-total">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="order-detail-sidebar">
            {/* Delivery Address */}
            <div className="info-card">
              <h3>Delivery Address</h3>
              <div className="address-info">
                <p className="name">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>PIN: {order.shippingAddress.pincode}</p>
                <p className="phone">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="info-card">
              <h3>Payment Information</h3>
              <div className="payment-info">
                <div className="info-row">
                  <span>Method:</span>
                  <strong>{order.paymentInfo.method.toUpperCase()}</strong>
                </div>
                <div className="info-row">
                  <span>Status:</span>
                  <strong className="success">{order.paymentInfo.status}</strong>
                </div>
                <div className="info-row">
                  <span>Transaction ID:</span>
                  <span className="transaction-id">{order.paymentInfo.id}</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="info-card">
              <h3>Price Details</h3>
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Items Total:</span>
                  <span>₹{order.itemsPrice.toFixed(2)}</span>
                </div>
                <div className="price-row">
                  <span>Shipping:</span>
                  <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice.toFixed(2)}`}</span>
                </div>
                <div className="price-row">
                  <span>Tax (GST):</span>
                  <span>₹{order.taxPrice.toFixed(2)}</span>
                </div>
                <hr />
                <div className="price-row total">
                  <span>Total Amount:</span>
                  <strong>₹{order.totalPrice.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
