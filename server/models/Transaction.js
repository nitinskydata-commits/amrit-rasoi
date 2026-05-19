const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true,
    default: null
  },
  tenantId: {
    type: String,
    index: true,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  category: {
    type: String,
    enum: ['sale', 'commission', 'refund', 'settlement', 'adjustment', 'tax'],
    required: true
  },
  referenceId: {
    type: String,
    default: null,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
