// src/components/PaymentCallback.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, forceRefreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState('processing');
  const hasVerified = useRef(false); // Prevent multiple verifications

  useEffect(() => {
    // Only run verification if authenticated and not already verified
    if (!isAuthenticated || !user || hasVerified.current) {
      return;
    }

    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');

      console.log('🔄 Payment callback received:', { reference, trxref, user: user.email });

      if (!reference && !trxref) {
        console.error('❌ No payment reference found');
        setStatus('error');
        toast.error('No payment reference found');
        return;
      }

      const paymentReference = reference || trxref;
      hasVerified.current = true; // Mark as verified to prevent duplicates

      try {
        // Get authentication token
        const token = localStorage.getItem('bloomsoko-token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        console.log('🔍 Verifying payment with reference:', paymentReference);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/paystack/verify/${paymentReference}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📡 Verification response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Payment verification result:', result);
          
          if (result.success) {
            setStatus('success');
            toast.success('Payment verified successfully!');
            
            // Clear the cart locally
            await clearCart();
            await forceRefreshCart();
            
            console.log('🛒 Cart cleared, redirecting to success page...');
            
            // Redirect to success page with order data
            navigate('/order-success', {
              state: {
                orderId: result.data.order.orderNumber,
                total: result.data.order.totalAmount,
                recipientEmail: result.data.order.recipient.email
              }
            });
          } else {
            console.error('❌ Payment verification failed:', result.message);
            setStatus('error');
            toast.error(result.message || 'Payment verification failed');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Verification request failed:', response.status, errorText);
          setStatus('error');
          toast.error(`Payment verification failed: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Payment verification error:', error);
        setStatus('error');
        toast.error(`Payment verification error: ${error.message}`);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, clearCart, forceRefreshCart, isAuthenticated, user]); // Added user to dependencies

  // Show loading while checking authentication
  if (!isAuthenticated) {
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h2 style={{ color: '#FFA000', marginBottom: '1rem' }}>Checking Authentication...</h2>
        <p style={{ color: '#666' }}>
          Please wait while we verify your login status.
        </p>
        <div style={{
          margin: '0 auto',
          width: '50px',
          height: '50px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #2E7D32',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

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
      {status === 'processing' && (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ color: '#FFA000', marginBottom: '1rem' }}>Verifying Payment...</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Please wait while we confirm your payment with Paystack.
          </p>
          <div style={{
            margin: '0 auto',
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #2E7D32',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}
      
      {status === 'success' && (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#2E7D32', marginBottom: '1rem' }}>Payment Verified!</h2>
          <p style={{ color: '#666' }}>
            Your payment has been successfully verified. Redirecting to order details...
          </p>
        </div>
      )}
      
      {status === 'error' && (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#F44336', marginBottom: '1rem' }}>Payment Verification Failed</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            There was an issue verifying your payment. Please check your orders page or contact support.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/orders')}
              style={{
                background: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              View Orders
            </button>
            <button 
              onClick={() => navigate('/cart')}
              style={{
                background: '#FFC107',
                color: 'black',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Back to Cart
            </button>
          </div>
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

export default PaymentCallback;