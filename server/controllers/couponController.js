const Coupon = require('../models/Coupon');

// Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('applicableBrands', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single coupon
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('applicableBrands', 'name')
      .populate('createdBy', 'name email');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(200).json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Validate and apply coupon (public)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, brandIds } = req.body;
    
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: Date.now() },
      endDate: { $gte: Date.now() }
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }
    
    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }
    
    // Check minimum price
    if (cartTotal < coupon.minPrice) {
      return res.status(400).json({
        success: false,
        message: `Minimum cart value should be ₹${coupon.minPrice}`
      });
    }
    
    // Check applicable brands
    if (coupon.applicableBrands.length > 0) {
      const hasApplicableBrand = brandIds.some(id => 
        coupon.applicableBrands.includes(id)
      );
      
      if (!hasApplicableBrand) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not applicable for selected products'
        });
      }
    }
    
    // Calculate discount
    let discount = 0;
    
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discount) / 100;
      
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discount;
    }
    
    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discount,
        discountType: coupon.discountType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create coupon (admin)
exports.createCoupon = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    req.body.code = req.body.code.toUpperCase();
    
    const coupon = await Coupon.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update coupon (admin)
exports.updateCoupon = async (req, res) => {
  try {
    let coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }
    
    coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete coupon (admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    await coupon.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Increment coupon usage (internal)
exports.incrementCouponUsage = async (couponCode) => {
  try {
    await Coupon.findOneAndUpdate(
      { code: couponCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
  }
};

// Get active coupons (public)
exports.getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: Date.now() },
      endDate: { $gte: Date.now() }
    }).select('code discount discountType minPrice maxDiscount description');
    
    res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
