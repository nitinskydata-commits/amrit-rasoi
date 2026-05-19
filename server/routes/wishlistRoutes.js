const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.route('/wishlist').get(isAuthenticatedUser, getWishlist);
router.route('/wishlist/add').post(isAuthenticatedUser, addToWishlist);
router.route('/wishlist/remove/:productId').delete(isAuthenticatedUser, removeFromWishlist);

module.exports = router;
