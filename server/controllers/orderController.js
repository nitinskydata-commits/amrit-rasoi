const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Organization = require('../models/Organization');
const InventoryLedger = require('../models/InventoryLedger');
const { writeAuditLog } = require('../utils/auditLogger');
const { syncProductStockFromLedger, allocateStockFromWarehouses } = require('../utils/inventorySync');
const { eventBus, EVENTS } = require('../utils/eventBus');

// Create New Order
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order.'
      });
    }

    if (!shippingAddress || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and city are required for logistics routing and warehouse selection.'
      });
    }

    // 1. Pre-check stock allocation from warehouses for all items to guarantee transactional consistency
    const allAllocations = [];
    for (const item of orderItems) {
      try {
        const allocations = await allocateStockFromWarehouses(
          item.product,
          item.variantId || null,
          item.quantity,
          shippingAddress.city
        );
        allAllocations.push({ item, allocations });
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Stock allocation failed for item "${item.name}": ${err.message}`
        });
      }
    }

    const productIds = orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select('organization tenantId');
    const productScopeById = new Map(products.map((product) => [
      product._id.toString(),
      { organization: product.organization || null, tenantId: product.tenantId || 'platform' }
    ]));

    // Fetch snapshot commission rates for the products' organizations
    const orgIds = products.map(p => p.organization).filter(Boolean);
    const organizations = await Organization.find({ _id: { $in: orgIds } }).select('_id commissionRate');
    const commissionById = new Map(organizations.map(org => [
      org._id.toString(),
      org.commissionRate
    ]));

    // 2. Build flat allocated order items list. If an item is split across warehouses, create separate line items.
    const scopedOrderItems = [];
    for (const { item, allocations } of allAllocations) {
      const scope = productScopeById.get(item.product.toString()) || {};
      const rate = scope.organization ? (commissionById.get(scope.organization.toString()) ?? 10) : 10;
      
      for (const allocation of allocations) {
        const itemTotal = item.price * allocation.quantity;
        const commissionPaid = itemTotal * (rate / 100);
        const netVendorPayout = itemTotal - commissionPaid;

        scopedOrderItems.push({
          product: item.product,
          name: item.name,
          quantity: allocation.quantity,
          price: item.price,
          mrp: item.mrp || item.price,
          image: item.image,
          variantId: item.variantId || null,
          variantLabel: item.variantLabel || '',
          warehouseId: allocation.warehouseId,
          warehouseCode: allocation.warehouseCode,
          organization: scope.organization || null,
          tenantId: scope.tenantId || 'platform',
          commissionRate: rate,
          commissionPaid,
          netVendorPayout
        });
      }
    }

    // 3. Group order items by Organization/Vendor for splitting
    const itemsByOrg = {};
    for (const item of scopedOrderItems) {
      const orgKey = item.organization ? item.organization.toString() : 'platform';
      if (!itemsByOrg[orgKey]) {
        itemsByOrg[orgKey] = [];
      }
      itemsByOrg[orgKey].push(item);
    }

    // Calculate total price of all items to compute proportional shipping/tax splits
    const totalItemsPrice = scopedOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const createdOrders = [];
    
    // 4. Create distinct order for each organization/vendor
    for (const [orgKey, groupItems] of Object.entries(itemsByOrg)) {
      const orgItemsPrice = groupItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const proportion = totalItemsPrice > 0 ? (orgItemsPrice / totalItemsPrice) : 0;
      
      const orgTaxPrice = Math.round((taxPrice * proportion) * 100) / 100;
      const orgShippingPrice = Math.round((shippingPrice * proportion) * 100) / 100;
      const orgTotalPrice = Math.round((orgItemsPrice + orgTaxPrice + orgShippingPrice) * 100) / 100;

      // Fetch warehouses to get their states for GST calculation
      const Warehouse = require('../models/Warehouse');
      const warehouseIds = [...new Set(groupItems.map(item => item.warehouseId).filter(Boolean))];
      const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } });
      const warehouseStateMap = new Map(warehouses.map(w => [w._id.toString(), w.state]));

      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let totalTaxableAmount = 0;

      // Populate itemized GST breakdowns
      for (const item of groupItems) {
        const whState = warehouseStateMap.get(item.warehouseId?.toString()) || 'Rajasthan';
        const isIntraState = whState.trim().toLowerCase() === shippingAddress.state?.trim().toLowerCase();
        
        const gstRate = 18; // standard 18% inclusive
        const itemTotalInclusive = item.price * item.quantity;
        const itemTaxableAmount = Math.round((itemTotalInclusive / (1 + (gstRate / 100))) * 100) / 100;
        const itemGstAmount = Math.round((itemTotalInclusive - itemTaxableAmount) * 100) / 100;

        let cgst = 0, sgst = 0, igst = 0;
        if (isIntraState) {
          cgst = Math.round((itemGstAmount / 2) * 100) / 100;
          sgst = Math.round((itemGstAmount / 2) * 100) / 100;
        } else {
          igst = itemGstAmount;
        }

        item.gstRate = gstRate;
        item.cgst = cgst;
        item.sgst = sgst;
        item.igst = igst;

        totalCgst += cgst;
        totalSgst += sgst;
        totalIgst += igst;
        totalTaxableAmount += itemTaxableAmount;
      }

      // Generate invoice number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randStr = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${dateStr}-${randStr}`;

      const order = await Order.create({
        orderItems: groupItems,
        organization: orgKey === 'platform' ? null : orgKey,
        tenantId: groupItems[0].tenantId || 'platform',
        shippingAddress,
        paymentInfo,
        paymentMethod: paymentInfo.method === 'cod' ? 'COD' : 'Card',
        paymentStatus: paymentInfo.status === 'Success' ? 'Paid' : 'Pending',
        itemsPrice: orgItemsPrice,
        taxPrice: orgTaxPrice,
        shippingPrice: orgShippingPrice,
        totalPrice: orgTotalPrice,
        invoiceNumber,
        gstBreakdown: {
          cgst: Math.round(totalCgst * 100) / 100,
          sgst: Math.round(totalSgst * 100) / 100,
          igst: Math.round(totalIgst * 100) / 100,
          taxableAmount: Math.round(totalTaxableAmount * 100) / 100
        },
        user: req.user.id
      });

      // 5. Deduct stock per allocation using InventoryLedger (Single Source of Truth)
      for (const item of groupItems) {
        await InventoryLedger.create({
          product: item.product,
          variantId: item.variantId || null,
          warehouse: item.warehouseId,
          quantityChanged: -item.quantity,
          transactionType: 'sale',
          referenceId: order._id.toString(),
          reason: `Order Placement: Order #${order._id}`,
          operator: req.user.id,
          organization: order.organization || null,
          tenantId: order.tenantId
        });

        // Re-sync product and variant stock totals
        await syncProductStockFromLedger(item.product);
      }

      // Emit ORDER_PLACED event so asynchronous workflows (WhatsApp, Emails, Notifications) trigger
      eventBus.emit(EVENTS.ORDER_PLACED, {
        orderId: order._id,
        userId: req.user.id,
        userName: req.user.name,
        totalAmount: order.totalPrice,
        itemsCount: order.orderItems.length,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'API'
      });

      createdOrders.push(order);
    }
    
    // Clear the cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 }
    );

    // Write a central AuditLog entry
    await writeAuditLog({
      req,
      action: 'ORDER_PLACED',
      targetModel: 'Order',
      targetId: createdOrders[0]._id,
      newState: {
        splitOrdersCount: createdOrders.length,
        orderIds: createdOrders.map(o => o._id),
        totalCharged: totalPrice
      }
    });
    
    // Return the first created order so client navigation stays fully functional
    res.status(201).json({
      success: true,
      order: createdOrders[0],
      allCreatedOrders: createdOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Order
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Logged in User Orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Request Return (Customer)
exports.requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify ownership
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to return this order'
      });
    }

    // Check order status
    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }

    // Check refund window eligibility across items
    const Product = require('../models/Product');
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      if (!product.isRefundable) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name}" is not eligible for returns/refunds.`
        });
      }

      // Check date limits
      const deliveryDate = order.deliveredAt || order.updatedAt;
      const daysSinceDelivery = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > product.refundWindowDays) {
        return res.status(400).json({
          success: false,
          message: `The return period of ${product.refundWindowDays} days for product "${item.name}" has expired.`
        });
      }
    }

    const { reason } = req.body;
    order.refundStatus = 'Requested';
    order.refundReason = reason || 'Customer requested return';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
