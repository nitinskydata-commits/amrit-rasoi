const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  
  // ✅ EXISTING: Keep your original paymentInfo
  paymentInfo: {
    id: String,
    status: String,
    method: String
  },
  
  // ✅ NEW: Enhanced Payment Details
  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'UPI', 'Card', 'NetBanking', 'Wallet', 'Other'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'PartialRefund'],
    default: 'Pending'
  },
  transactionId: String,
  
  // ✅ NEW: COD Extra Fee
  codFee: {
    type: Number,
    default: 0
  },
  
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  
  orderStatus: {
    type: String,
    enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing'
  },
  
  // ✅ NEW: Refund Management
  refundStatus: {
    type: String,
    enum: ['None', 'Requested', 'Processing', 'Completed', 'Rejected'],
    default: 'None'
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  refundedAt: Date,
  refundTransactionId: String,
  
  // ✅ NEW: Invoice & Tracking
  invoiceNumber: String,
  trackingId: String,
  
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
