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
  images: [{
    public_id: String,
    url: String
  }],
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Universal Variant Schema (Amazon Style)
const variantSchema = new mongoose.Schema({
  attributes: [{
    name: { type: String, required: true },   // e.g. "Weight", "Color", "Size"
    value: { type: String, required: true }   // e.g. "500g", "Red", "XL"
  }],
  price: {
    type: Number,
    required: true
  },
  mrp: {
    type: Number,
    required: true
  },
  minPrice: {
    type: Number,
    default: 0          // Prevents the dynamic discount engine from pricing below cost
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sku: String,
  barcode: String,
  images: [{
    publicId: String,
    url: String
  }],
  videos: [{
    publicId: String,
    url: String
  }],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  shippingWeight: Number,
  taxRate: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  shippingClass: { type: String, default: 'standard' },
  isFragile: { type: Boolean, default: false },
  warehouseStock: [{
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    quantity: { type: Number, default: 0 }
  }]
});

const productSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true
  },
  tenantId: {
    type: String,
    default: 'platform',
    index: true
  },
  // Product Type System
  productType: {
    type: String,
    enum: ['simple', 'variable', 'digital', 'subscription', 'bundle'],
    default: 'variable'
  },
  // Publish Status Workflow
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'hidden', 'archived'],
    default: 'draft'
  },
  scheduledPublishDate: {
    type: Date,
    default: null
  },
  name: {
    type: String,
    required: [true, 'Please enter product name'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // SEO Fields
  seoTitle: {
    type: String,
    default: ''
  },
  seoDescription: {
    type: String,
    default: ''
  },
  seoKeywords: [{
    type: String,
    trim: true
  }],
  canonicalUrl: {
    type: String,
    default: ''
  },
  ogImage: {
    publicId: String,
    url: String
  },

  // Tags for search & recommendations
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // Technical specifications (key-value pairs, shown in product specs table)
  specifications: [{
    key: { type: String },
    value: { type: String }
  }],
  
  // Default pricing (for backward compatibility and non-variant products)
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
  minPrice: {
    type: Number,
    default: 0.0        // Minimum loss-prevention price
  },
  
  hasVariants: {
    type: Boolean,
    default: false
  },
  variantType: {
    type: String, // e.g., "Weight", "Color", "Size", "Storage"
    default: 'Weight'
  },
  
  // Universal variants array
  variants: [variantSchema],
  
  images: [{
    publicId: String,
    url: String
  }],
  
  // Dynamic category (no enum constraint — managed via Category collection)
  category: {
    type: String,
    required: [true, 'Please select product category']
  },
  subcategory: {
    type: String,
    default: ''
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

  // Digital Product Assets
  digitalAssets: {
    files: [{
      name: String,
      url: String,
      size: Number
    }],
    licenseKey: { type: String, default: '' },
    downloadLimit: { type: Number, default: -1 },
    expiryDays: { type: Number, default: 0 }
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

productSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text', tags: 'text' });
productSchema.index({ tenantId: 1, isActive: 1, category: 1 });
productSchema.index({ organization: 1, isActive: 1 });

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

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

productSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slugify(this.name);
  next();
});

module.exports = mongoose.model('Product', productSchema);
