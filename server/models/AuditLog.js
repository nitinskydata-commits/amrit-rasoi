const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  organizationType: {
    type: String,
    default: null
  },
  action: {
    type: String,
    required: true // e.g. "CREATE_PRODUCT", "UPDATE_PERMISSIONS", "DELETE_REVIEW"
  },
  targetModel: {
    type: String,
    required: true // e.g. "Product", "User", "Order"
  },
  targetId: {
    type: String,
    required: true
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  tenantId: {
    type: String,
    default: null
  },
  collaboration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
