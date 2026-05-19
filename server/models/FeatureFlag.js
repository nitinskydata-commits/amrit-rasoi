const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Please enter feature flag unique key'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please enter user friendly feature name']
  },
  description: {
    type: String,
    default: ''
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  rules: {
    allowedRoles: [{
      type: String // e.g. ["admin", "inventory_manager"]
    }],
    allowedTenants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collaboration' // Feature flag active only for specific premium brands
    }],
    percentageRollout: {
      type: Number,
      default: 100 // 0 to 100 for canary testing
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
