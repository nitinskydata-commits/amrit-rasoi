const Advertisement = require('../models/Advertisement');

// Get all ads (admin)
exports.getAllAdsAdmin = async (req, res) => {
  try {
    const { position, isActive } = req.query;
    
    const query = {};
    if (position) query.position = position;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const ads = await Advertisement.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: ads.length,
      ads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get active ads for specific position (public)
exports.getActiveAdsByPosition = async (req, res) => {
  try {
    const { position } = req.params;
    
    const ads = await Advertisement.find({
      position,
      isActive: true,
      startDate: { $lte: Date.now() },
      endDate: { $gte: Date.now() }
    })
      .select('title description image link')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: ads.length,
      ads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single ad details
exports.getAdDetails = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    res.status(200).json({
      success: true,
      ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create ad (admin)
exports.createAd = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Handle ad image if uploaded
    if (req.file) {
      req.body.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }
    
    const ad = await Advertisement.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      ad
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update ad (admin)
exports.updateAd = async (req, res) => {
  try {
    let ad = await Advertisement.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    // Handle image update
    if (req.file) {
      req.body.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }
    
    ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully',
      ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete ad (admin)
exports.deleteAd = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    await ad.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle ad status (admin)
exports.toggleAdStatus = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    ad.isActive = !ad.isActive;
    await ad.save();
    
    res.status(200).json({
      success: true,
      message: `Advertisement ${ad.isActive ? 'activated' : 'deactivated'} successfully`,
      ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Track ad click (public)
exports.trackAdClick = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    ad.clicks += 1;
    await ad.save();
    
    res.status(200).json({
      success: true,
      message: 'Click tracked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Track ad impression (public)
exports.trackAdImpression = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    ad.impressions += 1;
    await ad.save();
    
    res.status(200).json({
      success: true,
      message: 'Impression tracked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get ad analytics (admin)
exports.getAdAnalytics = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }
    
    const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      analytics: {
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: `${ctr}%`,
        paymentReceived: ad.paymentReceived,
        paymentStatus: ad.paymentStatus,
        daysActive: Math.ceil((Date.now() - ad.startDate) / (1000 * 60 * 60 * 24)),
        daysRemaining: Math.ceil((ad.endDate - Date.now()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
