import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    readyOrders: 0,
    completedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders statistics
      const ordersStatsResponse = await fetch('http://localhost:5000/api/orders/admin/stats');
      const ordersStatsData = await ordersStatsResponse.json();
      console.log('📊 Orders Stats:', ordersStatsData);
      
      // Fetch products count
      const productsResponse = await fetch('http://localhost:5000/api/admin/products');
      const productsData = await productsResponse.json();
      console.log('📦 Products Data:', productsData);
      
      // Fetch recent orders
      const recentOrdersResponse = await fetch('http://localhost:5000/api/orders/admin?limit=5');
      const recentOrdersData = await recentOrdersResponse.json();
      console.log('🆕 Recent Orders:', recentOrdersData);
      
      // Set stats - Handle different response formats
      setStats({
        totalProducts: productsData.products?.length || productsData.length || 0,
        totalOrders: ordersStatsData.totalOrders || ordersStatsData.data?.totalOrders || 0,
        totalRevenue: ordersStatsData.totalRevenue || ordersStatsData.data?.totalRevenue || 0,
        pendingOrders: ordersStatsData.pendingOrders || ordersStatsData.data?.pendingOrders || 0,
        processingOrders: ordersStatsData.processingOrders || ordersStatsData.data?.processingOrders || 0,
        readyOrders: ordersStatsData.readyOrders || ordersStatsData.data?.readyOrders || 0,
        completedOrders: ordersStatsData.completedOrders || ordersStatsData.data?.completedOrders || 0
      });
      
      // Set recent orders - Handle different response formats
      let ordersArray = [];
      if (recentOrdersData.orders) {
        ordersArray = recentOrdersData.orders;
      } else if (Array.isArray(recentOrdersData)) {
        ordersArray = recentOrdersData;
      } else if (recentOrdersData.data) {
        ordersArray = recentOrdersData.data;
      } else if (recentOrdersData.data?.orders) {
        ordersArray = recentOrdersData.data.orders;
      }
      setRecentOrders(ordersArray.slice(0, 5));
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statsData = [
    { 
      label: 'Total Products', 
      value: stats.totalProducts, 
      color: 'var(--primary-color)', 
      icon: '🛍️',
      description: 'Active products in catalog'
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      color: 'var(--accent-gold)', 
      icon: '📦',
      description: 'All time orders'
    },
    { 
      label: 'Total Revenue', 
      value: `KSh ${stats.totalRevenue?.toLocaleString() || '0'}`, 
      color: 'var(--success)', 
      icon: '💰',
      description: 'Total sales revenue'
    },
    { 
      label: 'Pending Orders', 
      value: stats.pendingOrders, 
      color: 'var(--warning)', 
      icon: '⏳',
      description: 'Orders awaiting processing'
    },
    { 
      label: 'Processing', 
      value: stats.processingOrders, 
      color: 'var(--info)', 
      icon: '🔄',
      description: 'Orders in progress'
    },
    { 
      label: 'Ready for Pickup', 
      value: stats.readyOrders, 
      color: 'var(--accent-gold)', 
      icon: '📬',
      description: 'Orders ready for customer pickup'
    },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--warning)';
      case 'processing': return 'var(--info)';
      case 'ready_for_pickup': return 'var(--accent-gold)';
      case 'picked_up': return 'var(--success)';
      case 'cancelled': return 'var(--error)';
      default: return 'var(--text-light)';
    }
  };

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
        
        {/* Refresh Button */}
        <button 
          onClick={fetchDashboardData}
          className="btn btn-secondary"
          style={{ marginTop: 'var(--space-2)' }}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Debug Info */}
      {!loading && (
        <div style={{ 
          padding: 'var(--space-3)',
          backgroundColor: 'var(--bg-light)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
            <strong>Data Status:</strong> {stats.totalProducts} products • {stats.totalOrders} orders • {stats.pendingOrders} pending
          </div>
        </div>
      )}

      {/* Real Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-5)',
        marginBottom: 'var(--space-6)'
      }}>
        {statsData.map((stat, index) => (
          <div key={index} className={`stat-card ${index === 1 ? 'gold' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <div className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '2rem', opacity: 0.8 }}>
                {stat.icon}
              </div>
            </div>
            <div style={{
              color: 'var(--text-light)',
              fontSize: 'var(--font-size-base)',
              fontWeight: '500',
              marginBottom: 'var(--space-1)'
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-light)',
              opacity: 0.8
            }}>
              {stat.description}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity with Real Data */}
      <div className="card card-gold">
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
            <span style={{ color: 'var(--accent-gold)' }}>📦</span>
            Recent Orders ({recentOrders.length})
          </h3>
          <button 
            onClick={() => window.location.href = '/admin/orders'}
            className="btn btn-secondary"
            style={{ padding: 'var(--space-2) var(--space-3)' }}
          >
            View All Orders
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-light)' }}>
              Loading recent orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-light)' }}>
              <p>No recent orders found.</p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>Orders will appear here as customers place them.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)' }}>Order #</th>
                    <th style={{ padding: 'var(--space-3)' }}>Customer</th>
                    <th style={{ padding: 'var(--space-3)' }}>Amount</th>
                    <th style={{ padding: 'var(--space-3)' }}>Status</th>
                    <th style={{ padding: 'var(--space-3)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          {order.orderNumber}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <div style={{ fontWeight: '500' }}>
                          {order.recipient?.firstName} {order.recipient?.lastName}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          {order.recipient?.email}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3)', fontWeight: '600' }}>
                        KSh {order.totalAmount?.toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span style={{ 
                          backgroundColor: getStatusColor(order.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;