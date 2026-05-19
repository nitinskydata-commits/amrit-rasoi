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
  // branding links
  companyLogo: {
    public_id: String,
    url: String
  },
  favIcon: {
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
  /** Shown in header when the user has no saved address (e.g. "Ships across India" or your warehouse city) */
  deliveryAreaLabel: {
    type: String,
    default: ''
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
    linkedin: String
  },

  // SEO & Analytics
  metaTitle: {
    type: String,
    default: 'SBMI - Shree Bhanwal Mata Industries'
  },
  metaDescription: {
    type: String,
    default: 'Premium Quality Spices and Food Products'
  },
  metaKeywords: String,
  googleAnalyticsId: String,

  // UI Content
  footerText: {
    type: String,
    default: '© 2024 SBMI - Shree Bhanwal Mata Industries. All Rights Reserved.'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
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
  fssaiNumber: String
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
