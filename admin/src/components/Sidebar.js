import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaBox, 
  FaShoppingCart, 
  FaUsers, 
  FaStar,
  FaTags,
  FaTicketAlt,
  FaHandshake,
  FaBullhorn,
  FaCog,
  FaAward,
  FaEnvelope,
  FaComments
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/products', icon: <FaBox />, label: 'Products' },
    { path: '/orders', icon: <FaShoppingCart />, label: 'Orders' },
    { path: '/users', icon: <FaUsers />, label: 'Users' },
    { path: '/reviews', icon: <FaStar />, label: 'Reviews' },
    { path: '/brands', icon: <FaTags />, label: 'Brands' },
    { path: '/coupons', icon: <FaTicketAlt />, label: 'Coupons' },
    { path: '/collaborations', icon: <FaHandshake />, label: 'Collaborations' },
    { path: '/advertisements', icon: <FaBullhorn />, label: 'Advertisements' },
    // ✅ NEW MENU ITEMS
    { path: '/testimonials', icon: <FaComments />, label: 'Testimonials' },
    { path: '/badges', icon: <FaAward />, label: 'Trust Badges' },
    { path: '/newsletter', icon: <FaEnvelope />, label: 'Newsletter' },
    { path: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>SBMI Admin</h2>
        <p>Amrit Rasoi</p>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              isActive ? 'nav-item active' : 'nav-item'
            }
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
