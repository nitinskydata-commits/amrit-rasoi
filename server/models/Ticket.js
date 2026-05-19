const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please enter a ticket subject'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please enter ticket description/details']
  },
  category: {
    type: String,
    required: true,
    enum: ['Order Issue', 'Payment', 'Account', 'Product Query', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    required: true,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  messages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      message: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
