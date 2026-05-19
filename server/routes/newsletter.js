const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');

// ✅ Correct middleware
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');


// ✅ SUBSCRIBE
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existing = await Newsletter.findOne({ email });

    if (existing) {
      return res.json({ success: true, message: 'Already subscribed' });
    }

    const subscriber = await Newsletter.create({ email });

    res.json({ success: true, subscriber });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ✅ ADMIN ROUTE - MOVED TO adminRoutes.js
// router.get('/admin/all', ...);

module.exports = router;