import React from 'react';
import { FaBars, FaSignOutAlt, FaUserCircle, FaStore } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ toggleSidebar, onLogout }) => {
  const sellerUser = JSON.parse(localStorage.getItem('sellerUser') || '{}');
  const shopName = localStorage.getItem('sellerShopName') || 'Store';

  return (
    <header className="seller-navbar">
      <div className="navbar-left">
        <button className="menu-toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <div className="navbar-store-badge">
          <FaStore />
          <span>{shopName}</span>
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="user-profile-widget">
          <FaUserCircle className="user-avatar" />
          <div className="user-info">
            <span className="user-name">{sellerUser.name || 'Seller'}</span>
            <span className="user-role-badge">Approved Seller</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
