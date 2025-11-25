import React, { useState, useEffect } from 'react';
import { orderAPI, productAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders statistics
      const ordersResponse = await fetch('http://localhost:5000/api/orders/admin/stats');
      const ordersData = await ordersResponse.json();
      
      // Fetch products count
      const productsResponse = await fetch('http://localhost:5000/api/admin/products');
      const productsData = await productsResponse.json();
      
      // Fetch recent orders
      const recentOrdersResponse = await fetch('http://localhost:5000/api/orders/admin?limit=5');
      const recentOrdersData = await recentOrdersResponse.json();
      
      console.log('Dashboard data:', { ordersData, productsData, recentOrdersData });
      
      // Set stats
      setStats({
        totalProducts: productsData.products?.length || 0,
        totalOrders: ordersData.totalOrders || 0,
        totalRevenue: ordersData.totalRevenue || 0,
        pendingOrders: ordersData.pendingOrders || 0
      });
      
      // Set recent orders
      if (recentOrdersData.orders) {
        setRecentOrders(recentOrdersData.orders.slice(0, 5));
      } else if (Array.isArray(recentOrdersData)) {
        setRecentOrders(recentOrdersData.slice(0, 5));
      } else if (recentOrdersData.data) {
        setRecentOrders(recentOrdersData.data.slice(0, 5));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
      icon: '🛍️' 
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      color: 'var(--accent-gold)', 
      icon: '📦' 
    },
    { 
      label: 'Total Revenue', 
      value: `KSh ${stats.totalRevenue?.toLocaleString() || '0'}`, 
      color: 'var(--success)', 
      icon: '💰' 
    },
    { 
      label: 'Pending Orders', 
      value: stats.pendingOrders, 
      color: 'var(--info)', 
      icon: '⏳' 
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

      {/* Real Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-5)',
        marginBottom: 'var(--space-6)'
      }}>
        {statsData.map((stat, index) => (
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

      {/* Recent Activity with Real Data */}
      <div className="card card-gold">
        <div className="card-header">
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>📦</span>
            Recent Orders
          </h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-light)' }}>
              Loading recent orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-light)' }}>
              No recent orders found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)' }}>Order</th>
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
                        {order.recipient?.firstName} {order.recipient?.lastName}
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        KSh {order.totalAmount?.toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span style={{ 
                          backgroundColor: order.status === 'pending' ? 'var(--warning)' : 'var(--success)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
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