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
    enum: ['user', 'admin'],
    default: 'user'
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
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

// Generate Auth Token (new name - same functionality)
userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = mongoose.model('User', userSchema);
