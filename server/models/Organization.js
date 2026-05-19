const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Organization type is required'],
    enum: [
      'internal_brand',   // Your own brands (e.g., Amrit Rasoi)
      'partner_brand',    // Collaboration partner brands
      'external_vendor',  // External sellers/vendors
      'vendor',           // Alias for external_vendor
      'distributor',      // Distribution partners
      'franchise',        // Franchise operators
      'logistics_partner' // Delivery/shipping companies
    ],
    default: 'internal_brand'
  },

  // Contact & Details
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  contactPhone: String,
  website: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  logoUrl: String,
  description: String,

  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Tenant isolation key
  tenantId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },

  // Financial Settings
  commissionRate: {
    type: Number,
    default: 10,      // Platform takes 10% by default
    min: 0,
    max: 100
  },
  payoutAccount: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    accountHolderName: String
  },

  // Revenue tracking (aggregated)
  totalRevenue: { type: Number, default: 0 },
  totalPayouts: { type: Number, default: 0 },
  pendingPayout: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'archived', 'closed'],
    default: 'pending'
  },

  // KYC Fields
  kycStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    default: 'not_submitted'
  },
  gstin: {
    type: String,
    trim: true
  },
  pan: {
    type: String,
    trim: true
  },
  bankVerificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  documentUrl: {
    type: String
  },
  kycRemarks: {
    type: String
  },

  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Backward compat: link to existing Collaboration record
  collaborationRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration',
    default: null
  }

}, { timestamps: true });

// Auto-generate slug from name
organizationSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
    // Also auto-set tenantId if not set
    if (!this.tenantId) {
      this.tenantId = this.slug + '-' + Date.now().toString(36);
    }
  }
  next();
});

// Indexes for fast tenant lookup
organizationSchema.index({ type: 1, status: 1 });
organizationSchema.index({ owner: 1 });
organizationSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
