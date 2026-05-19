import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/Products/AddProduct';
import EditProduct from './pages/Products/EditProduct';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Reviews from './pages/Reviews';
import Brands from './pages/Brands';
import Coupons from './pages/Coupons';
import Collaborations from './pages/Collaborations';
import Advertisements from './pages/Advertisements';
import Settings from './pages/Settings';
import Testimonials from './pages/Testimonials';
import Badges from './pages/Badges';
import Newsletter from './pages/Newsletter';

// Enterprise Pages
import Warehouses from './pages/Warehouses';
import Finance from './pages/Finance';
import VendorPayouts from './pages/VendorPayouts';
import AuditLogs from './pages/AuditLogs';
import StaffManagement from './pages/StaffManagement';
import Inventory from './pages/Inventory';
import KYC from './pages/KYC';
import Analytics from './pages/Analytics';
import ExportCenter from './pages/ExportCenter';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Navbar 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            onLogout={handleLogout}
          />
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/products" element={<Products />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/edit-product/:id" element={<EditProduct />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/collaborations" element={<Collaborations />} />
              <Route path="/advertisements" element={<Advertisements />} />
              <Route path="/settings" element={<Settings />} />
              {/* ✅ NEW ROUTES */}
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/newsletter" element={<Newsletter />} />
              
              {/* ✅ ENTERPRISE ROUTES */}
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/payouts" element={<VendorPayouts />} />
              <Route path="/kyc" element={<KYC />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/export" element={<ExportCenter />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
