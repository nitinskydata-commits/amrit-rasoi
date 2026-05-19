const express = require('express');
const router = express.Router();
const {
  getFrequentlyBoughtTogether,
  getPersonalizedFeed
} = require('../controllers/recommendationController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.get('/products/recommendations/:id', getFrequentlyBoughtTogether);
router.get('/products/personalized-feed', isAuthenticatedUser, getPersonalizedFeed);

module.exports = router;
