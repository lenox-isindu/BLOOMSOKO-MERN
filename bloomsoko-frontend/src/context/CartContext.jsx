import React, { createContext, useContext, useReducer, useEffect } from 'react';

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

    //  demo user ID
    const getUserId = () => {
        let userId = localStorage.getItem('bloomsoko-user-id');
        if (!userId) {
            userId = `demo-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('bloomsoko-user-id', userId);
        }
        return userId;
    };

    // Load cart 
    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const userId = getUserId();
            
            const response = await fetch(`${API_URL}/cart`, {
                headers: {
                    'userid': userId
                }
            });
            
            if (response.ok) {
                const cartData = await response.json();
                console.log('Cart data received:', cartData);
                dispatch({ type: 'SET_CART', payload: cartData });
            } else {
                // If no cart exists, create empty one
                console.log('No cart found, creating empty cart');
                dispatch({ type: 'SET_CART', payload: { items: [] } });
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            dispatch({ type: 'SET_CART', payload: { items: [] } });
        }
    };

    const addToCart = async (product, quantity = 1, isBooking = false) => {
        try {
            const userId = getUserId();
            
            const response = await fetch(`${API_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'userid': userId
                },
                body: JSON.stringify({
                    productId: product._id,
                    quantity,
                    isBooking
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Add to cart result:', result);
                dispatch({ type: 'ADD_TO_CART', payload: result });
                return result;
            } else {
                throw new Error('Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            const userId = getUserId();
            
            const response = await fetch(`${API_URL}/cart/remove/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'userid': userId
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Remove from cart result:', result);
                dispatch({ type: 'REMOVE_FROM_CART', payload: result });
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            const userId = getUserId();
            
            const response = await fetch(`${API_URL}/cart/update/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'userid': userId
                },
                body: JSON.stringify({ quantity })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Update quantity result:', result);
                dispatch({ type: 'UPDATE_QUANTITY', payload: result });
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const clearCart = async () => {
        try {
            const userId = getUserId();
            
            const response = await fetch(`${API_URL}/cart/clear`, {
                method: 'DELETE',
                headers: {
                    'userid': userId
                }
            });

            if (response.ok) {
                dispatch({ type: 'CLEAR_CART' });
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const migrateCart = async (fromUserId, toUserId) => {
        try {
            const response = await fetch(`${API_URL}/cart/migrate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fromUserId, toUserId })
            });

            if (response.ok) {
                const result = await response.json();
                dispatch({ type: 'SET_CART', payload: result });
                return result;
            }
        } catch (error) {
            console.error('Error migrating cart:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    //  getCartCount 
    const getCartCount = () => {
        if (!state.items || !Array.isArray(state.items)) {
            console.warn('Cart items is not an array:', state.items);
            return 0;
        }
        return state.items.reduce((total, item) => total + (item.quantity || 0), 0);
    };

    
    const getCartTotal = () => {
        if (!state.items || !Array.isArray(state.items)) {
            console.warn('Cart items is not an array:', state.items);
            return 0;
        }
        return state.items.reduce((total, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 0;
            return total + (price * quantity);
        }, 0);
    };

    return (
        <CartContext.Provider value={{
            cart: state.items || [], 
            loading: state.loading,
            error: state.error,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            migrateCart,
            getCartCount,
            getCartTotal,
            refreshCart: fetchCart
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