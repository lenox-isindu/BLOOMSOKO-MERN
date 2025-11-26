import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications - Replace with real WebSocket or API polling
  const mockNotifications = [
    {
      id: 1,
      type: 'new_order',
      title: 'New Order Received',
      message: 'Order #BSO2401001 from John Doe',
      time: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      link: '/admin/orders'
    },
    {
      id: 2,
      type: 'payment_success',
      title: 'Payment Completed',
      message: 'Payment for Order #BSO2401001 was successful',
      time: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      read: false,
      link: '/admin/orders'
    },
    {
      id: 3,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Fresh Organic Tomatoes is running low (5 left)',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      link: '/admin/products'
    }
  ];

  useEffect(() => {
    // Load notifications
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
    
    // In real app, you would set up WebSocket or polling here
    // const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    // return () => clearInterval(interval);
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order': return '🛒';
      case 'payment_success': return '💰';
      case 'low_stock': return '⚠️';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          position: 'relative',
          padding: 'var(--space-2)',
          borderRadius: 'var(--radius-md)',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'var(--bg-light)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: 'var(--error)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '400px',
          backgroundColor: 'white',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: '500px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-light)'
          }}>
            <h4 style={{ margin: 0, color: 'var(--text-dark)' }}>
              Notifications {unreadCount > 0 && `(${unreadCount} new)`}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500'
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ 
                padding: 'var(--space-6)', 
                textAlign: 'center', 
                color: 'var(--text-light)' 
              }}>
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'transparent' : 'rgba(255, 193, 7, 0.05)',
                    transition: 'background-color 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = notification.read ? 'transparent' : 'rgba(255, 193, 7, 0.05)';
                  }}
                >
                  {!notification.read && (
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--accent-gold)',
                      borderRadius: '50%'
                    }} />
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 'var(--space-3)',
                    marginLeft: notification.read ? '0' : 'var(--space-3)'
                  }}>
                    <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: 'var(--text-dark)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{ 
                        color: 'var(--text-light)',
                        fontSize: 'var(--font-size-sm)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-light)'
                      }}>
                        {formatTime(notification.time)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: 'var(--space-3)',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            backgroundColor: 'var(--bg-light)'
          }}>
            <button
              onClick={() => setShowNotifications(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-gold)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default Notifications;

//
//WebSocket connections for real-time notifications

//PI polling to check for new orders/payments

//Database integration to store and retrieve notifications