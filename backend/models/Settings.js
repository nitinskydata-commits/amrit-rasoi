const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Site Information
  siteName: {
    type: String,
    default: 'SBMI - Shree Bhanwal Mata Industries'
  },
  tagline: {
    type: String,
    default: 'Premium Quality Spices'
  },
  companyLogo: {
    public_id: String,
    url: String
  },
  
  // Contact Information
  supportEmail: {
    type: String,
    default: 'support@sbmi.com'
  },
  supportPhone: {
    type: String,
    default: '+91-XXXXXXXXXX'
  },
  companyAddress: {
    type: String,
    default: 'Baliali, Punjab, India'
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
    linkedin: String
  },
  
  // Payment Settings
  codEnabled: {
    type: Boolean,
    default: true
  },
  onlinePaymentsEnabled: {
    type: Boolean,
    default: true
  },
  codMinOrder: {
    type: Number,
    default: 0
  },
  codMaxOrder: {
    type: Number,
    default: 50000
  },
  codExtraFee: {
    type: Number,
    default: 0
  },
  
  // Policies
  refundPolicyText: {
    type: String,
    default: 'We offer 7-day return and refund policy on selected products.'
  },
  shippingPolicyText: {
    type: String,
    default: 'We ship within 2-3 business days.'
  },
  privacyPolicyText: String,
  termsAndConditionsText: String,
  
  // Other Settings
  gstNumber: String,
  fssaiNumber: String,
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Only allow one settings document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
