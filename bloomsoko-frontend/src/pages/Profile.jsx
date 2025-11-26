// pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('bloomsoko-token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('bloomsoko-token');
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        setProfile(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || ''
        }));
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('bloomsoko-token');
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage with new data
        const updatedUser = {
          ...JSON.parse(localStorage.getItem('bloomsoko-user') || '{}'),
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName,
          phone: data.data.user.phone
        };
        
        localStorage.setItem('bloomsoko-user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (profile.newPassword !== profile.confirmPassword) {
        toast.error('New passwords do not match');
        setLoading(false);
        return;
      }

      if (profile.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('bloomsoko-token');
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: profile.currentPassword,
          newPassword: profile.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Clear password fields
        setProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        toast.success('Password changed successfully!');
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bloomsoko-token');
    localStorage.removeItem('bloomsoko-user');
    toast.success('Logged out successfully!');
    navigate('/');
  };

  const getUser = () => {
    return JSON.parse(localStorage.getItem('bloomsoko-user') || '{}');
  };

  const user = getUser();

  if (profileLoading) {
    return (
      <div className="customer-body">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-body">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            color: '#2E7D32',
            marginBottom: '0.5rem'
          }}>
            My <span style={{ color: '#FFD700' }}>Profile</span>
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Manage your account settings and preferences
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Profile Information */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <span style={{ 
                fontSize: '2rem',
                color: '#2E7D32'
              }}>👤</span>
              <h3 style={{ margin: 0, color: '#333' }}>Profile Information</h3>
            </div>
            
            <form onSubmit={handleProfileUpdate}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter your last name"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: '#f5f5f5'
                    }}
                    placeholder="Enter your email"
                    required
                    disabled
                  />
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    Email cannot be changed
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter your phone number"
                  />
                </div>

                <button 
                  type="submit" 
                  style={{
                    width: '100%',
                    background: loading ? '#ccc' : '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <span style={{ 
                fontSize: '2rem',
                color: '#2E7D32'
              }}>🔒</span>
              <h3 style={{ margin: 0, color: '#333' }}>Change Password</h3>
            </div>
            
            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={profile.currentPassword}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={profile.newPassword}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter new password"
                    required
                    minLength="6"
                  />
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                    Password must be at least 6 characters
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={profile.confirmPassword}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  style={{
                    width: '100%',
                    background: loading ? '#ccc' : '#2E7D32',
                    color: 'white',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Information */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            gridColumn: '1 / -1'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <span style={{ 
                fontSize: '2rem',
                color: '#2E7D32'
              }}>📊</span>
              <h3 style={{ margin: 0, color: '#333' }}>Account Information</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '2rem',
                  margin: '0 auto 1rem'
                }}>
                  {profile.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <h4 style={{ marginBottom: '0.5rem', color: '#333' }}>
                  {profile.firstName} {profile.lastName}
                </h4>
                <p style={{ color: '#666', margin: 0 }}>
                  Customer
                </p>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <strong>Account ID:</strong> {user.id || 'CUST001'}
                </div>
                <div>
                  <strong>Role:</strong> Customer
                </div>
                <div>
                  <strong>Last Login:</strong> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <strong>Email:</strong> {profile.email}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <strong>Account Status:</strong> Active
                </div>
                <div>
                  <strong>Phone:</strong> {profile.phone || 'Not set'}
                </div>
                <div>
                  <strong>Member Since:</strong> {new Date().getFullYear()}
                </div>
                <div>
                  <strong>Orders:</strong> 0
                </div>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            gridColumn: '1 / -1'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <span style={{ 
                fontSize: '2rem',
                color: '#2E7D32'
              }}>⚡</span>
              <h3 style={{ margin: 0, color: '#333' }}>Quick Actions</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link 
                to="/orders" 
                style={{
                  padding: '1rem 2rem',
                  background: '#2E7D32',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                View My Orders
              </Link>
              <Link 
                to="/products" 
                style={{
                  padding: '1rem 2rem',
                  background: '#FFD700',
                  color: '#333',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Continue Shopping
              </Link>
              <button 
                onClick={handleLogout}
                style={{
                  padding: '1rem 2rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;