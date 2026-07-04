const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// Helper: recalculate cart totals
const recalcTotals = (cart, isWholesale = false) => {
  let subtotal = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  if (isWholesale) {
    cart.discount = subtotal * 0.15; // 15% B2B discount
    subtotal = subtotal - cart.discount;
  } else {
    cart.discount = 0;
  }
  cart.subtotal = subtotal;
  cart.tax = subtotal * 0.18;
  cart.shipping = subtotal >= 500 ? 0 : 40;
  cart.total = subtotal + cart.tax + cart.shipping;
};

// Helper: build human-readable variant label from attributes array
const buildVariantLabel = (variant) => {
  if (!variant || !Array.isArray(variant.attributes)) return '';
  return variant.attributes.map(a => `${a.name}: ${a.value}`).join(', ');
};

// Get User Cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    const user = await User.findById(req.user.id);
    const isWholesale = user?.isWholesale || false;
    
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    recalcTotals(cart, isWholesale);
    await cart.save();
    
    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add to Cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, variantId } = req.body;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    // ✅ Resolve variant details
    let price = product.price;
    let mrp = product.mrp || product.price;
    let image = product.images?.[0]?.url || '';
    let variantLabel = '';
    let resolvedVariantId = variantId || null;
    const productOrganization = product.organization || null;
    const productTenantId = product.tenantId || 'platform';

    if (variantId && product.variants && product.variants.length > 0) {
      try {
        const matchedVariant = product.variants.id(variantId);
        if (matchedVariant) {
          price = matchedVariant.price;
          mrp = matchedVariant.mrp || matchedVariant.price;
          // Use variant image if available, else fall back to main product image
          if (matchedVariant.images && matchedVariant.images.length > 0) {
            image = matchedVariant.images[0].url;
          }
          variantLabel = buildVariantLabel(matchedVariant);
          resolvedVariantId = matchedVariant._id.toString();
        }
      } catch (e) {
        console.warn('Variant lookup failed, using product defaults:', e.message);
      }
    }

    // ✅ Fixed: compare both sides as strings to avoid ObjectId vs String mismatch
    const itemIndex = cart.items.findIndex(
      item =>
        item.product.toString() === productId &&
        (item.variantId || '').toString() === (resolvedVariantId || '').toString()
    );
    
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        organization: productOrganization,
        tenantId: productTenantId,
        name: product.name,
        price,
        mrp,
        quantity,
        image,
        variantId: resolvedVariantId,
        variantLabel
      });
    }
    
    const user = await User.findById(req.user.id);
    const isWholesale = user?.isWholesale || false;
    recalcTotals(cart, isWholesale);
    await cart.save();
    
    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Cart Item Quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const item = cart.items.id(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    const user = await User.findById(req.user.id);
    const isWholesale = user?.isWholesale || false;
    
    item.quantity = quantity;
    
    recalcTotals(cart, isWholesale);
    await cart.save();
    
    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const user = await User.findById(req.user.id);
    const isWholesale = user?.isWholesale || false;
    
    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    
    recalcTotals(cart, isWholesale);
    await cart.save();
    
    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = [];
    cart.subtotal = 0;
    cart.tax = 0;
    cart.shipping = 0;
    cart.total = 0;
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
