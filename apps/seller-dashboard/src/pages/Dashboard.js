import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../utils/api';
import { FaDollarSign, FaBox, FaShoppingBag, FaExclamationCircle, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="seller-loading">Gathering store metrics...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-section">
        <div>
          <h1>Store Overview</h1>
          <p>Real-time analytics for your store's sales, inventory, and settlements.</p>
        </div>
        <div className="quick-actions">
          <Link to="/add-product" className="btn btn-primary">Add New Product</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon revenue"><FaDollarSign /></div>
          <div className="stat-info">
            <span>Gross Sales</span>
            <h2>${stats?.totalRevenue?.toFixed(2) || '0.00'}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon net-earnings"><FaDollarSign /></div>
          <div className="stat-info">
            <span>Net Earnings</span>
            <h2>${stats?.netEarnings?.toFixed(2) || '0.00'}</h2>
            <small className="net-sub text-success">Settlement pending delivery</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders"><FaShoppingBag /></div>
          <div className="stat-info">
            <span>Store Orders</span>
            <h2>{stats?.totalOrders || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products"><FaBox /></div>
          <div className="stat-info">
            <span>Active Products</span>
            <h2>{stats?.activeProducts || 0}</h2>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="main-dashboard-grid">
        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Store Orders</h3>
            <Link to="/orders" className="view-all-link">View All <FaArrowRight /></Link>
          </div>
          <div className="card-body">
            {stats?.recentOrders?.length > 0 ? (
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items Count</th>
                      <th>Total Payout</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(order => (
                      <tr key={order._id}>
                        <td><small>{order._id.substring(0, 10)}...</small></td>
                        <td>{order.customerName}</td>
                        <td>{order.vendorItemsCount}</td>
                        <td><strong>${order.vendorTotal.toFixed(2)}</strong></td>
                        <td>
                          <span className={`dash-badge badge-${order.orderStatus.toLowerCase()}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No orders processed yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Low Stock Alerts</h3>
            <Link to="/products" className="view-all-link">Manage Stock <FaArrowRight /></Link>
          </div>
          <div className="card-body">
            {stats?.lowStockProducts?.length > 0 ? (
              <div className="alert-list">
                {stats.lowStockProducts.map(product => (
                  <div key={product._id} className="alert-item">
                    <FaExclamationCircle className="alert-icon" />
                    <div className="alert-details">
                      <strong>{product.name}</strong>
                      <span>Only {product.stock} units remaining in inventory</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="stock-ok-box">
                <p>✓ All product stocks are healthy.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
