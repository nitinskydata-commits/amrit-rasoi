const Product = require('../models/Product');
const { deleteMultipleImages } = require('../utils/cloudinaryUtils');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const { getActorScope } = require('../utils/accessControl');
const { writeAuditLog } = require('../utils/auditLogger');

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
    const { runDiscountEngine } = require('../utils/discountEngine');
    runDiscountEngine();
  } catch (e) {
    console.error('Failed dynamic discount calculation:', e);
  }
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
    let keywordQuery = null;
    let stockQuery = null;

    // 1. Keyword search (text index with regex fallback)
    const keywordTrimmed = keyword && String(keyword).trim();
    if (keywordTrimmed) {
      const safe = escapeRegex(keywordTrimmed);
      keywordQuery = {
        $or: [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } },
        { category: { $regex: safe, $options: 'i' } },
        { 'variants.attributes.value': { $regex: safe, $options: 'i' } },
        { 'variants.sku': { $regex: safe, $options: 'i' } },
        { 'variants.barcode': { $regex: safe, $options: 'i' } }
        ]
      };
    }

    // 2. Category & Brand Filtering
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (req.query.collaboration) query.collaboration = req.query.collaboration;

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
      stockQuery = {
        $or: [
        { $and: [{ hasVariants: false }, { stock: { $gt: 0 } }] },
        { $and: [{ hasVariants: true }, { 'variants.stock': { $gt: 0 } }] }
        ]
      };
    }

    if (keywordQuery && stockQuery) {
      query.$and = [keywordQuery, stockQuery];
    } else if (keywordQuery) {
      query.$or = keywordQuery.$or;
    } else if (stockQuery) {
      query.$or = stockQuery.$or;
    }

    // 5.5 Filter by Tag
    if (req.query.tag) {
      query.tags = req.query.tag.toLowerCase().trim();
    }

    // 6. Special Tags
    if (todaysDeal === 'true') query.inTodaysDeal = true;
    if (newArrivals === 'true') query.inNewArrivals = true;
    if (req.query.featured === 'true') query.isFeatured = true;

    // 6.5 Dynamic Attribute Filtering
    const attributesQuery = {};
    const standardParams = ['keyword', 'category', 'brand', 'minPrice', 'maxPrice', 'ratings', 'stock', 'todaysDeal', 'newArrivals', 'featured', 'page', 'limit', 'sort'];
    Object.keys(req.query).forEach(key => {
      if (!standardParams.includes(key)) {
        attributesQuery[key] = req.query[key];
      }
    });

    if (Object.keys(attributesQuery).length > 0) {
      const andQueries = [];
      Object.keys(attributesQuery).forEach(key => {
        andQueries.push({
          variants: {
            $elemMatch: {
              attributes: {
                $elemMatch: { name: key, value: attributesQuery[key] }
              }
            }
          }
        });
      });
      // Merge with existing $or or other $and
      if (query.$and) {
        query.$and = [...query.$and, ...andQueries];
      } else {
        query.$and = andQueries;
      }
    }

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
    let product;
    
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      product = await Product.findById(req.params.id);
    } else {
      product = await Product.findOne({ slug: req.params.id });
    }
    
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
    // Robust parsing for tags and specifications coming from FormData
    if (req.body['tags[]']) {
      req.body.tags = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
      delete req.body['tags[]'];
    } else if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
      } catch (err) {
        console.error('Error parsing specifications string:', err);
        req.body.specifications = [];
      }
    }

    // Handle image uploads
    let variantImages = {};
    
    if (req.files && req.files.length > 0) {
      const mainImages = [];
      
      req.files.forEach(file => {
        const url = isCloudinaryConfigured ? file.path : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        const publicId = file.filename;
        
        if (file.fieldname === 'images') {
          mainImages.push({ url, publicId });
        } else if (file.fieldname.startsWith('variant_images_')) {
          const index = parseInt(file.fieldname.replace('variant_images_', ''));
          if (!variantImages[index]) variantImages[index] = [];
          variantImages[index].push({ url, publicId });
        }
      });
      
      req.body.images = mainImages;
      console.log('✅ Main images processed:', req.body.images);
    }
    
    // Parse variants if provided
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);
      
      // Map files to variants
      req.body.variants.forEach((variant, index) => {
        if (variantImages[index]) {
          variant.images = variantImages[index];
          console.log(`Mapped ${variant.images.length} uploaded images to variant ${index}`);
        }
        
        // Fallback to imageIndices if no direct images uploaded
        if ((!variant.images || variant.images.length === 0) && variant.imageIndices && Array.isArray(variant.imageIndices) && req.body.images) {
          variant.images = variant.imageIndices
            .map(idx => req.body.images[idx])
            .filter(Boolean);
        }
      });
      
      console.log('✅ Variants processed:', req.body.variants);
      
      // Cast variant strings to numbers
      req.body.variants.forEach(v => {
        if (v.price !== undefined && v.price !== '') v.price = Number(v.price);
        if (v.mrp !== undefined && v.mrp !== '') v.mrp = Number(v.mrp);
        if (v.stock !== undefined && v.stock !== '') v.stock = Number(v.stock);
      });
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

    // Enforce collaboration scoping for Partner Admins
    if (req.user && req.user.role === 'partner_admin' && req.user.collaboration) {
      req.body.collaboration = req.user.collaboration;
      req.body.isCollaborationProduct = true;
    }

    // ✅ LOG BEFORE CREATE
    console.log('📝 FINAL PRODUCT DATA FOR DB:', req.body);

    const actorScope = getActorScope(req.user);
    req.body.organization = actorScope.global ? (req.body.organization || null) : (actorScope.organization || null);
    req.body.tenantId = actorScope.global ? (req.body.tenantId || 'platform') : (actorScope.tenantId || 'platform');

    const product = await Product.create(req.body);
    await writeAuditLog({
      req,
      action: 'PRODUCT_CREATED',
      targetModel: 'Product',
      targetId: product._id,
      newState: {
        name: product.name,
        price: product.price,
        stock: product.stock,
        tenantId: product.tenantId,
        organization: product.organization
      }
    });
    
    console.log('✅ Product created successfully with ID:', product._id);

    // Emit Async Enterprise Event
    try {
      const { eventBus, EVENTS } = require('../utils/eventBus');
      eventBus.emit(EVENTS.PRODUCT_CREATED, {
        productId: product._id,
        userId: req.user._id,
        userName: req.user.name,
        role: req.user.role,
        productData: { name: product.name, price: product.price, stock: product.stock },
        tenantId: product.collaboration,
        ipAddress: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
    } catch (e) {
      console.error('EventBus emit failed:', e);
    }
    
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
    // Robust parsing for tags and specifications coming from FormData
    if (req.body['tags[]']) {
      req.body.tags = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
      delete req.body['tags[]'];
    } else if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
      } catch (err) {
        console.error('Error parsing specifications string:', err);
        req.body.specifications = [];
      }
    }

    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Enforce collaboration scoping for Partner Admins
    if (req.user && req.user.role === 'partner_admin' && req.user.collaboration) {
      if (!product.collaboration || product.collaboration.toString() !== req.user.collaboration.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permissions to modify this product.'
        });
      }
      req.body.collaboration = req.user.collaboration;
      req.body.isCollaborationProduct = true;
    }

    const actorScope = getActorScope(req.user);
    const sameCollaboration = actorScope.collaboration && product.collaboration?.toString() === actorScope.collaboration.toString();
    if (!actorScope.global && !sameCollaboration && product.tenantId && product.tenantId !== actorScope.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This product belongs to another tenant.'
      });
    }

    const previousState = {
      name: product.name,
      price: product.price,
      stock: product.stock,
      tenantId: product.tenantId,
      organization: product.organization
    };
    
    // Handle image uploads
    let variantImages = {};
    
    if (req.files && req.files.length > 0) {
      const mainImages = [];
      
      req.files.forEach(file => {
        const url = isCloudinaryConfigured ? file.path : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        const publicId = file.filename;
        
        if (file.fieldname === 'images') {
          mainImages.push({ url, publicId });
        } else if (file.fieldname.startsWith('variant_images_')) {
          const index = parseInt(file.fieldname.replace('variant_images_', ''));
          if (!variantImages[index]) variantImages[index] = [];
          variantImages[index].push({ url, publicId });
        }
      });
      
      if (mainImages.length > 0) {
        req.body.images = mainImages;
        console.log('✅ Main images updated:', req.body.images);
      }
    }
    
    // Parse variants if provided
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);
      
      // Map files to variants
      req.body.variants.forEach((variant, index) => {
        const existing = variant.images || [];
        const uploaded = variantImages[index] || [];
        variant.images = [...existing, ...uploaded];
        console.log(`Mapped ${uploaded.length} new uploaded images to variant ${index}, existing: ${existing.length}`);
        
        // Fallback to imageIndices
        if (uploaded.length === 0 && (!existing || existing.length === 0) && variant.imageIndices && Array.isArray(variant.imageIndices)) {
          const imagesToUse = req.body.images || product.images;
          if (imagesToUse) {
            variant.images = variant.imageIndices
              .map(idx => imagesToUse[idx])
              .filter(Boolean);
          }
        }
      });
      
      console.log('✅ Variants processed:', req.body.variants);
      
      // Cast variant strings to numbers
      req.body.variants.forEach(v => {
        if (v.price !== undefined && v.price !== '') v.price = Number(v.price);
        if (v.mrp !== undefined && v.mrp !== '') v.mrp = Number(v.mrp);
        if (v.stock !== undefined && v.stock !== '') v.stock = Number(v.stock);
      });
    }

    const numericFields = ['price', 'originalPrice', 'stock', 'weight', 'mrp'];
    numericFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        req.body[field] = Number(req.body[field]);
      }
    });
    coerceProductBooleans(req.body);

        // Build explicit update object to avoid FormData string issues
    const updateFields = {};

    // Scalar text fields
    const textFields = ['name', 'description', 'category', 'brand', 'variantType', 'seoTitle', 'seoDescription'];
    textFields.forEach(f => { if (req.body[f] !== undefined) updateFields[f] = req.body[f]; });

    // Specifications & Tags
    if (req.body.specifications !== undefined) updateFields.specifications = req.body.specifications;
    if (req.body.tags !== undefined) updateFields.tags = req.body.tags;

    // Numeric fields
    numericFields.forEach(f => { if (req.body[f] !== undefined && req.body[f] !== '') updateFields[f] = Number(req.body[f]); });

    // Boolean fields
    ['isFeatured', 'inTodaysDeal', 'inNewArrivals', 'hasVariants'].forEach(f => { if (req.body[f] !== undefined) updateFields[f] = req.body[f] === true || req.body[f] === 'true'; });

    // Images (main product images)
    if (req.body.images) updateFields.images = req.body.images;
    if (!actorScope.global) {
      updateFields.organization = actorScope.organization || product.organization || null;
      updateFields.tenantId = actorScope.tenantId || product.tenantId || 'platform';
    }

    // Variants – ensure we keep existing images when none are provided
    if (Array.isArray(req.body.variants)) {
      // For each variant, if images missing, fallback to existing product's variant images
      req.body.variants = req.body.variants.map((v, idx) => {
        if (v.images === undefined) {
          const existingVar = product.variants?.find(ev => ev._id?.toString() === v._id?.toString()) || (product.variants && product.variants[idx]);
          if (existingVar && existingVar.images) v.images = existingVar.images;
        }
        return v;
      });
      updateFields.variants = req.body.variants;
    }

    // Merge existingImages with new uploads when keepExistingImages is true
    if (req.body.keepExistingImages === 'true' && req.body.existingImages) {
      try {
        const existing = JSON.parse(req.body.existingImages);
        const newImgs = updateFields.images || [];
        updateFields.images = [...existing, ...newImgs];
      } catch (e) { console.error('Error parsing existingImages:', e); }
    }

    // Perform the update
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    console.log('✅ Product updated successfully:', product._id, '| Variants:', product.variants?.length);

    // Emit Async Enterprise Event
    try {
      const { eventBus, EVENTS } = require('../utils/eventBus');
      eventBus.emit(EVENTS.PRODUCT_UPDATED, {
        productId: product._id,
        userId: req.user._id,
        userName: req.user.name,
        role: req.user.role,
        oldState: { name: product.name, price: product.price, stock: product.stock },
        newState: { name: product.name, price: product.price, stock: product.stock },
        tenantId: product.collaboration,
        ipAddress: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
    } catch (e) {
      console.error('EventBus emit failed:', e);
    }
 
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
    
    // Process uploaded review images
    let images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const url = isCloudinaryConfigured ? file.path : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        const public_id = file.filename;
        images.push({ url, public_id });
      });
    }

    // Verify if this is a verified purchase
    const Order = require('../models/Order');
    const hasOrdered = await Order.findOne({
      user: req.user._id,
      'orderItems.product': productId,
      'paymentInfo.status': 'paid'
    });
    const verifiedPurchase = !!hasOrdered;

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      title,
      comment,
      images,
      verifiedPurchase
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
          rev.rating = Number(rating);
          rev.title = title;
          rev.comment = comment;
          if (images.length > 0) {
            rev.images = images;
          }
          rev.verifiedPurchase = verifiedPurchase;
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    await product.save({ validateBeforeSave: false });

    // Synchronization with standalone Review collection for admin dashboard visibility
    const reviewData = {
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      title,
      comment,
      images,
      verifiedPurchase
    };

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (existingReview) {
      existingReview.rating = Number(rating);
      existingReview.title = title;
      existingReview.comment = comment;
      if (images.length > 0) {
        existingReview.images = images;
      }
      existingReview.verifiedPurchase = verifiedPurchase;
      await existingReview.save();
    } else {
      await Review.create(reviewData);
    }
    
    res.status(200).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Create product review error:', error);
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
