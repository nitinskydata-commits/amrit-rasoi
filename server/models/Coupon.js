const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please enter coupon code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please enter coupon description']
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'flat'],
    default: 'percentage'
  },
  discount: {
    type: Number,
    required: [true, 'Please enter discount value']
  },
  minPrice: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  maxUses: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  applicableBrands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  applicableCategories: [String],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Please enter expiry date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
