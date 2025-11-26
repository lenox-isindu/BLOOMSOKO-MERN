import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Notifications from './Notifications.jsx'; // Add this import

const AdminHeader = () => {
  const navigate = useNavigate();
  
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <header className="admin-header">
      <div style={{ flex: 1 }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-xl)', 
          color: 'var(--text-primary)',
          margin: 0 
        }}>
          Admin Dashboard
        </h1>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-4)' 
      }}>
        {/* Notifications Component */}
        <Notifications />
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--gray-100)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600'
          }}>
            {adminUser.name?.charAt(0) || 'A'}
          </div>
          <span style={{ fontWeight: '500' }}>{adminUser.name || 'Admin'}</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ padding: 'var(--space-2) var(--space-3)' }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;