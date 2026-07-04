const mongoose = require('mongoose');

const inventoryLedgerSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Please associate ledger entry with a product'],
    index: true
  },
  variantId: {
    type: String,
    default: null
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null,
    index: true
  },
  quantityChanged: {
    type: Number,
    required: [true, 'Please specify quantity changed (+ or -)']
  },
  transactionType: {
    type: String,
    enum: ['intake', 'transfer_in', 'transfer_out', 'sale', 'return', 'write_off', 'adjustment'],
    required: [true, 'Please specify transaction type']
  },
  referenceId: {
    type: String,
    default: null
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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

module.exports = mongoose.model('InventoryLedger', inventoryLedgerSchema);
