const mongoose = require('mongoose');

const productAttributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Attribute name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['select', 'color_swatch', 'text', 'number', 'boolean'],
    default: 'select'
  },
  values: [{
    type: String,
    trim: true
  }],
  // Which categories this attribute applies to (empty = global)
  categories: [{
    type: String,
    trim: true
  }],
  isGlobal: {
    type: Boolean,
    default: false
  },
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
productAttributeSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }
  next();
});

module.exports = mongoose.model('ProductAttribute', productAttributeSchema);
