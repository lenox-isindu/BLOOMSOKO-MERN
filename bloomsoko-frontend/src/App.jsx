import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Admin Components
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ProductsManagement from './pages/admin/ProductsManagement.jsx';

// Customer Components
import Home from './pages/Home.jsx';
import ProductCatalog from './components/ProductCatalog.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import ShoppingCart from './components/ShoppingCart.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import Checkout from './pages/Checkout.jsx';
import { CartProvider } from './context/CartContext';
import CustomerProductDetail from './components/CustomerProductDetail.jsx';

// CSS imports 
import './styles/globals.css';
import './styles/customer.css'; 

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

function App() {
  return (
    <CartProvider>
      <Router>
        {/* Remove global className to avoid conflicts */}
        <div>
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
            <Route path="/products" element={
              <div className="customer-body">
                <ProductCatalog />
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
      <Route path="/categories/:categorySlug" element={<CategoryPage />} />
      
      {/* Checkout */}
      <Route path="/checkout" element={<Checkout />} />
            
            {/*  - Use customer styles */}
            <Route path="/categories" element={
              <div className="customer-body">
                <ComingSoon title="Categories" />
              </div>
            } />
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
            <Route path="/admin/*" element={
              <div className="admin-app">
                <AdminLayout />
              </div>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="categories" element={<ComingSoon title="Categories Management" />} />
              <Route path="orders" element={<ComingSoon title="Orders Management" />} />
              <Route path="users" element={<ComingSoon title="Users Management" />} />
            </Route>

            {/* Redirect to home for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;