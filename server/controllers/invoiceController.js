const Order = require('../models/Order');
const Organization = require('../models/Organization');

// Get HTML Invoice for an Order
// Route: GET /api/v1/order/:id/invoice
exports.getOrderInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('organization');

    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }

    // Authorize: Only the placing customer or admins/staff can view this invoice
    const isAdmin = ['admin', 'platform_admin', 'staff', 'order_manager', 'warehouse_manager'].includes(req.user.role);
    if (order.user._id.toString() !== req.user.id && !isAdmin) {
      return res.status(403).send('<h1>Not authorized to view this invoice</h1>');
    }

    // Determine supplier details
    let supplierName = 'SBMI Headquarters';
    let supplierAddress = 'Industrial Area, Phase II, Jaipur, Rajasthan - 302001';
    let supplierPhone = '+91 98765 43210';
    let supplierEmail = 'billing@sbmi.org';

    if (order.organization) {
      supplierName = order.organization.name;
      const addr = order.organization.address || {};
      supplierAddress = `${addr.line1 || ''}, ${addr.line2 || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`;
      supplierPhone = order.organization.contactPhone || supplierPhone;
      supplierEmail = order.organization.contactEmail || supplierEmail;
    }

    // Formulate items table rows
    let itemsHtml = '';
    order.orderItems.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      const gstRate = item.gstRate || 18;
      const taxableVal = itemTotal / (1 + (gstRate / 100));
      const totalGst = itemTotal - taxableVal;
      
      let cgstVal = 0, sgstVal = 0, igstVal = 0;
      if (item.igst > 0) {
        igstVal = totalGst;
      } else {
        cgstVal = totalGst / 2;
        sgstVal = totalGst / 2;
      }

      itemsHtml += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>
            <strong>${item.name}</strong>
            ${item.variantLabel ? `<br/><small style="color: #666;">${item.variantLabel}</small>` : ''}
            ${item.warehouseCode ? `<br/><small style="color: #888; font-size: 11px;">Ship from: ${item.warehouseCode}</small>` : ''}
          </td>
          <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: center;">${gstRate}%</td>
          <td style="text-align: right;">₹${taxableVal.toFixed(2)}</td>
          <td style="text-align: right;">
            ${igstVal > 0 ? `IGST: ₹${igstVal.toFixed(2)}` : `CGST: ₹${cgstVal.toFixed(2)}<br/>SGST: ₹${sgstVal.toFixed(2)}`}
          </td>
          <td style="text-align: right; font-weight: bold;">₹${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });

    // Render beautiful print-friendly invoice
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${order.invoiceNumber || 'Order'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #333;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
      font-size: 14px;
      background-color: #fff;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #ddd;
      padding: 30px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border-radius: 8px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .header-table td {
      vertical-align: top;
    }
    .logo-container {
      font-size: 26px;
      font-weight: bold;
      color: #4CAF50;
      letter-spacing: 0.5px;
    }
    .company-sub {
      font-size: 12px;
      color: #777;
      text-transform: uppercase;
      font-weight: 600;
    }
    .invoice-title {
      font-size: 22px;
      font-weight: bold;
      text-align: right;
      color: #1a1a2e;
      text-transform: uppercase;
    }
    .invoice-meta {
      text-align: right;
      font-size: 12px;
      color: #555;
      margin-top: 5px;
    }
    .address-section {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    .address-section td {
      width: 50%;
      vertical-align: top;
      padding: 10px;
      background: #fdfdfd;
      border: 1px solid #f0f0f0;
    }
    .address-section h4 {
      margin: 0 0 8px 0;
      color: #4CAF50;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.8px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background-color: #1a1a2e;
      color: #fff;
      padding: 12px 10px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      border: 1px solid #1a1a2e;
    }
    .items-table td {
      padding: 12px 10px;
      border: 1px solid #eee;
      vertical-align: middle;
    }
    .items-table tr:nth-child(even) {
      background-color: #fafafa;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .summary-table td {
      padding: 8px 10px;
      font-size: 13px;
    }
    .summary-table .label {
      text-align: right;
      color: #555;
    }
    .summary-table .value {
      text-align: right;
      width: 120px;
      font-weight: 500;
    }
    .summary-table .total-row td {
      border-top: 2px solid #1a1a2e;
      border-bottom: 2px solid #1a1a2e;
      font-size: 16px;
      font-weight: bold;
      color: #1a1a2e;
      padding: 12px 10px;
    }
    .footer-note {
      text-align: center;
      margin-top: 40px;
      font-size: 12px;
      color: #888;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }
    .print-button-container {
      max-width: 800px;
      margin: 0 auto 15px auto;
      text-align: right;
    }
    .btn-print {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: background-color 0.2s;
    }
    .btn-print:hover {
      background-color: #43a047;
    }
    @media print {
      body {
        padding: 0;
        background-color: #fff;
      }
      .invoice-container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .print-button-container {
        display: none;
      }
    }
  </style>
</head>
<body>

  <div class="print-button-container">
    <button class="btn-print" onclick="window.print()">Print Invoice</button>
  </div>

  <div class="invoice-container">
    <table class="header-table">
      <tr>
        <td>
          <div class="logo-container">Amrit Rasoi</div>
          <div class="company-sub">A Brand of Shree Bhanwal Mata Industries (SBMI)</div>
        </td>
        <td>
          <div class="invoice-title">Tax Invoice</div>
          <div class="invoice-meta">
            <strong>Invoice No:</strong> ${order.invoiceNumber || 'N/A'}<br/>
            <strong>Invoice Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
            <strong>Order ID:</strong> #${order._id.toString().toUpperCase()}<br/>
            <strong>Payment Status:</strong> ${order.paymentStatus} (${order.paymentMethod})
          </div>
        </td>
      </tr>
    </table>

    <table class="address-section">
      <tr>
        <td>
          <h4>Supplier (Seller)</h4>
          <strong>${supplierName}</strong><br/>
          ${supplierAddress}<br/>
          Phone: ${supplierPhone}<br/>
          Email: ${supplierEmail}
        </td>
        <td>
          <h4>Customer (Bill To / Ship To)</h4>
          <strong>${order.shippingAddress.name}</strong><br/>
          ${order.shippingAddress.address}<br/>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
          Phone: ${order.shippingAddress.phone}<br/>
          Email: ${order.user.email}
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 40%; text-align: left;">Item Description</th>
          <th style="width: 12%; text-align: right;">Unit Price</th>
          <th style="width: 8%; text-align: center;">Qty</th>
          <th style="width: 8%; text-align: center;">GST</th>
          <th style="width: 12%; text-align: right;">Taxable Val</th>
          <th style="width: 15%; text-align: right;">Tax Amount</th>
          <th style="width: 15%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table class="summary-table">
      <tr>
        <td colspan="5"></td>
        <td class="label">Taxable Subtotal:</td>
        <td class="value">₹${order.gstBreakdown?.taxableAmount?.toFixed(2) || (order.itemsPrice - order.taxPrice).toFixed(2)}</td>
      </tr>
      ${order.gstBreakdown?.cgst > 0 ? `
        <tr>
          <td colspan="5"></td>
          <td class="label">CGST (9%):</td>
          <td class="value">₹${order.gstBreakdown.cgst.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="5"></td>
          <td class="label">SGST (9%):</td>
          <td class="value">₹${order.gstBreakdown.sgst.toFixed(2)}</td>
        </tr>
      ` : ''}
      ${order.gstBreakdown?.igst > 0 ? `
        <tr>
          <td colspan="5"></td>
          <td class="label">IGST (18%):</td>
          <td class="value">₹${order.gstBreakdown.igst.toFixed(2)}</td>
        </tr>
      ` : ''}
      <tr>
        <td colspan="5"></td>
        <td class="label">Shipping & Handling:</td>
        <td class="value">${order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice.toFixed(2)}`}</td>
      </tr>
      ${order.codFee > 0 ? `
        <tr>
          <td colspan="5"></td>
          <td class="label">COD Convenience Fee:</td>
          <td class="value">₹${order.codFee.toFixed(2)}</td>
        </tr>
      ` : ''}
      <tr class="total-row">
        <td colspan="5"></td>
        <td class="label">Grand Total:</td>
        <td class="value">₹${order.totalPrice.toFixed(2)}</td>
      </tr>
    </table>

    <div class="footer-note">
      Thank you for shopping with Amrit Rasoi!<br/>
      For returns or policy queries, please refer to our return policy or contact customer support.<br/>
      <strong>Shree Bhanwal Mata Industries (SBMI)</strong>
    </div>
  </div>

</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    return res.status(500).send(`<h1>Error generating invoice</h1><p>${error.message}</p>`);
  }
};
