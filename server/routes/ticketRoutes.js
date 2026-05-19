const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getTicketDetails,
  addMessage,
  updateTicketStatus
} = require('../controllers/ticketController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.route('/tickets')
  .post(isAuthenticatedUser, createTicket)
  .get(isAuthenticatedUser, getMyTickets);

router.route('/tickets/:id')
  .get(isAuthenticatedUser, getTicketDetails)
  .put(isAuthenticatedUser, addMessage);

router.route('/admin/tickets/:id/status')
  .put(isAuthenticatedUser, authorizeRoles('admin', 'platform_admin', 'staff'), updateTicketStatus);

module.exports = router;
