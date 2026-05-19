import React, { useState, useEffect } from 'react';
import { getAllSubscribers, deleteSubscriber } from '../utils/api';
import { FaTrash, FaEnvelope, FaDownload } from 'react-icons/fa';
import './Newsletter.css';

const Newsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const { data } = await getAllSubscribers();
      if (data.success) {
        setSubscribers(data.subscribers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    try {
      await deleteSubscriber(id);
      alert('Subscriber deleted successfully!');
      fetchSubscribers();
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      alert('Failed to delete subscriber');
    }
  };

  const exportToCSV = () => {
    const filteredSubs = getFilteredSubscribers();
    const csvContent = [
      ['Email', 'Status', 'Subscribed At'],
      ...filteredSubs.map(sub => [
        sub.email,
        sub.isActive ? 'Active' : 'Inactive',
        new Date(sub.subscribedAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getFilteredSubscribers = () => {
    if (filter === 'active') {
      return subscribers.filter(sub => sub.isActive);
    } else if (filter === 'inactive') {
      return subscribers.filter(sub => !sub.isActive);
    }
    return subscribers;
  };

  const filteredSubscribers = getFilteredSubscribers();

  if (loading) {
    return <div className="loading">Loading subscribers...</div>;
  }

  return (
    <div className="newsletter-page">
      <div className="page-header">
        <h1>Newsletter Subscribers</h1>
        <button className="btn-primary" onClick={exportToCSV}>
          <FaDownload /> Export to CSV
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <FaEnvelope />
          </div>
          <div className="stat-info">
            <h3>Total Subscribers</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FaEnvelope />
          </div>
          <div className="stat-info">
            <h3>Active</h3>
            <p className="stat-number">{stats.active}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <FaEnvelope />
          </div>
          <div className="stat-info">
            <h3>Unsubscribed</h3>
            <p className="stat-number">{stats.inactive}</p>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({stats.active})
        </button>
        <button
          className={filter === 'inactive' ? 'active' : ''}
          onClick={() => setFilter('inactive')}
        >
          Unsubscribed ({stats.inactive})
        </button>
      </div>

      <div className="subscribers-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Subscribed At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                  No subscribers found
                </td>
              </tr>
            ) : (
              filteredSubscribers.map(subscriber => (
                <tr key={subscriber._id}>
                  <td className="email-cell">
                    <FaEnvelope className="email-icon" />
                    {subscriber.email}
                  </td>
                  <td>
                    <span className={`status-badge ${subscriber.isActive ? 'active' : 'inactive'}`}>
                      {subscriber.isActive ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td>
                    {new Date(subscriber.subscribedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(subscriber._id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Newsletter;
