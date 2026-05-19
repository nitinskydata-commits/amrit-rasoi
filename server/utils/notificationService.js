const { eventBus, EVENTS } = require('./eventBus');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Core dispatch function
const sendNotification = async (recipientId, data) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: data.sender || null,
      organization: data.organization || null,
      tenantId: data.tenantId || null,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      link: data.link || null
    });
    return notification;
  } catch (err) {
    console.error('❌ [NotificationService] Failed to persist alert:', err.message);
  }
};

// Broadcast function to all operators matching a role and optional organization filter
const broadcastToRole = async (role, data, organizationId = null) => {
  try {
    const query = { role };
    if (organizationId) {
      query.$or = [
        { organizationId: organizationId },
        { organization: organizationId }
      ];
    }
    const recipients = await User.find(query);
    const notifications = [];
    for (const r of recipients) {
      const n = await sendNotification(r._id, data);
      if (n) notifications.push(n);
    }
    return notifications;
  } catch (err) {
    console.error('❌ [NotificationService] Broadcast failed:', err.message);
  }
};

// ==================== EVENT SUBSCRIPTIONS ====================

// 🛒 1. Order Placed Subscription
eventBus.on(EVENTS.ORDER_PLACED, async (data) => {
  console.log(`📡 [NotificationService] Hooked ORDER_PLACED for Order ID: ${data.orderId}`);
  try {
    if (data.userId) {
      await sendNotification(data.userId, {
        title: '🛒 Order Placed successfully!',
        message: `Your order #${data.orderId.toString().substring(18)} of ₹${data.totalAmount} has been registered successfully.`,
        type: 'success',
        link: '/orders'
      });
    }
  } catch (err) {
    console.error('❌ [NotificationService] ORDER_PLACED subscription error:', err.message);
  }
});

// 🔒 2. Security Alert Subscription
eventBus.on(EVENTS.SECURITY_ALERT, async (data) => {
  console.log(`📡 [NotificationService] Hooked SECURITY_ALERT: ${data.message}`);
  try {
    const admins = await User.find({ role: { $in: ['admin', 'platform_admin'] } });
    for (const admin of admins) {
      await sendNotification(admin._id, {
        title: '🚨 SECURITY PROTECTION ACTION',
        message: data.message,
        type: 'alert',
        link: '/audit-logs'
      });
    }
  } catch (err) {
    console.error('❌ [NotificationService] SECURITY_ALERT subscription error:', err.message);
  }
});

// 💸 3. Payout Reconciliations Subscription
eventBus.on('payout.processed', async (data) => {
  console.log(`📡 [NotificationService] Hooked payout.processed for organization: ${data.organizationId}`);
  try {
    await broadcastToRole('vendor_owner', {
      title: '💸 Settlement payout Transferred!',
      message: `A settlement cycle of ₹${data.amount} has been processed and closed with Bank UTR: ${data.transactionRef}.`,
      type: 'success',
      link: '/payouts',
      organization: data.organizationId,
      tenantId: data.tenantId
    }, data.organizationId);
  } catch (err) {
    console.error('❌ [NotificationService] payout.processed subscription error:', err.message);
  }
});

// ⚠️ 4. Critically Low Stock Warning Subscription
eventBus.on('stock.low', async (data) => {
  console.log(`📡 [NotificationService] Hooked stock.low for product: ${data.productName}`);
  try {
    await broadcastToRole('warehouse_manager', {
      title: '⚠️ Low Stock warning!',
      message: `Product ${data.productName} has dropped below threshold! Remaining physical count: ${data.stock} units.`,
      type: 'warning',
      link: '/inventory',
      organization: data.organizationId,
      tenantId: data.tenantId
    }, data.organizationId);
  } catch (err) {
    console.error('❌ [NotificationService] stock.low subscription error:', err.message);
  }
});

module.exports = {
  sendNotification,
  broadcastToRole
};
