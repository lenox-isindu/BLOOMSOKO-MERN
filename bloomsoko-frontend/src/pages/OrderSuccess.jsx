
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation();
  const { orderId, total } = location.state || {};

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      textAlign: 'center',
      background: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
      <h1 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Order Placed Successfully!</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#666' }}>
        Thank you for your purchase. Your order has been confirmed.
      </p>
      
      {orderId && (
        <div style={{
          background: '#f8f9fa',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <p><strong>Order Reference:</strong> {orderId}</p>
          {total && <p><strong>Total Amount:</strong> KSh {total.toLocaleString()}</p>}
        </div>
      )}

      <p style={{ marginBottom: '2rem', color: '#666' }}>
        A confirmation email has been sent to your email address. 
        You will receive tracking information once your order ships.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link 
          to="/orders"
          style={{
            background: '#2E7D32',
            color: '#FFFFFF',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          View Orders
        </Link>
        <Link 
          to="/products"
          style={{
            background: '#FFC107',
            color: '#000000',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;