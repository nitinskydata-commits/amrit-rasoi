import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCart, updateCartItem, removeFromCart, clearCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import { FaTrash, FaShoppingBag } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading } = useSelector(state => state.cart);

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      await dispatch(updateCartItem({ itemId, quantity })).unwrap();
    } catch (error) {
      toast.error(error || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error(error || 'Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      try {
        await dispatch(clearCart()).unwrap();
        toast.success('Cart cleared');
      } catch (error) {
        toast.error(error || 'Failed to clear cart');
      }
    }
  };

  const handleCheckout = () => {
    if (!cart?.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="loading-text">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          {cart?.items && cart.items.length > 0 && (
            <button className="clear-cart-btn" onClick={handleClearCart}>
              Clear Cart
            </button>
          )}
        </div>

        {!cart?.items || cart.items.length === 0 ? (
          <motion.div
            className="empty-cart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FaShoppingBag className="empty-icon" />
            <h2>Your cart is empty</h2>
            <p>Add items to your cart to see them here</p>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="cart-grid">
            {/* Cart Items */}
            <div className="cart-items">
              {cart.items.map((item) => (
                <motion.div
                  key={item._id}
                  className="cart-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Link to={`/product/${item.product}`} className="item-image">
                    <img src={item.image} alt={item.name} />
                  </Link>

                  <div className="item-details">
                    <Link to={`/product/${item.product}`} className="item-name">
                      {item.name}
                    </Link>
                    {item.variant && (
                      <p className="item-variant">Weight: {item.variant}</p>
                    )}
                    <p className="item-price">₹{item.price}</p>

                    <div className="item-actions">
                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() => handleUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                        >
                          -
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => handleUpdateQuantity(item._id, Math.min(10, item.quantity + 1))}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item._id)}
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="item-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="cart-summary">
              <div className="summary-card">
                <h3>Order Summary</h3>

                <div className="summary-row">
                  <span>Subtotal ({cart.items.length} items):</span>
                  <span>₹{cart.subtotal?.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Shipping:</span>
                  <span className={cart.shipping === 0 ? 'free-shipping' : ''}>
                    {cart.shipping === 0 ? 'FREE' : `₹${cart.shipping?.toFixed(2)}`}
                  </span>
                </div>

                {cart.shipping > 0 && cart.subtotal < 500 && (
                  <p className="shipping-note">
                    Add ₹{(500 - cart.subtotal).toFixed(2)} more for FREE shipping
                  </p>
                )}

                <div className="summary-row">
                  <span>Tax (18% GST):</span>
                  <span>₹{cart.tax?.toFixed(2)}</span>
                </div>

                <hr />

                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{cart.total?.toFixed(2)}</span>
                </div>

                <motion.button
                  className="btn btn-primary btn-full checkout-btn"
                  onClick={handleCheckout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Proceed to Checkout
                </motion.button>

                <Link to="/" className="btn btn-outline btn-full">
                  Continue Shopping
                </Link>

                <div className="secure-checkout">
                  <i className="fas fa-lock"></i>
                  <span>Secure Checkout</span>
                </div>
              </div>

              {/* Features */}
              <div className="cart-features">
                <div className="feature">
                  <i className="fas fa-shipping-fast"></i>
                  <div>
                    <strong>Free Shipping</strong>
                    <p>On orders above ₹500</p>
                  </div>
                </div>
                <div className="feature">
                  <i className="fas fa-undo"></i>
                  <div>
                    <strong>Easy Returns</strong>
                    <p>7-day return policy</p>
                  </div>
                </div>
                <div className="feature">
                  <i className="fas fa-shield-alt"></i>
                  <div>
                    <strong>100% Secure</strong>
                    <p>Safe payment options</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
