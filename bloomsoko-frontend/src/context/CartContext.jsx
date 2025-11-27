// context/CartContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CART':
            return {
                ...state,
                items: action.payload.items || [],
                loading: false
            };
        case 'ADD_TO_CART':
            return {
                ...state,
                items: action.payload.items || []
            };
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                items: action.payload.items || []
            };
        case 'UPDATE_QUANTITY':
            return {
                ...state,
                items: action.payload.items || []
            };
        case 'CLEAR_CART':
            return {
                ...state,
                items: []
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'SET_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        default:
            return state;
    }
};

const initialState = {
    items: [], 
    loading: true,
    error: null
};

export const CartProvider = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!localStorage.getItem('bloomsoko-token');
    };

    // Get the correct user ID (authenticated or guest)
    const getCurrentUserId = () => {
        // Priority 1: Authenticated user ID
        const authUserId = localStorage.getItem('bloomsoko-authenticated-user-id');
        if (authUserId) {
            return authUserId;
        }
        
        // Priority 2: Guest user ID
        let guestUserId = localStorage.getItem('bloomsoko-user-id');
        if (!guestUserId) {
            guestUserId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('bloomsoko-user-id', guestUserId);
        }
        return guestUserId;
    };

    // Get auth headers for API calls
    const getAuthHeaders = () => {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const token = localStorage.getItem('bloomsoko-token');
        const currentUserId = getCurrentUserId();
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Always send userid header
        headers['userid'] = currentUserId;
        
        console.log('🛒 Auth headers:', { 
            hasToken: !!token, 
            userId: currentUserId,
            isAuthenticated: !!token
        });
        
        return headers;
    };

    // Event listeners for cart refresh
    useEffect(() => {
        const handleCartMigrated = () => {
            console.log('🔄 Cart migration detected, refreshing cart...');
            fetchCart();
        };

        const handleCartRefresh = () => {
            console.log('🔄 Manual cart refresh triggered');
            fetchCart();
        };

        const handleCartUpdated = () => {
            console.log('🛒 Cart updated event received');
            fetchCart();
        };

        window.addEventListener('cartMigrated', handleCartMigrated);
        window.addEventListener('cartRefreshNeeded', handleCartRefresh);
        window.addEventListener('cartUpdated', handleCartUpdated);
        
        return () => {
            window.removeEventListener('cartMigrated', handleCartMigrated);
            window.removeEventListener('cartRefreshNeeded', handleCartRefresh);
            window.removeEventListener('cartUpdated', handleCartUpdated);
        };
    }, []);

    // Load cart from backend on mount
    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            const response = await fetch(`${API_URL}/cart`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const cartData = await response.json();
                console.log('🛒 Cart data received:', cartData);
                dispatch({ type: 'SET_CART', payload: cartData });
            } else if (response.status === 401) {
                // Unauthorized - clear cart
                console.log('❌ Unauthorized, clearing cart');
                dispatch({ type: 'SET_CART', payload: { items: [] } });
            } else {
                console.log('No cart found, creating empty cart');
                dispatch({ type: 'SET_CART', payload: { items: [] } });
            }
        } catch (error) {
            console.error('❌ Error fetching cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            dispatch({ type: 'SET_CART', payload: { items: [] } });
        }
    };

    const addToCart = async (product, quantity = 1, isBooking = false) => {
        try {
            // Check authentication first
            if (!isAuthenticated()) {
                toast.error('Please login to add items to cart');
                window.location.href = '/login';
                return;
            }

            console.log('🛒 Adding to cart:', {
                productId: product._id,
                productName: product.name,
                quantity,
                isBooking,
                userId: getCurrentUserId()
            });

            const response = await fetch(`${API_URL}/cart/add`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    productId: product._id,
                    quantity,
                    isBooking
                })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Add to cart success:', result);
                
                dispatch({ type: 'ADD_TO_CART', payload: result });
                await fetchCart(); // Refresh cart to get latest state
                
                // Emit cart update event for real-time updates
                window.dispatchEvent(new Event('cartUpdated'));
                
                toast.success(isBooking ? 'Product booked successfully!' : 'Product added to cart!');
                return result;
            } else {
                console.error('❌ Add to cart failed:', result);
                throw new Error(result.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            toast.error(error.message || 'Failed to add to cart');
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            const response = await fetch(`${API_URL}/cart/remove/${itemId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const result = await response.json();
                dispatch({ type: 'REMOVE_FROM_CART', payload: result });
                await fetchCart();
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('❌ Error removing from cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            const response = await fetch(`${API_URL}/cart/update/${itemId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ quantity })
            });

            if (response.ok) {
                const result = await response.json();
                dispatch({ type: 'UPDATE_QUANTITY', payload: result });
                await fetchCart();
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('❌ Error updating cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const clearCart = async () => {
        try {
            const response = await fetch(`${API_URL}/cart/clear`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                dispatch({ type: 'CLEAR_CART' });
                console.log('🛒 Cart cleared');
                window.dispatchEvent(new Event('cartUpdated'));
                return true;
            } else {
                throw new Error('Failed to clear cart on server');
            }
        } catch (error) {
            console.error('❌ Error clearing cart:', error);
            dispatch({ type: 'CLEAR_CART' });
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return false;
        }
    };

    // Migrate cart from guest to authenticated user
    const migrateCartToUser = async (authenticatedUserId) => {
        if (!authenticatedUserId) return;
        
        const guestUserId = localStorage.getItem('bloomsoko-user-id');
        if (!guestUserId) return;
        
        try {
            const token = localStorage.getItem('bloomsoko-token');
            const response = await fetch(`${API_URL}/cart/migrate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    fromUserId: guestUserId, 
                    toUserId: authenticatedUserId 
                })
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.removeItem('bloomsoko-user-id'); // Remove guest ID after migration
                dispatch({ type: 'SET_CART', payload: result });
                console.log('🔄 Cart migrated to authenticated user');
                window.dispatchEvent(new Event('cartUpdated'));
                return true;
            }
        } catch (error) {
            console.error('❌ Error migrating cart:', error);
        }
        return false;
    };

    const getCartCount = () => {
        if (!state.items || !Array.isArray(state.items)) {
            return 0;
        }
        return state.items.reduce((total, item) => total + (item.quantity || 0), 0);
    };

    const getCartTotal = () => {
        if (!state.items || !Array.isArray(state.items)) {
            return 0;
        }
        return state.items.reduce((total, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 0;
            return total + (price * quantity);
        }, 0);
    };

    // Debug logging
    useEffect(() => {
        console.log('🔍 CART CONTEXT DEBUG:', {
            hasToken: !!localStorage.getItem('bloomsoko-token'),
            authUserId: localStorage.getItem('bloomsoko-authenticated-user-id'),
            guestUserId: localStorage.getItem('bloomsoko-user-id'),
            cartItems: state.items?.length || 0,
            cartCount: getCartCount(),
            loading: state.loading
        });
    }, [state.items, state.loading, getCartCount]);

    return (
        <CartContext.Provider value={{
            cart: state.items || [],
            loading: state.loading,
            error: state.error,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            migrateCartToUser,
            getCartCount,
            getCartTotal,
            refreshCart: fetchCart,
            forceRefreshCart: fetchCart,
            isAuthenticated: isAuthenticated()
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};