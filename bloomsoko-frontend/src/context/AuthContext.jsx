// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('bloomsoko-token') || null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    checkAuthStatus();
}, []); // ⬅ NO ESLINT COMMENT


  const emitAuthChange = () => {
  try {
    console.log('[AuthContext] emitAuthChange -> firing authChanged event', { user });
    window.dispatchEvent(new Event('authChanged'));
  } catch (err) {
    const ev = document.createEvent('Event');
    ev.initEvent('authChanged', true, true);
    window.dispatchEvent(ev);
  }
};

  const migrateCart = async (authenticatedUserId) => {
    try {
      const guestUserId = localStorage.getItem('bloomsoko-user-id');
      if (!guestUserId) return;

      const savedToken = localStorage.getItem('bloomsoko-token');
      if (!savedToken) return;

      const response = await fetch(`${API_URL}/cart/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          fromUserId: guestUserId,
          toUserId: authenticatedUserId
        })
      });

      if (response.ok) {
        localStorage.removeItem('bloomsoko-user-id');
        window.dispatchEvent(new Event('cartRefreshNeeded'));
      } else {
        console.warn('Cart migrate responded with non-OK status');
      }
    } catch (error) {
      console.error('Cart migration error:', error);
    }
  };

  // context/AuthContext.js - Update the checkAuthStatus function
const checkAuthStatus = async () => {
  try {
    const storedToken = localStorage.getItem('bloomsoko-token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${storedToken}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setUser(result.data);
        setToken(storedToken);
        localStorage.setItem('bloomsoko-authenticated-user-id', result.data._id);
        
        // 🔥 CRITICAL FIX: Migrate cart after auth check
        const guestUserId = localStorage.getItem('bloomsoko-user-id');
        if (guestUserId && guestUserId !== result.data._id) {
          console.log('🔄 Attempting cart migration from:', guestUserId, 'to:', result.data._id);
          const migrationSuccess = await migrateCart(result.data._id);
          if (migrationSuccess) {
            console.log('✅ Cart migration completed successfully');
          } else {
            console.log('❌ Cart migration failed, fetching fresh cart');
            window.dispatchEvent(new Event('cartRefreshNeeded'));
          }
        } else {
          // If no guest cart, just refresh the cart
          window.dispatchEvent(new Event('cartRefreshNeeded'));
        }
        
      } else {
        throw new Error(result.message);
      }
    } else {
      logout();
    }
    
  } catch (error) {
    console.error('Auth check failed:', error);
    logout();
  } finally {
    setLoading(false);
  }
};
  const register = async (userData) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // persist token & authenticated user id
        localStorage.setItem('bloomsoko-token', result.data.token);
        localStorage.setItem('bloomsoko-authenticated-user-id', result.data.user._id);

        setToken(result.data.token);
        setUser(result.data.user);

        const guestUserId = localStorage.getItem('bloomsoko-user-id');
        if (guestUserId) {
          await migrateCart(result.data.user._id);
        }

        emitAuthChange();

        return { success: true, data: result.data };
      }

      return { success: false, error: result.message || 'Registration failed' };
    } catch (error) {
      console.error('register error:', error);
      return { success: false, error: error.message || 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        localStorage.setItem('bloomsoko-token', result.data.token);
        localStorage.setItem('bloomsoko-authenticated-user-id', result.data.user._id);

        setToken(result.data.token);
        setUser(result.data.user);

        const guestUserId = localStorage.getItem('bloomsoko-user-id');
        if (guestUserId) {
          await migrateCart(result.data.user._id);
        }

        // notify listeners (Navbar is listening to 'authChanged')
        emitAuthChange();

        return { success: true, data: result.data };
      }

      return { success: false, error: result.message || 'Login failed' };
    } catch (error) {
      console.error('login error:', error);
      return { success: false, error: error.message || 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  // Accept options to allow silent logout from checkAuthStatus
  const logout = ({ silent = false } = {}) => {
    try {
      localStorage.removeItem('bloomsoko-token');
      localStorage.removeItem('bloomsoko-authenticated-user-id');
    } catch (e) {
      /* ignore localStorage errors */
    }

    setUser(null);
    setToken(null);

    // notify UI (unless caller asked for silent)
    if (!silent) {
      emitAuthChange();
      window.dispatchEvent(new Event('cartRefreshNeeded'));
      // redirect to home for interactive logouts
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setUser(result.data);
        // notify UI that user profile changed
        emitAuthChange();
        return { success: true, data: result.data };
      }

      return { success: false, error: result.message || 'Update failed' };
    } catch (err) {
      console.error('updateProfile error:', err);
      return { success: false, error: err.message || 'Network error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
