const AuditLog = require('../models/AuditLog');
const { getActorScope } = require('./accessControl');

const writeAuditLog = async ({
  req,
  action,
  targetModel,
  targetId,
  previousState = null,
  newState = null,
  metadata = null
}) => {
  try {
    if (!req?.user || !action || !targetModel || !targetId) return;

    const scope = getActorScope(req.user);
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name || req.user.email || req.user.phone || 'Unknown',
      role: req.user.role,
      organization: scope.organization || null,
      organizationType: req.user.organizationType || null,
      action,
      targetModel,
      targetId: targetId.toString(),
      previousState,
      newState: metadata ? { ...newState, metadata } : newState,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      tenantId: scope.tenantId || null,
      collaboration: scope.collaboration || null
    });
  } catch (error) {
    console.error('Audit log write failed:', error.message);
  }
};

module.exports = { writeAuditLog };
