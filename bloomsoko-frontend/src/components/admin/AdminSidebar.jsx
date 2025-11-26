import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/products', icon: '🛍️', label: 'Products' },
    { path: '/admin/categories', icon: '📁', label: 'Categories' },
    { path: '/admin/orders', icon: '📦', label: 'Orders' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
    { path: '/admin/promotions', icon: '🎯', label: 'Promotions' },
    { path: '/admin/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Logo with Gold Accent */}
      <div className="sidebar-header" style={{ 
        padding: 'var(--space-6)', 
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-light)'
      }}>
        <h2 style={{ 
          color: 'var(--primary-color)', 
          fontSize: 'var(--font-size-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          fontWeight: '700'
        }}>
          <span style={{ color: 'var(--accent-gold)' }}>🌺</span>
          <span>
            <span style={{ color: 'var(--primary-color)' }}>Bloom</span>
            <span style={{ color: 'var(--accent-gold)' }}>Soko</span>
          </span>
        </h2>
        <p style={{ 
          color: 'var(--text-light)', 
          fontSize: 'var(--font-size-sm)',
          marginTop: 'var(--space-1)'
        }}>
          <span style={{ color: 'var(--accent-gold)' }}>Admin</span> Panel
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ padding: 'var(--space-4)' }}>
        <ul style={{ listStyle: 'none' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} style={{ marginBottom: 'var(--space-1)' }}>
                <Link
                  to={item.path}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span style={{ 
                    fontSize: '1.2em',
                    color: isActive ? 'var(--accent-gold)' : 'inherit'
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ 
                    fontWeight: isActive ? '600' : '400',
                    fontSize: 'var(--font-size-base)'
                  }}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;