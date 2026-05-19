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
      // Customer (Level 6)
      'user'
    ],
    default: 'user'
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

// Generate Auth Token (alias)
userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = mongoose.model('User', userSchema);
