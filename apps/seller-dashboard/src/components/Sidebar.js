import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaBox, 
  FaShoppingCart, 
  FaHandHoldingUsd, 
  FaUser, 
  FaStore 
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const shopName = localStorage.getItem('sellerShopName') || 'My Seller Store';

  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/products', icon: <FaBox />, label: 'Products' },
    { path: '/orders', icon: <FaShoppingCart />, label: 'Orders' },
    { path: '/earnings', icon: <FaHandHoldingUsd />, label: 'Earnings & Payouts' },
    { path: '/profile', icon: <FaUser />, label: 'Shop Profile' }
  ];

  return (
    <div className={`seller-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="header-logo">
          <FaStore />
          <h2>SBMI Seller</h2>
        </div>
        <p className="shop-title-sub">{shopName}</p>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
