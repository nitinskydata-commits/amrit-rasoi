const mongoose = require('mongoose');

const siteBadgeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    url: String,
    publicId: String
  },
  emoji: {
    type: String,
    default: '✓'
  },
  order: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteBadge', siteBadgeSchema);
