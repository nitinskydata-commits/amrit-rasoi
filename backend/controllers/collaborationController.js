const Collaboration = require('../models/Collaboration');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get all collaborations (admin)
exports.getAllCollaborations = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const collaborations = await Collaboration.find(query)
      .populate('productsListed', 'name price images')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: collaborations.length,
      collaborations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get active collaborations (public)
exports.getActiveCollaborations = async (req, res) => {
  try {
    const collaborations = await Collaboration.find({
      status: 'active',
      startDate: { $lte: Date.now() },
      endDate: { $gte: Date.now() }
    })
      .populate('productsListed', 'name price mrp images')
      .select('partnerName description startDate endDate productsListed');
    
    res.status(200).json({
      success: true,
      count: collaborations.length,
      collaborations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single collaboration details
exports.getCollaborationDetails = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id)
      .populate('productsListed', 'name price mrp images ratings')
      .populate('createdBy', 'name email');
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      collaboration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create collaboration (admin)
exports.createCollaboration = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    const collaboration = await Collaboration.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Collaboration created successfully',
      collaboration
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update collaboration (admin)
exports.updateCollaboration = async (req, res) => {
  try {
    let collaboration = await Collaboration.findById(req.params.id);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }
    
    collaboration = await Collaboration.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Collaboration updated successfully',
      collaboration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add product to collaboration (admin)
exports.addProductToCollaboration = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }
    
    const { productId } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Add product to collaboration
    if (!collaboration.productsListed.includes(productId)) {
      collaboration.productsListed.push(productId);
      await collaboration.save();
      
      // Mark product as collaboration product
      product.isCollaborationProduct = true;
      product.collaboration = collaboration._id;
      await product.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Product added to collaboration',
      collaboration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove product from collaboration (admin)
exports.removeProductFromCollaboration = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }
    
    const { productId } = req.body;
    
    collaboration.productsListed = collaboration.productsListed.filter(
      id => id.toString() !== productId
    );
    
    await collaboration.save();
    
    // Update product
    await Product.findByIdAndUpdate(productId, {
      isCollaborationProduct: false,
      collaboration: null
    });
    
    res.status(200).json({
      success: true,
      message: 'Product removed from collaboration',
      collaboration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete collaboration (admin)
exports.deleteCollaboration = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }
    
    // Remove collaboration reference from products
    await Product.updateMany(
      { collaboration: collaboration._id },
      {
        isCollaborationProduct: false,
        collaboration: null
      }
    );
    
    await collaboration.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Collaboration deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Calculate collaboration revenue (admin)
exports.calculateCollaborationRevenue = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id)
      .populate('productsListed');
    
    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }
    
    const productIds = collaboration.productsListed.map(p => p._id);
    
    // Get all paid orders containing collaboration products
    const orders = await Order.find({
      'orderItems.product': { $in: productIds },
      paymentStatus: 'Paid',
      createdAt: {
        $gte: collaboration.startDate,
        $lte: collaboration.endDate
      }
    });
    
    let totalRevenue = 0;
    
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (productIds.some(id => id.toString() === item.product.toString())) {
          totalRevenue += item.price * item.quantity;
        }
      });
    });
    
    // Update collaboration revenue
    collaboration.totalRevenue = totalRevenue;
    await collaboration.save();
    
    const partnerShare = (totalRevenue * collaboration.revenueShare) / 100;
    const ourShare = totalRevenue - partnerShare;
    
    res.status(200).json({
      success: true,
      revenue: {
        totalRevenue,
        revenueShare: collaboration.revenueShare,
        partnerShare,
        ourShare,
        ordersCount: orders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
