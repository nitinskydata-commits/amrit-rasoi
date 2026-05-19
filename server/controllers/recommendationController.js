const Order = require('../models/Order');
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const mongoose = require('mongoose');

// GET /api/v1/products/recommendations/:id
// Returns "Frequently Bought Together" products based on order co-occurrence
exports.getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // 1. Find orders containing the target product
    const orders = await Order.find({
      'orderItems.product': productId
    });

    const frequencyMap = {};

    // 2. Aggregate other products from the same orders
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const itemIdStr = item.product.toString();
        if (itemIdStr !== productId) {
          frequencyMap[itemIdStr] = (frequencyMap[itemIdStr] || 0) + 1;
        }
      });
    });

    // 3. Sort by co-occurrence frequency
    const sortedIds = Object.keys(frequencyMap)
      .sort((a, b) => frequencyMap[b] - frequencyMap[a]);

    // 4. Fetch the full product documents
    let recommendedProducts = await Product.find({
      _id: { $in: sortedIds },
      isActive: true
    }).limit(4);

    // Fallback: If no co-occurring products, suggest products from the same category
    if (recommendedProducts.length < 4) {
      const targetProduct = await Product.findById(productId);
      if (targetProduct) {
        const categoryFallback = await Product.find({
          category: targetProduct.category,
          _id: { $ne: productId },
          isActive: true
        }).limit(4 - recommendedProducts.length);
        
        recommendedProducts = [...recommendedProducts, ...categoryFallback];
      }
    }

    // Secondary Fallback: If still less than 4, return top-rated active products
    if (recommendedProducts.length < 4) {
      const globalFallback = await Product.find({
        _id: { $ne: productId },
        isActive: true
      })
        .sort({ ratings: -1 })
        .limit(4 - recommendedProducts.length);

      recommendedProducts = [...recommendedProducts, ...globalFallback];
    }

    res.status(200).json({
      success: true,
      products: recommendedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET /api/v1/products/personalized-feed
// Returns personalized recommendations based on user's wishlist and order history
exports.getPersonalizedFeed = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    let categoriesOfInterest = new Set();
    let excludeProductIds = new Set();

    if (userId) {
      // 1. Gather wishlist product categories
      const wishlist = await Wishlist.findOne({ user: userId });
      if (wishlist && wishlist.products && wishlist.products.length > 0) {
        const products = await Product.find({ _id: { $in: wishlist.products } });
        products.forEach(p => {
          if (p.category) categoriesOfInterest.add(p.category);
          excludeProductIds.add(p._id.toString());
        });
      }

      // 2. Gather past orders categories
      const pastOrders = await Order.find({ user: userId });
      pastOrders.forEach(order => {
        order.orderItems.forEach(item => {
          excludeProductIds.add(item.product.toString());
        });
      });

      // Fetch products that user purchased to identify categories
      const purchasedProducts = await Product.find({
        _id: { $in: Array.from(excludeProductIds) }
      });
      purchasedProducts.forEach(p => {
        if (p.category) categoriesOfInterest.add(p.category);
      });
    }

    let recommendedProducts = [];

    // 3. Query based on identified categories
    if (categoriesOfInterest.size > 0) {
      recommendedProducts = await Product.find({
        category: { $in: Array.from(categoriesOfInterest) },
        _id: { $nin: Array.from(excludeProductIds) },
        isActive: true
      })
        .sort({ ratings: -1 })
        .limit(8);
    }

    // Fallback: If recommended list is empty, return general top-rated/best seller items
    if (recommendedProducts.length < 4) {
      const topProducts = await Product.find({
        _id: { $nin: Array.from(excludeProductIds) },
        isActive: true
      })
        .sort({ ratings: -1, numOfReviews: -1 })
        .limit(8 - recommendedProducts.length);

      recommendedProducts = [...recommendedProducts, ...topProducts];
    }

    res.status(200).json({
      success: true,
      products: recommendedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
