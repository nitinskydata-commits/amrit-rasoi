import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTicketAlt, FaPaperPlane, FaPlus, FaClock, FaCheckCircle, FaInbox, FaSpinner } from 'react-icons/fa';
import './SupportTickets.css';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Order Issue',
    priority: 'Medium',
    description: ''
  });
  const [creatingTicket, setCreatingTicket] = useState(false);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(data.tickets || []);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTicket(data.ticket);
    } catch (error) {
      toast.error('Failed to load ticket details');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreatingTicket(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_BASE_URL}/tickets`, newTicket, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Support ticket created successfully!');
      setTickets([data.ticket, ...tickets]);
      setSelectedTicket(data.ticket);
      setShowCreateModal(false);
      setNewTicket({
        subject: '',
        category: 'Order Issue',
        priority: 'Medium',
        description: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${API_BASE_URL}/tickets/${selectedTicket._id}`,
        { message: replyMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTicket(data.ticket);
      setReplyMessage('');
      // Update in ticket list
      setTickets(tickets.map(t => t._id === data.ticket._id ? data.ticket : t));
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open': return 'badge-open';
      case 'In Progress': return 'badge-progress';
      case 'Resolved': return 'badge-resolved';
      case 'Closed': return 'badge-closed';
      default: return '';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="support-tickets-container">
      <div className="support-header">
        <div>
          <h1>Customer Support Portal</h1>
          <p>Get assistance with your orders, payments, and account inquiries</p>
        </div>
        <motion.button 
          className="btn btn-primary create-btn"
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlus /> New Ticket
        </motion.button>
      </div>

      <div className="support-workspace">
        {/* Left Column: Tickets List */}
        <div className="tickets-sidebar">
          <h2>Your Support Tickets</h2>
          {loading ? (
            <div className="sidebar-loading">
              <FaSpinner className="spinner" />
              <p>Loading your tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="sidebar-empty">
              <FaInbox />
              <p>No tickets raised yet.</p>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map(ticket => (
                <div 
                  key={ticket._id} 
                  className={`ticket-item-card ${selectedTicket?._id === ticket._id ? 'active' : ''}`}
                  onClick={() => fetchTicketDetails(ticket._id)}
                >
                  <div className="ticket-item-header">
                    <span className="category-tag">{ticket.category}</span>
                    <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>{ticket.status}</span>
                  </div>
                  <h3>{ticket.subject}</h3>
                  <div className="ticket-item-meta">
                    <span className={`priority-tag ${getPriorityBadgeClass(ticket.priority)}`}>{ticket.priority}</span>
                    <span className="date-tag">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="ticket-conversation">
          {selectedTicket ? (
            <div className="conversation-box">
              <div className="conversation-header">
                <div className="conversation-title-row">
                  <h2>{selectedTicket.subject}</h2>
                  <span className={`status-badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="conversation-meta-row">
                  <span><strong>Category:</strong> {selectedTicket.category}</span>
                  <span><strong>Priority:</strong> <span className={`priority-tag ${getPriorityBadgeClass(selectedTicket.priority)}`}>{selectedTicket.priority}</span></span>
                  <span><strong>Opened:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="conversation-messages">
                {selectedTicket.messages?.map((msg, index) => {
                  const isStaff = ['admin', 'platform_admin', 'staff'].includes(msg.sender?.role);
                  return (
                    <div key={msg._id || index} className={`message-bubble-wrapper ${isStaff ? 'agent' : 'customer'}`}>
                      <div className="message-sender-info">
                        <strong>{msg.sender?.name || 'User'}</strong> 
                        <span className="sender-role-badge">{isStaff ? 'Support Staff' : 'You'}</span>
                      </div>
                      <div className="message-bubble">
                        <p>{msg.message}</p>
                        <span className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTicket.status !== 'Closed' ? (
                <form className="conversation-reply-form" onSubmit={handleSendReply}>
                  <textarea
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                  ></textarea>
                  <button type="submit" disabled={sendingReply} className="btn btn-primary send-reply-btn">
                    {sendingReply ? <FaSpinner className="spinner" /> : <FaPaperPlane />} Send Reply
                  </button>
                </form>
              ) : (
                <div className="ticket-closed-notice">
                  <FaCheckCircle />
                  <p>This support ticket is marked as Closed. If you need further assistance, please create a new ticket.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="conversation-placeholder">
              <FaTicketAlt />
              <h3>No Ticket Selected</h3>
              <p>Select a support ticket from the sidebar or click "New Ticket" to launch a new request.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
            <motion.div 
              className="modal-content-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2>Create Support Ticket</h2>
              <form onSubmit={handleCreateTicket}>
                <div className="form-group">
                  <label>Subject / Issue Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order #12345 delayed delivery"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    >
                      <option value="Order Issue">Order Issue</option>
                      <option value="Payment">Payment</option>
                      <option value="Account">Account</option>
                      <option value="Product Query">Product Query</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Describe the details of your issue</label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Please provide order IDs, product details, or details of your query."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={creatingTicket} className="btn btn-primary">
                    {creatingTicket ? <FaSpinner className="spinner" /> : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTickets;
