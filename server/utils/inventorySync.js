const Product = require('../models/Product');
const InventoryLedger = require('../models/InventoryLedger');
const Warehouse = require('../models/Warehouse');

/**
 * Recalculates and updates product and variant stock counts from the InventoryLedger database collection.
 * This guarantees the ledger is the absolute single source of truth.
 * 
 * @param {string|ObjectId} productId - ID of the product to sync
 */
async function syncProductStockFromLedger(productId) {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      console.warn(`[InventorySync] Product not found for stock sync: ${productId}`);
      return;
    }

    const ledgers = await InventoryLedger.find({ product: productId });

    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // 1. Group ledger sums by variantId
      const variantStockMap = {};
      
      ledgers.forEach(ledger => {
        const vId = ledger.variantId ? ledger.variantId.toString() : 'root';
        if (!variantStockMap[vId]) {
          variantStockMap[vId] = 0;
        }
        variantStockMap[vId] += ledger.quantityChanged;
      });

      // 2. Update each variant in the product document
      let totalVariantsStock = 0;
      product.variants.forEach(variant => {
        const vId = variant._id.toString();
        const stockSum = variantStockMap[vId] || 0;
        
        variant.stock = Math.max(0, stockSum);
        variant.isActive = variant.stock > 0;
        totalVariantsStock += variant.stock;
      });

      // 3. Update main product totals
      product.stock = totalVariantsStock;
      product.isActive = totalVariantsStock > 0;
    } else {
      // Non-variant product: sum all ledger entries
      const totalStock = ledgers.reduce((sum, item) => sum + item.quantityChanged, 0);
      product.stock = Math.max(0, totalStock);
      product.isActive = product.stock > 0;
    }

    // Save without running validators to prevent required fields blocking update
    await product.save({ validateBeforeSave: false });
    console.log(`[InventorySync] Synced stock for product "${product.name}" (${product._id}) -> Stock: ${product.stock}, Active: ${product.isActive}`);

    if (product.stock < 10) {
      try {
        const { eventBus } = require('./eventBus');
        eventBus.emit('stock.low', {
          productName: product.name,
          stock: product.stock,
          organizationId: product.organization || null,
          tenantId: product.tenantId || 'platform'
        });
      } catch (err) {
        console.error('[InventorySync] Failed to emit stock.low event:', err.message);
      }
    }
  } catch (error) {
    console.error(`[InventorySync] Error syncing stock for product ${productId}:`, error);
  }
}

/**
 * Allocates warehouse stock for an order item.
 * Supports splitting allocations across multiple warehouses if one doesn't have enough stock.
 * Prioritizes local warehouses matching the shipping city.
 * 
 * @param {string} productId 
 * @param {string|null} variantId 
 * @param {number} quantity 
 * @param {string} shippingCity 
 * @returns {Promise<Array<{warehouseId: string, warehouseCode: string, warehouseName: string, quantity: number}>>}
 */
async function allocateStockFromWarehouses(productId, variantId, quantity, shippingCity) {
  // Query to group stock by warehouse
  const query = { product: productId };
  if (variantId) {
    query.variantId = variantId.toString();
  } else {
    // If no variantId is specified, match null variantId or empty/undefined
    query.$or = [{ variantId: null }, { variantId: '' }, { variantId: { $exists: false } }];
  }

  // Aggregate stock per warehouse
  const stockLogs = await InventoryLedger.find(query);
  const warehouseStockMap = {};
  stockLogs.forEach(log => {
    const whId = log.warehouse.toString();
    if (!warehouseStockMap[whId]) {
      warehouseStockMap[whId] = 0;
    }
    warehouseStockMap[whId] += log.quantityChanged;
  });

  // Filter warehouses with positive stock
  const availableWarehouseIds = Object.keys(warehouseStockMap).filter(
    whId => warehouseStockMap[whId] > 0
  );

  if (availableWarehouseIds.length === 0) {
    throw new Error('Out of stock: No warehouses have available inventory.');
  }

  // Fetch warehouse details
  const warehouses = await Warehouse.find({ _id: { $in: availableWarehouseIds } });
  
  // Map warehouse info with available stock
  const warehouseOptions = warehouses.map(wh => ({
    warehouse: wh,
    stock: warehouseStockMap[wh._id.toString()] || 0
  }));

  // Sort warehouses:
  // 1. Same city (Rajasthan local band etc)
  // 2. Highest stock
  const cityLower = shippingCity ? shippingCity.toLowerCase().trim() : '';
  warehouseOptions.sort((a, b) => {
    const aCityMatches = a.warehouse.city && a.warehouse.city.toLowerCase().trim() === cityLower;
    const bCityMatches = b.warehouse.city && b.warehouse.city.toLowerCase().trim() === cityLower;

    if (aCityMatches && !bCityMatches) return -1;
    if (!aCityMatches && bCityMatches) return 1;

    // Secondary: Highest stock
    return b.stock - a.stock;
  });

  // Allocate stock
  const allocations = [];
  let remainingToAllocate = quantity;

  for (const option of warehouseOptions) {
    if (remainingToAllocate <= 0) break;

    const available = option.stock;
    const toAllocate = Math.min(available, remainingToAllocate);

    allocations.push({
      warehouseId: option.warehouse._id.toString(),
      warehouseCode: option.warehouse.code,
      warehouseName: option.warehouse.name,
      quantity: toAllocate
    });

    remainingToAllocate -= toAllocate;
  }

  if (remainingToAllocate > 0) {
    throw new Error(`Insufficient stock: Only ${quantity - remainingToAllocate} out of ${quantity} items available in warehouses.`);
  }

  return allocations;
}

module.exports = {
  syncProductStockFromLedger,
  allocateStockFromWarehouses
};
