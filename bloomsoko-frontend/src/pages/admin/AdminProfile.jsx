import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminProfile = () => {
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

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Load admin profile from backend
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

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
      const token = localStorage.getItem('adminToken');
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
          ...JSON.parse(localStorage.getItem('adminUser') || '{}'),
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName,
          phone: data.data.user.phone
        };
        
        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
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

      const token = localStorage.getItem('adminToken');
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

  const getAdminUser = () => {
    return JSON.parse(localStorage.getItem('adminUser') || '{}');
  };

  const adminUser = getAdminUser();

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-2xl)', 
          color: 'var(--text-dark)',
          marginBottom: 'var(--space-2)'
        }}>
          Admin <span className="accent-gold">Profile</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your admin account settings and preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Profile Information */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span style={{ color: 'var(--accent-gold)' }}>👤</span>
              Profile Information
            </h3>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleProfileUpdate}>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your first name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your last name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                    disabled // Email shouldn't be changed usually
                  />
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginTop: 'var(--space-1)' }}>
                    Email cannot be changed
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-gold"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span style={{ color: 'var(--accent-gold)' }}>🔒</span>
              Change Password
            </h3>
          </div>
          
          <div className="card-body">
            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={profile.currentPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={profile.newPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter new password"
                    required
                    minLength="6"
                  />
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginTop: 'var(--space-1)' }}>
                    Password must be at least 6 characters
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={profile.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-gold"
                  disabled={loading}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Information */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h3 style={{ 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span style={{ color: 'var(--accent-gold)' }}>📊</span>
              Account Information
            </h3>
          </div>
          
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              
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
                  margin: '0 auto var(--space-3)'
                }}>
                  {profile.firstName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <h4 style={{ marginBottom: 'var(--space-1)', color: 'var(--text-dark)' }}>
                  {profile.firstName} {profile.lastName}
                </h4>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>
                  {adminUser.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div>
                  <strong>Account ID:</strong> {adminUser.id || 'ADMIN001'}
                </div>
                <div>
                  <strong>Role:</strong> {adminUser.role === 'admin' ? 'Administrator' : 'User'}
                </div>
                <div>
                  <strong>Last Login:</strong> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <strong>Email:</strong> {profile.email}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div>
                  <strong>Permissions:</strong> Full Access
                </div>
                <div>
                  <strong>Account Status:</strong> Active
                </div>
                <div>
                  <strong>Phone:</strong> {profile.phone || 'Not set'}
                </div>
                <div>
                  <strong>Member Since:</strong> {new Date().getFullYear()}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;