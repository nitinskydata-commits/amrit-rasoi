const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,  // Allows multiple null values
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please enter your phone number'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    minLength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: [
      // Platform-level roles (Level 0-1)
      'admin',
      'platform_admin',
      // Organization owner roles (Level 2)
      'vendor_owner',
      'partner_admin',
      'franchise_manager',
      // Department manager roles (Level 3)
      'regional_manager',
      'warehouse_manager',
      'inventory_manager',
      'order_manager',
      'marketing_manager',
      'branch_manager',
      // Staff roles (Level 4)
      'finance_staff',
      'support_staff',
      'moderator',
      'staff',
      'vendor_staff',
      // Operational worker roles (Level 5)
      'warehouse_staff',
      'delivery_agent',
      'delivery_boy',
      // B2B Wholesale Customer Role
      'wholesale_buyer',
      // Customer (Level 6)
      'user'
    ],
    default: 'user'
  },
  
  // ==================== WHOLESALE SYSTEM ====================
  isWholesale: {
    type: Boolean,
    default: false
  },
  wholesaleStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  wholesaleProfile: {
    companyName: { type: String, default: '' },
    gstin: { type: String, default: '' },
    tradeLicense: { type: String, default: '' },
    businessAddress: { type: String, default: '' },
    appliedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null }
  },
  // Organization this user belongs to (null = platform staff or customer)
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  organizationType: {
    type: String,
    default: null
  },
  permissions: {
    manageProducts: { type: Boolean, default: false },
    manageOrders: { type: Boolean, default: false },
    manageReviews: { type: Boolean, default: false },
    manageNewsletters: { type: Boolean, default: false },
    manageInventory: { type: Boolean, default: false }
  },
  // Legacy: collaboration scoping for partner_admin (keep for backward compatibility)
  collaboration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration',
    default: null
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },

  // ==================== SELLER SYSTEM ====================
  sellerStatus: {
    type: String,
    enum: [
      'none',          // Not applied
      'pending',       // Application submitted
      'kyc_in_progress', // Admin started KYC review
      'kyc_approved',  // KYC passed, awaiting payment setup from seller
      'kyc_failed',    // KYC failed with reason
      'payment_pending', // Seller submitted payment gateway details
      'approved',      // Fully onboarded active seller
      'rejected',      // Rejected at any stage
      'suspended'      // Suspended after approval
    ],
    default: 'none'
  },
  sellerProfile: {
    shopName: { type: String, default: '' },
    shopDescription: { type: String, default: '' },
    shopLogo: { type: String, default: '' },
    gstin: { type: String, default: '' },
    pan: { type: String, default: '' },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
      upiId: { type: String, default: '' }
    },
    businessAddress: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' }
    },
    appliedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    commissionRate: { type: Number, default: 10 },
    // KYC pipeline tracking
    kycStartedAt: { type: Date, default: null },
    kycApprovedAt: { type: Date, default: null },
    kycFailedAt: { type: Date, default: null },
    kycFailedReason: { type: String, default: '' },
    // Payment gateway submitted by seller after KYC approval
    paymentGateway: {
      upiId: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
      paymentGatewayProvider: { type: String, default: '' }, // e.g. Razorpay, Stripe
      merchantId: { type: String, default: '' },
      submittedAt: { type: Date, default: null }
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  branchName: {
    type: String,
    default: null
  },
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  addresses: [{
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    addressType: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home'
    },
    isDefault: { type: Boolean, default: false }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

// Hash password before saving (only if password exists and is modified)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Token (keeping old name for compatibility)
userSchema.methods.getJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate JWT Token (uppercase alias)
userSchema.methods.getJWTToken = function() {
  return this.getJwtToken();
};

// Generate Auth Token (alias)
userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = mongoose.model('User', userSchema);
