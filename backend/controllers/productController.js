const Product = require('../models/Product');

// Parse variants from form data - NEW HELPER FUNCTION
const parseVariants = (variantsData) => {
  if (!variantsData) return [];
  
  try {
    // If it's already an array, return it
    if (Array.isArray(variantsData)) {
      return variantsData;
    }
    
    // If it's a JSON string, parse it
    if (typeof variantsData === 'string') {
      return JSON.parse(variantsData);
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing variants:', error);
    return [];
  }
};

// Get All Products
exports.getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, page = 1, sort } = req.query;
    
    const query = {};
    
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    let sortOption = {};
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { ratings: -1 };
    else if (sort === 'popular') sortOption = { numOfReviews: -1 };
    
    const limit = 12;
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit)
      .skip(skip);
    
    const totalProducts = await Product.countDocuments(query);
    
    res.status(200).json({
      success: true,
      products,
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Product
exports.getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create Product (Admin) - UPDATED WITH VARIANTS SUPPORT
exports.createProduct = async (req, res) => {
  console.log('📦 CREATE PRODUCT REQUEST:', req.body);
  console.log('📸 UPLOADED FILES:', req.files);
  
  try {
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => ({
        url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        publicId: file.filename
      }));
      console.log('✅ Images processed:', req.body.images);
    }
    
    // Parse variants if provided - NEW CODE
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);
      console.log('✅ Variants parsed:', req.body.variants);
    }
    
    const product = await Product.create(req.body);
    
    console.log('✅ Product created successfully:', product._id);
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update Product (Admin) - UPDATED WITH VARIANTS SUPPORT
exports.updateProduct = async (req, res) => {
  console.log('📦 UPDATE PRODUCT REQUEST:', req.params.id);
  console.log('📸 UPLOADED FILES:', req.files);
  
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        publicId: file.filename
      }));
      
      // If keepExisting is true, append new images, otherwise replace
      if (req.body.keepExistingImages === 'true') {
        req.body.images = [...product.images, ...newImages];
      } else {
        req.body.images = newImages;
      }
      
      console.log('✅ Images updated:', req.body.images);
    }
    
    // Parse variants if provided - NEW CODE
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);
      console.log('✅ Variants updated:', req.body.variants);
    }
    
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    console.log('✅ Product updated successfully:', product._id);
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Product (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    await product.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create/Update Review
exports.createProductReview = async (req, res) => {
  try {
    const { rating, title, comment, productId } = req.body;
    
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      title,
      comment
    };
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const isReviewed = product.reviews.find(
      rev => rev.user.toString() === req.user._id.toString()
    );
    
    if (isReviewed) {
      product.reviews.forEach(rev => {
        if (rev.user.toString() === req.user._id.toString()) {
          rev.rating = rating;
          rev.title = title;
          rev.comment = comment;
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    await product.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Product Reviews
exports.getProductReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.query.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      reviews: product.reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
