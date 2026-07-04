const mongoose = require('mongoose');
const Warehouse = require('../models/Warehouse');
const InventoryLedger = require('../models/InventoryLedger');
const Product = require('../models/Product');
const { scopeQueryForActor } = require('../utils/accessControl');
const { syncProductStockFromLedger } = require('../utils/inventorySync');

/**
 * Helper to sync aggregated warehouse stock to the main Product document
 */
async function syncProductStock(productId) {
  await syncProductStockFromLedger(productId);
}

/**
 * Helper to check current stock of a product in a specific warehouse
 */
async function getWarehouseProductStock(warehouseId, productId, variantId = null) {
  const query = { warehouse: warehouseId, product: productId };
  if (variantId) query.variantId = variantId;

  const ledgers = await InventoryLedger.find(query);
  return ledgers.reduce((sum, item) => sum + item.quantityChanged, 0);
}

// @desc    Create a new warehouse
// @route   POST /api/v1/warehouses
// @access  Private (Admin, Platform Admin, Vendor Owner)
exports.createWarehouse = async (req, res) => {
  try {
    const { name, code, address, city, state, capacity, manager, organization } = req.body;

    const isPlatformAdmin = ['admin', 'platform_admin'].includes(req.user.role) || req.user.isSuperAdmin;
    const orgId = isPlatformAdmin ? organization : req.user.organizationId;
    const tenantId = isPlatformAdmin ? (orgId ? orgId.toString() : 'platform') : req.user.tenantId;

    let finalCode = code;
    if (!finalCode || finalCode.trim() === '') {
      const cityPrefix = city ? city.trim().substring(0, 3).toUpperCase() : 'GEN';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalCode = `WH-${cityPrefix}-${randomSuffix}`;
    } else {
      finalCode = finalCode.toUpperCase();
    }

    // Check if code is already used
    const existing = await Warehouse.findOne({ code: finalCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Warehouse with code ${finalCode} already exists.`
      });
    }

    const warehouse = await Warehouse.create({
      name,
      code: finalCode,
      address,
      city,
      state: state || 'Maharashtra',
      capacity,
      manager: manager || null,
      organization: orgId || null,
      tenantId: tenantId || 'platform'
    });

    res.status(201).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all warehouses
// @route   GET /api/v1/warehouses
// @access  Private
exports.getAllWarehouses = async (req, res) => {
  try {
    const query = scopeQueryForActor(req.user);
    const warehouses = await Warehouse.find(query)
      .populate('manager', 'name email')
      .populate('organization', 'name type');

    // Compute current stock size for each warehouse
    const InventoryLedger = require('../models/InventoryLedger');
    const stockAggr = await InventoryLedger.aggregate([
      { $match: { warehouse: { $in: warehouses.map(w => w._id) } } },
      { $group: { _id: '$warehouse', totalStock: { $sum: '$quantityChanged' } } }
    ]);

    const stockMap = {};
    stockAggr.forEach(item => {
      stockMap[item._id.toString()] = item.totalStock;
    });

    const enrichedWarehouses = warehouses.map(wh => {
      const whObj = wh.toObject();
      whObj.currentStockSize = stockMap[wh._id.toString()] || 0;
      return whObj;
    });

    res.status(200).json({
      success: true,
      count: enrichedWarehouses.length,
      data: enrichedWarehouses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Record inventory intake directly into a warehouse
// @route   POST /api/v1/warehouses/intake
// @access  Private (Admin, Vendor Owner, Inventory Manager, Warehouse Manager)
exports.intakeStock = async (req, res) => {
  try {
    const { products, productId, variantId, warehouseId, quantity, reason } = req.body;

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse ID is required.'
      });
    }

    // Verify warehouse exists and is accessible
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Enforce role-based isolation
    const isPlatformAdmin = ['admin', 'platform_admin'].includes(req.user.role) || req.user.isSuperAdmin;
    if (!isPlatformAdmin && req.user.tenantId !== warehouse.tenantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to intake stock into this warehouse.' });
    }

    // Normalize input to an array of products to ingest
    let intakeItems = [];
    if (products && Array.isArray(products) && products.length > 0) {
      intakeItems = products;
    } else {
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid intake parameters. Provide a list of products or a single product with positive quantity.'
        });
      }
      intakeItems = [{ productId, variantId, quantity }];
    }

    const ledgers = [];
    for (const item of intakeItems) {
      const { productId: pId, variantId: vId, quantity: qty } = item;
      
      if (!pId || !qty || qty <= 0) {
        continue;
      }

      // Lookup product by ObjectId, SKU, or Name
      let productDoc = null;
      if (mongoose.Types.ObjectId.isValid(pId.toString())) {
        productDoc = await Product.findById(pId);
      }
      if (!productDoc) {
        productDoc = await Product.findOne({
          $or: [
            { name: pId },
            { sku: pId },
            { SKU: pId }
          ]
        });
      }

      if (!productDoc) {
        productDoc = await Product.create({
          name: pId.toString().trim(),
          price: 0,
          category: 'Other',
          stock: 0,
          description: 'Auto-registered during stock intake',
          tenantId: warehouse.tenantId || 'platform'
        });
        console.log(`✅ [WarehouseIntake] Auto-registered new product: "${productDoc.name}"`);
      }

      const finalProductId = productDoc._id;

      // Record ledger entry
      const ledger = await InventoryLedger.create({
        product: finalProductId,
        variantId: vId || null,
        warehouse: warehouseId,
        quantityChanged: qty,
        transactionType: 'intake',
        reason: reason || 'Standard intake log',
        operator: req.user._id,
        organization: warehouse.organization || null,
        tenantId: warehouse.tenantId
      });

      // Update main product document
      await syncProductStock(finalProductId);
      ledgers.push(ledger);
    }

    res.status(200).json({
      success: true,
      message: `Intake of ${ledgers.length} item(s) completed successfully.`,
      data: ledgers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Transfer stock between warehouses
// @route   POST /api/v1/warehouses/transfer
// @access  Private (Admin, Vendor Owner, Inventory Manager)
exports.transferStock = async (req, res) => {
  try {
    const { productId, variantId, fromWarehouseId, toWarehouseId, quantity, reason } = req.body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer parameters. Product, Source, Destination, and positive quantity required.'
      });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination warehouses must be different.'
      });
    }

    const fromWarehouse = await Warehouse.findById(fromWarehouseId);
    const toWarehouse = await Warehouse.findById(toWarehouseId);

    if (!fromWarehouse || !toWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'One or both warehouses not found'
      });
    }

    // Tenant authorization bounds checking
    const isPlatformAdmin = ['admin', 'platform_admin'].includes(req.user.role) || req.user.isSuperAdmin;
    if (!isPlatformAdmin) {
      if (req.user.tenantId !== fromWarehouse.tenantId || req.user.tenantId !== toWarehouse.tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Cross-tenant stock transfers are unauthorized.'
        });
      }
    }

    // Resolve product ID/name/SKU
    let productDoc = null;
    if (mongoose.Types.ObjectId.isValid(productId.toString())) {
      productDoc = await Product.findById(productId);
    }
    if (!productDoc) {
      productDoc = await Product.findOne({
        $or: [
          { name: productId },
          { sku: productId },
          { SKU: productId }
        ]
      });
    }

    if (!productDoc) {
      return res.status(404).json({
        success: false,
        message: `Product matching query "${productId}" not found.`
      });
    }

    const finalProductId = productDoc._id;

    // Verify sufficient stock in source warehouse
    const currentStock = await getWarehouseProductStock(fromWarehouseId, finalProductId, variantId);
    if (currentStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Sufficient stock not found in source warehouse. Available: ${currentStock}, Requested: ${quantity}`
      });
    }

    // 1. Deduct from Source A
    const deductLedger = await InventoryLedger.create({
      product: finalProductId,
      variantId: variantId || null,
      warehouse: fromWarehouseId,
      quantityChanged: -quantity,
      transactionType: 'transfer_out',
      reason: reason || `Transfer out to ${toWarehouse.name}`,
      operator: req.user._id,
      organization: fromWarehouse.organization || null,
      tenantId: fromWarehouse.tenantId
    });

    // 2. Intake to Destination B
    const intakeLedger = await InventoryLedger.create({
      product: finalProductId,
      variantId: variantId || null,
      warehouse: toWarehouseId,
      quantityChanged: quantity,
      transactionType: 'transfer_in',
      reason: reason || `Transfer in from ${fromWarehouse.name}`,
      operator: req.user._id,
      organization: toWarehouse.organization || null,
      tenantId: toWarehouse.tenantId
    });

    // Sync aggregate stock counts
    await syncProductStock(finalProductId);

    res.status(200).json({
      success: true,
      message: 'Stock transfer completed successfully.',
      transferOut: deductLedger,
      transferIn: intakeLedger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get detailed stock trace ledger history
// @route   GET /api/v1/warehouses/ledger
// @access  Private
exports.getStockLedger = async (req, res) => {
  try {
    const actorQuery = scopeQueryForActor(req.user);
    
    // Find ledger entries belonging to actor's scoped tenant limits
    const ledger = await InventoryLedger.find(actorQuery)
      .populate('product', 'name SKU images price')
      .populate('warehouse', 'name code')
      .populate('operator', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ledger.length,
      data: ledger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get inventory items aggregated by warehouse
// @route   GET /api/v1/warehouses/:id/stock
// @access  Private
exports.getWarehouseStock = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const isPlatformAdmin = ['admin', 'platform_admin'].includes(req.user.role) || req.user.isSuperAdmin;
    if (!isPlatformAdmin && req.user.tenantId !== warehouse.tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this warehouse stock' });
    }

    // Retrieve ledger entries grouped by product
    const stockLogs = await InventoryLedger.find({ warehouse: req.params.id })
      .populate('product', 'name sku price brand category');

    const productMap = {};
    stockLogs.forEach(log => {
      if (!log.product) return;
      const key = log.product._id.toString();
      if (!productMap[key]) {
        productMap[key] = {
          product: log.product,
          stock: 0
        };
      }
      productMap[key].stock += log.quantityChanged;
    });

    const results = Object.values(productMap).filter(item => item.stock !== 0);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
