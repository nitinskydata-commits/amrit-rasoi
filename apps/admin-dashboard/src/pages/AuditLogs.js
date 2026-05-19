import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../utils/api';
import { FaShieldAlt, FaSearch, FaFilter, FaHistory, FaTv, FaUserShield, FaCalendarAlt } from 'react-icons/fa';
import './AuditLogs.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [filterAction, filterRole]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await getAuditLogs({
        action: filterAction,
        role: filterRole,
        search: searchTerm
      });
      if (response.data.success) {
        setLogs(response.data.logs);
      }
    } catch (error) {
      console.error('Error fetching system audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('CREATE') || action.includes('PLACED')) return 'badge-create';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'badge-update';
    if (action.includes('DELETE') || action.includes('REVOKE')) return 'badge-delete';
    return 'badge-system';
  };

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <div>
          <h1>🛡️ Enterprise Audit & Compliance Vault</h1>
          <p>Real-time system observability, action-tracking, and security audit logs.</p>
        </div>
      </div>

      {/* DYNAMIC FILTERING & OBSERVABILITY TOOLBAR */}
      <div className="card toolbar-card">
        <form onSubmit={handleSearchSubmit} className="toolbar-flex">
          <div className="search-box">
            <FaSearch className="icon" />
            <input 
              type="text" 
              placeholder="Search by Operator, Action, Target..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-search">Query</button>
          </div>

          <div className="filters-group">
            <div className="filter-select">
              <FaFilter className="icon" />
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                <option value="">-- All Actions --</option>
                <option value="PRODUCT_CREATED">Product Created</option>
                <option value="PRODUCT_UPDATED">Product Updated</option>
                <option value="ORDER_PLACED">Order Placed</option>
                <option value="REFUND_APPROVED">Refund Approved</option>
                <option value="SECURITY_ALERT">Security Alert</option>
              </select>
            </div>

            <div className="filter-select">
              <FaUserShield className="icon" />
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">-- All Roles --</option>
                <option value="admin">Administrator</option>
                <option value="staff">Staff Sub-Admin</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="partner_admin">Brand Collaborator</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* REAL-TIME LOGS TIMELINE FLAT GRID */}
      <div className="card logs-grid-card">
        {loading ? (
          <div className="observability-loading">
            <div className="observability-spinner"></div>
            <p>Querying secure ledger database...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-logs">
            <FaShieldAlt style={{ fontSize: '40px', color: '#bdc3c7', marginBottom: '10px' }} />
            <p>No audit compliance logs matching current query parameters found.</p>
          </div>
        ) : (
          <div className="timeline-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Role</th>
                  <th>Action Triggered</th>
                  <th>Target Resource</th>
                  <th>IP Address</th>
                  <th>State Diffs</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="timestamp-col">
                      <FaCalendarAlt style={{ marginRight: '6px', color: '#7f8c8d' }} />
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </td>
                    <td>
                      <div className="operator-profile">
                        <div className="operator-avatar">{log.userName.charAt(0).toUpperCase()}</div>
                        <strong>{log.userName}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${log.role}`}>
                        {log.role}
                      </span>
                    </td>
                    <td>
                      <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="target-col">
                      <strong>{log.targetModel}</strong>
                      <span>ID: {log.targetId.substring(0, 8)}...</span>
                    </td>
                    <td className="ip-col">
                      <FaTv style={{ marginRight: '6px', color: '#bdc3c7' }} />
                      {log.ipAddress}
                    </td>
                    <td>
                      <button 
                        className="btn-inspect"
                        onClick={() => setSelectedLog(log)}
                      >
                        <FaHistory style={{ marginRight: '6px' }} /> Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECT LOG MODAL WITH JSON DIFF DISPLAY */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="log-modal-container">
            <div className="modal-header">
              <h3>
                <FaShieldAlt style={{ marginRight: '8px', color: '#1a5276' }} />
                Compliance Details: {selectedLog.action}
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedLog(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="log-metadata-box">
                <div><strong>Triggered By:</strong> {selectedLog.userName} ({selectedLog.role})</div>
                <div><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
                <div><strong>IP Address:</strong> {selectedLog.ipAddress}</div>
                <div><strong>User Agent:</strong> {selectedLog.userAgent}</div>
                {selectedLog.tenantId && <div><strong>Tenant ID:</strong> {selectedLog.tenantId}</div>}
              </div>

              <div className="json-diffs-flex">
                <div className="json-block">
                  <h4>Previous State</h4>
                  <pre>{selectedLog.previousState ? JSON.stringify(selectedLog.previousState, null, 2) : '/* Empty State */'}</pre>
                </div>
                <div className="json-block">
                  <h4>New State</h4>
                  <pre>{selectedLog.newState ? JSON.stringify(selectedLog.newState, null, 2) : '/* Empty State */'}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
