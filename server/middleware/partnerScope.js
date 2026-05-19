exports.scopePartnerCatalog = (req, res, next) => {
  // If the logged-in user is a partner admin, restrict all queries to their collaboration brand
  if (req.user && req.user.role === 'partner_admin' && req.user.collaboration) {
    req.query.collaboration = req.user.collaboration.toString();
  }
  next();
};
