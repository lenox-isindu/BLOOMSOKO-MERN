// src/components/PaymentCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, forceRefreshCart } = useCart();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');

      console.log('Payment callback received:', { reference, trxref });

      if (!reference && !trxref) {
        setStatus('error');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/paystack/verify/${reference || trxref}`
        );

        if (response.ok) {
          const result = await response.json();
          console.log('Payment verification result:', result);
          
          if (result.success) {
            setStatus('success');
            
            // Clear the cart locally
            await clearCart();
            await forceRefreshCart();
            
            // Redirect to success page with order data
            navigate('/order-success', {
              state: {
                orderId: result.data.order.orderNumber,
                total: result.data.order.totalAmount,
                recipientEmail: result.data.order.recipient.email
              }
            });
          } else {
            setStatus('error');
          }
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams, navigate, clearCart, forceRefreshCart]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      {status === 'processing' && (
        <div>
          <h2>Processing Payment...</h2>
          <p>Please wait while we verify your payment.</p>
          <div>Loading...</div>
        </div>
      )}
      {status === 'error' && (
        <div>
          <h2>Payment Failed</h2>
          <p>There was an issue processing your payment. Please try again.</p>
          <button onClick={() => navigate('/cart')}>Back to Cart</button>
        </div>
      )}
    </div>
  );
};

export default PaymentCallback;