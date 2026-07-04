const Product = require('../models/Product');
const Order = require('../models/Order');
const Organization = require('../models/Organization');
const User = require('../models/User');

// @desc    Get Seller Dashboard Stats (scoped to seller's organization)
// @route   GET /api/v1/seller/dashboard
// @access  Private (Approved Seller)
exports.getSellerDashboard = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    // 1. Products count
    const totalProducts = await Product.countDocuments({ organization: orgId });
    const activeProducts = await Product.countDocuments({ organization: orgId, isActive: true, status: 'published' });
    const draftProducts = await Product.countDocuments({ organization: orgId, status: 'draft' });

    // 2. Orders containing seller items
    const orders = await Order.find({ 'orderItems.organization': orgId });
    const totalOrders = orders.length;

    // 3. Financial metrics
    let totalRevenue = 0;
    let totalCommission = 0;
    let netEarnings = 0;
    const ordersByStatus = {};

    orders.forEach(order => {
      ordersByStatus[order.orderStatus] = (ordersByStatus[order.orderStatus] || 0) + 1;

      order.orderItems.forEach(item => {
        if (item.organization && item.organization.toString() === orgId.toString()) {
          const itemTotal = item.price * item.quantity;
          totalRevenue += itemTotal;
          totalCommission += item.commissionPaid || (itemTotal * (item.commissionRate / 100 || 0.1));
          netEarnings += item.netVendorPayout || (itemTotal - (itemTotal * (item.commissionRate / 100 || 0.1)));
        }
      });
    });

    // 4. Low stock alerts
    const lowStockProducts = await Product.find({
      organization: orgId,
      $or: [
        { stock: { $lt: 10 } },
        { 'variants.stock': { $lt: 10 } }
      ]
    }).select('name stock variants images').limit(10);

    // 5. Recent orders
    const recentOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(order => {
        const vendorItems = order.orderItems.filter(
          item => item.organization && item.organization.toString() === orgId.toString()
        );
        const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
          _id: order._id,
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
          customerName: order.shippingAddress?.name || 'Customer',
          vendorItemsCount: vendorItems.length,
          vendorTotal
        };
      });

    // 6. Organization info
    const organization = await Organization.findById(orgId).select('name commissionRate status');

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        draftProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        netEarnings: Number(netEarnings.toFixed(2)),
        averageOrderValue: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
        lowStockProducts,
        recentOrders,
        ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({ _id: status, count }))
      },
      organization
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Seller's Products
// @route   GET /api/v1/seller/products
// @access  Private (Approved Seller)
exports.getSellerProducts = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { page = 1, limit = 20, status, search, category } = req.query;

    const query = { organization: orgId };
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Helper to coerce boolean strings to actual booleans
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

// Helper to parse variants
const parseVariants = (variantsData) => {
  if (!variantsData) return [];
  try {
    if (Array.isArray(variantsData)) return variantsData;
    if (typeof variantsData === 'string') return JSON.parse(variantsData);
    return [];
  } catch (error) {
    console.error('Error parsing variants:', error);
    return [];
  }
};

// @desc    Create a Product (seller-scoped)
// @route   POST /api/v1/seller/product/new
// @access  Private (Approved Seller)
exports.createSellerProduct = async (req, res) => {
  console.log('📦 SELLER CREATE PRODUCT REQUEST:', req.body);
  console.log('📸 SELLER UPLOADED FILES:', req.files);

  try {
    const orgId = req.user.organizationId;
    const org = await Organization.findById(orgId);

    // Parse tags
    if (req.body['tags[]']) {
      req.body.tags = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
      delete req.body['tags[]'];
    } else if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Parse specifications
    if (typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
      } catch (err) {
        console.error('Error parsing specifications string:', err);
        req.body.specifications = [];
      }
    }

    // Handle image uploads
    const { isCloudinaryConfigured } = require('../config/cloudinary');
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
    }

    // Parse variants if provided
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);
      
      // Map files to variants
      req.body.variants.forEach((variant, index) => {
        if (variantImages[index]) {
          variant.images = variantImages[index];
        }
        
        // Fallback to imageIndices
        if ((!variant.images || variant.images.length === 0) && variant.imageIndices && Array.isArray(variant.imageIndices) && req.body.images) {
          variant.images = variant.imageIndices
            .map(idx => req.body.images[idx])
            .filter(Boolean);
        }

        if (v => {
          if (v.price !== undefined && v.price !== '') v.price = Number(v.price);
          if (v.mrp !== undefined && v.mrp !== '') v.mrp = Number(v.mrp);
          if (v.stock !== undefined && v.stock !== '') v.stock = Number(v.stock);
        });
      });
    }

    // Default MRP logic
    if (!req.body.mrp && req.body.originalPrice) req.body.mrp = req.body.originalPrice;
    if (!req.body.mrp && req.body.price) req.body.mrp = req.body.price;

    // Cast string values to numbers
    const numericFields = ['price', 'originalPrice', 'stock', 'weight', 'mrp'];
    numericFields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = Number(req.body[field]);
      }
    });

    coerceProductBooleans(req.body);

    const productData = {
      ...req.body,
      organization: orgId,
      tenantId: org?.tenantId || orgId.toString(),
      seller: req.user._id,
      status: 'draft' // Seller products always start as draft for admin review
    };

    const product = await Product.create(productData);

    // Audit log
    const { writeAuditLog } = require('../utils/auditLogger');
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

    res.status(201).json({
      success: true,
      message: 'Product created successfully! It will be reviewed before going live.',
      product
    });
  } catch (error) {
    console.error('Error creating seller product:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a Product (seller-scoped — can only edit own products)
// @route   PUT /api/v1/seller/product/:id
// @access  Private (Approved Seller)
exports.updateSellerProduct = async (req, res) => {
  console.log('📦 SELLER UPDATE PRODUCT REQUEST:', req.body);
  console.log('📸 SELLER UPDATE FILES:', req.files);

  try {
    const orgId = req.user.organizationId;
    let product = await Product.findOne({ _id: req.params.id, organization: orgId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to edit it.'
      });
    }

    // Parse tags
    if (req.body['tags[]']) {
      req.body.tags = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
      delete req.body['tags[]'];
    } else if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Parse specifications
    if (typeof req.body.specifications === 'string') {
      try {
        req.body.specifications = JSON.parse(req.body.specifications);
      } catch (err) {
        console.error('Error parsing specifications string:', err);
        req.body.specifications = [];
      }
    }

    // Handle image uploads
    const { isCloudinaryConfigured } = require('../config/cloudinary');
    let variantImages = {};
    const mainImages = product.images || [];

    if (req.files && req.files.length > 0) {
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
    }

    req.body.images = mainImages;

    // Parse variants if provided
    if (req.body.variants) {
      req.body.variants = parseVariants(req.body.variants);

      // Map files to variants
      req.body.variants.forEach((variant, index) => {
        if (variantImages[index]) {
          variant.images = [...(variant.images || []), ...variantImages[index]];
        }

        // Fallback to imageIndices
        if ((!variant.images || variant.images.length === 0) && variant.imageIndices && Array.isArray(variant.imageIndices)) {
          variant.images = variant.imageIndices
            .map(idx => req.body.images[idx])
            .filter(Boolean);
        }

        if (v => {
          if (v.price !== undefined && v.price !== '') v.price = Number(v.price);
          if (v.mrp !== undefined && v.mrp !== '') v.mrp = Number(v.mrp);
          if (v.stock !== undefined && v.stock !== '') v.stock = Number(v.stock);
        });
      });
    }

    // Cast string values to numbers
    const numericFields = ['price', 'originalPrice', 'stock', 'weight', 'mrp'];
    numericFields.forEach(field => {
      if (req.body[field] !== undefined) {
        req.body[field] = req.body[field] === '' ? 0 : Number(req.body[field]);
      }
    });

    coerceProductBooleans(req.body);

    // Keep draft status after edits for seller, so admin gets to verify any changed product
    req.body.status = 'draft';

    // Sellers cannot change organization or tenantId
    const { organization, tenantId, seller, ...updateData } = req.body;
    
    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    // Audit log
    const { writeAuditLog } = require('../utils/auditLogger');
    await writeAuditLog({
      req,
      action: 'PRODUCT_UPDATED',
      targetModel: 'Product',
      targetId: product._id,
      newState: {
        name: product.name,
        price: product.price,
        stock: product.stock
      }
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully. It has been set to draft pending admin review.',
      product
    });
  } catch (error) {
    console.error('Error updating seller product:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// @desc    Delete a Product (seller-scoped)
// @route   DELETE /api/v1/seller/product/:id
// @access  Private (Approved Seller)
exports.deleteSellerProduct = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const product = await Product.findOne({ _id: req.params.id, organization: orgId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it.'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Seller's Orders (only items belonging to seller)
// @route   GET /api/v1/seller/orders
// @access  Private (Approved Seller)
exports.getSellerOrders = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { page = 1, limit = 20, status } = req.query;

    const query = { 'orderItems.organization': orgId };
    if (status) query.orderStatus = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Filter order items to only show seller's items
    const sellerOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.orderItems = orderObj.orderItems.filter(
        item => item.organization && item.organization.toString() === orgId.toString()
      );
      // Calculate seller's subtotal
      orderObj.sellerSubtotal = orderObj.orderItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      return orderObj;
    });

    res.status(200).json({
      success: true,
      orders: sellerOrders,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order item status (seller can mark shipped/dispatched for their items)
// @route   PUT /api/v1/seller/order/:id/item-status
// @access  Private (Approved Seller)
exports.updateSellerOrderItemStatus = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { itemStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify this order has items from this seller
    const hasSellerItems = order.orderItems.some(
      item => item.organization && item.organization.toString() === orgId.toString()
    );

    if (!hasSellerItems) {
      return res.status(403).json({
        success: false,
        message: 'This order does not contain items from your store.'
      });
    }

    // Update seller-specific items
    order.orderItems.forEach(item => {
      if (item.organization && item.organization.toString() === orgId.toString()) {
        item.itemStatus = itemStatus;
        if (trackingNumber) item.trackingNumber = trackingNumber;
      }
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order item status updated successfully.',
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Seller Earnings & Payout Ledger
// @route   GET /api/v1/seller/earnings
// @access  Private (Approved Seller)
exports.getSellerEarnings = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    const org = await Organization.findById(orgId).select('name commissionRate totalRevenue totalPayouts pendingPayout payoutAccount');

    // Delivered orders for payout calculation
    const deliveredOrders = await Order.find({
      'orderItems.organization': orgId,
      orderStatus: 'Delivered'
    }).sort({ createdAt: -1 });

    let totalEarned = 0;
    let totalCommission = 0;
    let totalPayout = 0;

    const payoutLedger = deliveredOrders.map(order => {
      let orderRevenue = 0;
      let orderCommission = 0;
      let orderPayout = 0;

      const items = order.orderItems
        .filter(item => item.organization && item.organization.toString() === orgId.toString())
        .map(item => {
          const itemTotal = item.price * item.quantity;
          const commission = item.commissionPaid || (itemTotal * (item.commissionRate / 100 || 0.1));
          const payout = item.netVendorPayout || (itemTotal - commission);

          orderRevenue += itemTotal;
          orderCommission += commission;
          orderPayout += payout;

          return {
            productId: item.product,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            commission,
            payout
          };
        });

      totalEarned += orderRevenue;
      totalCommission += orderCommission;
      totalPayout += orderPayout;

      return {
        orderId: order._id,
        deliveredAt: order.deliveredAt || order.createdAt,
        orderRevenue,
        orderCommission,
        orderPayout,
        items
      };
    });

    // Pending orders (not yet delivered)
    const pendingOrders = await Order.countDocuments({
      'orderItems.organization': orgId,
      orderStatus: { $nin: ['Delivered', 'Cancelled', 'Refunded'] }
    });

    res.status(200).json({
      success: true,
      earnings: {
        totalEarned: Number(totalEarned.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        totalPayout: Number(totalPayout.toFixed(2)),
        pendingOrders,
        commissionRate: org?.commissionRate || 10
      },
      payoutAccount: org?.payoutAccount || {},
      payoutLedger,
      organization: {
        name: org?.name,
        totalRevenue: org?.totalRevenue || 0,
        totalPayouts: org?.totalPayouts || 0,
        pendingPayout: org?.pendingPayout || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Seller Profile (shop info + org details)
// @route   GET /api/v1/seller/profile
// @access  Private (Approved Seller)
exports.getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpire');
    const org = await Organization.findById(req.user.organizationId);

    res.status(200).json({
      success: true,
      user,
      organization: org
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Seller Profile (shop info, bank details)
// @route   PUT /api/v1/seller/profile
// @access  Private (Approved Seller)
exports.updateSellerProfile = async (req, res) => {
  try {
    const { shopName, shopDescription, shopLogo, bankDetails, businessAddress } = req.body;

    const user = await User.findById(req.user.id);

    if (shopName !== undefined) user.sellerProfile.shopName = shopName;
    if (shopDescription !== undefined) user.sellerProfile.shopDescription = shopDescription;
    if (shopLogo !== undefined) user.sellerProfile.shopLogo = shopLogo;
    if (bankDetails) {
      user.sellerProfile.bankDetails = { ...user.sellerProfile.bankDetails, ...bankDetails };
    }
    if (businessAddress) {
      user.sellerProfile.businessAddress = { ...user.sellerProfile.businessAddress, ...businessAddress };
    }

    await user.save();

    // Also update organization if relevant fields changed
    if (shopName || bankDetails) {
      const org = await Organization.findById(req.user.organizationId);
      if (org) {
        if (shopName) org.name = shopName;
        if (bankDetails) {
          org.payoutAccount = { ...org.payoutAccount, ...bankDetails };
        }
        await org.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
