const User = require('../models/User');
const Collaboration = require('../models/Collaboration');
const bcrypt = require('bcryptjs');
const { getActorScope, scopeQueryForActor } = require('../utils/accessControl');
const { writeAuditLog } = require('../utils/auditLogger');

// Get all staff and partners (admin / branch manager)
exports.getAllStaff = async (req, res) => {
  try {
    let query = { role: { $ne: 'user' } };

    if (req.user.role === 'branch_manager') {
      query = { 
        role: 'delivery_boy', 
        branchName: req.user.branchName 
      };
    } else if (!req.accessScope?.global) {
      query = scopeQueryForActor(req.user, { role: { $ne: 'user' } });
    }

    const staff = await User.find(query)
      .populate('collaboration', 'partnerName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create staff or partner (admin)
exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role, permissions, collaborationId, branchName } = req.body;

    // Check if email or phone already exists
    let existingUser = null;
    if (email) {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    }
    if (!existingUser && phone) {
      existingUser = await User.findOne({ phone });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or phone number already exists. To prevent mixing up personal customer shopping history (orders, addresses, reviews) with administrative/brand profiles, please use a distinct work email or phone for staff and partner accounts.'
      });
    }

    const actorScope = getActorScope(req.user);
    const userData = {
      name,
      email: email ? email.toLowerCase() : undefined,
      phone,
      password,
      role,
      organization: actorScope.global ? (req.body.organizationId || null) : actorScope.organization,
      organizationType: actorScope.global ? (req.body.organizationType || 'platform') : (req.user.organizationType || 'partner'),
      tenantId: actorScope.global ? (req.body.tenantId || 'platform') : (actorScope.tenantId || 'platform'),
      branchName: branchName || null,
      permissions: permissions || {
        manageProducts: false,
        manageOrders: false,
        manageReviews: false,
        manageNewsletters: false,
        manageInventory: false
      }
    };

    if (role === 'partner_admin' && collaborationId) {
      userData.collaboration = collaborationId;
      // Partner admin automatically gets access to their scoped products & reviews
      userData.permissions.manageProducts = true;
      userData.permissions.manageReviews = true;
      userData.permissions.manageInventory = true;
    }

    if (!actorScope.global && actorScope.collaboration) {
      userData.collaboration = actorScope.collaboration;
    }

    if (['branch_manager', 'delivery_boy'].includes(role)) {
      userData.permissions.manageOrders = true;
    }

    const user = await User.create(userData);
    await writeAuditLog({
      req,
      action: 'STAFF_CREATED',
      targetModel: 'User',
      targetId: user._id,
      newState: {
        role: user.role,
        tenantId: user.tenantId,
        organization: user.organization,
        collaboration: user.collaboration
      }
    });

    res.status(201).json({
      success: true,
      message: `${role === 'partner_admin' ? 'Partner Collaboration' : 'Staff'} account created successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update staff or partner permissions (admin)
exports.updateStaff = async (req, res) => {
  try {
    const { name, email, phone, role, permissions, collaborationId, password, branchName } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.accessScope?.global) {
      const sameTenant = user.tenantId === req.accessScope.tenantId;
      const sameCollaboration = !req.accessScope.collaboration || user.collaboration?.toString() === req.accessScope.collaboration.toString();
      if (!sameTenant && !sameCollaboration) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: cannot update staff from another tenant.'
        });
      }
    }

    const previousState = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      tenantId: user.tenantId,
      organization: user.organization,
      collaboration: user.collaboration
    };

    // Update simple fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    if (!req.accessScope?.global) {
      user.organization = req.accessScope.organization || user.organization || null;
      user.tenantId = req.accessScope.tenantId || user.tenantId || 'platform';
      if (req.accessScope.collaboration) user.collaboration = req.accessScope.collaboration;
    }
    
    // Scopes branch details
    if (branchName !== undefined) {
      user.branchName = branchName;
    }

    if (role === 'partner_admin' && collaborationId) {
      user.collaboration = collaborationId;
    } else if (role !== 'partner_admin') {
      user.collaboration = null;
    }

    if (['branch_manager', 'delivery_boy'].includes(role)) {
      user.permissions.manageOrders = true;
    }

    // If password is changed, hash it
    if (password && password.trim() !== '') {
      user.password = password; // pre-save hook will automatically hash it
    }

    await user.save();
    await writeAuditLog({
      req,
      action: 'STAFF_UPDATED',
      targetModel: 'User',
      targetId: user._id,
      previousState,
      newState: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        tenantId: user.tenantId,
        organization: user.organization,
        collaboration: user.collaboration
      }
    });

    res.status(200).json({
      success: true,
      message: 'Sub-admin details updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete staff or partner (admin)
exports.deleteStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Guard: Prevent self-deletion or deleting super admins
    if (user.isSuperAdmin || user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Action prohibited: You cannot delete a super admin or yourself.'
      });
    }

    if (!req.accessScope?.global && user.tenantId !== req.accessScope.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: cannot delete staff from another tenant.'
      });
    }

    await user.deleteOne();
    await writeAuditLog({
      req,
      action: 'STAFF_DELETED',
      targetModel: 'User',
      targetId: user._id,
      previousState: {
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        organization: user.organization,
        collaboration: user.collaboration
      },
      newState: { status: 'deleted' }
    });

    res.status(200).json({
      success: true,
      message: 'Staff/Partner access revoked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all active collaborations for partner dropdown selections (admin)
exports.getAllCollaborations = async (req, res) => {
  try {
    const collaborations = await Collaboration.find({ status: { $in: ['active', 'pending'] } }).select('partnerName _id');
    res.status(200).json({
      success: true,
      collaborations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
