import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = ({ toggleSidebar, onLogout }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <NotificationDropdown />
        
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
