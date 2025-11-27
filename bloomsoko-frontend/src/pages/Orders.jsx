// src/pages/Orders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [processingPayment, setProcessingPayment] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-refresh interval (10 seconds for pending orders)
  const REFRESH_INTERVAL = 10000;

  // Function to remove duplicates
  const removeDuplicateOrders = (orders) => {
    const uniqueOrders = [];
    const orderNumbers = new Set();
    
    // Sort by creation date (newest first) to keep the most recent version
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    sortedOrders.forEach(order => {
      if (!orderNumbers.has(order.orderNumber)) {
        orderNumbers.add(order.orderNumber);
        uniqueOrders.push(order);
      } else {
        console.log(`🔄 Removing duplicate order: ${order.orderNumber}`);
      }
    });
    
    return uniqueOrders;
  };

  // Cleanup function for completed orders
  const cleanupCompletedOrders = useCallback((ordersList) => {
    return ordersList.filter(order => {
      // Keep the order if it's either:
      // 1. Not a pending order, OR
      // 2. Is a pending order but was created recently (last 1 hour)
      if (order.status !== 'pending') return true;
      
      const orderAge = Date.now() - new Date(order.createdAt).getTime();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      // Remove pending orders older than 1 hour that should have been completed
      return orderAge < oneHour;
    });
  }, []);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchOrders = useCallback(async (silent = false) => {
    if (!isAuthenticated) {
      toast.error('Please login to view your orders');
      navigate('/login');
      return;
    }

    if (!silent) {
      setRefreshing(true);
    }
    
    try {
      const token = localStorage.getItem('bloomsoko-token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Orders data received:', data);
        
        let ordersData = [];
        
        // Handle different response formats
        if (data.success && data.data) {
          ordersData = data.data;
        } else if (Array.isArray(data)) {
          ordersData = data;
        } else if (data.orders) {
          ordersData = data.orders;
        }
        
        // REMOVE DUPLICATES and clean up before setting state
        const uniqueOrders = removeDuplicateOrders(ordersData);
        const cleanedOrders = cleanupCompletedOrders(uniqueOrders);
        console.log(`🔄 Filtered ${ordersData.length} orders to ${cleanedOrders.length} unique orders`);
        
        setOrders(cleanedOrders);
      } else if (response.status === 401) {
        toast.error('Please login again to view orders');
        navigate('/login');
      } else {
        console.error('Failed to fetch orders:', response.status);
        toast.error('Failed to load orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, navigate, cleanupCompletedOrders]);

  // Check for payment success from navigation state or URL params
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      console.log('🎉 Payment successful, refreshing orders...');
      fetchOrders();
      // Clear the state to prevent repeated refreshes
      window.history.replaceState({}, document.title);
    }

    // Check URL for payment success parameters
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('payment') === 'success') {
      console.log('🎉 URL indicates payment success, refreshing orders...');
      fetchOrders();
    }
  }, [location, fetchOrders]);

  // Force refresh detection
  useEffect(() => {
    const handleStorageChange = () => {
      const forceRefresh = localStorage.getItem('force-refresh-orders');
      if (forceRefresh) {
        console.log('🔄 Force refreshing orders...');
        fetchOrders();
        localStorage.removeItem('force-refresh-orders');
      }
    };

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Check on component mount
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchOrders]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
    
    // Set up auto-refresh interval for pending orders
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        const hasPendingOrders = orders.some(order => order.status === 'pending');
        if (hasPendingOrders) {
          console.log('🔄 Auto-refreshing orders...');
          fetchOrders(true); // silent refresh
        }
      }
    }, REFRESH_INTERVAL);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchOrders, orders.length]);

  // Function to manually refresh a specific order
  const refreshOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('bloomsoko-token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const orderData = await response.json();
        if (orderData.success) {
          // Update the specific order in the orders array
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order._id === orderId ? orderData.data : order
            )
          );
          return true;
        }
      }
    } catch (error) {
      console.error(`Error refreshing order ${orderId}:`, error);
    }
    return false;
  };

  const handlePayNow = async (order) => {
    if (!isAuthenticated) {
      toast.error('Please login to make payments');
      navigate('/login');
      return;
    }

    setProcessingPayment(order._id);
    
    try {
      const token = localStorage.getItem('bloomsoko-token');
      
      const paymentData = {
        amount: order.totalAmount * 100,
        email: order.recipient?.email || user?.email,
        orderId: order._id, // Send existing order ID
        metadata: {
          recipient: {
            firstName: order.recipient?.firstName || user?.firstName,
            lastName: order.recipient?.lastName || user?.lastName,
            email: order.recipient?.email || user?.email,
            phone: order.recipient?.phone || user?.phone,
            idNumber: order.recipient?.idNumber
          },
          pickup: {
            option: order.pickup?.option,
            station: order.pickup?.station,
            county: order.pickup?.county,
            stationDetails: order.pickup?.stationDetails
          },
          items: order.items,
          specialInstructions: order.specialInstructions
        }
      };

      console.log('💰 Processing payment for EXISTING order:', order.orderNumber);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/paystack/initialize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(paymentData)
        }
      );

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server error response:', responseData);
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      if (responseData.success) {
        // Store order ID for status checking after payment
        localStorage.setItem('pending-payment-order', order._id);
        
        console.log('✅ Payment initialized, redirecting to Paystack...');
        // Redirect to Paystack
        window.location.href = responseData.data.authorization_url;
      } else {
        throw new Error(responseData.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Payment failed: ${error.message}`);
      setProcessingPayment(null);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrder(orderId);

    try {
      const token = localStorage.getItem('bloomsoko-token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/${orderId}/cancel`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Order cancelled successfully!');
          
          // Immediately update the order status in the local state
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order._id === orderId ? { ...order, status: 'cancelled' } : order
            )
          );
          
          // Also refresh from server to ensure consistency
          setTimeout(() => fetchOrders(true), 1000);
        } else {
          toast.error(result.message || 'Failed to cancel order');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to cancel order. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#FFA000',
      'completed': '#2E7D32',
      'cancelled': '#F44336',
      'ready_for_pickup': '#9C27B0'
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Awaiting Payment',
      'completed': 'Order Confirmed',
      'cancelled': 'Cancelled',
      'ready_for_pickup': 'Ready for Pickup'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: '60vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading your orders...</h2>
          <div style={{
            margin: '2rem auto',
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #2E7D32',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: '60vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Please login to view your orders</h2>
          <Link 
            to="/login"
            style={{
              display: 'inline-block',
              background: '#2E7D32',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
              marginTop: '1rem'
            }}
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      minHeight: '80vh'
    }}>
      {/* Header with Refresh Button */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ 
              color: '#2E7D32', 
              margin: '0 0 0.5rem 0',
              fontSize: '2rem',
              fontWeight: '700'
            }}>
              My Orders
            </h1>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              <Link to="/" style={{ color: '#2E7D32', textDecoration: 'none' }}>Home</Link> &gt; 
              <span> My Orders</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => fetchOrders()}
              disabled={refreshing}
              style={{
                background: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                opacity: refreshing ? 0.7 : 1,
                minWidth: '120px'
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Orders'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {[
          { value: 'all', label: 'All Orders' },
          { value: 'pending', label: 'Pending Payment' },
          { value: 'completed', label: 'Confirmed' },
          { value: 'cancelled', label: 'Cancelled' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              background: filter === value ? '#2E7D32' : 'transparent',
              color: filter === value ? 'white' : '#666',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            {label}
            {value !== 'all' && (
              <span style={{ 
                background: filter === value ? 'white' : '#2E7D32',
                color: filter === value ? '#2E7D32' : 'white',
                borderRadius: '10px',
                padding: '2px 8px',
                fontSize: '0.7rem',
                marginLeft: '0.5rem'
              }}>
                {orders.filter(order => order.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Auto-refresh Status */}
      {orders.filter(order => order.status === 'pending').length > 0 && (
        <div style={{
          background: '#E8F5E8',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          border: '1px solid #C8E6C9',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          color: '#2E7D32'
        }}>
          <span>🔄</span>
          <span>
            <strong>Auto-refresh active:</strong> Checking {orders.filter(order => order.status === 'pending').length} pending order{orders.filter(order => order.status === 'pending').length !== 1 ? 's' : ''} every 10 seconds
          </span>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#666', marginBottom: '1rem' }}>
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </h3>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            {filter === 'all' 
              ? 'Start shopping to see your orders here!'
              : `You don't have any ${getStatusText(filter).toLowerCase()} orders.`
            }
          </p>
          <Link 
            to="/products"
            style={{
              display: 'inline-block',
              background: '#FFC107',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredOrders.map(order => (
            <OrderCard 
              key={order._id}
              order={order}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              onPayNow={handlePayNow}
              onCancel={cancelOrder}
              processingPayment={processingPayment}
              cancellingOrder={cancellingOrder}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              formatDate={formatDate}
              onRefreshOrder={refreshOrder}
            />
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ 
  order, 
  selectedOrder, 
  setSelectedOrder, 
  onPayNow, 
  onCancel, 
  processingPayment,
  cancellingOrder,
  getStatusColor, 
  getStatusText, 
  formatDate,
  onRefreshOrder
}) => {
  const handleRefresh = () => {
    onRefreshOrder(order._id);
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Order Header */}
      <div style={{
        padding: '1.5rem',
        background: '#fafafa',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, color: '#2E7D32' }}>
              Order #{order.orderNumber || order._id}
            </h3>
            <span style={{
              background: getStatusColor(order.status),
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              {getStatusText(order.status)}
            </span>
          </div>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            Placed on {formatDate(order.createdAt)} • 
            Total: <strong>KSh {order.totalAmount?.toLocaleString() || '0'}</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Refresh button for individual order */}
          <button
            onClick={handleRefresh}
            style={{
              background: 'transparent',
              border: '1px solid #2196F3',
              color: '#2196F3',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem'
            }}
          >
            Refresh
          </button>

          <button
            onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
            style={{
              background: 'transparent',
              border: '1px solid #2E7D32',
              color: '#2E7D32',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.8rem'
            }}
          >
            {selectedOrder?._id === order._id ? 'Hide Details' : 'View Details'}
          </button>

          {order.status === 'pending' && (
            <>
              <button
                onClick={() => onPayNow(order)}
                disabled={processingPayment === order._id}
                style={{
                  background: '#FFC107',
                  color: '#000',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: processingPayment === order._id ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  opacity: processingPayment === order._id ? 0.7 : 1
                }}
              >
                {processingPayment === order._id ? 'Processing...' : 'Pay Now'}
              </button>

              <button
                onClick={() => onCancel(order._id)}
                disabled={cancellingOrder === order._id}
                style={{
                  background: 'transparent',
                  border: '1px solid #F44336',
                  color: '#F44336',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: cancellingOrder === order._id ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  opacity: cancellingOrder === order._id ? 0.7 : 1
                }}
              >
                {cancellingOrder === order._id ? 'Cancelling...' : 'Cancel'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Order Items Preview */}
      <div style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {(order.items || []).slice(0, 3).map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem',
              background: '#f8f9fa',
              borderRadius: '4px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#e9ecef',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                color: '#666'
              }}>
                {item.image || item.product?.featuredImage ? (
                  <img 
                    src={item.image || item.product?.featuredImage} 
                    alt={item.name || item.product?.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ) : (
                  '📦'
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', fontSize: '0.9rem' }}>
                  {item.name || item.product?.name || 'Product'}
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
                  Qty: {item.quantity} × KSh {(item.price || item.product?.price || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          
          {(order.items || []).length > 3 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              background: '#f8f9fa',
              borderRadius: '4px',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              +{(order.items || []).length - 3} more items
            </div>
          )}
        </div>

        {/* Payment Reminder for Pending Orders */}
        {order.status === 'pending' && (
          <div style={{
            background: '#FFF3E0',
            padding: '0.75rem',
            borderRadius: '4px',
            marginTop: '1rem',
            borderLeft: '3px solid #FFA000'
          }}>
            <p style={{ margin: 0, color: '#E65100', fontSize: '0.9rem', fontWeight: '600' }}>
              ⚠️ This order is awaiting payment. Complete payment to confirm your order.
            </p>
          </div>
        )}
      </div>

      {/* Expanded Order Details */}
      {selectedOrder?._id === order._id && (
        <div style={{
          padding: '1.5rem',
          background: '#f8f9fa',
          borderTop: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ color: '#2E7D32', marginBottom: '1rem', fontSize: '1rem' }}>Order Items</h4>
              <div style={{ background: 'white', borderRadius: '6px', padding: '1rem' }}>
                {(order.items || []).map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        {item.image || item.product?.featuredImage ? (
                          <img 
                            src={item.image || item.product?.featuredImage} 
                            alt={item.name || item.product?.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '0.8rem'
                          }}>
                            No Image
                          </div>
                        )}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600' }}>
                          {item.name || item.product?.name || 'Product'}
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#2E7D32' }}>
                        KSh {(item.price || item.product?.price || 0).toLocaleString()}
                      </p>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
                        Total: KSh {((item.price || item.product?.price || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 0 0 0',
                  borderTop: '2px solid #2E7D32',
                  fontWeight: '700'
                }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#2E7D32', fontSize: '1.1rem' }}>
                    KSh {order.totalAmount?.toLocaleString() || '0'}
                  </span>
                </div>

                {/* Pay Now Button in Expanded View */}
                {order.status === 'pending' && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => onPayNow(order)}
                      disabled={processingPayment === order._id}
                      style={{
                        background: '#FFC107',
                        color: '#000',
                        border: 'none',
                        padding: '0.75rem 2rem',
                        borderRadius: '6px',
                        cursor: processingPayment === order._id ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        width: '100%',
                        opacity: processingPayment === order._id ? 0.7 : 1
                      }}
                    >
                      {processingPayment === order._id ? 'Processing Payment...' : 'Pay Now - KSh ' + (order.totalAmount?.toLocaleString() || '0')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ color: '#2E7D32', marginBottom: '1rem', fontSize: '1rem' }}>Pickup Information</h4>
              <div style={{ background: 'white', borderRadius: '6px', padding: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Station:</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{order.pickup?.station || 'Not specified'}</p>
                </div>
                
                {order.pickup?.stationDetails?.address && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Address:</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{order.pickup.stationDetails.address}</p>
                  </div>
                )}
                
                {order.pickup?.stationDetails?.contact && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Contact:</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{order.pickup.stationDetails.contact}</p>
                  </div>
                )}
                
                {order.pickup?.stationDetails?.hours && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Operating Hours:</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{order.pickup.stationDetails.hours}</p>
                  </div>
                )}
                
                {order.specialInstructions && (
                  <div>
                    <strong>Special Instructions:</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{order.specialInstructions}</p>
                  </div>
                )}

                {/* Important Notes */}
                <div style={{
                  background: '#FFF3E0',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginTop: '1rem',
                  borderLeft: '3px solid #FFA000'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#E65100' }}>
                    Important:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#666' }}>
                    <li>Carry your National ID for verification</li>
                    <li>Pay shipping fee at the station</li>
                    <li>Provide order number: <strong>{order.orderNumber || order._id}</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;