const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notificationController');

const { isAuthenticatedUser } = require('../middleware/auth');

// Secure all endpoints with authentication
router.use(isAuthenticatedUser);

router.get('/', getMyNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
