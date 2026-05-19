const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasPermission } = require('../utils/accessControl');

exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User for this token no longer exists'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role: ${req.user.role} is not allowed to access this resource`
      });
    }
    next();
  };
};

exports.authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    // Super Admins or platform admins bypass all module permission checks
    if (req.user.isSuperAdmin || req.user.role === 'admin' || req.user.role === 'platform_admin') {
      return next();
    }

    // Granular sub-admin roles require at least one of the specified modules to be true
    const subAdminRoles = [
      'staff',
      'vendor_owner',
      'vendor_staff',
      'inventory_manager',
      'order_manager',
      'warehouse_manager',
      'warehouse_staff',
      'delivery_agent',
      'delivery_boy',
      'finance_staff',
      'support_staff',
      'marketing_manager',
      'moderator',
      'regional_manager',
      'franchise_manager',
      'branch_manager'
    ];
    if (subAdminRoles.includes(req.user.role)) {
      const hasAccess = requiredPermissions.some(permission => hasPermission(req.user, permission));
      if (hasAccess) {
        return next();
      }
    }

    // Partner admins only get access to specifically allowed modules (products and reviews)
    if (req.user.role === 'partner_admin') {
      const hasAccess = requiredPermissions.every(perm => hasPermission(req.user, perm));
      if (hasAccess) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: `Access Denied: You do not have permissions to perform this action.`
    });
  };
};
