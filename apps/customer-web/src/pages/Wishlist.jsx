import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import { FaTrash, FaShoppingCart, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './Wishlist.css';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { wishlist, loading } = useSelector(state => state.wishlist);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemoveItem = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error(error || 'Failed to remove item');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const variant = (product.variants?.[0]?.attributes && product.variants[0].attributes.length > 0)
        ? product.variants[0].attributes.map(a => a.value).join(' / ')
        : (product.variants?.[0]?.weight || '');
      await dispatch(addToCart({
        productId: product._id,
        quantity: 1,
        variant
      })).unwrap();
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="login-prompt">
            <FaHeart className="prompt-icon" />
            <h2>Please login to view your wishlist</h2>
            <p>Save your favorite premium items to buy them later.</p>
            <Link to="/login" className="btn btn-primary">
              Login / Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="loading-text">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <span className="count-badge">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</span>
        </div>

        {wishlist.length === 0 ? (
          <motion.div
            className="empty-wishlist"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="heart-circle">
              <FaRegHeart className="empty-icon" />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Explore our organic product collection and save your favorites!</p>
            <Link to="/" className="btn btn-primary">
              Go Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((product) => {
              const displayPrice = product.variants && product.variants.length > 0 
                ? product.variants[0].price 
                : product.price;

              const displayMRP = product.variants && product.variants.length > 0 
                ? product.variants[0].mrp 
                : product.mrp;

              const displayStock = product.variants && product.variants.length > 0 
                ? product.variants[0].stock 
                : product.stock;

              const discountPercent = displayMRP > displayPrice 
                ? Math.round(((displayMRP - displayPrice) / displayMRP) * 100) 
                : 0;

              return (
                <motion.div
                  key={product._id}
                  className="wishlist-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Remove Button */}
                  <button 
                    className="remove-wishlist-btn" 
                    onClick={() => handleRemoveItem(product._id)}
                    title="Remove from wishlist"
                  >
                    <FaTrash />
                  </button>

                  {/* Product Image */}
                  <Link to={`/product/${product._id}`} className="card-image-link">
                    <div className="product-image">
                      <img 
                        src={product.images?.[0]?.url || '/placeholder.png'} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.png';
                        }}
                      />
                      {discountPercent > 0 && (
                        <div className="discount-tag">-{discountPercent}%</div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="product-info">
                    <Link to={`/product/${product._id}`} className="product-name">
                      {product.name}
                    </Link>
                    
                    <p className="product-category">{product.category}</p>

                    <div className="product-pricing">
                      <span className="current-price">₹{displayPrice}</span>
                      {displayMRP > displayPrice && (
                        <span className="original-price">₹{displayMRP}</span>
                      )}
                    </div>

                    <div className="stock-status">
                      {displayStock > 0 ? (
                        <span className="in-stock">In Stock</span>
                      ) : (
                        <span className="out-of-stock">Out of Stock</span>
                      )}
                    </div>

                    <div className="action-buttons">
                      {displayStock > 0 ? (
                        product.variants && product.variants.length > 1 ? (
                          <Link 
                            to={`/product/${product._id}`} 
                            className="btn btn-primary select-options-btn"
                          >
                            Select Options
                          </Link>
                        ) : (
                          <button
                            className="btn btn-primary add-to-cart-btn"
                            onClick={() => handleAddToCart(product)}
                          >
                            <FaShoppingCart /> Add to Cart
                          </button>
                        )
                      ) : (
                        <button className="btn btn-disabled" disabled>
                          Out of Stock
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
