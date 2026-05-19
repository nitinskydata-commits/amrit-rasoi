const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Fetch user's wishlist
// Route: GET /api/v1/wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'products',
        select: 'name price mrp images variants category ratings numReviews stock'
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    res.status(200).json({
      success: true,
      wishlist: wishlist.products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add product to wishlist (idempotent)
// Route: POST /api/v1/wishlist/add
// Body: { productId }
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [productId] });
    } else {
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
      }
    }

    // Populate products to return the fresh full list
    await wishlist.populate({
      path: 'products',
      select: 'name price mrp images variants category ratings numReviews stock'
    });

    res.status(200).json({
      success: true,
      message: 'Added to wishlist',
      wishlist: wishlist.products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove product from wishlist
// Route: DELETE /api/v1/wishlist/remove/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();

    // Populate products to return the fresh full list
    await wishlist.populate({
      path: 'products',
      select: 'name price mrp images variants category ratings numReviews stock'
    });

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist',
      wishlist: wishlist.products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
