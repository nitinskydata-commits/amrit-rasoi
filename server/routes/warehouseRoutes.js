const express = require('express');
const router = express.Router();

const { 
  createWarehouse, 
  getAllWarehouses, 
  intakeStock, 
  transferStock, 
  getStockLedger, 
  getWarehouseStock 
} = require('../controllers/warehouseController');

const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

// Secure all endpoints with authentication
router.use(isAuthenticatedUser);

router.route('/')
  .get(getAllWarehouses)
  .post(authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'franchise_manager', 'inventory_manager'), createWarehouse);

router.post('/intake', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'inventory_manager', 'warehouse_manager'), intakeStock);
router.post('/transfer', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'inventory_manager', 'warehouse_manager'), transferStock);
router.get('/ledger', authorizeRoles('admin', 'platform_admin', 'vendor_owner', 'partner_admin', 'inventory_manager', 'warehouse_manager'), getStockLedger);
router.get('/:id/stock', getWarehouseStock);

module.exports = router;
