const ROLE_LEVELS = {
  admin: 0,
  platform_admin: 1,
  vendor_owner: 2,
  partner_admin: 2,
  franchise_manager: 2,
  regional_manager: 3,
  warehouse_manager: 3,
  inventory_manager: 3,
  order_manager: 3,
  marketing_manager: 3,
  finance_staff: 4,
  support_staff: 4,
  moderator: 4,
  staff: 4,
  vendor_staff: 4,
  warehouse_staff: 5,
  delivery_agent: 5,
  delivery_boy: 5,
  user: 6
};

const ROLE_GROUPS = {
  platform: ['admin', 'platform_admin', 'staff', 'inventory_manager', 'order_manager', 'marketing_manager', 'finance_staff', 'support_staff', 'moderator', 'regional_manager'],
  organizationOwner: ['vendor_owner', 'partner_admin', 'franchise_manager'],
  warehouse: ['warehouse_manager', 'warehouse_staff'],
  delivery: ['delivery_agent', 'delivery_boy'],
  customer: ['user']
};

const ROLE_DEFAULT_PERMISSIONS = {
  admin: ['*'],
  platform_admin: ['*'],
  partner_admin: ['manageProducts', 'manageInventory', 'manageReviews', 'viewOrders'],
  vendor_owner: ['manageProducts', 'manageInventory', 'manageReviews', 'viewOrders', 'manageStaff', 'viewAnalytics'],
  vendor_staff: ['manageProducts', 'manageInventory', 'viewOrders'],
  inventory_manager: ['manageProducts', 'manageInventory'],
  order_manager: ['manageOrders', 'viewOrders'],
  warehouse_manager: ['manageInventory', 'manageFulfillment', 'viewOrders'],
  warehouse_staff: ['manageFulfillment'],
  delivery_agent: ['manageDeliveries'],
  delivery_boy: ['manageDeliveries'],
  finance_staff: ['manageFinance', 'viewOrders'],
  marketing_manager: ['manageNewsletters', 'manageCampaigns'],
  support_staff: ['manageSupport', 'viewOrders'],
  moderator: ['manageReviews'],
  staff: [],
  user: []
};

const getRoleLevel = (role) => ROLE_LEVELS[role] ?? 99;

const getUserPermissionSet = (user) => {
  const defaults = ROLE_DEFAULT_PERMISSIONS[user?.role] || [];
  const explicit = Object.entries(user?.permissions || {})
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
  return new Set([...defaults, ...explicit]);
};

const hasPermission = (user, permission) => {
  const permissions = getUserPermissionSet(user);
  return permissions.has('*') || permissions.has(permission);
};

const canAssignRole = (actor, targetRole) => {
  if (!actor) return false;
  if (actor.isSuperAdmin || actor.role === 'admin') return true;
  if (actor.role === 'platform_admin') {
    return !['admin', 'platform_admin'].includes(targetRole);
  }

  const actorLevel = getRoleLevel(actor.role);
  const targetLevel = getRoleLevel(targetRole);
  if (targetLevel <= actorLevel) return false;

  if (['vendor_owner', 'partner_admin'].includes(actor.role)) {
    return ['vendor_staff'].includes(targetRole);
  }

  if (actor.role === 'warehouse_manager') {
    return ['warehouse_staff'].includes(targetRole);
  }

  if (actor.role === 'regional_manager') {
    return ['warehouse_manager', 'warehouse_staff', 'delivery_agent', 'delivery_boy'].includes(targetRole);
  }

  return false;
};

const getActorScope = (user) => {
  if (!user) return { global: false, tenantId: null, organization: null, collaboration: null };

  const global = Boolean(user.isSuperAdmin || user.role === 'admin' || user.role === 'platform_admin');
  
  // Use organizationId as the primary scope key (new system)
  // Fall back to collaboration for backward compat (partner_admin)
  const organization = user.organizationId || user.organization || null;
  const collaboration = user.collaboration || null;
  
  // Build tenantId: prefer organizationId-derived, then collaboration, then explicit tenantId
  let tenantId = 'platform';
  if (organization) {
    tenantId = organization.toString();
  } else if (collaboration) {
    tenantId = collaboration.toString();
  } else if (user.tenantId) {
    tenantId = user.tenantId;
  }

  return {
    global,
    tenantId,
    organization,
    collaboration,
    branchName: user.branchName || null
  };
};

const scopeQueryForActor = (user, query = {}) => {
  const scope = getActorScope(user);
  if (scope.global) return { ...query };

  const scopedQuery = { ...query };
  if (scope.collaboration) {
    scopedQuery.collaboration = scope.collaboration;
    return scopedQuery;
  }

  if (scope.organization) scopedQuery.organization = scope.organization;
  if (scope.tenantId) scopedQuery.tenantId = scope.tenantId;
  return scopedQuery;
};

module.exports = {
  ROLE_GROUPS,
  ROLE_LEVELS,
  ROLE_DEFAULT_PERMISSIONS,
  canAssignRole,
  getActorScope,
  getRoleLevel,
  getUserPermissionSet,
  hasPermission,
  scopeQueryForActor
};
