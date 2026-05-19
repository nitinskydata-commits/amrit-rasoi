const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const upload = require('../middleware/upload');

// ✅ Correct middleware import
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');


// ✅ GET ALL APPROVED TESTIMONIALS (Public)
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      isApproved: true,
      isVisible: true
    }).sort({ createdAt: -1 });

    res.json({ success: true, testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ✅ DELETE TESTIMONIAL (Admin) - MOVED TO adminRoutes.js
// ... logic removed ...

module.exports = router;