const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.route('/wishlist')
  .get(isAuthenticatedUser, getWishlist)
  .post(isAuthenticatedUser, addToWishlist);

router.route('/wishlist/add').post(isAuthenticatedUser, addToWishlist);

router.route('/wishlist/:productId').delete(isAuthenticatedUser, removeFromWishlist);
router.route('/wishlist/remove/:productId').delete(isAuthenticatedUser, removeFromWishlist);

module.exports = router;
