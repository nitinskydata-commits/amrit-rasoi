const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    tenantId: {
      type: String,
      default: 'platform'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,     // Selling price (variant-specific snapshot)
    mrp: Number,       // MRP snapshot for strikethrough display
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    image: String,     // Variant-specific image URL (falls back to main product image)
    // ✅ Variant tracking — stored as string to survive product updates
    variantId: String,       // The variant's _id at time of adding to cart
    variantLabel: String,    // Human-readable snapshot e.g. "Weight: 500g, Color: Red"
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cart', cartSchema);
