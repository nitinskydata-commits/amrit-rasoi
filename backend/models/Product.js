const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Weight Variant Schema - THIS IS KEY!
const weightVariantSchema = new mongoose.Schema({
  weight: {
    type: String,
    required: true // e.g., "100g", "200g", "500g", "1kg"
  },
  price: {
    type: Number,
    required: true
  },
  mrp: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter product name'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Default pricing (for backward compatibility and base price)
  price: {
    type: Number,
    required: [true, 'Please enter product price'],
    default: 0.0
  },
  originalPrice: {
    type: Number,
    default: 0.0
  },
  mrp: {
    type: Number,
    default: 0.0
  },
  
  // NEW: Weight variants array
  variants: [weightVariantSchema],
  
  images: [{
    publicId: String,
    url: String
  }],
  
  category: {
    type: String,
    required: [true, 'Please select product category'],
    enum: ['Spices', 'Powders', 'Blends', 'Organic', 'Masalas', 'Seeds', 'Herbs']
  },
  
  brand: {
    type: String,
    default: 'Amrit Rasoi'
  },
  brandName: {
    type: String,
    default: 'Amrit Rasoi'
  },
  
  stock: {
    type: Number,
    required: [true, 'Please enter product stock'],
    default: 0
  },
  
  weight: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    enum: ['g', 'kg', 'ml', 'l', 'pcs'],
    default: 'g'
  },
  
  // Payment Options
  codAllowed: {
    type: Boolean,
    default: true
  },
  onlinePaymentOnly: {
    type: Boolean,
    default: false
  },
  
  // Refund Policy
  isRefundable: {
    type: Boolean,
    default: true
  },
  refundWindowDays: {
    type: Number,
    default: 7
  },
  replacementOnly: {
    type: Boolean,
    default: false
  },
  
  // Collaboration
  isCollaborationProduct: {
    type: Boolean,
    default: false
  },
  collaboration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration'
  },
  
  // Promotions & Visibility
  isFeatured: {
    type: Boolean,
    default: false
  },
  /** Shown on Today's Deals (home strip + /deals) — set in admin */
  inTodaysDeal: {
    type: Boolean,
    default: false
  },
  /** Shown on New Arrivals (home strip + /new-arrivals) — set in admin */
  inNewArrivals: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Real Reviews and Ratings
  ratings: {
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  reviews: [reviewSchema],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text' });

// Auto-calculate ratings whenever reviews are updated
productSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.ratings = (totalRating / this.reviews.length).toFixed(1);
    this.numOfReviews = this.reviews.length;
  } else {
    this.ratings = 0;
    this.numOfReviews = 0;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
