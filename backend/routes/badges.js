const express = require('express');
const router = express.Router();
const SiteBadge = require('../models/SiteBadge');
const upload = require('../middleware/upload');

// ✅ Correct middleware (your project)
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');


// ✅ GET ALL VISIBLE BADGES (Public)
router.get('/', async (req, res) => {
  try {
    const badges = await SiteBadge.find({ isVisible: true }).sort({ order: 1 });
    res.json({ success: true, badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ✅ GET ALL BADGES (Admin)
router.get(
  '/admin/all',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const badges = await SiteBadge.find().sort({ order: 1 });
      res.json({ success: true, badges });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


// ✅ CREATE BADGE (Admin)
router.post(
  '/',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('icon'),
  async (req, res) => {
    try {
      const badgeData = {
        ...req.body,
        icon: req.file
          ? {
              url: `/uploads/${req.file.filename}`,
              publicId: req.file.filename
            }
          : undefined
      };

      const badge = await SiteBadge.create(badgeData);
      res.status(201).json({ success: true, badge });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);


// ✅ UPDATE BADGE (Admin)
router.put(
  '/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  upload.single('icon'),
  async (req, res) => {
    try {
      const updateData = { ...req.body };

      if (req.file) {
        updateData.icon = {
          url: `/uploads/${req.file.filename}`,
          publicId: req.file.filename
        };
      }

      const badge = await SiteBadge.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!badge) {
        return res.status(404).json({
          success: false,
          message: 'Badge not found'
        });
      }

      res.json({ success: true, badge });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);


// ✅ DELETE BADGE (Admin)
router.delete(
  '/:id',
  isAuthenticatedUser,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const badge = await SiteBadge.findByIdAndDelete(req.params.id);

      if (!badge) {
        return res.status(404).json({
          success: false,
          message: 'Badge not found'
        });
      }

      res.json({ success: true, message: 'Badge deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;