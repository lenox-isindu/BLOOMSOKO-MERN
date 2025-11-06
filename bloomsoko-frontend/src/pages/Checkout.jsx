import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from './Checkout.module.css';


const stripePromise = loadStripe('your-publishable-key-here');

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            
            const { clientSecret } = await createPaymentIntent();

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                }
            });

            if (result.error) {
                setError(result.error.message);
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.checkoutContainer}>
            <h2>Checkout</h2>
            
            {success ? (
                <div className={styles.successMessage}>
                    <h3>Payment Successful! 🎉</h3>
                    <p>Thank you for your purchase. You will receive a confirmation email shortly.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles.checkoutForm}>
                    <div className={styles.formSection}>
                        <h3>Payment Details</h3>
                        <div className={styles.cardElement}>
                            <CardElement 
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button 
                        type="submit" 
                        disabled={!stripe || loading}
                        className={styles.payButton}
                    >
                        {loading ? 'Processing...' : `Pay KSh ${totalAmount}`}
                    </button>
                </form>
            )}
        </div>
    );
};

const Checkout = () => {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm />
        </Elements>
    );
};

export default Checkout;