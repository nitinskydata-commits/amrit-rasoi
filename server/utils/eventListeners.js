const { eventBus, EVENTS } = require('./eventBus');
const sendEmail = require('./sendEmail');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const User = require('../models/User');

// Expand EVENTS dictionary dynamically if not already defined
EVENTS.ORDER_STATUS_UPDATED = 'order.status.updated';
EVENTS.STOCK_LOW = 'stock.low';

// 1. Listen for order placement to send invoice email
eventBus.on(EVENTS.ORDER_PLACED, async (data) => {
  try {
    const orderId = data.orderId || data._id;
    const order = await Order.findById(orderId).populate('user');
    if (!order || !order.user || !order.user.email) return;

    console.log(`✉️ [EventBus] Dispatching invoice email for order ${orderId} to ${order.user.email}`);

    const emailSubject = `Order Invoice - ${order.invoiceNumber || orderId}`;
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Thank you for shopping with Amrit Rasoi!</h2>
        <p>Your order has been placed successfully.</p>
        <p><strong>Invoice Number:</strong> ${order.invoiceNumber || 'Pending'}</p>
        <p><strong>Grand Total:</strong> ₹${order.totalPrice.toFixed(2)}</p>
        <p>We are preparing your package for shipment. You can track your order status in your profile portal.</p>
      </div>
    `;

    await sendEmail({
      email: order.user.email,
      subject: emailSubject,
      message: `Your order ${order.invoiceNumber || orderId} has been placed. Total amount: ₹${order.totalPrice.toFixed(2)}`,
      html: emailHtml
    });
  } catch (error) {
    console.error(`❌ [EventListeners Error] [ORDER_PLACED] failed to send email:`, error.message);
  }
});

// 2. Listen for order status transitions to generate notifications & alerts
eventBus.on(EVENTS.ORDER_STATUS_UPDATED, async (data) => {
  try {
    const { orderId, status, userId } = data;
    const order = await Order.findById(orderId).populate('user');
    if (!order) return;

    const recipientId = userId || order.user?._id;
    if (!recipientId) return;

    console.log(`📡 [EventBus] Order status update notification: Order #${orderId} -> ${status}`);

    // Create in-app Notification document
    await Notification.create({
      recipient: recipientId,
      title: `Order Status Updated: ${status}`,
      message: `Your order #${order.invoiceNumber || orderId.toString().slice(-8).toUpperCase()} is now ${status}.`,
      type: status === 'Delivered' ? 'success' : 'info',
      link: `/order/${orderId}`
    });

    // Send simulation email
    if (order.user && order.user.email) {
      await sendEmail({
        email: order.user.email,
        subject: `Your Order Status: ${status}`,
        message: `Dear Customer, your order #${order.invoiceNumber || orderId} is now ${status}.`
      });
    }

    // Simulated SMS logger
    console.log(`📲 [SMS Dispatcher] Alert sent to phone ${order.shippingAddress?.phone || order.user?.phone}: Order status changed to ${status}`);
  } catch (error) {
    console.error(`❌ [EventListeners Error] [ORDER_STATUS_UPDATED] failed:`, error.message);
  }
});

// 3. Listen for low stock levels to warn administrators/vendors
eventBus.on(EVENTS.STOCK_LOW, async (data) => {
  try {
    const productName = data.productName || data.productId || 'Unknown Product';
    const currentStock = data.stock !== undefined ? data.stock : data.currentStock;
    const variantLabel = data.variantLabel || 'Default';
    console.warn(`🚨 [EventBus] [STOCK_LOW] Product ${productName} stock alert: ${currentStock} remaining`);

    // Find organization owner or general administrators to notify
    const managers = await User.find({
      role: { $in: ['admin', 'platform_admin', 'warehouse_manager'] }
    });

    for (const manager of managers) {
      // Create in-app alerts
      await Notification.create({
        recipient: manager._id,
        title: `Low Stock Alert`,
        message: `Product ${productName} (${variantLabel}) is running low on stock. Current level: ${currentStock}`,
        type: 'warning',
        link: '/admin/products'
      });

      // Send email alert
      if (manager.email) {
        await sendEmail({
          email: manager.email,
          subject: `🚨 Alert: Low Stock for Product ${productName}`,
          message: `Product ${productName} (${variantLabel}) stock dropped to ${currentStock}. Please restock.`
        });
      }
    }
  } catch (error) {
    console.error(`❌ [EventListeners Error] [STOCK_LOW] failed:`, error.message);
  }
});

console.log('✅ Enterprise Event Listeners module loaded.');
