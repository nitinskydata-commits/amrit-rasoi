const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  tenantId: {
    type: String,
    index: true,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payout amount must be positive']
  },
  bankDetails: {
    bankName: {
      type: String,
      required: true
    },
    accountNumber: {
      type: String,
      required: true
    },
    ifscCode: {
      type: String,
      required: true
    },
    accountHolderName: {
      type: String,
      required: true
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
    index: true
  },
  transactionRef: {
    type: String,
    default: null,
    index: true
  },
  transferReceiptUrl: {
    type: String,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payout', payoutSchema);
