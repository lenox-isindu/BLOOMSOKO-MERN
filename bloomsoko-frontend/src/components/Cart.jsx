import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './Cart.module.css';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const handleRemoveItem = (productId) => {
        if (window.confirm('Are you sure you want to remove this item from your cart?')) {
            removeFromCart(productId);
        }
    };

    if (cart.length === 0) {
        return (
            <div className={styles.cart}>
                <div className={styles.cartHeader}>
                    <h1>Shopping Cart</h1>
                    <div className={styles.breadcrumbs}>
                        <Link to="/">Home</Link> &gt; <span>Shopping Cart</span>
                    </div>
                </div>
                
                <div className={styles.cartContainer}>
                    <div className={styles.emptyCart}>
                        <h2>Your cart is empty</h2>
                        <p>Browse our products and add items to your cart</p>
                        <Link to="/products" className={styles.ctaButton}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const regularItems = cart.filter(item => !item.isBooking);
    const bookingItems = cart.filter(item => item.isBooking);

    return (
        <div className={styles.cart}>
            <div className={styles.cartHeader}>
                <h1>Shopping Cart ({cart.length} items)</h1>
                <div className={styles.breadcrumbs}>
                    <Link to="/">Home</Link> &gt; <span>Shopping Cart</span>
                </div>
            </div>
            
            <div className={styles.cartContainer}>
                <div className={styles.cartContent}>
                    {/* Regular Items */}
                    {regularItems.length > 0 && (
                        <div className={styles.cartSection}>
                            <h2>Cart Items</h2>
                            {regularItems.map(item => (
                                <div key={item.productId} className={styles.cartItem}>
                                    <div className={styles.itemImage}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <div className={styles.noImage}>No Image</div>
                                        )}
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <h3>{item.name}</h3>
                                        <p className={styles.itemCategory}>{item.category}</p>
                                        <p className={styles.itemPrice}>KSh {item.price.toLocaleString()}</p>
                                    </div>
                                    <div className={styles.itemControls}>
                                        <div className={styles.quantityControl}>
                                            <button 
                                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                className={styles.quantityBtn}
                                            >
                                                -
                                            </button>
                                            <span className={styles.quantity}>{item.quantity}</span>
                                            <button 
                                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                className={styles.quantityBtn}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveItem(item.productId)}
                                            className={styles.removeBtn}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className={styles.itemTotal}>
                                        KSh {(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Booking Items */}
                    {bookingItems.length > 0 && (
                        <div className={styles.cartSection}>
                            <h2>Booked Items</h2>
                            {bookingItems.map(item => (
                                <div key={item.productId} className={`${styles.cartItem} ${styles.bookingItem}`}>
                                    <div className={styles.itemImage}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} />
                                        ) : (
                                            <div className={styles.noImage}>No Image</div>
                                        )}
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <h3>{item.name}</h3>
                                        <p className={styles.itemCategory}>{item.category}</p>
                                        <p className={styles.bookingNote}>📅 Booked - We'll contact you when ready</p>
                                        {item.growingDetails && (
                                            <p className={styles.growingInfo}>
                                                Progress: {item.growingDetails.progress}% • 
                                                Expected: {new Date(item.growingDetails.expectedReadyDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className={styles.itemControls}>
                                        <button 
                                            onClick={() => handleRemoveItem(item.productId)}
                                            className={styles.removeBtn}
                                        >
                                            Cancel Booking
                                        </button>
                                    </div>
                                    <div className={styles.itemTotal}>
                                        KSh {item.price.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.cartSummary}>
                        <div className={styles.summaryRow}>
                            <span>Subtotal:</span>
                            <span>KSh {getCartTotal().toLocaleString()}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Shipping:</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Total:</span>
                            <span className={styles.totalAmount}>KSh {getCartTotal().toLocaleString()}</span>
                        </div>
                        
                        <div className={styles.cartActions}>
                            <button className={styles.clearCart} onClick={() => {
                                if (window.confirm('Are you sure you want to clear your entire cart?')) {
                                    clearCart();
                                }
                            }}>
                                Clear Cart
                            </button>
                            <Link to="/checkout" className={styles.checkoutBtn}>
                                Proceed to Checkout
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;