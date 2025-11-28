import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    // Order Stats
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    
    // Product Stats
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    preOrderItems: 0,
    
    // Business Metrics
    totalBookings: 0,
    activePromotions: 0,
    averageOrderValue: 0,
    conversionRate: 0
  });

  const [trends, setTrends] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalBookings: 0,
    averageOrderValue: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // Add this hook for navigation

  // Format trend percentage
  const formatTrend = (value) => {
    if (value === 0 || value === undefined || isNaN(value)) return null;
    const sign = value > 0 ? '+' : '';
    return `${sign}${Math.round(value)}%`;
  };

  // Get trend color and icon
  const getTrendStyle = (value) => {
    if (value > 0) return { color: 'var(--success)', icon: '📈' };
    if (value < 0) return { color: 'var(--error)', icon: '📉' };
    return { color: 'var(--text-light)', icon: '➡️' };
  };

  // Navigation functions
  const navigateToOrders = () => navigate('/admin/orders');
  const navigateToProducts = () => navigate('/admin/products');
  const navigateToNewProduct = () => navigate('/admin/products/new');
  const navigateToPromotions = () => navigate('/admin/promotions');
  const navigateToNewPromotion = () => navigate('/admin/promotions/new');
  const navigateToUsers = () => navigate('/admin/users');

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        toast.error('Please login to view dashboard');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      // Fetch all data in parallel for better performance
      const [
        ordersStatsResponse,
        productsResponse,
        recentOrdersResponse,
        promotionsResponse,
        trendsResponse
      ] = await Promise.all([
        fetch(`${API_URL}/orders/admin/stats`, { headers }).catch(() => ({})),
        fetch(`${API_URL}/admin/products?limit=100`, { headers }).catch(() => ({})),
        fetch(`${API_URL}/orders/admin?limit=5`, { headers }).catch(() => ({})),
        fetch(`${API_URL}/promotions`, { headers }).catch(() => ({})),
        fetch(`${API_URL}/analytics/trends`, { headers }).catch(() => ({}))
      ]);

      // Parse responses
      const ordersStatsData = ordersStatsResponse.ok ? await ordersStatsResponse.json() : {};
      const productsData = productsResponse.ok ? await productsResponse.json() : {};
      const recentOrdersData = recentOrdersResponse.ok ? await recentOrdersResponse.json() : {};
      const promotionsData = promotionsResponse.ok ? await promotionsResponse.json() : {};
      const trendsData = trendsResponse.ok ? await trendsResponse.json() : {};

      console.log('📊 Dashboard Data Loaded:', {
        ordersStats: ordersStatsData,
        products: productsData,
        recentOrders: recentOrdersData,
        promotions: promotionsData,
        trends: trendsData
      });

      // Process products data for stock analysis
      const products = productsData.data || productsData.products || productsData || [];
      const lowStockProductsList = products.filter(product => 
        product.stockStatus === 'low-stock' || 
        (product.inventory?.stock - (product.inventory?.reservedStock || 0)) <= (product.inventory?.lowStockThreshold || 10)
      );
      
      const outOfStockProducts = products.filter(product => 
        product.stockStatus === 'out-of-stock' || 
        (product.inventory?.stock - (product.inventory?.reservedStock || 0)) <= 0
      );
      
      const preOrderProducts = products.filter(product => 
        product.productType === 'pre-order' || product.stockStatus === 'pre-order'
      );

      // Calculate total bookings (pre-orders)
      const totalBookings = products.reduce((total, product) => {
        return total + (product.preOrders?.length || 0);
      }, 0);

      // Calculate active promotions
      const now = new Date();
      const activePromos = (promotionsData.data || promotionsData.promotions || promotionsData || []).filter(promo => {
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);
        return promo.status === 'active' || (startDate <= now && endDate >= now);
      });

      // Calculate metrics from orders data
      const totalRevenue = ordersStatsData.data?.totalRevenue || ordersStatsData.totalRevenue || 0;
      const totalOrders = ordersStatsData.data?.totalOrders || ordersStatsData.totalOrders || 0;
      const completedOrders = ordersStatsData.data?.completedOrders || ordersStatsData.completedOrders || 0;
      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
      const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Set stats
      setStats({
        totalOrders,
        pendingOrders: ordersStatsData.data?.pendingOrders || ordersStatsData.pendingOrders || 0,
        completedOrders,
        cancelledOrders: ordersStatsData.data?.cancelledOrders || ordersStatsData.cancelledOrders || 0,
        totalRevenue,
        totalProducts: products.length,
        lowStockItems: lowStockProductsList.length,
        outOfStockItems: outOfStockProducts.length,
        preOrderItems: preOrderProducts.length,
        totalBookings,
        activePromotions: activePromos.length,
        averageOrderValue,
        conversionRate
      });

      // Set trends (use real trends if available, otherwise show 0)
      setTrends(trendsData.data || {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalBookings: 0,
        averageOrderValue: 0
      });

      // Set recent orders
      const ordersArray = recentOrdersData.data || recentOrdersData.orders || recentOrdersData || [];
      setRecentOrders(Array.isArray(ordersArray) ? ordersArray.slice(0, 5) : []);

      // Set low stock products
      setLowStockProducts(lowStockProductsList.slice(0, 5));

      // Set active promotions
      setActivePromotions(activePromos.slice(0, 3));

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Enhanced stats data with REAL trends
  const statsData = [
    { 
      label: 'Total Revenue', 
      value: `KSh ${stats.totalRevenue?.toLocaleString() || '0'}`, 
      color: 'var(--success)', 
      icon: '💰',
      description: 'Lifetime sales revenue',
      trend: trends.totalRevenue,
      key: 'totalRevenue'
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      color: 'var(--accent-gold)', 
      icon: '📦',
      description: 'All time orders placed',
      trend: trends.totalOrders,
      key: 'totalOrders'
    },
    { 
      label: 'Active Bookings', 
      value: stats.totalBookings, 
      color: 'var(--info)', 
      icon: '📅',
      description: 'Current pre-orders & bookings',
      trend: trends.totalBookings,
      key: 'totalBookings'
    },
    { 
      label: 'Pending Orders', 
      value: stats.pendingOrders, 
      color: 'var(--warning)', 
      icon: '⏳',
      description: 'Orders awaiting processing',
      trend: trends.pendingOrders,
      key: 'pendingOrders'
    },
    { 
      label: 'Completed Orders', 
      value: stats.completedOrders, 
      color: 'var(--success)', 
      icon: '✅',
      description: 'Successfully delivered orders',
      trend: trends.completedOrders,
      key: 'completedOrders'
    },
    { 
      label: 'Avg Order Value', 
      value: `KSh ${Math.round(stats.averageOrderValue)?.toLocaleString() || '0'}`, 
      color: 'var(--primary)', 
      icon: '📊',
      description: 'Average revenue per order',
      trend: trends.averageOrderValue,
      key: 'averageOrderValue'
    },
  ];

  // Stock alerts data
  const stockAlertsData = [
    { 
      label: 'Total Products', 
      value: stats.totalProducts, 
      color: 'var(--primary)', 
      icon: '🛍️',
      description: 'Active products in catalog'
    },
    { 
      label: 'Low Stock Items', 
      value: stats.lowStockItems, 
      color: 'var(--warning)', 
      icon: '⚠️',
      description: 'Need restocking attention',
      alert: stats.lowStockItems > 0
    },
    { 
      label: 'Out of Stock', 
      value: stats.outOfStockItems, 
      color: 'var(--error)', 
      icon: '❌',
      description: 'Items need immediate restock',
      alert: stats.outOfStockItems > 0
    },
    { 
      label: 'Pre-Order Items', 
      value: stats.preOrderItems, 
      color: 'var(--info)', 
      icon: '📋',
      description: 'Available for pre-booking'
    },
  ];

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--warning)';
      case 'completed': return 'var(--success)';
      case 'cancelled': return 'var(--error)';
      default: return 'var(--text-light)';
    }
  };

  const getStockStatusColor = (stockStatus) => {
    switch (stockStatus) {
      case 'low-stock': return 'var(--warning)';
      case 'out-of-stock': return 'var(--error)';
      case 'pre-order': return 'var(--info)';
      default: return 'var(--success)';
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
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-3)' }}>
          <button 
            onClick={fetchDashboardData}
            className="btn btn-secondary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            {loading ? ' Refreshing...' : ' Refresh '}
          </button>
          
          {!loading && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Key Business Metrics */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-xl)', 
          color: 'var(--text-dark)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
        Key Metrics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-5)'
        }}>
          {statsData.map((stat, index) => {
            const trendStyle = getTrendStyle(stat.trend);
            const trendDisplay = formatTrend(stat.trend);
            
            return (
              <div key={stat.key} className="stat-card" style={{
                borderLeft: `4px solid ${stat.color}`,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <div className="stat-value" style={{ color: stat.color, fontSize: 'var(--font-size-2xl)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '2rem', opacity: 0.8 }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{
                  color: 'var(--text-dark)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '600',
                  marginBottom: 'var(--space-1)'
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-light)',
                  marginBottom: trendDisplay ? 'var(--space-2)' : '0'
                }}>
                  {stat.description}
                </div>
                {trendDisplay && (
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: trendStyle.color,
                    fontWeight: '600',
                    padding: '2px 8px',
                    backgroundColor: stat.trend > 0 ? 'rgba(34, 197, 94, 0.1)' : 
                                    stat.trend < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <span>{trendStyle.icon}</span>
                    {trendDisplay} from last month
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Management & Promotions - Side by Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-6)'
      }}>
        {/* Stock Management */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span style={{ color: 'var(--accent-gold)' }}>📦</span>
              Stock Management
            </h3>
          </div>
          <div className="card-body">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-4)'
            }}>
              {stockAlertsData.map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: '700', 
                    color: stat.color,
                    marginBottom: 'var(--space-1)'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 ? (
              <div>
                <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-dark)' }}>
                  ⚠️ Low Stock Alerts
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {lowStockProducts.map((product, index) => (
                    <div key={product._id || index} style={{
                      padding: 'var(--space-3)',
                      borderBottom: index < lowStockProducts.length - 1 ? '1px solid var(--border-light)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          {product.name || 'Unnamed Product'}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          Stock: {product.inventory?.stock || 0} • Reserved: {product.inventory?.reservedStock || 0}
                        </div>
                      </div>
                      <span style={{
                        backgroundColor: getStockStatusColor(product.stockStatus),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {product.stockStatus?.replace('-', ' ') || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>✅</div>
                <p>All products are well stocked</p>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>No low stock alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Promotions */}
        <div className="card">
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
              <span style={{ color: 'var(--accent-gold)' }}>🎯</span>
              Active Promotions
            </h3>
            <span style={{
              backgroundColor: stats.activePromotions > 0 ? 'var(--accent-gold)' : 'var(--text-light)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: '600'
            }}>
              {stats.activePromotions} Active
            </span>
          </div>
          <div className="card-body">
            {activePromotions.length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {activePromotions.map((promo, index) => (
                  <div key={promo._id || index} style={{
                    padding: 'var(--space-3)',
                    borderBottom: index < activePromotions.length - 1 ? '1px solid var(--border-light)' : 'none',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-dark)', marginBottom: 'var(--space-1)' }}>
                      {promo.title || 'Untitled Promotion'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginBottom: 'var(--space-1)' }}>
                      {promo.type ? promo.type.replace('_', ' ') : 'Promotion'} • 
                      {promo.discountValue ? ` ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : ' KSh'} off` : ' Special offer'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-light)' }}>
                      {promo.endDate ? `Ends: ${formatDate(promo.endDate)}` : 'No end date'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🎯</div>
                <p>No active promotions</p>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>Create promotions to boost sales</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
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
            onClick={navigateToOrders}
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
                          {order.orderNumber || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <div style={{ fontWeight: '500' }}>
                          {order.recipient?.firstName || 'Customer'} {order.recipient?.lastName || ''}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          {order.recipient?.email || 'No email'}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3)', fontWeight: '600' }}>
                        KSh {order.totalAmount?.toLocaleString() || '0'}
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
                          {order.status || 'unknown'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                        {order.createdAt ? formatDate(order.createdAt) : 'Unknown date'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>⚡</span>
            Quick Actions
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          
            
            <button 
              onClick={navigateToOrders}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              📦 Manage Orders
            </button>
            <button 
              onClick={navigateToUsers}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              👥 View Customers
            </button>
            <button 
              onClick={navigateToProducts}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              🛍️ View Products
            </button>
            <button 
              onClick={navigateToPromotions}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
               View Promotions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;