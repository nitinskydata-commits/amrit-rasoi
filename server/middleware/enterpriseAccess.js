const {
  canAssignRole,
  getActorScope,
  hasPermission,
  scopeQueryForActor
} = require('../utils/accessControl');

exports.attachAccessScope = (req, res, next) => {
  req.accessScope = getActorScope(req.user);
  next();
};

exports.requirePermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    if (req.user.isSuperAdmin || req.user.role === 'admin') {
      return next();
    }

    const allowed = permissions.some((permission) => hasPermission(req.user, permission));
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: missing required permission'
      });
    }

    next();
  };
};

exports.requireRoleAssignmentAuthority = (roleResolver = (req) => req.body.role) => {
  return (req, res, next) => {
    const targetRole = roleResolver(req);
    if (!targetRole) return next();

    if (!canAssignRole(req.user, targetRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${req.user.role} cannot assign ${targetRole}`
      });
    }

    next();
  };
};

exports.scopeTenantQuery = (req, res, next) => {
  req.tenantQuery = scopeQueryForActor(req.user);
  next();
};
