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
  const [token, setToken] = useState(localStorage.getItem('bloomsoko-token'));

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = localStorage.getItem('bloomsoko-token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // For now, since backend auth isn't implemented, we'll use demo data
      // TODO: Replace with actual API call when backend auth is ready
      const demoUser = {
        id: 'demo-user-id',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@bloomsoko.com',
        phone: '+254712345678'
      };
      
      setUser(demoUser);
      setToken(storedToken);
      
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('bloomsoko-token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      console.log('Registering user:', userData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoUser = {
        id: 'new-user-id',
        ...userData
      };
      
      const demoToken = 'demo-jwt-token';
      localStorage.setItem('bloomsoko-token', demoToken);
      setToken(demoToken);
      setUser(demoUser);
      
      return { success: true, data: { user: demoUser, token: demoToken } };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      console.log('Logging in:', email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoUser = {
        id: 'user-id',
        firstName: 'Demo',
        lastName: 'User',
        email: email,
        phone: '+254712345678'
      };
      
      const demoToken = 'demo-jwt-token';
      localStorage.setItem('bloomsoko-token', demoToken);
      setToken(demoToken);
      setUser(demoUser);
      
      return { success: true, data: { user: demoUser, token: demoToken } };
    } catch (error) {
      return { success: false, error: 'Invalid credentials' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('bloomsoko-token');
    localStorage.removeItem('bloomsoko-user-id');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      // TODO: Replace with actual API call
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      return { success: true, data: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};