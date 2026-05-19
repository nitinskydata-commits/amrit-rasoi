import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../redux/slices/orderSlice';
import { addAddress, fetchAddresses } from '../redux/slices/addressSlice';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaEdit, FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);
  const { addresses, loading } = useSelector(state => state.address);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  useEffect(() => {
    if (!cart || cart.items?.length === 0) {
      navigate('/cart');
    }

    // Fetch addresses on mount
    dispatch(fetchAddresses());
  }, [cart, navigate, dispatch]);

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(addr => addr.isDefault);
      setSelectedAddress(defaultAddr || addresses[0]);
    }
  }, [addresses]);

  const handleSaveAddress = async () => {
    // Validation
    if (!newAddress.name || !newAddress.phone || !newAddress.address || 
        !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    if (newAddress.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (newAddress.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    try {
      await dispatch(addAddress(newAddress)).unwrap();
      toast.success('Address saved successfully!');
      setShowAddressForm(false);
      setNewAddress({
        name: user?.name || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      });
    } catch (error) {
      toast.error(error || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    let finalPaymentInfo = {
      id: `cod_${Date.now()}`,
      status: 'Success',
      method: 'cod'
    };

    try {
      const token = localStorage.getItem('token');
      if (paymentMethod === 'card') {
        const { data } = await axios.post(`${API_BASE_URL}/payment/process`, {
          amount: cart.total
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        finalPaymentInfo = {
          id: data.chargeId,
          status: 'Success',
          method: 'stripe'
        };
        toast.info('Card payment processed successfully!');
      } else if (paymentMethod === 'upi') {
        // Razorpay order creation simulation
        const rzpOrderResp = await axios.post(`${API_BASE_URL}/payment/razorpay/order`, {
          amount: cart.total
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Razorpay verification simulation
        const rzpVerifyResp = await axios.post(`${API_BASE_URL}/payment/razorpay/verify`, {
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 12)}`,
          razorpay_order_id: rzpOrderResp.data.id,
          razorpay_signature: 'valid_mock_signature'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        finalPaymentInfo = {
          id: rzpVerifyResp.data.paymentId,
          status: 'Success',
          method: 'razorpay'
        };
        toast.info('UPI payment processed successfully!');
      } else if (paymentMethod === 'netbanking') {
        finalPaymentInfo = {
          id: `nb_${Date.now()}`,
          status: 'Success',
          method: 'netbanking'
        };
        toast.info('Netbanking authorization successful!');
      }

      const orderData = {
        orderItems: cart.items.map(item => ({
          product: item.product?._id || item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          variantId: item.variantId || null,
          variantLabel: item.variantLabel || ''
        })),
        shippingAddress: selectedAddress,
        paymentInfo: finalPaymentInfo,
        itemsPrice: cart.subtotal,
        taxPrice: cart.tax,
        shippingPrice: cart.shipping,
        totalPrice: cart.total
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      toast.success('Order placed successfully!');
      navigate(`/order/${result.order._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error || 'Failed to place order');
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>

        <div className="checkout-grid">
          {/* Left: Delivery & Payment */}
          <div className="checkout-main">
            {/* Delivery Address */}
            <div className="checkout-section">
              <div className="section-header">
                <h2>1. Delivery Address</h2>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  <FaPlus /> Add New Address
                </button>
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <motion.div
                  className="address-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                >
                  <div className="form-grid">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({...newAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                      maxLength="10"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                      maxLength="6"
                      required
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                    />
                  </div>
                  <textarea
                    placeholder="Address (House No, Building, Street, Area) *"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                    rows="3"
                    required
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSaveAddress}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Address'}
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Address List */}
              <div className="address-list">
                {addresses && addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div
                      key={address._id}
                      className={`address-card ${selectedAddress?._id === address._id ? 'selected' : ''}`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="address-radio">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddress?._id === address._id}
                          onChange={() => setSelectedAddress(address)}
                        />
                      </div>
                      <div className="address-info">
                        <h4>{address.name}</h4>
                        <p>{address.address}</p>
                        <p>{address.city}, {address.state} - {address.pincode}</p>
                        <p className="address-phone">Phone: {address.phone}</p>
                        {address.isDefault && (
                          <span className="default-badge">Default</span>
                        )}
                      </div>
                      <button className="edit-address-btn">
                        <FaEdit />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-address">No saved addresses. Please add a new address.</p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-section">
              <h2>2. Payment Method</h2>
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <strong>Credit / Debit Card</strong>
                    <p>Visa, Mastercard, RuPay</p>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <strong>UPI</strong>
                    <p>Google Pay, PhonePe, Paytm</p>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'netbanking' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="netbanking"
                    checked={paymentMethod === 'netbanking'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <strong>Net Banking</strong>
                    <p>All major banks</p>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-info">
                    <strong>Cash on Delivery</strong>
                    <p>Pay when you receive</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>

              <div className="summary-items">
                {cart?.items?.map((item) => (
                  <div key={item._id} className="summary-item">
                    <img src={item.image} alt={item.name} />
                    <div className="item-info">
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                    <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <hr />

              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{cart?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span className={cart?.shipping === 0 ? 'free' : ''}>
                  {cart?.shipping === 0 ? 'FREE' : `₹${cart?.shipping?.toFixed(2)}`}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax (GST):</span>
                <span>₹{cart?.tax?.toFixed(2)}</span>
              </div>

              <hr />

              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{cart?.total?.toFixed(2)}</span>
              </div>

              <motion.button
                className="btn btn-primary btn-full place-order-btn"
                onClick={handlePlaceOrder}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!selectedAddress}
              >
                Place Order
              </motion.button>

              <p className="secure-note">
                <i className="fas fa-lock"></i>
                Your payment information is secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
