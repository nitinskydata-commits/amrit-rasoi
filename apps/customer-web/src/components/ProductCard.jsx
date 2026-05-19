import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { toast } from 'react-toastify';
import { FaStar, FaShoppingCart, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { wishlist } = useSelector(state => state.wishlist);
  const isInWishlist = wishlist?.some(item => item._id === product._id);

  // Get the first variant or default price
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

  const handleAddToCart = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await dispatch(addToCart({
        productId: product._id,
        quantity: 1,
        variant: (product.variants?.[0]?.attributes && product.variants[0].attributes.length > 0)
          ? product.variants[0].attributes.map(a => a.value).join(' / ')
          : (product.variants?.[0]?.weight || '')
      })).unwrap();
      
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to manage your wishlist');
      return;
    }
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error || 'Failed to update wishlist');
    }
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card-link">
      <motion.div 
        className={`product-card ${discountPercent >= 30 ? 'high-discount' : ''}`}
        whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Wishlist Toggle */}
        <button 
          className={`wishlist-card-toggle ${isInWishlist ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isInWishlist ? <FaHeart className="heart-filled" /> : <FaRegHeart className="heart-outline" />}
        </button>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className={`discount-badge ${discountPercent >= 30 ? 'high-discount-badge' : ''}`}>
            {discountPercent >= 30 ? `🔥 STEAL DEAL: -${discountPercent}%` : `-${discountPercent}%`}
          </div>
        )}

        {/* Product Image */}
        <div className="product-image">
          <img 
            src={product.images?.[0]?.url || '/placeholder.png'} 
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder.png';
            }}
          />
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          
          {/* Brand */}
          {product.brand && (
            <p className="product-brand">{product.brand}</p>
          )}

          {/* Variants Info */}
          {product.variants && product.variants.length > 1 && (
            <p className="variants-info">{product.variants.length} sizes available</p>
          )}
          
          {/* Rating */}
          <div className="product-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.floor(product.ratings || 0) ? 'star filled' : 'star'}
                />
              ))}
            </div>
            <span className="rating-count">
              {product.ratings > 0 ? `${product.ratings.toFixed(1)} (${product.numOfReviews || 0})` : 'No reviews yet'}
            </span>
          </div>

          {/* Price */}
          <div className="product-price">
            <span className="current-price">₹{displayPrice}</span>
            {displayMRP > displayPrice && (
              <>
                <span className="original-price">₹{displayMRP}</span>
                <span className="save-amount">Save ₹{displayMRP - displayPrice}</span>
              </>
            )}
          </div>

          {/* Stock Status */}
          {displayStock > 0 ? (
            <p className="in-stock">✓ In Stock</p>
          ) : (
            <p className="out-of-stock">✗ Out of Stock</p>
          )}

          {/* Add to Cart Button */}
          <motion.button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={displayStock === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaShoppingCart />
            Add to Cart
          </motion.button>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
