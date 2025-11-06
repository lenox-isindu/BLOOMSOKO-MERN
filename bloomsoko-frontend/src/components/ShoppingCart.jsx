
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ShoppingCart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart();
  const navigate = useNavigate();

  
  console.log('Cart State:', cart);
  console.log('Cart Items:', cart?.items);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      removeFromCart(itemId);
    }
  };

  const handlePlaceOrder = () => {
   
    alert('Order placed successfully! You will receive a confirmation email shortly.');
    clearCart();
    navigate('/');
  };

  const cartItems = cart?.items || cart || [];
  const isEmpty = !cartItems || cartItems.length === 0;
  const cartCount = getCartCount();

  if (isEmpty) {
    return (
      <div className="shopping-cart">
        {/* Header  */}
        <div className="cart-header" style={{
          padding: 'var(--space-8) 5%',
          background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#FFFFFF',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: 'var(--font-size-3xl)', 
            marginBottom: 'var(--space-4)',
            fontWeight: '700'
          }}>
            Shopping Cart
          </h1>
          <div className="breadcrumbs" style={{ color: 'rgba(255,255,255,0.9)' }}>
            <Link to="/" style={{ color: '#FFFFFF', textDecoration: 'none' }}>
              Home
            </Link> &gt; <span>Shopping Cart</span>
          </div>
        </div>
        
        <div className="cart-container" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--space-8) 5%'
        }}>
          <div className="cart-items">
            <div className="empty-cart" style={{
              textAlign: 'center',
              padding: 'var(--space-16) var(--space-8)',
              background: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E0E0E0'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🛒</div>
              <h2 style={{ 
                color: '#2E7D32',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: '600'
              }}>
                Your cart is empty
              </h2>
              <p style={{ 
                color: '#666666',
                marginBottom: 'var(--space-8)',
                fontSize: 'var(--font-size-lg)'
              }}>
                Browse our products and add items to your cart
              </p>
              <Link 
                to="/products" 
                style={{
                  display: 'inline-block',
                  background: '#FFC107',
                  color: '#000000',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  border: '2px solid #FFC107'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#FFD54F';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#FFC107';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Process cart items - 
  const processCartItem = (item) => {
    // If item has nested product object 
    if (item.product && typeof item.product === 'object') {
      return {
        itemId: item._id,
        productId: item.product._id,
        name: item.product.name,
        price: item.price || item.product.price,
        image: item.product.featuredImage?.url || item.product.featuredImage || item.product.images?.[0]?.url,
        category: item.product.category,
        quantity: item.quantity,
        isBooking: item.isBooking,
        growingDetails: item.product.growingDetails,
        slug: item.product.slug
      };
    }
    // If item is already flat 
    return {
      itemId: item._id || item.itemId || item.productId,
      productId: item.productId || item._id,
      name: item.name,
      price: item.price,
      image: item.image?.url || item.image,
      category: item.category,
      quantity: item.quantity,
      isBooking: item.isBooking,
      growingDetails: item.growingDetails,
      slug: item.slug
    };
  };

  const processedItems = cartItems.map(processCartItem);
  
  // Separate regular and booking items
  const regularItems = processedItems.filter(item => !item.isBooking);
  const bookingItems = processedItems.filter(item => item.isBooking);

  return (
    <div className="shopping-cart">
      {/* Header  */}
      <div className="cart-header" style={{
        padding: 'var(--space-8) 5%',
        background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#FFFFFF',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-3xl)', 
          marginBottom: 'var(--space-4)',
          fontWeight: '700'
        }}>
          Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
        </h1>
        <div className="breadcrumbs" style={{ color: 'rgba(255,255,255,0.9)' }}>
          <Link to="/" style={{ color: '#FFFFFF', textDecoration: 'none' }}>
            Home
          </Link> &gt; <span>Shopping Cart</span>
        </div>
      </div>
      
      <div className="cart-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--space-8) 5%'
      }}>
        <div className="cart-content">
          {/* Regular Items */}
          {regularItems.length > 0 && (
            <div className="cart-section" style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)',
                marginBottom: 'var(--space-6)',
                color: '#2E7D32',
                fontWeight: '600',
                paddingBottom: 'var(--space-2)',
                borderBottom: '2px solid #FFC107'
              }}>
                Cart Items ({regularItems.length})
              </h2>
              {regularItems.map(item => (
                <div key={item.itemId} className="cart-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--space-6)',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  marginBottom: 'var(--space-4)',
                  gap: 'var(--space-6)',
                  border: '1px solid #E0E0E0',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  {/* Product Image  */}
                  <Link 
                    to={`/product/${item.productId}`}
                    className="item-image" 
                    style={{
                      width: '100px',
                      height: '100px',
                      flexShrink: 0,
                      textDecoration: 'none'
                    }}
                  >
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: '#F5F5F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        color: '#666666',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        No Image
                      </div>
                    )}
                  </Link>
                  
                  {/* Product Details */}
                  <div className="item-details" style={{ flex: 1 }}>
                    <Link 
                      to={`/product/${item.productId}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <h3 style={{ 
                        margin: '0 0 var(--space-2) 0',
                        color: '#2E7D32',
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600'
                      }}>
                        {item.name}
                      </h3>
                    </Link>
                    <p style={{ 
                      margin: '0 0 var(--space-2) 0',
                      color: '#666666',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {item.category}
                    </p>
                    <p style={{ 
                      margin: 0,
                      color: '#2E7D32',
                      fontWeight: '600',
                      fontSize: 'var(--font-size-lg)'
                    }}>
                      KSh {item.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="item-controls" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-4)'
                  }}>
                    <div className="quantity-control" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)'
                    }}>
                      <button 
                        onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '1px solid #E0E0E0',
                          background: '#FFFFFF',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'var(--font-size-lg)',
                          color: '#2E7D32',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#2E7D32';
                          e.target.style.color = '#FFFFFF';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#FFFFFF';
                          e.target.style.color = '#2E7D32';
                        }}
                      >
                        -
                      </button>
                      <span style={{
                          padding: 'var(--space-2) var(--space-4)',
                          border: '1px solid #E0E0E0',
                          borderRadius: '6px',
                          minWidth: '40px',
                          textAlign: 'center',
                          fontSize: 'var(--font-size-md)',
                          background: '#F9F9F9'
                        }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '1px solid #E0E0E0',
                          background: '#FFFFFF',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'var(--font-size-lg)',
                          color: '#2E7D32',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#2E7D32';
                          e.target.style.color = '#FFFFFF';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#FFFFFF';
                          e.target.style.color = '#2E7D32';
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.itemId)}
                      style={{
                        background: 'none',
                        border: '1px solid #D32F2F',
                        color: '#D32F2F',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#D32F2F';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'none';
                        e.target.style.color = '#D32F2F';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  
                  {/* Item Total */}
                  <div className="item-total" style={{
                    fontWeight: '600',
                    fontSize: 'var(--font-size-lg)',
                    color: '#2E7D32',
                    minWidth: '120px',
                    textAlign: 'right'
                  }}>
                    KSh {((item.price || 0) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Booking Items */}
          {bookingItems.length > 0 && (
            <div className="cart-section" style={{ marginBottom: 'var(--space-8)' }}>
              <h2 style={{ 
                fontSize: 'var(--font-size-xl)',
                marginBottom: 'var(--space-6)',
                color: '#2E7D32',
                fontWeight: '600',
                paddingBottom: 'var(--space-2)',
                borderBottom: '2px solid #FFC107'
              }}>
                Booked Items ({bookingItems.length})
              </h2>
              {bookingItems.map(item => (
                <div key={item.itemId} className="cart-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--space-6)',
                  background: '#F1F8E9',
                  border: '2px solid #C8E6C9',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  marginBottom: 'var(--space-4)',
                  gap: 'var(--space-6)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  {/* Product Image with Link */}
                  <Link 
                    to={`/product/${item.productId}`}
                    className="item-image" 
                    style={{
                      width: '100px',
                      height: '100px',
                      flexShrink: 0,
                      textDecoration: 'none'
                    }}
                  >
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: '#E8F5E8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        color: '#666666',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        No Image
                      </div>
                    )}
                  </Link>
                  
                  {/* Product Details with Link */}
                  <div className="item-details" style={{ flex: 1 }}>
                    <Link 
                      to={`/product/${item.productId}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <h3 style={{ 
                        margin: '0 0 var(--space-2) 0',
                        color: '#2E7D32',
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600'
                      }}>
                        {item.name}
                      </h3>
                    </Link>
                    <p style={{ 
                      margin: '0 0 var(--space-2) 0',
                      color: '#666666',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {item.category}
                    </p>
                    <p style={{ 
                      margin: '0 0 var(--space-2) 0',
                      color: '#FF9800',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600'
                    }}>
                      📅 Booked - We'll contact you when ready
                    </p>
                    {item.growingDetails && (
                      <p style={{ 
                        margin: 0,
                        color: '#666666',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        Progress: {item.growingDetails.progress}% • 
                        Expected: {new Date(item.growingDetails.expectedReadyDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  {/* Cancel Booking Button */}
                  <div className="item-controls" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-4)'
                  }}>
                    <button 
                      onClick={() => handleRemoveItem(item.itemId)}
                      style={{
                        background: 'none',
                        border: '1px solid #D32F2F',
                        color: '#D32F2F',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#D32F2F';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'none';
                        e.target.style.color = '#D32F2F';
                      }}
                    >
                      Cancel Booking
                    </button>
                  </div>
                  
                  {/* Item Price */}
                  <div className="item-total" style={{
                    fontWeight: '600',
                    fontSize: 'var(--font-size-lg)',
                    color: '#2E7D32',
                    minWidth: '120px',
                    textAlign: 'right'
                  }}>
                    KSh {item.price?.toLocaleString() || '0'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Summary & Order Placement */}
          <div className="cart-summary" style={{
            background: '#FFFFFF',
            padding: 'var(--space-6)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginTop: 'var(--space-8)',
            border: '1px solid #E0E0E0'
          }}>
            <h3 style={{
              color: '#2E7D32',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: '600'
            }}>
              Order Summary
            </h3>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid #E0E0E0'
            }}>
              <span style={{ color: '#666666' }}>Subtotal:</span>
              <span style={{ fontWeight: '600', color: '#2E7D32' }}>
                KSh {getCartTotal().toLocaleString()}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid #E0E0E0'
            }}>
              <span style={{ color: '#666666' }}>Shipping:</span>
              <span style={{ color: '#666666' }}>Calculated at checkout</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: '600'
            }}>
              <span>Total:</span>
              <span style={{ color: '#2E7D32' }}>
                KSh {getCartTotal().toLocaleString()}
              </span>
            </div>
            
            {/* Order Placement Button */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--space-4)',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)'
            }}>
              <button 
                onClick={handlePlaceOrder}
                style={{
                  background: '#FFC107',
                  color: '#000000',
                  border: '2px solid #FFC107',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: 'var(--font-size-md)',
                  flex: 2,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#FFD54F';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#FFC107';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🛍 Place Order Now
              </button>
            </div>
            
            {/* Additional Actions */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--space-4)',
              justifyContent: 'space-between'
            }}>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire cart?')) {
                    clearCart();
                  }
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D32F2F',
                  color: '#D32F2F',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#D32F2F';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#FFFFFF';
                  e.target.style.color = '#D32F2F';
                }}
              >
                Clear Cart
              </button>
              <Link 
                to="/products" 
                style={{
                  display: 'block',
                  background: '#2E7D32',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textAlign: 'center',
                  flex: 1,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#1B5E20';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#2E7D32';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;