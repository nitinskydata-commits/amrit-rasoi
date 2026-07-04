import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductDetails, createReview } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { toast } from 'react-toastify';
import { FaStar, FaShoppingCart, FaTruck, FaShieldAlt, FaExchangeAlt, FaHeart, FaRegHeart, FaLock, FaStore } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import ProductCard from '../components/ProductCard';

import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, loading } = useSelector(state => state.products);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { wishlist } = useSelector(state => state.wishlist);
  const isInWishlist = wishlist?.some(item => item._id === product?._id);
  const { settings } = useSelector(state => state.settings);

  const [selectedImage, setSelectedImage] = useState(0);
  const [activeImages, setActiveImages] = useState([]);
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

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    dispatch(getProductDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products/recommendations/${id}`);
        setRecommendations(data.products || []);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    };
    fetchRecommendations();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const getVariantLabel = (variant) => {
    if (!variant) return '';
    if (variant.attributes && variant.attributes.length > 0) {
      return variant.attributes.map(a => a.value).join(' / ');
    }
    return variant.weight || '';
  };

  // Update prices and images when variant changes or product loads
  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants[selectedVariant];
        setCurrentPrice(variant.price);
        setCurrentMRP(variant.mrp);
        setCurrentStock(variant.stock);
        setCurrentWeight(getVariantLabel(variant));

        // Switch to variant specific images if they exist, else fallback to product images
        if (variant.images && variant.images.length > 0) {
          setActiveImages(variant.images);
        } else {
          setActiveImages(product.images || []);
        }
        setSelectedImage(0);
      } else {
        // Fallback to default pricing
        setCurrentPrice(product.price);
        setCurrentMRP(product.mrp);
        setCurrentStock(product.stock);
        setCurrentWeight('');
        setActiveImages(product.images || []);
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
        variant: currentWeight || getVariantLabel(product.variants?.[selectedVariant]) || ''
      })).unwrap();
      
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    if(isAuthenticated) {
      navigate('/checkout');
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to manage your wishlist');
      navigate('/login');
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

  // Derive date for delivery estimate (e.g. 3 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryOptions = { weekday: 'long', day: 'numeric', month: 'short' };
  const deliveryDateString = deliveryDate.toLocaleDateString('en-IN', deliveryOptions);

  return (
    <div className="product-detail-amazon">
      <div className="amazon-container">
        
        {/* Amazon-Style Breadcrumbs */}
        <div className="amz-breadcrumbs">
          <span>Home</span> &rsaquo; <span>{product.category || 'Shop'}</span> &rsaquo; <span>{product.brand || 'SBMI'}</span>
        </div>

        <div className="amz-layout-grid">
          
          {/* LEFT: GALLERY */}
          <div className="amz-gallery-col">
            <div className="amz-thumbnails-list">
              {activeImages?.map((image, index) => (
                <div
                  key={index}
                  className={`amz-thumb ${selectedImage === index ? 'active' : ''}`}
                  onMouseEnter={() => setSelectedImage(index)}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image.url} alt={`${product.name} ${index + 1}`} />
                </div>
              ))}
            </div>
            <div className="amz-main-image-view">
              {activeImages && activeImages.length > 0 ? (
                <img src={activeImages[selectedImage]?.url} alt={product.name} className="img-fluid" />
              ) : (
                <div className="no-image-placeholder">No Image Available</div>
              )}
            </div>
          </div>

          {/* CENTER: PRODUCT INFO */}
          <div className="amz-info-col">
            <h1 className="amz-product-title">{product.name}</h1>
            <a href="#" className="amz-brand-link">Visit the {product.brand || 'SBMI'} Store</a>
            
            <div className="amz-ratings-row">
              <span className="amz-rating-number">{(product.ratings || 0).toFixed(1)}</span>
              <div className="amz-stars">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={i < Math.round(product.ratings || 0) ? 'star-filled' : 'star-empty'} />
                ))}
              </div>
              <span className="amz-ratings-count">⌄ {product.numOfReviews || 0} ratings</span>
            </div>

            <div className="amz-badges-row">
               {(product.inTodaysDeal || product.isFeatured) && (
                 <span className="amz-choice-badge">
                   <span className="amz-badge-text">SBMI Choice</span>
                   <span className="amz-badge-arrow"></span>
                 </span>
               )}
               <span className="amz-bought-past-month">100+ bought in past month</span>
            </div>

            <hr className="amz-divider" />

            {/* Price Block */}
            <div className="amz-price-block">
              {discountPercent > 0 && <span className="amz-discount-tag">-{discountPercent}%</span>}
              <span className="amz-selling-price">
                <span className="amz-rupee">₹</span>{currentPrice}
              </span>
              <div className="amz-mrp-row">
                <span className="amz-mrp-label">M.R.P.: </span>
                <span className="amz-mrp-value">₹{currentMRP}</span>
              </div>
              <p className="amz-tax-info">Inclusive of all taxes</p>
            </div>

            <hr className="amz-divider" />

            {/* Offers Grid */}
            {settings?.productOffers && settings.productOffers.length > 0 && (
              <div className="amz-offers-section">
                <h3 className="amz-section-subtitle">Offers</h3>
                <div className="amz-offers-grid">
                  {settings.productOffers.map((offer, idx) => (
                    <div className="amz-offer-card" key={idx}>
                      <h4>{offer.title}</h4>
                      <p>{offer.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="amz-divider" />

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="amz-variants-wrapper">
                <h3 className="amz-variant-title">{product.variantType || 'Size / Weight'}: <strong>{currentWeight}</strong></h3>
                <div className="amz-variants-flex">
                  {product.variants.map((variant, index) => (
                    <div
                      key={index}
                      className={`amz-variant-chip ${selectedVariant === index ? 'active' : ''}`}
                      onClick={() => handleVariantChange(index)}
                    >
                      <span className="amz-variant-val">{getVariantLabel(variant)}</span>
                      <span className="amz-variant-prc">₹{variant.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Specifics */}
            <div className="amz-tech-details">
              <table>
                <tbody>
                  <tr>
                    <td className="amz-td-label">Brand</td>
                    <td className="amz-td-value">{product.brand || 'SBMI'}</td>
                  </tr>
                  <tr>
                    <td className="amz-td-label">Item Weight</td>
                    <td className="amz-td-value">{currentWeight || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="amz-td-label">Form</td>
                    <td className="amz-td-value">{product.category || 'N/A'}</td>
                  </tr>
                  {product.specifications && product.specifications.map((spec, i) => (
                     <tr key={i}>
                       <td className="amz-td-label">{spec.key}</td>
                       <td className="amz-td-value">{spec.value}</td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <hr className="amz-divider" />

            {/* About this item (Description bullets) */}
            <div className="amz-about-item">
              <h3>About this item</h3>
              <ul className="amz-bullets">
                {product.description 
                  ? product.description.split('\n').filter(line => line.trim() !== '').map((line, i) => (
                      <li key={i}>{line}</li>
                    ))
                  : <li>Premium quality product directly sourced and verified.</li>
                }
              </ul>
            </div>
          </div>

          {/* RIGHT: BUY BOX */}
          <div className="amz-buybox-col">
            <div className="amz-buybox-card">
              <div className="amz-buybox-price">
                <span className="amz-rupee">₹</span>{currentPrice}
              </div>
              
              <div className="amz-delivery-date">
                FREE delivery <strong>{deliveryDateString}</strong>. Order within <span className="amz-green-text">5 hrs 30 mins</span>.
              </div>
              <div className="amz-location-marker">
                <FaTruck className="amz-loc-icon"/> Deliver to Customer - Anywhere
              </div>

              {currentStock > 0 ? (
                <div className="amz-stock-status">In stock</div>
              ) : (
                <div className="amz-stock-status out">Currently unavailable.</div>
              )}

              {currentStock > 0 && (
                <>
                  <div className="amz-quantity-select">
                    <label>Quantity: </label>
                    <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
                      {[...Array(Math.min(10, currentStock))].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                      ))}
                    </select>
                  </div>

                  <button className="amz-btn amz-btn-cart" onClick={handleAddToCart}>
                    Add to Cart
                  </button>
                  <button className="amz-btn amz-btn-buy" onClick={handleBuyNow}>
                    Buy Now
                  </button>
                </>
              )}

              <div className="amz-buybox-ledger">
                <div className="ledger-row">
                  <span className="ledger-label">Ships from</span>
                  <span className="ledger-value">{product.seller ? product.brand : 'SBMI'}</span>
                </div>
                <div className="ledger-row">
                  <span className="ledger-label">Sold by</span>
                  <span className="ledger-value">{product.brand || 'SBMI'}</span>
                </div>
                <div className="ledger-row secure-tx">
                  <FaLock className="secure-icon" /> Secure transaction
                </div>
              </div>

              <hr className="amz-divider" />
              
              <button 
                className={`amz-wishlist-btn ${isInWishlist ? 'active' : ''}`}
                onClick={handleWishlistToggle}
              >
                {isInWishlist ? 'Added to Wish List' : 'Add to Wish List'}
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTIONS */}
        <div className="amz-bottom-sections">
          
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="amz-recommendations">
              <h2>Related items bought by customers</h2>
              <div className="amz-scroll-row">
                {recommendations.map(prod => (
                  <div className="amz-rec-card" key={prod._id} onClick={() => navigate(`/product/${prod._id}`)}>
                    <img src={prod.images?.[0]?.url || ''} alt={prod.name} />
                    <span className="rec-title">{prod.name}</span>
                    <div className="rec-rating">
                      <div className="amz-stars">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < Math.round(prod.ratings || 0) ? 'star-filled' : 'star-empty'} />
                        ))}
                      </div>
                      <span className="rec-count">{prod.numOfReviews || 0}</span>
                    </div>
                    <span className="rec-price">₹{prod.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews Section */}
          <div className="amz-reviews-container">
             <h2>Customer Reviews</h2>
             <div className="amz-reviews-grid">
                
                {/* Reviews Summary Column */}
                <div className="amz-reviews-summary-col">
                  <div className="amz-big-rating">
                    <div className="amz-stars-large">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < Math.round(product.ratings || 0) ? 'star-filled' : 'star-empty'} />
                        ))}
                    </div>
                    <span className="amz-rating-out-of">{(product.ratings || 0).toFixed(1)} out of 5</span>
                  </div>
                  <p className="amz-global-ratings">{product.numOfReviews || 0} global ratings</p>

                  <div className="amz-review-action">
                    <h3>Review this product</h3>
                    <p>Share your thoughts with other customers</p>
                    <button className="amz-write-review-btn" onClick={() => setShowReviewForm(!showReviewForm)}>
                      Write a product review
                    </button>
                  </div>

                  {showReviewForm && (
                    <form className="amz-review-form" onSubmit={handleSubmitReview}>
                      <div className="form-group">
                        <label>Overall rating</label>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
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
                        <label>Add a headline</label>
                        <input
                          type="text"
                          value={reviewData.title}
                          onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                          required
                          placeholder="What's most important to know?"
                        />
                      </div>
                      <div className="form-group">
                        <label>Add a written review</label>
                        <textarea
                          value={reviewData.comment}
                          onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                          required
                          rows="4"
                          placeholder="What did you like or dislike? What did you use this product for?"
                        ></textarea>
                      </div>
                      <button type="submit" className="amz-submit-btn">Submit</button>
                    </form>
                  )}
                </div>

                {/* Reviews List Column */}
                <div className="amz-reviews-list-col">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((review) => (
                      <div key={review._id} className="amz-review-item">
                        <div className="amz-reviewer-profile">
                          <div className="amz-avatar">{review.name.charAt(0).toUpperCase()}</div>
                          <span className="amz-reviewer-name">{review.name}</span>
                        </div>
                        <div className="amz-review-rating-title">
                          <div className="amz-stars">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={i < review.rating ? 'star-filled' : 'star-empty'} />
                            ))}
                          </div>
                          <span className="amz-review-title">{review.title}</span>
                        </div>
                        <span className="amz-review-date">
                          Reviewed in India on {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {review.verifiedPurchase && (
                          <span className="amz-verified-badge">Verified Purchase</span>
                        )}
                        <p className="amz-review-text">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="amz-no-reviews">No customer reviews yet.</p>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
