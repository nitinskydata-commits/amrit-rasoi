import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaUserCircle, FaSignOutAlt, FaBell } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ toggleSidebar, onLogout }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const userDropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Real notifications (empty for now - will be fetched from API later)
  const notifications = [];

  return (
    <div className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <h1 className="navbar-title">Admin Dashboard</h1>
      </div>
      
      <div className="navbar-right">
        {/* Notifications */}
        <div className="notification-menu" ref={notificationRef}>
          <button 
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell />
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="badge badge-success">
                    {notifications.filter(n => n.unread).length} new
                  </span>
                )}
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${notif.unread ? 'unread' : ''}`}
                    >
                      <p>{notif.message}</p>
                      <span className="notification-time">{notif.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    <p>No new notifications</p>
                  </div>
                )}
              </div>
              <div className="notification-footer">
                <button onClick={() => setShowNotifications(false)}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* User Menu */}
        <div className="user-menu" ref={userDropdownRef}>
          <button 
            className="user-btn"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <FaUserCircle />
            <span>Admin</span>
          </button>
          
          {showUserDropdown && (
            <div className="dropdown">
              <button onClick={onLogout} className="dropdown-item">
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
