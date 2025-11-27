// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (res && res.success) {
        toast.success(`Welcome back, ${res.data.user.firstName}!`);
        // Force page refresh to update all states
        window.location.href = '/';
      } else {
        toast.error(res.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error', err);
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-body">
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fdf8 0%, #e8f5e9 100%)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ 
              color: '#2E7D32', 
              marginBottom: '0.5rem',
              fontSize: '2rem',
              fontWeight: '700'
            }}>
              Welcome Back
            </h1>
            <p style={{ color: '#666' }}>Sign in to your Bloomsoko account</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="on">
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? '#ccc' : '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginBottom: '1.5rem'
              }}
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#2E7D32', fontWeight: '600', textDecoration: 'none' }}>
                Sign up here
              </Link>
            </p>
            <Link to="/forgot-password" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;