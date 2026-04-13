import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../utils/api';
import { 
  FaBox, 
  FaShoppingCart, 
  FaUsers, 
  FaRupeeSign,
  FaChartLine,
  FaExclamationTriangle
} from 'react-icons/fa';
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
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: <FaBox />,
      color: '#4CAF50'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: <FaShoppingCart />,
      color: '#2196F3'
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <FaUsers />,
      color: '#FF9800'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: <FaRupeeSign />,
      color: '#9C27B0'
    }
  ];

  const todayStats = [
    {
      title: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: <FaChartLine />,
      color: '#00BCD4'
    },
    {
      title: "Today's Revenue",
      value: `₹${stats?.todayRevenue?.toLocaleString() || 0}`,
      icon: <FaRupeeSign />,
      color: '#4CAF50'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Main Stats */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-info">
              <p>{stat.title}</p>
              <h3>{stat.value}</h3>
            </div>
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Today's Stats */}
      <div className="stats-grid">
        {todayStats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-info">
              <p>{stat.title}</p>
              <h3>{stat.value}</h3>
            </div>
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders */}
        <div className="card">
          <h2 className="card-title">Recent Orders</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-6)}</td>
                    <td>{order.user?.name}</td>
                    <td>₹{order.totalPrice}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <h2 className="card-title">
            <FaExclamationTriangle style={{ color: '#FF9800', marginRight: '8px' }} />
            Low Stock Alert
          </h2>
          <div className="low-stock-list">
            {stats?.lowStockProducts?.length > 0 ? (
              stats.lowStockProducts.map((product) => (
                <div key={product._id} className="low-stock-item">
                  <span className="product-name">{product.name}</span>
                  <span className="stock-badge">{product.stock} left</span>
                </div>
              ))
            ) : (
              <p className="no-data">All products are well stocked!</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      {stats?.ordersByStatus && (
        <div className="card">
          <h2 className="card-title">Orders by Status</h2>
          <div className="status-grid">
            {stats.ordersByStatus.map((item) => (
              <div key={item._id} className="status-card">
                <h4>{item._id}</h4>
                <p className="status-count">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    'Processing': 'warning',
    'Confirmed': 'info',
    'Shipped': 'info',
    'Delivered': 'success',
    'Cancelled': 'danger'
  };
  return colors[status] || 'info';
};

export default Dashboard;
