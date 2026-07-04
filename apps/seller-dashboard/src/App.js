import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Orders from './pages/Orders';
import Earnings from './pages/Earnings';
import Profile from './pages/Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sellerStatus, setSellerStatus] = useState('none');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sellerToken');
    const status = localStorage.getItem('sellerStatus') || 'none';
    if (token) {
      setIsAuthenticated(true);
      setSellerStatus(status);
    }
    setLoading(false);
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setSellerStatus(user.sellerStatus || 'pending');
  };

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerUser');
    localStorage.removeItem('sellerShopName');
    localStorage.removeItem('sellerStatus');
    setIsAuthenticated(false);
    setSellerStatus('none');
  };

  if (loading) {
    return <div className="seller-loading">Booting merchant portal...</div>;
  }

  // Not authenticated: Auth pages only
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Authenticated but pending approval or review
  if (sellerStatus !== 'approved') {
    return (
      <Router>
        <Routes>
          <Route path="/pending-approval" element={<PendingApproval onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/pending-approval" replace />} />
        </Routes>
      </Router>
    );
  }

  // Approved seller portal routing
  return (
    <Router>
      <div className="seller-app-layout">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`seller-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Navbar 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            onLogout={handleLogout}
          />
          <div className="seller-page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/edit-product/:id" element={<EditProduct />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/earnings" element={<Earnings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
