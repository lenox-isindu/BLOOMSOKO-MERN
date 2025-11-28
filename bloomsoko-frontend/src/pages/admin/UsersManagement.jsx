import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch users from backend
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '50', // Increased limit to show more users
        ...(search && { search })
      });

      const response = await fetch(`${API_URL}/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users || []);
        setPagination(data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: data.data.users?.length || 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Update user status
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: newStatus === 'active' })
      });

      const data = await response.json();

      if (data.success) {
        // Update the user in the local state
        setUsers(prev => prev.map(user =>
          user._id === userId ? { 
            ...user, 
            isActive: newStatus === 'active',
            status: newStatus === 'active' ? 'active' : 'inactive'
          } : user
        ));
        
        // If selected user is being updated, update that too
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            isActive: newStatus === 'active',
            status: newStatus === 'active' ? 'active' : 'inactive'
          }));
        }
        
        toast.success(data.message || `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        setSelectedUser(null);
      } else {
        throw new Error(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.message || 'Failed to update user status');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `KSh ${amount?.toLocaleString() || '0'}`;
  };

  // Get full name
  const getFullName = (user) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  };

  // Get status for display (maps isActive boolean to status string)
  const getStatus = (user) => {
    return user.isActive ? 'active' : 'inactive';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-6)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            color: 'var(--text-dark)',
            marginBottom: 'var(--space-2)'
          }}>
            Users <span className="accent-gold">Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage customer accounts and user permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-5)',
        marginBottom: 'var(--space-6)'
      }}>
        <div className="stat-card gold">
          <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>
            {pagination.totalUsers}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
            Total Users
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {users.filter(u => u.isActive).length}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
            Active Users
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {users.filter(u => !u.isActive).length}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
            Inactive Users
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--info)' }}>
            {users.reduce((total, user) => total + (user.ordersCount || 0), 0)}
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
            Total Orders
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>👥</span>
            All Users ({pagination.totalUsers})
          </h3>
          
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ 
                width: '300px',
                paddingLeft: '35px'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-light)'
            }}>
              🔍
            </span>
          </div>
        </div>
        
        <div className="card-body">
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse' 
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '2px solid var(--border-light)',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: 'var(--space-4)' }}>User</th>
                    <th style={{ padding: 'var(--space-4)' }}>Contact</th>
                    <th style={{ padding: 'var(--space-4)' }}>Orders</th>
                    <th style={{ padding: 'var(--space-4)' }}>Total Spent</th>
                    <th style={{ padding: 'var(--space-4)' }}>Status</th>
                    <th style={{ padding: 'var(--space-4)' }}>Joined</th>
                    <th style={{ padding: 'var(--space-4)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr 
                      key={user._id}
                      style={{ 
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.parentNode.style.backgroundColor = 'var(--bg-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.parentNode.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-dark)',
                            fontWeight: '600',
                            fontSize: 'var(--font-size-sm)'
                          }}>
                            {getFullName(user).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                              {getFullName(user)}
                            </div>
                            <div style={{ 
                              fontSize: 'var(--font-size-sm)', 
                              color: 'var(--text-light)',
                              textTransform: 'capitalize'
                            }}>
                              {user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-dark)' }}>
                          {user.email}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          {user.phone || 'No phone'}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-dark)',
                          textAlign: 'center'
                        }}>
                          {user.ordersCount || 0}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--success)',
                          textAlign: 'center'
                        }}>
                          {formatCurrency(user.totalSpent)}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span 
                          style={{ 
                            backgroundColor: getStatus(user) === 'active' ? 'var(--success)' : 'var(--error)',
                            color: 'white',
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}
                        >
                          {getStatus(user)}
                        </span>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-dark)' }}>
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                            onClick={() => setSelectedUser(user)}
                          >
                            View
                          </button>
                          
                          {getStatus(user) === 'active' ? (
                            <button 
                              className="btn btn-warning"
                              style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                              onClick={() => updateUserStatus(user._id, 'inactive')}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button 
                              className="btn btn-success"
                              style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                              onClick={() => updateUserStatus(user._id, 'active')}
                            >
                              Activate
                            </button>
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
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onStatusUpdate={updateUserStatus}
          getFullName={getFullName}
          getStatus={getStatus}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onStatusUpdate, getFullName, getStatus, formatDate, formatCurrency }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="card-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>👤</span>
            User Details: {getFullName(user)}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-light)'
            }}
          >
            ×
          </button>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            
            {/* User Profile */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dark)',
                fontWeight: '600',
                fontSize: 'var(--font-size-xl)',
                margin: '0 auto var(--space-4)'
              }}>
                {getFullName(user).charAt(0).toUpperCase()}
              </div>
              <h4 style={{ marginBottom: 'var(--space-2)', color: 'var(--text-dark)' }}>
                {getFullName(user)}
              </h4>
              <p style={{ color: 'var(--text-light)', margin: 0 }}>
                {user.role} • {getStatus(user) === 'active' ? 'Active' : 'Inactive'} User
              </p>
            </div>

            {/* User Information */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Contact Information
              </h4>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Phone:</strong> {user.phone || 'Not provided'}
                </div>
                <div>
                  <strong>Member Since:</strong> {formatDate(user.createdAt)}
                </div>
                {user.lastLogin && (
                  <div>
                    <strong>Last Login:</strong> {formatDate(user.lastLogin)}
                  </div>
                )}
              </div>
            </div>

            {/* User Statistics */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Shopping Statistics
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 'var(--space-4)',
                textAlign: 'center'
              }}>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>
                    {user.ordersCount || 0}
                  </div>
                  <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-sm)' }}>
                    Total Orders
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--success)' }}>
                    {formatCurrency(user.totalSpent)}
                  </div>
                  <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-sm)' }}>
                    Total Spent
                  </div>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Account Management
              </h4>
              <div style={{ textAlign: 'center' }}>
                {getStatus(user) === 'active' ? (
                  <button 
                    className="btn btn-warning"
                    onClick={() => onStatusUpdate(user._id, 'inactive')}
                  >
                    Deactivate Account
                  </button>
                ) : (
                  <button 
                    className="btn btn-success"
                    onClick={() => onStatusUpdate(user._id, 'active')}
                  >
                    Activate Account
                  </button>
                )}
                <p style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: 'var(--text-light)',
                  marginTop: 'var(--space-2)'
                }}>
                  {getStatus(user) === 'active' 
                    ? 'Deactivating will prevent this user from placing new orders.'
                    : 'Activating will allow this user to place orders again.'
                  }
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="card-footer" style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: 'var(--space-3)'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;