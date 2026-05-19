import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaShoppingCart, 
  FaLeaf, 
  FaArrowLeft, 
  FaPlus, 
  FaMinus, 
  FaCheckCircle, 
  FaSpinner, 
  FaMapMarkerAlt
} from 'react-icons/fa';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000/api/v1';

function App() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState('browse'); // browse, cart, checkout, success
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [address, setAddress] = useState({
    fullName: 'Rohan Sharma',
    addressLine: 'A-12, Sector 62',
    city: 'Noida',
    postalCode: '201301',
    phone: '9876543210'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/products`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.product._id === product._id);
    if (existing) {
      setCart(cart.map(item => 
        item.product._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product._id === productId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulate order placement
      await axios.post(`${API_BASE}/admin/orders`, {
        orderItems: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        shippingAddress: address,
        totalPrice: getCartTotal(),
        status: 'processing'
      });
      setCart([]);
      setCheckoutStep('success');
    } catch (err) {
      alert('Checkout failed, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-app-container">
      {/* Smartphone frame representation */}
      <div className="phone-frame">
        <div className="phone-screen">
          
          {/* Header */}
          <header className="app-header">
            {checkoutStep !== 'browse' && (
              <button className="back-btn" onClick={() => setCheckoutStep('browse')}>
                <FaArrowLeft />
              </button>
            )}
            <div className="brand-title">
              <FaLeaf className="brand-icon" />
              <span>Amrit Rasoi</span>
            </div>
            <button className="cart-badge-btn" onClick={() => setCheckoutStep('cart')}>
              <FaShoppingCart />
              {cart.length > 0 && <span className="cart-count">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
            </button>
          </header>

          {/* Browse Step */}
          {checkoutStep === 'browse' && (
            <div className="content fade-in">
              {/* Search Bar */}
              <div className="search-bar">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search organic foods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Product list */}
              <div className="products-section">
                <h3 className="section-title">Fresh Arrivals</h3>
                {loading ? (
                  <div className="loading-center">
                    <FaSpinner className="spin" />
                    <p>Fetching catalog...</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="products-grid">
                    {filteredProducts.map(p => (
                      <div key={p._id} className="prod-card">
                        <div className="prod-img">
                          <FaLeaf />
                        </div>
                        <div className="prod-info">
                          <h4>{p.name}</h4>
                          <span className="price">₹{p.price}</span>
                          <button className="add-btn" onClick={() => addToCart(p)}>
                            <FaPlus /> Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-items">No matches found in store.</p>
                )}
              </div>
            </div>
          )}

          {/* Cart Step */}
          {checkoutStep === 'cart' && (
            <div className="content fade-in">
              <h3 className="section-title">My Basket</h3>
              {cart.length > 0 ? (
                <div className="cart-page">
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.product._id} className="cart-item-card">
                        <div className="item-details">
                          <h4>{item.product.name}</h4>
                          <span>₹{item.product.price}</span>
                        </div>
                        <div className="item-actions">
                          <button onClick={() => updateQuantity(item.product._id, -1)}><FaMinus /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product._id, 1)}><FaPlus /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-footer">
                    <div className="total-row">
                      <span>Total Price</span>
                      <strong>₹{getCartTotal()}</strong>
                    </div>
                    <button className="btn btn-primary" onClick={() => setCheckoutStep('checkout')}>
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-cart">
                  <FaShoppingCart className="empty-icon" />
                  <p>Your basket is empty.</p>
                  <button className="btn btn-secondary" onClick={() => setCheckoutStep('browse')}>
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Checkout Form Step */}
          {checkoutStep === 'checkout' && (
            <div className="content fade-in">
              <h3 className="section-title">Delivery Details</h3>
              <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={address.fullName} 
                    onChange={e => setAddress({...address, fullName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Street Address</label>
                  <input 
                    type="text" 
                    value={address.addressLine} 
                    onChange={e => setAddress({...address, addressLine: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    value={address.city} 
                    onChange={e => setAddress({...address, city: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input 
                    type="text" 
                    value={address.postalCode} 
                    onChange={e => setAddress({...address, postalCode: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input 
                    type="text" 
                    value={address.phone} 
                    onChange={e => setAddress({...address, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="checkout-summary">
                  <div className="total-row">
                    <span>Payable Total</span>
                    <strong>₹{getCartTotal()}</strong>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <FaSpinner className="spin" /> : 'Confirm Order (COD)'}
                </button>
              </form>
            </div>
          )}

          {/* Success Step */}
          {checkoutStep === 'success' && (
            <div className="content success-screen fade-in">
              <FaCheckCircle className="success-icon" />
              <h2>Order Placed!</h2>
              <p>Your delivery has been scheduled. Track it using our partner delivery app.</p>
              
              <div className="delivery-card">
                <h4><FaMapMarkerAlt /> Shipping Address</h4>
                <p>{address.fullName}</p>
                <p>{address.addressLine}, {address.city}</p>
              </div>

              <button className="btn btn-primary" onClick={() => setCheckoutStep('browse')}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
