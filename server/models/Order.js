const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true
  },
  tenantId: {
    type: String,
    default: 'platform',
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [{
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    tenantId: {
      type: String,
      default: 'platform'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: String,
    quantity: Number,
    price: Number,   // Selling price snapshot
    mrp: Number,     // MRP snapshot for invoice/display
    image: String,
    variantId: String,     // Variant _id snapshot (string, survives product edits)
    variantLabel: String,   // e.g. "Weight: 500g, Color: Red"
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null
    },
    warehouseCode: {
      type: String,
      default: null
    },
    commissionRate: {
      type: Number,
      default: 10
    },
    commissionPaid: {
      type: Number,
      default: 0
    },
    netVendorPayout: {
      type: Number,
      default: 0
    },
    gstRate: {
      type: Number,
      default: 18
    },
    cgst: {
      type: Number,
      default: 0
    },
    sgst: {
      type: Number,
      default: 0
    },
    igst: {
      type: Number,
      default: 0
    }
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
  
  gstBreakdown: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 }
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
  assignedBranch: {
    type: String,
    default: null
  },
  assignedDeliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryOTP: {
    type: String,
    default: null
  },
  couponCode: {
    type: String,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
