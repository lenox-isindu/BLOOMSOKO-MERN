import React from 'react';

const AdminHeader = () => {
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
            A
          </div>
          <span style={{ fontWeight: '500' }}>Admin User</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
