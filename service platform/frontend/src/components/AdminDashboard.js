import React, { useState, useEffect } from 'react';
import { getAllUsers, getUserStats } from '../firebase/init';
import './AdminDashboard.css';

const AdminDashboard = ({ adminUser }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersResult, statsResult] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ]);

      if (usersResult.success) {
        setUsers(usersResult.users);
      } else {
        setError(usersResult.error);
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    // User type filter
    const matchesType = 
      filterType === 'all' || 
      user.userType === filterType ||
      (filterType === 'admin' && user.isAdmin);

    // Verification filter
    const matchesVerification = 
      filterVerification === 'all' ||
      (filterVerification === 'verified' && user.phoneVerified) ||
      (filterVerification === 'unverified' && !user.phoneVerified);

    return matchesSearch && matchesType && matchesVerification;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <h1>👑 Admin Dashboard</h1>
          <p>Welcome back, {adminUser.name || 'Admin'}!</p>
        </div>
        <div className="admin-actions">
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card total-users">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <div className="stat-details">
              <span>Consumers: {stats.totalConsumers}</span>
              <span>Providers: {stats.totalProviders}</span>
            </div>
          </div>

          <div className="stat-card verified-users">
            <h3>Verified Users</h3>
            <p className="stat-number">{stats.verifiedUsers}</p>
            <div className="stat-details">
              <span className="verified">✓ {stats.verifiedUsers} verified</span>
              <span className="unverified">✗ {stats.unverifiedUsers} pending</span>
            </div>
          </div>

          <div className="stat-card admins">
            <h3>Admins</h3>
            <p className="stat-number">
              {users.filter(u => u.isAdmin).length}
            </p>
            <div className="stat-details">
              <span>Full system access</span>
            </div>
          </div>

          <div className="stat-card recent-users">
            <h3>Today's Activity</h3>
            <p className="stat-number">
              {users.filter(u => {
                const userDate = new Date(u.createdAt);
                const today = new Date();
                return userDate.toDateString() === today.toDateString();
              }).length}
            </p>
            <div className="stat-details">
              <span>New registrations today</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All User Types</option>
            <option value="consumer">Consumers</option>
            <option value="provider">Providers</option>
            <option value="admin">Admins</option>
          </select>

          <select 
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <h3>User Management ({filteredUsers.length} users)</h3>
        
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <p>No users found matching your criteria</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>SL No.</th>
                  <th>User Info</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.uid} className={user.isAdmin ? 'admin-row' : ''}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="user-info">
                        <strong>{user.name || 'N/A'}</strong>
                        <small>{user.email}</small>
                        {user.isAdmin && <span className="admin-badge">ADMIN</span>}
                      </div>
                    </td>
                    <td>
                      <div className="phone-info">
                        <span>{user.phone || 'N/A'}</span>
                        {user.phoneVerified ? (
                          <span className="verified-badge">✓ Verified</span>
                        ) : (
                          <span className="unverified-badge">✗ Unverified</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${user.userType}`}>
                        {user.userType === 'provider' ? '🔧 Provider' : '👤 Consumer'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status || 'active'}`}>
                        ● {user.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <small>{formatDate(user.createdAt)}</small>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="view-btn">View</button>
                        <button className="edit-btn">Edit</button>
                        {!user.phoneVerified && (
                          <button className="verify-btn">Verify</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demo Admin Info */}
      <div className="demo-info">
        <h4>Demo Admin Accounts for Testing:</h4>
        <div className="demo-accounts">
          <div className="demo-account">
            <strong>Email:</strong> kavishan16@icloud.com
            <br />
            <strong>Password:</strong> shan16@K
            <br />
            <strong>OTP:</strong> 123456
          </div>
          <div className="demo-account">
            <strong>Email:</strong> admin@wefix.com
            <br />
            <strong>Password:</strong> admin123
            <br />
            <strong>OTP:</strong> 123456
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
