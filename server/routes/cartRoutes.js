const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.get('/cart', isAuthenticatedUser, getCart);
router.post('/cart', isAuthenticatedUser, addToCart);
router.put('/cart/item', isAuthenticatedUser, updateCartItem);
router.delete('/cart/item/:itemId', isAuthenticatedUser, removeFromCart);
router.delete('/cart', isAuthenticatedUser, clearCart);

module.exports = router;
