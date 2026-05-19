const Brand = require('../models/Brand');
const Product = require('../models/Product');

// Get all brands (public)
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .select('name slug description logo bannerImage productCount')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: brands.length,
      brands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all brands (admin)
exports.getAllBrandsAdmin = async (req, res) => {
  try {
    const brands = await Brand.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: brands.length,
      brands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single brand
exports.getBrandDetails = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    const products = await Product.find({ brand: brand._id, isActive: true });
    
    res.status(200).json({
      success: true,
      brand,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create brand (admin)
exports.createBrand = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const brand = await Brand.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      brand
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update brand (admin)
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      brand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete brand (admin)
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    await brand.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
