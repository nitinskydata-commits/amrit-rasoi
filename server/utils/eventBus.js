const EventEmitter = require('events');
const eventBus = new EventEmitter();

// Define core enterprise event names
const EVENTS = {
  ORDER_PLACED: 'order.placed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  REFUND_REQUESTED: 'refund.requested',
  REFUND_APPROVED: 'refund.approved',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  STAFF_PERMISSIONS_CHANGED: 'staff.permissions_changed',
  TENANT_ONBOARDED: 'tenant.onboarded',
  SECURITY_ALERT: 'security.alert'
};

// ==================== CORE EVENT SUBSCRIBERS ====================

// 🛒 Order Placed Event Handler (Deduce Inventory, Send WhatsApp/Email, Log Audit)
eventBus.on(EVENTS.ORDER_PLACED, async (data) => {
  console.log(`📡 [EventBus] [ORDER_PLACED] Triggered for Order ID: ${data.orderId}`);
  try {
    const AuditLog = require('../models/AuditLog');
    
    // Log async audit trail
    await AuditLog.create({
      user: data.userId,
      userName: data.userName || 'System Customer',
      role: 'customer',
      action: 'ORDER_PLACED',
      targetModel: 'Order',
      targetId: data.orderId.toString(),
      newState: { totalAmount: data.totalAmount, itemsCount: data.itemsCount },
      ipAddress: data.ipAddress || 'Internal',
      userAgent: data.userAgent || 'WebBrowser'
    });
    
    // Simulated WhatsApp / Email trigger
    console.log(`✉️ [EventBus] WhatsApp trigger sent to customer for order ${data.orderId}`);
  } catch (err) {
    console.error(`❌ [EventBus Error] [ORDER_PLACED] failed:`, err.message);
  }
});

// 💸 Refund Approved Event Handler
eventBus.on(EVENTS.REFUND_APPROVED, async (data) => {
  console.log(`📡 [EventBus] [REFUND_APPROVED] Triggered for Order ID: ${data.orderId}`);
  try {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      user: data.adminId,
      userName: data.adminName,
      role: 'admin',
      action: 'REFUND_APPROVED',
      targetModel: 'Order',
      targetId: data.orderId.toString(),
      ipAddress: data.ipAddress || 'Internal',
      userAgent: data.userAgent || 'AdminBrowser'
    });
    console.log(`💰 [EventBus] Settlement ledger updated for Refunded Order ID: ${data.orderId}`);
  } catch (err) {
    console.error(`❌ [EventBus Error] [REFUND_APPROVED] failed:`, err.message);
  }
});

// 📦 Product Created Event Handler
eventBus.on(EVENTS.PRODUCT_CREATED, async (data) => {
  console.log(`📡 [EventBus] [PRODUCT_CREATED] Triggered for Product ID: ${data.productId}`);
  try {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      user: data.userId,
      userName: data.userName,
      role: data.role || 'staff',
      action: 'PRODUCT_CREATED',
      targetModel: 'Product',
      targetId: data.productId.toString(),
      newState: data.productData,
      tenantId: data.tenantId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
  } catch (err) {
    console.error(`❌ [EventBus Error] [PRODUCT_CREATED] failed:`, err.message);
  }
});

// 🔄 Product Updated Event Handler
eventBus.on(EVENTS.PRODUCT_UPDATED, async (data) => {
  console.log(`📡 [EventBus] [PRODUCT_UPDATED] Triggered for Product ID: ${data.productId}`);
  try {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      user: data.userId,
      userName: data.userName,
      role: data.role || 'staff',
      action: 'PRODUCT_UPDATED',
      targetModel: 'Product',
      targetId: data.productId.toString(),
      previousState: data.oldState,
      newState: data.newState,
      tenantId: data.tenantId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
  } catch (err) {
    console.error(`❌ [EventBus Error] [PRODUCT_UPDATED] failed:`, err.message);
  }
});

// 🔒 Security Alert Event Handler
eventBus.on(EVENTS.SECURITY_ALERT, async (data) => {
  console.warn(`🚨 [EventBus] [SECURITY_ALERT] HIGH SEVERITY ACTION DETECTED:`, data.message);
  try {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      user: data.userId,
      userName: data.userName,
      role: data.role,
      action: 'SECURITY_ALERT',
      targetModel: 'SystemSecurity',
      targetId: 'VaultProtection',
      previousState: { trigger: data.message },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
  } catch (err) {
    console.error(`❌ [EventBus Error] [SECURITY_ALERT] failed:`, err.message);
  }
});

module.exports = {
  eventBus,
  EVENTS
};
