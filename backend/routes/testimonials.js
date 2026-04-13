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


// ✅ GET ALL TESTIMONIALS (Admin)
router.get(
  '/admin/all',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const testimonials = await Testimonial.find()
        .populate('orderId', 'orderNumber')
        .sort({ createdAt: -1 });

      res.json({ success: true, testimonials });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


// ✅ CREATE TESTIMONIAL (Admin)
router.post(
  '/',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('customerImage'),
  async (req, res) => {
    try {
      const testimonialData = {
        ...req.body,
        customerImage: req.file
          ? {
              url: `/uploads/${req.file.filename}`,
              publicId: req.file.filename
            }
          : undefined
      };

      const testimonial = await Testimonial.create(testimonialData);

      res.status(201).json({ success: true, testimonial });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);


// ✅ UPDATE TESTIMONIAL (Admin)
router.put(
  '/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('customerImage'),
  async (req, res) => {
    try {
      const updateData = { ...req.body };

      if (req.file) {
        updateData.customerImage = {
          url: `/uploads/${req.file.filename}`,
          publicId: req.file.filename
        };
      }

      const testimonial = await Testimonial.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      res.json({ success: true, testimonial });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);


// ✅ DELETE TESTIMONIAL (Admin)
router.delete(
  '/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      res.json({ success: true, message: 'Testimonial deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;