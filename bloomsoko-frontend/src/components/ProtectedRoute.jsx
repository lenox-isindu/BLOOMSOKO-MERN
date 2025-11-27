// components/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('🔐 ProtectedRoute auth check:', {
      isAuthenticated,
      loading,
      path: location.pathname,
      hasToken: !!localStorage.getItem('bloomsoko-token')
    });
  }, [isAuthenticated, loading, location.pathname]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Double check localStorage as fallback
  const hasValidToken = localStorage.getItem('bloomsoko-token');
  
  if (!isAuthenticated && !hasValidToken) {
    console.log('🚫 Redirecting to login from:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ ProtectedRoute access granted to:', location.pathname);
  return children;
};

export default ProtectedRoute;