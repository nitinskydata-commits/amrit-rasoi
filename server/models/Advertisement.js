const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter ad title']
  },
  description: String,
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  image: {
    public_id: String,
    url: String
  },
  video: {
    public_id: String,
    url: String
  },
  link: String,
  position: {
    type: String,
    enum: ['home-top', 'home-middle', 'home-sidebar', 'home-overlay', 'product-banner', 'checkout-banner', 'footer'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Please enter end date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  advertiser: {
    name: String,
    email: String,
    phone: String
  },
  paymentReceived: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Advertisement', advertisementSchema);
