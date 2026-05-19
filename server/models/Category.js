const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  icon: {
    type: String,
    default: ''
  },
  image: {
    publicId: String,
    url: String
  },
  // Attributes that should appear by default when this category is selected
  attributePresets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductAttribute'
  }],
  // Specification template for this category (e.g., "Processor", "Battery" for Electronics)
  specificationTemplate: [{
    key: { type: String },
    required: { type: Boolean, default: false }
  }],
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-generate slug from name
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
