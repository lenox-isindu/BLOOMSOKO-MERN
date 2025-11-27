// src/pages/Orders.jsx
import React, { useState, useEffect } from 'react';
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
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-refresh interval (10 seconds)
  const REFRESH_INTERVAL = 10000;

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
    
    // Set up auto-refresh interval
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
  }, [orders.length, isAuthenticated]);

  // Check for payment success from navigation state
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      console.log('🎉 Payment successful, refreshing orders...');
      fetchOrders();
      // Clear the state to prevent repeated refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchOrders = async (silent = false) => {
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
        
        // Handle different response formats
        if (data.success && data.data) {
          setOrders(data.data);
        } else if (Array.isArray(data)) {
          setOrders(data);
        } else if (data.orders) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
        
        // Check if any pending orders need status updates
        const currentOrders = data.data || data.orders || data || [];
        checkPendingOrdersStatus(currentOrders);
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
  };

  const checkPendingOrdersStatus = async (currentOrders) => {
    const pendingOrders = currentOrders.filter(order => order.status === 'pending');
    
    // Check if we have a recently completed payment
    const pendingPaymentOrderId = localStorage.getItem('pending-payment-order');
    if (pendingPaymentOrderId) {
      const pendingOrder = pendingOrders.find(order => order._id === pendingPaymentOrderId);
      if (pendingOrder) {
        console.log(`🔍 Checking status for recently paid order: ${pendingOrder.orderNumber}`);
        await verifyOrderStatus(pendingOrder._id, true);
        return; // Prioritize checking the recently paid order
      }
    }
    
    // Check all pending orders
    for (const order of pendingOrders) {
      await verifyOrderStatus(order._id);
    }
  };

  const verifyOrderStatus = async (orderId, isRecentPayment = false) => {
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
        if (orderData.data && orderData.data.status === 'completed') {
          console.log(`✅ Order ${orderData.data.orderNumber} status updated to completed`);
          
          // Clear pending payment flag if this was the recently paid order
          if (isRecentPayment) {
            localStorage.removeItem('pending-payment-order');
          }
          
          // Trigger a full refresh to get updated order list
          fetchOrders();
          return true;
        }
      }
    } catch (error) {
      console.error(`Error checking order ${orderId}:`, error);
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

      if (response.ok) {
        const paymentResponse = await response.json();
        if (paymentResponse.success) {
          // Store order ID for status checking after payment
          localStorage.setItem('pending-payment-order', order._id);
          // Redirect to Paystack
          window.location.href = paymentResponse.data.authorization_url;
        } else {
          throw new Error(paymentResponse.message || 'Payment initialization failed');
        }
      } else {
        throw new Error('Failed to initialize payment');
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
        toast.success('Order cancelled successfully!');
        fetchOrders();
      } else {
        toast.error('Failed to cancel order. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#FFA000',
      'completed': '#2E7D32',
      'cancelled': '#F44336',
      'processing': '#2196F3',
      'shipped': '#9C27B0'
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Awaiting Payment',
      'completed': 'Order Confirmed',
      'cancelled': 'Cancelled',
      'processing': 'Processing',
      'shipped': 'Shipped'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
              {refreshing ? 'Refreshing...' : 'Refresh'}
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
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Order Card Component (Keep your existing design)
const OrderCard = ({ 
  order, 
  selectedOrder, 
  setSelectedOrder, 
  onPayNow, 
  onCancel, 
  processingPayment,
  getStatusColor, 
  getStatusText, 
  formatDate 
}) => {
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
                style={{
                  background: 'transparent',
                  border: '1px solid #F44336',
                  color: '#F44336',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
              >
                Cancel
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
        <ExpandedOrderDetails 
          order={order} 
          onPayNow={onPayNow}
          processingPayment={processingPayment}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

// Expanded Order Details Component (Keep your existing design)
const ExpandedOrderDetails = ({ order, onPayNow, processingPayment, getStatusColor }) => {
  return (
    <div style={{
      padding: '1.5rem',
      background: '#f8f9fa',
      borderTop: '1px solid #e0e0e0'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* All Order Items */}
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

        {/* Pickup Information */}
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
  );
};

export default Orders;