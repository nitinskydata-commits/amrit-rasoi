const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a warehouse name'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please provide a unique warehouse code'],
    unique: true,
    trim: true,
    uppercase: true
  },
  address: {
    type: String,
    required: [true, 'Please provide a physical address']
  },
  city: {
    type: String,
    required: [true, 'Please provide a city for logistics routing']
  },
  state: {
    type: String,
    required: [true, 'Please provide a state for GST tax calculation'],
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  capacity: {
    type: Number,
    required: [true, 'Please define warehouse max capacity in units'],
    default: 10000
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'full', 'maintenance'],
    default: 'active'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true,
    default: null
  },
  tenantId: {
    type: String,
    index: true,
    default: 'platform'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
