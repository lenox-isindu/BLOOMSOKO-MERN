import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import ProductForm from '../../components/admin/ProductForm.jsx';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

 
  const fetchProducts = async () => {
  try {
    setLoading(true);
    
    // Get the API URL from environment or use default
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    console.log('🔄 Fetching products from:', `${API_URL}/admin/products`);
    
    // Get admin token from storage
    const adminToken = localStorage.getItem('adminToken');
    
    // Prepare headers with authorization
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token exists
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    const response = await fetch(`${API_URL}/admin/products`, {
      headers: headers
    });
    
    // Check for authentication errors
    if (response.status === 401 || response.status === 403) {
      toast.error('Admin authentication required. Please login again.');
      // Optionally redirect to admin login
      // window.location.href = '/admin/login';
      setProducts([]);
      return;
    }
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    // Your backend returns { products: [], totalPages, currentPage, total }
    if (data.products) {
      setProducts(data.products);
      console.log(`✅ Loaded ${data.products.length} products`);
    } else {
      console.warn('❌ No products found in response');
      setProducts([]);
    }
    
  } catch (error) {
    console.error('❌ Fetch error:', error);
    
    // Better error messages based on error type
    if (error.message.includes('Failed to fetch')) {
      toast.error('Cannot connect to server. Check if backend is running.');
    } else if (error.message.includes('NetworkError')) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('Failed to load products. Check console for details.');
    }
    
    setProducts([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProducts();
  }, []);

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(productId);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  // Edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Add new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-6)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            color: 'var(--text-dark)',
            marginBottom: 'var(--space-2)'
          }}>
            Products <span className="accent-gold">Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your product catalog and inventory
          </p>
        </div>
        <button 
          className="btn btn-gold"
          onClick={handleAddProduct}
        >
          <span>+</span>
          Add Product
        </button>
      </div>

      {/* Debug Info */}
      <div style={{ 
        padding: 'var(--space-3)',
        backgroundColor: 'var(--bg-light)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-4)',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
           {products.length} products loaded  
          <button 
            onClick={fetchProducts}
            style={{ 
              marginLeft: 'var(--space-2)',
              background: 'none',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-xs)'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>🛍️</span>
            All Products ({products.length})
          </h3>
        </div>
        
        <div className="card-body">
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              <p>No products found.</p>
              <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                This could mean: no products in database, API connection issue, or server error.
              </p>
              <button 
                className="btn btn-gold"
                onClick={handleAddProduct}
                style={{ marginTop: 'var(--space-4)' }}
              >
                Add Your First Product
              </button>
              <button 
                className="btn btn-secondary"
                onClick={fetchProducts}
                style={{ marginTop: 'var(--space-4)', marginLeft: 'var(--space-2)' }}
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse' 
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '2px solid var(--border-light)',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: 'var(--space-4)' }}>Product</th>
                    <th style={{ padding: 'var(--space-4)' }}>Price</th>
                    <th style={{ padding: 'var(--space-4)' }}>Stock</th>
                    <th style={{ padding: 'var(--space-4)' }}>Status</th>
                    <th style={{ padding: 'var(--space-4)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          {product.featuredImage?.url ? (
                            <img 
                              src={product.featuredImage.url} 
                              alt={product.featuredImage.alt || product.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: 'var(--radius-md)',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-gray)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-light)'
                            }}>
                              🖼️
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)' }}>
                              {product.category?.name || 'Uncategorized'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          KSh {product.price?.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '600' }}>
                          {product.inventory?.stock || 0}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span style={{ 
                          backgroundColor: product.status === 'active' ? 'var(--success)' : 'var(--error)',
                          color: 'white',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: '600'
                        }}>
                          {product.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: 'var(--space-2) var(--space-3)' }}
                            onClick={() => handleEditProduct(product)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger"
                            style={{ padding: 'var(--space-2) var(--space-3)' }}
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm 
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

export default ProductsManagement;