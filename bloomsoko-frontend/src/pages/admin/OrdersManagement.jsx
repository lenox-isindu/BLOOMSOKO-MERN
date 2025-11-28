import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0
  });

  // Fetch orders and stats
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const token = localStorage.getItem('adminToken');
      const ordersResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/admin${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const ordersData = await ordersResponse.json();
      
      // Fetch stats
      const statsResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const statsData = await statsResponse.json();
      
      console.log('Orders response:', ordersData);
      console.log('Stats response:', statsData);
      
      // Handle orders response
      if (ordersData.success) {
        setOrders(ordersData.data || []);
      } else {
        setOrders([]);
        toast.error(ordersData.message || 'Failed to load orders');
      }
      
      // Handle stats response
      if (statsData.success) {
        setStats(statsData.data || {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0
        });
      } else {
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/admin/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus, notes })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `Order status updated to ${newStatus}`);
        fetchOrders(); // Refresh the list
        setSelectedOrder(null); // Close modal
      } else {
        throw new Error(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/orders/${orderId}/cancel`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        if (data.success) {
          toast.success('Order cancelled successfully');
          fetchOrders(); // Refresh the list
        } else {
          throw new Error(data.message || 'Failed to cancel order');
        }
      } catch (error) {
        console.error('Error cancelling order:', error);
        toast.error(error.message || 'Failed to cancel order');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color - UPDATED to match your backend
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--warning)';
      case 'completed': return 'var(--success)';
      case 'cancelled': return 'var(--error)';
      default: return 'var(--text-light)';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'failed': return 'var(--error)';
      default: return 'var(--text-light)';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-6)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            color: 'var(--text-dark)',
            marginBottom: 'var(--space-2)'
          }}>
            Orders <span className="accent-gold">Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage customer orders and track order status
          </p>
        </div>
      </div>

     {/* Order Stats */}
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 'var(--space-5)',
  marginBottom: 'var(--space-6)'
}}>
  {/* Total Orders */}
  <div className="stat-card gold">
    <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>
      {stats.totalOrders}
    </div>
    <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
      Total Orders
    </div>
  </div>
  
  {/* Pending Orders */}
  <div className="stat-card">
    <div className="stat-value" style={{ color: 'var(--warning)' }}>
      {stats.pendingOrders}
    </div>
    <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
      Pending
    </div>
  </div>
  
  {/* Completed Orders */}
  <div className="stat-card">
    <div className="stat-value" style={{ color: 'var(--success)' }}>
      {stats.completedOrders}
    </div>
    <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
      Completed
    </div>
  </div>
  
  {/* Cancelled Orders - NEW CARD */}
  <div className="stat-card">
    <div className="stat-value" style={{ color: 'var(--error)' }}>
      {stats.cancelledOrders || 0}
    </div>
    <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
      Cancelled
    </div>
  </div>
  
  {/* Total Revenue */}
  <div className="stat-card">
    <div className="stat-value" style={{ color: 'var(--info)' }}>
      KSh {stats.totalRevenue?.toLocaleString() || '0'}
    </div>
    <div style={{ color: 'var(--text-light)', fontSize: 'var(--font-size-base)', fontWeight: '500' }}>
      Total Revenue
    </div>
  </div>
</div>

      {/* Orders Table */}
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
            <span style={{ color: 'var(--accent-gold)' }}>📦</span>
            All Orders ({orders.length})
          </h3>
          
          {/* Status Filter - UPDATED to match your backend */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="card-body">
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              <p>No orders found.</p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                {statusFilter !== 'all' ? `No orders with status "${statusFilter}"` : 'No orders have been placed yet.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse' 
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '2px solid var(--border-light)',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: 'var(--space-4)' }}>Order</th>
                    <th style={{ padding: 'var(--space-4)' }}>Customer</th>
                    <th style={{ padding: 'var(--space-4)' }}>Items</th>
                    <th style={{ padding: 'var(--space-4)' }}>Total</th>
                    <th style={{ padding: 'var(--space-4)' }}>Status</th>
                    <th style={{ padding: 'var(--space-4)' }}>Payment</th>
                    <th style={{ padding: 'var(--space-4)' }}>Date</th>
                    <th style={{ padding: 'var(--space-4)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr 
                      key={order._id}
                      style={{ 
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.parentNode.style.backgroundColor = 'var(--bg-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.parentNode.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          {order.orderNumber}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          {order._id?.substring(-8) || 'N/A'}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          {order.recipient?.firstName} {order.recipient?.lastName}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          {order.recipient?.email}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-light)' }}>
                          {order.recipient?.phone}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-dark)' }}>
                          {order.items?.length || 0} items
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          {order.items?.[0]?.name || 'N/A'}
                          {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          KSh {order.totalAmount?.toLocaleString() || '0'}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span 
                          style={{ 
                            backgroundColor: getStatusColor(order.status),
                            color: 'white',
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}
                        >
                          {order.status || 'Unknown'}
                        </span>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span 
                          style={{ 
                            backgroundColor: getPaymentStatusColor(order.paymentStatus),
                            color: 'white',
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}
                        >
                          {order.paymentStatus || 'Unknown'}
                        </span>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-dark)' }}>
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                            onClick={() => setSelectedOrder(order)}
                          >
                            View
                          </button>
                          
                          {order.status === 'pending' && (
                            <button 
                              className="btn btn-danger"
                              style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
                              onClick={() => cancelOrder(order._id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={updateOrderStatus}
        />
      )}
    </div>
  );
};

// Order Details Modal Component - UPDATED status options
const OrderDetailsModal = ({ order, onClose, onStatusUpdate }) => {
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState(order.notes || '');
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (status !== order.status || notes !== order.notes) {
      setUpdating(true);
      await onStatusUpdate(order._id, status, notes);
      setUpdating(false);
    } else {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
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
            Order Details: {order.orderNumber}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-light)'
            }}
          >
            ×
          </button>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            
            {/* Order Summary */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Order Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <strong>Order Number:</strong> {order.orderNumber}
                </div>
                <div>
                  <strong>Order Date:</strong> {formatDate(order.createdAt)}
                </div>
                <div>
                  <strong>Total Amount:</strong> KSh {order.totalAmount?.toLocaleString()}
                </div>
                <div>
                  <strong>Payment Status:</strong> 
                  <span style={{ 
                    marginLeft: 'var(--space-2)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: order.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning)',
                    color: 'white',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: '600'
                  }}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Customer Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <strong>Name:</strong> {order.recipient?.firstName} {order.recipient?.lastName}
                </div>
                <div>
                  <strong>Email:</strong> {order.recipient?.email}
                </div>
                <div>
                  <strong>Phone:</strong> {order.recipient?.phone}
                </div>
                <div>
                  <strong>ID Number:</strong> {order.recipient?.idNumber}
                </div>
              </div>
            </div>

            {/* Pickup Information */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Pickup Information
              </h4>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div><strong>Pickup Option:</strong> {order.pickup?.option}</div>
                <div><strong>Station:</strong> {order.pickup?.station}</div>
                <div><strong>County:</strong> {order.pickup?.county}</div>
                {order.pickup?.stationDetails?.address && (
                  <div><strong>Address:</strong> {order.pickup.stationDetails.address}</div>
                )}
                {order.pickup?.stationDetails?.contact && (
                  <div><strong>Contact:</strong> {order.pickup.stationDetails.contact}</div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Order Items ({order.items?.length || 0})
              </h4>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                {order.items?.map((item, index) => (
                  <div key={index} style={{
                    padding: 'var(--space-4)',
                    borderBottom: index < order.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: 'var(--radius-md)',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                          Quantity: {item.quantity}
                          {item.isBooking && <span style={{ marginLeft: 'var(--space-2)', color: 'var(--accent-gold)' }}>• Pre-order</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                      KSh {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--bg-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: '600',
                  fontSize: 'var(--font-size-lg)'
                }}>
                  <div>Total Amount:</div>
                  <div>KSh {order.totalAmount?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Order Status Update - UPDATED status options */}
            <div>
              <h4 style={{ 
                marginBottom: 'var(--space-4)',
                color: 'var(--text-dark)',
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: 'var(--space-2)'
              }}>
                Update Order Status
              </h4>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Admin Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-textarea"
                    placeholder="Add any notes or instructions..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="card-footer" style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: 'var(--space-3)'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={updating}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-gold" 
            onClick={handleStatusUpdate}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;