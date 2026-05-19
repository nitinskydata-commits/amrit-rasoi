const express = require('express');
const router = express.Router();

const {
  getSalesAnalytics,
  getInventoryAnalytics,
  getDemandForecasts
} = require('../controllers/analyticsController');

const { isAuthenticatedUser } = require('../middleware/auth');

// Secure all endpoints with authentication
router.use(isAuthenticatedUser);

router.get('/sales', getSalesAnalytics);
router.get('/inventory', getInventoryAnalytics);
router.get('/forecasts', getDemandForecasts);

module.exports = router;
