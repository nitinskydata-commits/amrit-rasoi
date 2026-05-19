const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  partnerName: {
    type: String,
    required: [true, 'Please enter partner company name']
  },
  partnerEmail: {
    type: String,
    required: [true, 'Please enter partner email']
  },
  partnerPhone: String,
  description: {
    type: String,
    required: [true, 'Please enter collaboration description']
  },
  startDate: {
    type: Date,
    required: [true, 'Please enter start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please enter end date']
  },
  terms: String,
  revenueShare: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  productsListed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Collaboration', collaborationSchema);
