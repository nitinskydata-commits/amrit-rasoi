const Product = require('../models/Product');
const { deleteMultipleImages } = require('../utils/cloudinaryUtils');
const { isCloudinaryConfigured } = require('../config/cloudinary');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const coerceProductBooleans = (body) => {
  const boolFields = [
    'isFeatured', 'inTodaysDeal', 'inNewArrivals', 'isActive', 'isRefundable',
    'replacementOnly', 'codAllowed', 'onlinePaymentOnly', 'isCollaborationProduct'
  ];
  boolFields.forEach((field) => {
    if (body[field] !== undefined) {
      const v = body[field];
      body[field] = v === true || v === 'true' || v === '1' || v === 'on';
    }
  });
};

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

// Get All Products (Advanced Search Engine)
exports.getProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      page = 1,
      sort,
      todaysDeal,
      newArrivals,
      ratings,
      brand,
      stock,
      limit: limitRaw
    } = req.query;

    let query = { isActive: { $ne: false } };

    // 1. Keyword search (text index with regex fallback)
    const keywordTrimmed = keyword && String(keyword).trim();
    if (keywordTrimmed) {
      const safe = escapeRegex(keywordTrimmed);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } },
        { category: { $regex: safe, $options: 'i' } }
      ];
    }

    // 2. Category & Brand Filtering
    if (category) query.category = category;
    if (brand) query.brand = brand;

    // 3. Price Range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 4. Ratings (4 stars and up, etc.)
    if (ratings) {
      query.ratings = { $gte: Number(ratings) };
    }

    // 5. Availability (Amazon Style)
    if (stock === 'inStock') {
      query.stock = { $gt: 0 };
    }

    // 6. Special Tags
    if (todaysDeal === 'true') query.inTodaysDeal = true;
    if (newArrivals === 'true') query.inNewArrivals = true;
    if (req.query.featured === 'true') query.isFeatured = true;

    // 7. Dynamic Sorting Logic
    let sortOption = {};
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { ratings: -1 };
    else if (sort === 'popular') sortOption = { numOfReviews: -1 };
    else sortOption = { isFeatured: -1, createdAt: -1 };

    const limit = Math.min(Math.max(Number(limitRaw) || 12, 1), 48);
    const skip = (Number(page) - 1) * limit;

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit)
      .skip(skip);

    const totalProducts = await Product.countDocuments(query);

    // Dynamic Meta Information (For Amazon-style Sidebar)
    const allBrands = await Product.distinct('brand', { category: category || { $exists: true } });
    const allCategories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      products,
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit) || 1,
      meta: {
        brands: allBrands,
        categories: allCategories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const mapSuggestionProduct = (p) => {
  const price = p.variants?.length ? p.variants[0].price : p.price;
  const mrp = p.variants?.length ? p.variants[0].mrp : (p.mrp || p.price);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return {
    id: p._id,
    name: p.name,
    category: p.category,
    brand: p.brand,
    image: p.images?.[0]?.url,
    price,
    mrp,
    discount,
    rating: Number(p.ratings) || 0,
    numOfReviews: p.numOfReviews || 0
  };
};

// Real-time Autocomplete Suggestions (Amazon Style)
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    const allCategories = await Product.distinct('category', { isActive: { $ne: false } });

    if (!q || q.length < 2) {
      const featured = await Product.find({ isActive: { $ne: false } })
        .sort({ isFeatured: -1, numOfReviews: -1, createdAt: -1 })
        .limit(6)
        .select('name category brand images price mrp variants ratings numOfReviews');

      return res.status(200).json({
        success: true,
        suggestions: featured.map(mapSuggestionProduct),
        meta: { categories: allCategories.filter(Boolean) }
      });
    }

    const safe = escapeRegex(String(q).trim());
    const suggestions = await Product.find({
      isActive: { $ne: false },
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } },
        { category: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } }
      ]
    })
      .select('name category brand images price mrp variants ratings numOfReviews')
      .limit(8);

    res.status(200).json({
      success: true,
      suggestions: suggestions.map(mapSuggestionProduct),
      meta: { categories: allCategories.filter(Boolean) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
        url: isCloudinaryConfigured ? file.path : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        publicId: file.filename // ✅ FIXED
      }));
      console.log(`✅ Images processed for database (${isCloudinaryConfigured ? 'Cloudinary' : 'Local'}):`, req.body.images);
    }
    
    // Parse variants if provided - NEW CODE
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);
      console.log('✅ Variants parsed:', req.body.variants);
    }
    
    // Default MRP logic for schema compliance
    if (!req.body.mrp && req.body.originalPrice) req.body.mrp = req.body.originalPrice;
    if (!req.body.mrp && req.body.price) req.body.mrp = req.body.price;

    // ✅ CAST STRINGS TO NUMBERS (Crucial for Multer/FormData)
    const numericFields = ['price', 'originalPrice', 'stock', 'weight', 'mrp'];
    numericFields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = Number(req.body[field]);
      }
    });

    coerceProductBooleans(req.body);

    // ✅ LOG BEFORE CREATE
    console.log('📝 FINAL PRODUCT DATA FOR DB:', req.body);

    const product = await Product.create(req.body);
    
    console.log('✅ Product created successfully with ID:', product._id);
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('❌ Create product error details:', error);
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
      req.body.images = req.files.map(file => ({
        url: isCloudinaryConfigured ? file.path : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        publicId: file.filename // ✅ FIXED
      }));
      console.log(`✅ Images processed for database (${isCloudinaryConfigured ? 'Cloudinary' : 'Local'}):`, req.body.images);
    }
    
    // Parse variants if provided - NEW CODE
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);
      console.log('✅ Variants updated:', req.body.variants);
    }

    const numericFields = ['price', 'originalPrice', 'stock', 'weight', 'mrp'];
    numericFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        req.body[field] = Number(req.body[field]);
      }
    });
    coerceProductBooleans(req.body);
    
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
    
    if (product.images && product.images.length > 0) {
      const publicIds = product.images.map(img => img.publicId || img.public_id);
      await deleteMultipleImages(publicIds);
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
