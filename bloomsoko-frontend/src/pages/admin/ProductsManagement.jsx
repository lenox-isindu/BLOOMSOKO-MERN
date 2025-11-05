import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import ProductForm from '../../components/admin/ProductForm.jsx';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
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
        fetchProducts(); // Refresh the list
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
              <button 
                className="btn btn-gold"
                onClick={handleAddProduct}
                style={{ marginTop: 'var(--space-4)' }}
              >
                Add Your First Product
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
                    <tr 
                      key={product._id}
                      style={{ 
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.parentNode.style.backgroundColor = 'var(--bg-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.parentNode.style.backgroundColor = 'transparent';
                      }}
                    >
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
                            <div style={{ 
                              fontWeight: '600', 
                              color: 'var(--text-dark)',
                              marginBottom: 'var(--space-1)'
                            }}>
                              {product.name}
                            </div>
                            <div style={{ 
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--text-light)'
                            }}>
                              {product.category?.name || 'Uncategorized'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                          ₦{product.price?.toLocaleString()}
                        </div>
                        {product.comparePrice > product.price && (
                          <div style={{ 
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-light)',
                            textDecoration: 'line-through'
                          }}>
                            ₦{product.comparePrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <div style={{ 
                          fontWeight: '600',
                          color: product.inventory.stock === 0 ? 'var(--error)' : 
                                 product.inventory.stock <= 10 ? 'var(--warning)' : 'var(--success)'
                        }}>
                          {product.inventory.stock}
                        </div>
                        {product.inventory.stock <= 10 && product.inventory.stock > 0 && (
                          <div style={{ 
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--warning)'
                          }}>
                            Low stock
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span 
                          className="badge-gold"
                          style={{ 
                            backgroundColor: product.status === 'active' ? 'var(--success)' : 
                                           product.status === 'draft' ? 'var(--warning)' : 'var(--error)',
                            color: 'white',
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '600'
                          }}
                        >
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

      {/* Product Form Modal - We'll implement this next */}
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
            fetchProducts(); // Refresh the list
          }}
        />
      )}
    </div>
  );
};




export default ProductsManagement;