import React from 'react';

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Products', value: '24', color: 'var(--primary-color)', icon: '🛍️' },
    { label: 'Total Orders', value: '156', color: 'var(--accent-gold)', icon: '📦' },
    { label: 'Total Revenue', value: '₦1.2M', color: 'var(--success)', icon: '💰' },
    { label: 'Customers', value: '89', color: 'var(--info)', icon: '👥' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-2xl)', 
          color: 'var(--text-dark)',
          marginBottom: 'var(--space-2)'
        }}>
          Dashboard <span className="accent-gold">Overview</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome to <span style={{ color: 'var(--accent-gold)', fontWeight: '500' }}>Bloomsoko</span> Admin Panel
        </p>
      </div>

      {/* Stats Grid with Gold Accent */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-5)',
        marginBottom: 'var(--space-6)'
      }}>
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${index === 1 ? 'gold' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{
                  color: 'var(--text-light)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '500'
                }}>
                  {stat.label}
                </div>
              </div>
              <div style={{
                fontSize: '2rem',
                opacity: 0.8
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity with Gold Header */}
      <div className="card card-gold">
        <div className="card-header">
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>⭐</span>
            Recent Activity
          </h3>
        </div>
        <div className="card-body">
          <p style={{ 
            color: 'var(--text-secondary)', 
            textAlign: 'center', 
            padding: 'var(--space-8)',
            fontStyle: 'italic'
          }}>
            Recent orders, products, and customer activity will appear here.
            <br />
            <span style={{ color: 'var(--accent-gold)' }}>Coming soon with more golden accents!</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;