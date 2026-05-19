import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  FaComments,
  FaWarehouse,
  FaFileInvoiceDollar,
  FaHandHoldingUsd,
  FaShieldAlt,
  FaUserShield,
  FaBoxes,
  FaUserTie,
  FaUserCog,
  FaUsersCog,
  FaChevronRight,
  FaChartLine
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/users')) {
      setUserMenuOpen(true);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/analytics', icon: <FaChartLine />, label: 'Analytics & Reports' },
    { path: '/products', icon: <FaBox />, label: 'Products' },
    { path: '/inventory', icon: <FaBoxes />, label: 'Inventory' },
    { path: '/orders', icon: <FaShoppingCart />, label: 'Orders' },
    
    // Collapsible User Management Submenu
    {
      label: 'User Management',
      icon: <FaUsers />,
      isSubmenu: true,
      subItems: [
        { path: '/users?group=customers', icon: <FaUsers />, label: 'Customers' },
        { path: '/users?group=board_members', icon: <FaUserTie />, label: 'Board Members' },
        { path: '/users?group=hr_management', icon: <FaUserShield />, label: 'HR Management' },
        { path: '/users?group=managers', icon: <FaUserCog />, label: 'All Managers' },
        { path: '/users?group=staff', icon: <FaUsersCog />, label: 'Staff' },
        { path: '/users?group=partners', icon: <FaHandshake />, label: 'Partners & Collaborators' },
        { path: '/users?group=admins', icon: <FaShieldAlt />, label: 'Administrators' },
      ]
    },
    
    { path: '/reviews', icon: <FaStar />, label: 'Reviews' },
    { path: '/brands', icon: <FaTags />, label: 'Brands' },
    { path: '/coupons', icon: <FaTicketAlt />, label: 'Coupons' },
    { path: '/collaborations', icon: <FaHandshake />, label: 'Collaborations' },
    { path: '/advertisements', icon: <FaBullhorn />, label: 'Advertisements' },
    
    // ENTERPRISE ITEMS
    { path: '/warehouses', icon: <FaWarehouse />, label: 'Warehouse Hub' },
    { path: '/finance', icon: <FaFileInvoiceDollar />, label: 'Finance & Ledger' },
    { path: '/payouts', icon: <FaHandHoldingUsd />, label: 'Vendor Payouts' },
    { path: '/kyc', icon: <FaUserShield />, label: 'KYC Verification' },
    { path: '/audit-logs', icon: <FaShieldAlt />, label: 'Audit Compliance' },
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
        {menuItems.map((item) => {
          if (item.isSubmenu) {
            const currentPath = location.pathname + location.search;
            const hasActiveSubItem = item.subItems.some(sub => 
              currentPath === sub.path || (sub.path === '/users?group=customers' && currentPath === '/users')
            );
            
            return (
              <div key={item.label} className="submenu-container">
                <div 
                  className={`nav-item submenu-trigger ${hasActiveSubItem ? 'active' : ''}`}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  <FaChevronRight 
                    style={{ 
                      fontSize: '11px',
                      transition: 'transform 0.2s ease', 
                      transform: userMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' 
                    }} 
                  />
                </div>
                
                {userMenuOpen && (
                  <div className="submenu-items" style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.15)', 
                    display: 'flex', 
                    flexDirection: 'column' 
                  }}>
                    {item.subItems.map((sub) => {
                      const currentPath = location.pathname + location.search;
                      const isSubActive = currentPath === sub.path || (sub.path === '/users?group=customers' && currentPath === '/users');
                      
                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={isSubActive ? 'nav-item active' : 'nav-item'}
                          style={{ 
                            padding: '10px 20px 10px 35px', 
                            fontSize: '13px' 
                          }}
                        >
                          <span className="nav-icon" style={{ fontSize: '14px', marginRight: '10px' }}>{sub.icon}</span>
                          <span className="nav-label">{sub.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const currentPath = location.pathname + location.search;
          const isActive = currentPath === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
