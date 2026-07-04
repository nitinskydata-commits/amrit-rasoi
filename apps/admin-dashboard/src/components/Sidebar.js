import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt, FaBox, FaShoppingCart, FaUsers, FaStar, FaTags,
  FaTicketAlt, FaHandshake, FaBullhorn, FaCog, FaAward, FaEnvelope,
  FaComments, FaWarehouse, FaFileInvoiceDollar, FaHandHoldingUsd,
  FaShieldAlt, FaBoxes, FaUserTie, FaUserCog, FaUsersCog,
  FaChevronDown, FaChartLine, FaFileCsv, FaStore, FaBuilding, FaIdCard
} from 'react-icons/fa';
import './Sidebar.css';

const GROUP_SECTIONS = [
  {
    groupLabel: 'CORE',
    items: [
      { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
      { path: '/analytics', icon: <FaChartLine />, label: 'Analytics & Reports' },
    ]
  },
  {
    groupLabel: 'CATALOGUE',
    items: [
      { path: '/products', icon: <FaBox />, label: 'Products' },
      { path: '/inventory', icon: <FaBoxes />, label: 'Inventory' },
      { path: '/brands', icon: <FaTags />, label: 'Brands' },
    ]
  },
  {
    groupLabel: 'SALES',
    items: [
      { path: '/orders', icon: <FaShoppingCart />, label: 'Orders' },
      { path: '/coupons', icon: <FaTicketAlt />, label: 'Coupons' },
    ]
  },
  {
    groupLabel: 'MARKETPLACE',
    items: [
      { path: '/sellers', icon: <FaStore />, label: 'Seller Accounts' },
      { path: '/kyc', icon: <FaIdCard />, label: 'KYC Verification' },
      { path: '/payouts', icon: <FaHandHoldingUsd />, label: 'Vendor Payouts' },
    ]
  },
  {
    groupLabel: 'CUSTOMERS',
    isSubmenu: true,
    icon: <FaUsers />,
    label: 'User Management',
    subItems: [
      { path: '/users', icon: <FaUsers />, label: 'All Customers' },
      { path: '/users?group=wholesale', icon: <FaBuilding />, label: 'B2B Wholesalers' },
      { path: '/users?group=board_members', icon: <FaUserTie />, label: 'Board Members' },
      { path: '/users?group=managers', icon: <FaUserCog />, label: 'All Managers' },
      { path: '/users?group=staff', icon: <FaUsersCog />, label: 'Staff' },
      { path: '/users?group=admins', icon: <FaShieldAlt />, label: 'Administrators' },
    ],
    extraItems: [
      { path: '/reviews', icon: <FaStar />, label: 'Reviews' },
      { path: '/tickets', icon: <FaTicketAlt />, label: 'Support Tickets' },
    ]
  },
  {
    groupLabel: 'MARKETING',
    items: [
      { path: '/advertisements', icon: <FaBullhorn />, label: 'Advertisements' },
      { path: '/collaborations', icon: <FaHandshake />, label: 'Collaborations' },
      { path: '/testimonials', icon: <FaComments />, label: 'Testimonials' },
      { path: '/badges', icon: <FaAward />, label: 'Trust Badges' },
      { path: '/newsletter', icon: <FaEnvelope />, label: 'Newsletter' },
    ]
  },
  {
    groupLabel: 'FINANCE & OPS',
    items: [
      { path: '/finance', icon: <FaFileInvoiceDollar />, label: 'Finance & Ledger' },
      { path: '/warehouses', icon: <FaWarehouse />, label: 'Warehouse Hub' },
      { path: '/staff', icon: <FaUsersCog />, label: 'Staff Management' },
      { path: '/audit-logs', icon: <FaShieldAlt />, label: 'Audit Compliance' },
    ]
  },
  {
    groupLabel: 'SYSTEM',
    items: [
      { path: '/export', icon: <FaFileCsv />, label: 'Data Export' },
      { path: '/settings', icon: <FaCog />, label: 'Settings' },
    ]
  },
];

const NavItem = ({ item }) => {
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const isActive = currentPath === item.path || location.pathname === item.path.split('?')[0];

  return (
    <NavLink
      to={item.path}
      className={`nav-item ${isActive ? 'active' : ''}`}
    >
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
    </NavLink>
  );
};

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({ CUSTOMERS: false });

  // Auto-expand group if current path is a sub-item
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (currentPath.startsWith('/users') || currentPath === '/reviews' || currentPath === '/tickets') {
      setOpenGroups(prev => ({ ...prev, CUSTOMERS: true }));
    }
  }, [location]);

  const toggleGroup = (groupLabel) => {
    setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>SBMI Admin</h2>
        <p>Platform Control</p>
      </div>

      <nav className="sidebar-nav">
        {GROUP_SECTIONS.map((section) => {
          if (section.isSubmenu) {
            const isOpen = openGroups[section.groupLabel] || false;
            const currentPath = location.pathname + location.search;
            const allSubItems = [...(section.subItems || []), ...(section.extraItems || [])];
            const isAnySubActive = allSubItems.some(sub =>
              currentPath === sub.path || location.pathname === sub.path.split('?')[0]
            );

            return (
              <div key={section.groupLabel} className="nav-group">
                <div className="nav-group-label">{section.groupLabel}</div>

                {/* Collapsible "User Management" trigger */}
                <div
                  className={`nav-item submenu-trigger ${isAnySubActive ? 'active' : ''}`}
                  onClick={() => toggleGroup(section.groupLabel)}
                  style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="nav-icon">{section.icon}</span>
                    <span className="nav-label">{section.label}</span>
                  </div>
                  <FaChevronDown
                    style={{
                      fontSize: '11px',
                      transition: 'transform 0.25s ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  />
                </div>

                {isOpen && (
                  <div className="submenu-items">
                    {(section.subItems || []).map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={`nav-item ${(location.pathname + location.search) === sub.path || location.pathname === sub.path.split('?')[0] ? 'active' : ''}`}
                        style={{ paddingLeft: '36px', fontSize: '13px' }}
                      >
                        <span className="nav-icon" style={{ fontSize: '13px' }}>{sub.icon}</span>
                        <span className="nav-label">{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}

                {/* Extra standalone items in this section (Reviews, Tickets) */}
                {(section.extraItems || []).map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            );
          }

          // Regular flat group section
          return (
            <div key={section.groupLabel} className="nav-group">
              <div className="nav-group-label">{section.groupLabel}</div>
              {section.items.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
