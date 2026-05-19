const Ticket = require('../models/Ticket');
const { writeAuditLog } = require('../utils/auditLogger');

// Create Ticket (Customer)
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    const ticket = await Ticket.create({
      user: req.user.id,
      subject,
      description,
      category,
      priority,
      messages: [
        {
          sender: req.user.id,
          message: description
        }
      ]
    });

    await writeAuditLog({
      req,
      action: 'TICKET_CREATED',
      targetModel: 'Ticket',
      targetId: ticket._id,
      newState: { subject, category, priority }
    });

    res.status(201).json({
      success: true,
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Logged In User's Tickets
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Ticket Details (Customer & Admin authorized)
exports.getTicketDetails = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('messages.sender', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Verify ownership or check if staff/admin
    const isAdminOrStaff = ['admin', 'platform_admin', 'staff', 'warehouse_manager'].includes(req.user.role);
    if (ticket.user._id.toString() !== req.user.id && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this support ticket'
      });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add reply message to ticket thread
exports.addMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Verify ownership or check if staff/admin
    const isAdminOrStaff = ['admin', 'platform_admin', 'staff', 'warehouse_manager'].includes(req.user.role);
    if (ticket.user.toString() !== req.user.id && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to post a message in this support ticket'
      });
    }

    ticket.messages.push({
      sender: req.user.id,
      message
    });

    // If customer replies to a Resolved/Closed ticket, automatically reopen it
    if (!isAdminOrStaff && ['Resolved', 'Closed'].includes(ticket.status)) {
      ticket.status = 'Open';
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('user', 'name email role')
      .populate('messages.sender', 'name email role');

    res.status(200).json({
      success: true,
      ticket: populatedTicket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Ticket Status (Admin/Staff only)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    ticket.status = status;
    await ticket.save();

    await writeAuditLog({
      req,
      action: 'TICKET_STATUS_UPDATED',
      targetModel: 'Ticket',
      targetId: ticket._id,
      newState: { status }
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('user', 'name email role')
      .populate('messages.sender', 'name email role');

    res.status(200).json({
      success: true,
      ticket: populatedTicket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
