import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // ⭐ FIXED LINE: Changed from /auth/login to /admin/auth/login
    const response = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success && data.data.user.role === 'admin') {
      // Store admin session with real data from backend
      localStorage.setItem('adminToken', data.data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.data.user));
      
      toast.success(`Welcome back, ${data.data.user.firstName}!`);
      navigate('/admin');
    } else {
      if (data.data?.user?.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
      } else {
        toast.error(data.message || 'Invalid admin credentials');
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    toast.error('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-light)',
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '400px',
        padding: 'var(--space-6)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            color: 'var(--text-dark)',
            marginBottom: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>🌺</span>
            <span>
              <span style={{ color: 'var(--primary-color)' }}>Bloom</span>
              <span style={{ color: 'var(--accent-gold)' }}>Soko</span>
            </span>
          </h2>
          <p style={{ color: 'var(--text-light)' }}>Admin Panel Login</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="admin@bloomsoko.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-gold"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In to Admin Panel'}
            </button>
          </div>
        </form>

        {/* Demo Credentials */}
        <div style={{ 
          marginTop: 'var(--space-6)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--bg-light)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}>
          <h4 style={{ 
            marginBottom: 'var(--space-2)',
            color: 'var(--text-dark)',
            fontSize: 'var(--font-size-sm)'
          }}>
            Demo Credentials:
          </h4>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
            <div>Email: <strong>admin@bloomsoko.com</strong></div>
            <div>Password: <strong>admin123</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;