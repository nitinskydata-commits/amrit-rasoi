import React, { useState, useEffect, useRef } from 'react';
import { getAllTickets, updateTicketStatus, replyToTicket } from '../utils/api';
import { toast } from 'react-toastify';
import { FaTicketAlt, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import './SupportTickets.css';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  
  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await getAllTickets();
      setTickets(data.tickets || []);
    } catch (error) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket]);

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const { data } = await updateTicketStatus(selectedTicket._id, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
      setSelectedTicket(data.ticket);
      setTickets(tickets.map(t => t._id === data.ticket._id ? data.ticket : t));
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    
    setSendingReply(true);
    try {
      const { data } = await replyToTicket(selectedTicket._id, replyMessage);
      toast.success('Reply sent successfully');
      setSelectedTicket(data.ticket);
      setReplyMessage('');
      setTickets(tickets.map(t => t._id === data.ticket._id ? data.ticket : t));
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = filterStatus === 'All' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const getStatusClass = (status) => {
    switch(status) {
      case 'Open': return 'status-open';
      case 'In Progress': return 'status-progress';
      case 'Resolved': return 'status-resolved';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="admin-tickets-container">
      <div className="tickets-header">
        <h1>Support Tickets Hub</h1>
        <div className="tickets-filters">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Tickets</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="tickets-workspace">
        {/* Sidebar List */}
        <div className="tickets-list-sidebar">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}><FaSpinner className="spinner" /> Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No tickets found.</div>
          ) : (
            <div className="tickets-list">
              {filteredTickets.map(ticket => (
                <div 
                  key={ticket._id} 
                  className={`admin-ticket-card ${selectedTicket?._id === ticket._id ? 'active' : ''}`}
                  onClick={() => handleSelectTicket(ticket)}
                >
                  <div className="ticket-card-header">
                    <span className={`status-badge ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                    <span className="ticket-date">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="ticket-card-title">{ticket.subject}</h3>
                  <div className="ticket-card-meta">
                    <span>{ticket.user?.name || 'Unknown User'}</span>
                    <span className={getPriorityClass(ticket.priority)}>{ticket.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div className="ticket-conversation-panel">
          {selectedTicket ? (
            <>
              <div className="conversation-header">
                <div className="header-top">
                  <h2>{selectedTicket.subject}</h2>
                  <div className="ticket-actions">
                    <select 
                      value={selectedTicket.status} 
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="header-details">
                  <span><strong>Customer:</strong> {selectedTicket.user?.name} ({selectedTicket.user?.email})</span>
                  <span><strong>Category:</strong> {selectedTicket.category}</span>
                  {selectedTicket.orderId && (
                    <span><strong>Order Ref:</strong> {selectedTicket.orderId._id}</span>
                  )}
                </div>
              </div>

              <div className="messages-container">
                {selectedTicket.messages.map((msg, idx) => {
                  const isAdmin = ['admin', 'platform_admin', 'staff'].includes(msg.sender?.role);
                  return (
                    <div key={idx} className={`message-bubble-wrapper ${isAdmin ? 'admin' : 'customer'}`}>
                      <div className="message-sender">
                        {msg.sender?.name || 'User'} 
                        {isAdmin && <span className="badge">Agent</span>}
                      </div>
                      <div className="message-content">{msg.message}</div>
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="reply-box">
                <form onSubmit={handleSendReply}>
                  <textarea
                    placeholder="Type your reply to the customer..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                  ></textarea>
                  <button type="submit" disabled={sendingReply} className="btn-send">
                    {sendingReply ? <FaSpinner className="spinner" /> : <FaPaperPlane />} Reply
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="conversation-placeholder">
              <FaTicketAlt />
              <h3>No Ticket Selected</h3>
              <p>Select a ticket from the sidebar to view details and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
