import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/globals.css';


// Admin Components
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ProductsManagement from './pages/admin/ProductsManagement.jsx';

// Customer Components
import Home from './pages/Home.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--gray-200)',
            },
          }}
        />
        
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          
          {/* Coming Soon Pages */}
          <Route path="/shop" element={<ComingSoon title="Shop" />} />
          <Route path="/product/:id" element={<ComingSoon title="Product Details" />} />
          <Route path="/cart" element={<ComingSoon title="Shopping Cart" />} />
          <Route path="/categories" element={<ComingSoon title="Categories" />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<div>Categories Management - Coming Soon</div>} />
            <Route path="orders" element={<div>Orders Management - Coming Soon</div>} />
            <Route path="users" element={<div>Users Management - Coming Soon</div>} />
          </Route>

          {/* Redirect to home for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}


export default App;