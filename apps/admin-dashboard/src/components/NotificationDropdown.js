import React, { useState, useEffect, useRef } from 'react';
import { 
  getMyNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from '../utils/api';
import { 
  FaBell, 
  FaShieldAlt, 
  FaBoxes, 
  FaMoneyBillWave, 
  FaInfoCircle, 
  FaTrashAlt,
  FaCheckDouble
} from 'react-icons/fa';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Close on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getMyNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await markNotificationRead(id);
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, unread: false, read: true } : n));
      }
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead();
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false, read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await deleteNotification(id);
      if (res.data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'security':
      case 'SECURITY':
        return <FaShieldAlt className="notif-icon security" />;
      case 'stock':
      case 'inventory':
      case 'STOCK':
        return <FaBoxes className="notif-icon stock" />;
      case 'payout':
      case 'finance':
      case 'PAYOUT':
        return <FaMoneyBillWave className="notif-icon payout" />;
      default:
        return <FaInfoCircle className="notif-icon system" />;
    }
  };

  const unreadCount = notifications.filter(n => n.unread || !n.read).length;

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      <button 
        className="notification-trigger-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="bell-badge-count">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown-box">
          <div className="dropdown-header">
            <div>
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-banner">{unreadCount} unread</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="btn-action-link" onClick={handleMarkAllRead}>
                <FaCheckDouble style={{ marginRight: '4px' }} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-list-body">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const isUnread = notif.unread || !notif.read;
                const notifType = notif.type?.toLowerCase() || 'system';
                return (
                  <div 
                    key={notif._id} 
                    className={`notification-card-item ${notifType} ${isUnread ? 'unread' : ''}`}
                    onClick={(e) => isUnread && handleMarkAsRead(e, notif._id)}
                  >
                    <div className="notif-inner">
                      {getNotificationIcon(notif.type)}
                      <div className="notif-content-area">
                        <p>{notif.message}</p>
                        <span className="notif-time-stamp">
                          {new Date(notif.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="notif-actions">
                      {isUnread && (
                        <button 
                          className="action-dot-btn" 
                          title="Mark read"
                          onClick={(e) => handleMarkAsRead(e, notif._id)}
                        />
                      )}
                      <button 
                        className="action-trash-btn" 
                        title="Delete notification"
                        onClick={(e) => handleDelete(e, notif._id)}
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-inbox">
                <FaBell className="bell-hollow-icon" />
                <p>No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;