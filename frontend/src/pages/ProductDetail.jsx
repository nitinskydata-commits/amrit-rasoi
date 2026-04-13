import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductDetails, createReview } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import { FaStar, FaShoppingCart, FaTruck, FaShieldAlt, FaExchangeAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, loading } = useSelector(state => state.products);
  const { isAuthenticated } = useSelector(state => state.auth);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  // Current variant details
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentMRP, setCurrentMRP] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [currentWeight, setCurrentWeight] = useState('');

  useEffect(() => {
    dispatch(getProductDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update prices when variant changes or product loads
  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants[selectedVariant];
        setCurrentPrice(variant.price);
        setCurrentMRP(variant.mrp);
        setCurrentStock(variant.stock);
        setCurrentWeight(variant.weight);
      } else {
        // Fallback to default pricing
        setCurrentPrice(product.price);
        setCurrentMRP(product.mrp);
        setCurrentStock(product.stock);
        setCurrentWeight('');
      }
    }
  }, [product, selectedVariant]);

  const handleVariantChange = (index) => {
    setSelectedVariant(index);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await dispatch(addToCart({
        productId: product._id,
        quantity,
        variant: currentWeight || product.variants?.[selectedVariant]?.weight || ''
      })).unwrap();
      
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      return;
    }

    try {
      await dispatch(createReview({
        ...reviewData,
        productId: product._id
      })).unwrap();
      
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setReviewData({ rating: 5, title: '', comment: '' });
      dispatch(getProductDetails(id));
    } catch (error) {
      toast.error(error || 'Failed to submit review');
    }
  };

  if (loading || !product) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="loading-text">Loading product details...</p>
      </div>
    );
  }

  const discountPercent = currentMRP > currentPrice 
    ? Math.round(((currentMRP - currentPrice) / currentMRP) * 100) 
    : 0;

  return (
    <div className="product-detail">
      <div className="container">
        <div className="product-detail-grid">
          {/* Left: Images */}
          <div className="product-images-section">
            <div className="image-thumbnails">
              {product.images?.map((image, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image.url} alt={`${product.name} ${index + 1}`} />
                </div>
              ))}
            </div>
            <div className="main-image">
              <img src={product.images?.[selectedImage]?.url} alt={product.name} />
            </div>
          </div>

          {/* Middle: Details */}
          <div className="product-details-section">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-meta">
              <div className="rating-section">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < Math.floor(product.ratings || 0) ? 'star filled' : 'star'}
                    />
                  ))}
                </div>
                <span className="rating-text">{(product.ratings || 0).toFixed(1)}</span>
                <span className="reviews-count">({product.numOfReviews || 0} reviews)</span>
              </div>
              
              <div className="brand-badge">
                Brand: <strong>{product.brand || 'Amrit Rasoi'}</strong>
              </div>
            </div>

            <hr />

            <div className="price-section">
              <div className="price-row">
                <span className="price-label">Price:</span>
                <div className="price-info">
                  <span className="current-price">₹{currentPrice}</span>
                  {currentMRP > currentPrice && (
                    <>
                      <span className="original-price">₹{currentMRP}</span>
                      <span className="discount-badge">Save ₹{currentMRP - currentPrice}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="tax-info">Inclusive of all taxes</p>
              {discountPercent > 0 && (
                <p className="discount-info">You save {discountPercent}% on this product!</p>
              )}
            </div>

            <hr />

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="variants-section">
                <h3>Select Weight:</h3>
                <div className="variants-grid">
                  {product.variants.map((variant, index) => (
                    <button
                      key={index}
                      className={`variant-btn ${selectedVariant === index ? 'active' : ''}`}
                      onClick={() => handleVariantChange(index)}
                    >
                      <div className="variant-weight">{variant.weight}</div>
                      <div className="variant-price">₹{variant.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="quantity-section">
              <h3>Quantity:</h3>
              <div className="quantity-selector">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock Status */}
            {currentStock > 0 ? (
              <p className="in-stock">✓ In Stock ({currentStock} units available)</p>
            ) : (
              <p className="out-of-stock">✗ Currently Out of Stock</p>
            )}

            <hr />

            {/* Description */}
            <div className="description-section">
              <h3>About this item</h3>
              <p>{product.description || 'Premium quality product from Amrit Rasoi.'}</p>
            </div>
          </div>

          {/* Right: Buy Box */}
          <div className="buy-box">
            <div className="buy-box-card">
              <div className="price-box">
                <span className="price">₹{currentPrice}</span>
                {discountPercent > 0 && (
                  <span className="save-text">Save ₹{currentMRP - currentPrice}</span>
                )}
              </div>

              <div className="delivery-info">
                <FaTruck className="icon" />
                <div>
                  <strong>Free Delivery</strong>
                  <p>On orders above ₹500</p>
                </div>
              </div>

              {currentStock > 0 ? (
                <>
                  <motion.button
                    className="btn btn-primary btn-full"
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaShoppingCart /> Add to Cart
                  </motion.button>
                  <motion.button
                    className="btn btn-secondary btn-full"
                    onClick={handleBuyNow}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Buy Now
                  </motion.button>
                </>
              ) : (
                <button className="btn btn-full" disabled>
                  Out of Stock
                </button>
              )}

              <div className="features-list">
                <div className="feature-item">
                  <FaShieldAlt className="icon" />
                  <span>Secure transaction</span>
                </div>
                <div className="feature-item">
                  <FaExchangeAlt className="icon" />
                  <span>7-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>Customer Reviews</h2>
            {product.numOfReviews > 0 && (
              <div className="reviews-summary">
                <div className="average-rating">
                  <span className="rating-number">{(product.ratings || 0).toFixed(1)}</span>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < Math.floor(product.ratings || 0) ? 'star filled' : 'star'}
                      />
                    ))}
                  </div>
                  <span className="total-reviews">{product.numOfReviews} reviews</span>
                </div>
              </div>
            )}
            <button
              className="btn btn-outline"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <motion.form
              className="review-form"
              onSubmit={handleSubmitReview}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="form-group">
                <label>Rating</label>
                <div className="star-rating">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <label key={star}>
                      <input
                        type="radio"
                        name="rating"
                        value={star}
                        checked={reviewData.rating === star}
                        onChange={(e) => setReviewData({ ...reviewData, rating: Number(e.target.value) })}
                      />
                      <span>{star} ★</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Review Title</label>
                <input
                  type="text"
                  value={reviewData.title}
                  onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                  required
                  placeholder="Summarize your experience"
                />
              </div>
              <div className="form-group">
                <label>Review</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  required
                  rows="5"
                  placeholder="Share your thoughts about this product"
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">
                Submit Review
              </button>
            </motion.form>
          )}

          {/* Reviews List */}
          <div className="reviews-list">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{review.name}</h4>
                        {review.verifiedPurchase && (
                          <span className="verified-badge">✓ Verified Purchase</span>
                        )}
                      </div>
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < review.rating ? 'star filled' : 'star'}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="review-title">{review.title}</h3>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
