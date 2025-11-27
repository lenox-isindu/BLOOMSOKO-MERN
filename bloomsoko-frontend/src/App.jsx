// App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

// Admin Components
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ProductsManagement from './pages/admin/ProductsManagement.jsx';
import CategoriesManagement from './pages/admin/CategoriesManagement.jsx';
import OrdersManagement from './pages/admin/OrdersManagement.jsx';
import UsersManagement from './pages/admin/UsersManagement.jsx';
import PromotionsManagement from './pages/admin/PromotionsManagement.jsx';

// Customer Components
import Home from './pages/Home.jsx';
import ProductCatalog from './components/ProductCatalog.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import ShoppingCart from './components/ShoppingCart.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import Checkout from './pages/Checkout.jsx';
import CustomerProductDetail from './components/CustomerProductDetail.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import PaymentCallback from './components/PaymentCallback.jsx';
import Orders from './pages/Orders.jsx';
import Profile from './pages/Profile.jsx';

// Customer Authentication Components
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute.jsx';

// CSS imports 
import './styles/globals.css';
import './styles/customer.css'; 

// Debug component to monitor auth and cart state
const AppDebugger = () => {
  const { isAuthenticated, user } = useAuth();
  const { cart, getCartCount } = useCart();
  
  useEffect(() => {
    console.log('🔐 App.jsx - Auth status:', { 
      isAuthenticated, 
      user, 
      hasToken: !!localStorage.getItem('bloomsoko-token') 
    });
  }, [isAuthenticated, user]);
  
  useEffect(() => {
    console.log('🛒 App.jsx - Cart status:', { 
      cartItems: cart?.length, 
      cartCount: getCartCount() 
    });
  }, [cart, getCartCount()]);

  return null;
};

const ComingSoon = ({ title }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <h1 style={{ 
      fontSize: '1.875rem', 
      color: '#121212',
      fontFamily: 'Poppins, sans-serif'
    }}>
      {title}
    </h1>
    <p style={{ 
      color: '#666666', 
      fontSize: '1.125rem',
      fontFamily: 'Poppins, sans-serif'
    }}>
      Coming Soon 
    </p>
    <a href="/" className="customer-btn customer-btn-gold">
      ← Back to Home
    </a>
  </div>
);

// Admin Protected Route (separate from customer auth)
const AdminProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('adminToken');
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

function AppContent() {
  return (
    <Router>
      <div>
        <AppDebugger />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#333333',
              border: '1px solid #e9ecef',
              fontFamily: 'Poppins, sans-serif'
            },
          }}
        />
        
        <Routes>
          {/* Customer Routes - Use customer styles */}
          <Route path="/" element={
            <div className="customer-body">
              <Home />
            </div>
          } />
          
          {/* Customer Authentication Routes */}
          <Route path="/login" element={
            <div className="customer-body">
              <Login />
            </div>
          } />
          <Route path="/register" element={
            <div className="customer-body">
              <Register />
            </div>
          } />

          <Route path="/products" element={
            <div className="customer-body">
              <ProductCatalog />
            </div>
          } />

          {/* Protected Customer Routes */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <div className="customer-body">
                <Checkout />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <div className="customer-body">
                <Orders />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="customer-body">
                <Profile />
              </div>
            </ProtectedRoute>
          } />

          {/* Public Customer Routes */}
          <Route path="/payment-callback" element={
            <div className="customer-body">
              <PaymentCallback />
            </div>
          } />
          <Route path="/order-success" element={
            <div className="customer-body">
              <OrderSuccess />
            </div>
          } />
          
          <Route path="/admin/products/:id" element={
            <div className="customer-body">
              <ProductDetail />
            </div>
          } />
          <Route path="/cart" element={
            <div className="customer-body">
              <ShoppingCart />
            </div>
          } />
          <Route path="/product/:id" element={
            <div className="customer-body">
              <CustomerProductDetail />
            </div>
          } />
          
          {/* Category Pages */}
          <Route path="/categories/:categorySlug" element={
            <div className="customer-body">
              <CategoryPage />
            </div>
          } />
          
          {/* Coming Soon Pages */}
          <Route path="/about" element={
            <div className="customer-body">
              <ComingSoon title="About Us" />
            </div>
          } />
          <Route path="/contact" element={
            <div className="customer-body">
              <ComingSoon title="Contact Us" />
            </div>
          } />

          {/* Admin Routes - Use admin styles */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <AdminProtectedRoute>
              <div className="admin-app">
                <AdminLayout />
              </div>
            </AdminProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="promotions" element={<PromotionsManagement />} />
          </Route>

          {/* Redirect to home for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    // ✅ CORRECT ORDER: CartProvider FIRST, then AuthProvider
    <CartProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </CartProvider>
  );
}

export default App;