const Organization = require('../models/Organization');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { writeAuditLog } = require('../utils/auditLogger');

// ==================== CREATE ====================

// Create Organization (admin / platform_admin only)
exports.createOrganization = async (req, res) => {
  try {
    const {
      name, type, contactEmail, contactPhone, website,
      address, description, commissionRate, payoutAccount, ownerId
    } = req.body;

    const org = await Organization.create({
      name,
      type,
      contactEmail,
      contactPhone,
      website,
      address,
      description,
      commissionRate: commissionRate ?? 10,
      payoutAccount,
      owner: ownerId || null,
      createdBy: req.user._id,
      status: 'active'
    });

    // If an owner user is specified, link them to this org
    if (ownerId) {
      await User.findByIdAndUpdate(ownerId, {
        organizationId: org._id,
        organizationType: type
      });
    }

    await writeAuditLog({
      req,
      action: 'ORGANIZATION_CREATED',
      targetModel: 'Organization',
      targetId: org._id,
      newState: { name: org.name, type: org.type }
    });

    res.status(201).json({
      success: true,
      message: `Organization "${org.name}" created successfully`,
      organization: org
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== READ ====================

// Get all organizations (admin — full list | org owner — own only)
exports.getAllOrganizations = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = {};

    // Non-admins only see their own org
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      if (req.user.organizationId) {
        query._id = req.user.organizationId;
      } else {
        return res.status(200).json({ success: true, count: 0, organizations: [] });
      }
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const organizations = await Organization.find(query)
      .populate('owner', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: organizations.length,
      organizations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single organization
exports.getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('owner', 'name email phone role')
      .populate('createdBy', 'name email');

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Non-admins can only see their own org
    if (!['admin', 'platform_admin'].includes(req.user.role)) {
      if (!req.user.organizationId || req.user.organizationId.toString() !== org._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.status(200).json({ success: true, organization: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE ====================

// Update organization details
exports.updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Only admins or the org owner can update
    const isAdmin = ['admin', 'platform_admin'].includes(req.user.role);
    const isOwner = org.owner && org.owner.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allowedFields = [
      'name', 'contactEmail', 'contactPhone', 'website',
      'address', 'description', 'logoUrl', 'payoutAccount', 'settings'
    ];
    // Only admins can change commission rate, status, type
    if (isAdmin) {
      allowedFields.push('commissionRate', 'status', 'type', 'ownerId');
    }

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (req.body.ownerId && isAdmin) {
      updateData.owner = req.body.ownerId;
      await User.findByIdAndUpdate(req.body.ownerId, {
        organizationId: org._id,
        organizationType: org.type
      });
    }

    const previous = org.toObject();
    const updated = await Organization.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true
    });

    await writeAuditLog({
      req,
      action: 'ORGANIZATION_UPDATED',
      targetModel: 'Organization',
      targetId: org._id,
      previousState: { name: previous.name, status: previous.status },
      newState: { name: updated.name, status: updated.status }
    });

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      organization: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Suspend/Activate organization (admin only)
exports.setOrganizationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'pending', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const org = await Organization.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    await writeAuditLog({
      req,
      action: `ORGANIZATION_STATUS_CHANGED_TO_${status.toUpperCase()}`,
      targetModel: 'Organization',
      targetId: org._id,
      newState: { status }
    });

    res.status(200).json({
      success: true,
      message: `Organization "${org.name}" status changed to ${status}`,
      organization: org
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ANALYTICS (Isolated per org) ====================

// Get organization-specific analytics (owner or admin)
exports.getOrganizationAnalytics = async (req, res) => {
  try {
    const orgId = req.params.id;

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Access check
    const isAdmin = ['admin', 'platform_admin'].includes(req.user.role);
    const isOwner = org.owner && org.owner.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner && req.user.organizationId?.toString() !== orgId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Products count
    const totalProducts = await Product.countDocuments({ organization: orgId });

    // Orders scoped to this org (via orderItems tenantId or organization)
    const orders = await Order.find({ 'orderItems.organization': orgId });
    const totalOrders = orders.length;

    // Revenue from org's items only
    let totalRevenue = 0;
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.organization && item.organization.toString() === orgId) {
          totalRevenue += (item.price * item.quantity);
        }
      });
    });

    const platformCommission = totalRevenue * (org.commissionRate / 100);
    const vendorPayout = totalRevenue - platformCommission;

    res.status(200).json({
      success: true,
      analytics: {
        organizationName: org.name,
        type: org.type,
        commissionRate: org.commissionRate,
        totalProducts,
        totalOrders,
        totalRevenue,
        platformCommission,
        vendorPayout
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE ====================

// Delete organization (admin only — soft delete via status change)
exports.deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Soft delete — set status to 'closed' to preserve historical data
    org.status = 'closed';
    await org.save();

    await writeAuditLog({
      req,
      action: 'ORGANIZATION_DELETED',
      targetModel: 'Organization',
      targetId: org._id,
      previousState: { name: org.name, status: 'active' },
      newState: { status: 'closed' }
    });

    res.status(200).json({
      success: true,
      message: `Organization "${org.name}" has been closed and archived`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
