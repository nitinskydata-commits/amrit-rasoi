const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Create New Order
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;
    
    const order = await Order.create({
      orderItems,
      shippingAddress,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      user: req.user.id
    });
    
    // Update product stock
    for (const item of orderItems) {
      await updateStock(item.product, item.quantity);
    }
    
    // Clear cart after order
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 }
    );
    
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Stock
async function updateStock(productId, quantity) {
  const product = await Product.findById(productId);
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}

// Get Single Order
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Logged in User Orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// All administrative functions (getAllOrders, updateOrderStatus, etc.) 
// have been moved to adminController.js to centralize management.
