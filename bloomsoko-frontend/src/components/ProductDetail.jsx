// src/components/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [debugMode, setDebugMode] = useState(true);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchProduct();
        
        // Auto-refresh every 3 seconds
        const interval = setInterval(fetchProduct, 3000);
        
        return () => clearInterval(interval);
    }, [id]);

    const fetchProduct = async () => {
        try {
            console.log('🔄 FETCHING PRODUCT FROM:', `${API_BASE_URL}/products/${id}`);
            
            const response = await fetch(`${API_BASE_URL}/products/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch product`);
            }
            
            const productData = await response.json();
            
            console.log('📦 PRODUCT DATA RECEIVED:', {
                name: productData.name,
                stock: productData.inventory?.stock,
                reservedStock: productData.inventory?.reservedStock,
                availableStock: productData.inventory ? 
                    (productData.inventory.stock - productData.inventory.reservedStock) : 0
            });

            setProduct(productData);
            
        } catch (error) {
            console.error('❌ Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            console.log('🛒 ADDING TO CART:', { productId: product._id, quantity });

            const response = await fetch(`${API_BASE_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product._id,
                    quantity: quantity
                })
            });

            console.log('🛒 CART RESPONSE STATUS:', response.status, response.ok);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add to cart');
            }
            
            const result = await response.json();
            console.log('✅ ADD TO CART RESULT:', result);
            
            alert(`${product.name} added to cart!`);
            
            // Force immediate refresh
            await fetchProduct();
            
        } catch (error) {
            console.error('❌ Add to cart error:', error);
            alert(error.message || 'Failed to add to cart. Please try again.');
        }
    };

    const getCategoryClass = (category) => {
        const categoryMap = {
            'fashion': 'fashion',
            'cosmetics': 'cosmetics',
            'home': 'home',
            'farm': 'farm'
        };
        return categoryMap[category?.toLowerCase()] || 'farm';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Loading product...</h2>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Product not found.</h2>
            </div>
        );
    }

    // Calculate available stock (stock - reservedStock)
    const availableStock = product.inventory ? 
        (product.inventory.stock - product.inventory.reservedStock) : 0;

    const categoryClass = getCategoryClass(product.category);
    const isFarmProduct = product.category?.toLowerCase() === 'farm';
    const isReady = isFarmProduct ? 
        !(product.subcategory && product.subcategory.toLowerCase().includes('notready')) : 
        true;

    return (
        <div>
            {/* BIG RED DEBUG BUTTON - CAN'T MISS IT */}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                background: debugMode ? '#dc3545' : '#28a745',
                color: 'white',
                padding: '15px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                border: '3px solid white'
            }}>
                <div onClick={() => setDebugMode(!debugMode)}>
                    {debugMode ? '🔴 DEBUG ON' : '🟢 DEBUG OFF'}
                </div>
            </div>

            <div className="breadcrumbs" style={{ 
                padding: '20px 5%',
                background: '#f8f9fa'
            }}>
                <Link to="/" style={{ color: '#2E7D32', textDecoration: 'none' }}>
                    Home
                </Link> &gt;{' '}
                <Link to="/products" style={{ color: '#2E7D32', textDecoration: 'none' }}>
                    Products
                </Link> &gt;{' '}
                <span>{product.name}</span>
            </div>
            
            <div style={{ 
                display: 'flex', 
                padding: '40px 5%',
                gap: '40px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Product Images */}
                <div style={{ flex: 1 }}>
                    <div style={{ 
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        marginBottom: '20px'
                    }}>
                        <img 
                            src={product.featuredImage?.url || '/images/default-product.jpg'} 
                            alt={product.name}
                            style={{ 
                                width: '100%', 
                                height: '400px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                            }}
                        />
                    </div>
                </div>
                
                {/* Product Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ 
                        background: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                        <h1 style={{ 
                            fontSize: '28px',
                            marginBottom: '20px',
                            color: '#333'
                        }}>
                            {product.name}
                        </h1>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <span style={{ 
                                display: 'inline-block',
                                padding: '5px 15px',
                                borderRadius: '50px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: 'white',
                                background: '#2E7D32'
                            }}>
                                {product.category}
                            </span>
                        </div>
                        
                        <div style={{ marginBottom: '30px' }}>
                            <span style={{ 
                                fontSize: '32px',
                                fontWeight: '700',
                                color: '#2E7D32'
                            }}>
                                KSh {product.price?.toLocaleString() || '0'}
                            </span>
                        </div>
                        
                        <div style={{ marginBottom: '30px' }}>
                            <p style={{ 
                                color: '#666',
                                lineHeight: '1.6'
                            }}>
                                {product.description || 'No description available.'}
                            </p>
                        </div>

                        {/* DEBUG INFORMATION - BIG AND CLEAR */}
                        {debugMode && (
                            <div style={{
                                background: '#fff3cd',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                border: '3px solid #ffc107'
                            }}>
                                <h3 style={{ 
                                    color: '#856404', 
                                    margin: '0 0 15px 0'
                                }}>
                                    🐛 DEBUG INFORMATION
                                </h3>
                                
                                <div style={{ 
                                    background: 'white',
                                    padding: '15px',
                                    borderRadius: '6px',
                                    marginBottom: '15px',
                                    border: '1px solid #ffeaa7'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                                        CURRENT PRODUCT DATA:
                                    </h4>
                                    <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                                        <div>📦 Product ID: <strong>{product._id}</strong></div>
                                        <div>🏷️ Name: <strong>{product.name}</strong></div>
                                        <div>📊 Stock: <strong style={{color: '#1976d2'}}>{product.inventory?.stock}</strong></div>
                                        <div>🔒 Reserved: <strong style={{color: '#f57c00'}}>{product.inventory?.reservedStock}</strong></div>
                                        <div>🛒 Available: <strong style={{color: availableStock > 0 ? '#28a745' : '#dc3545'}}>{availableStock}</strong></div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        console.log('🧪 MANUAL DEBUG CHECK - FULL PRODUCT DATA:', product);
                                        console.log('🧪 CALCULATION:');
                                        console.log('   Stock:', product.inventory?.stock);
                                        console.log('   Reserved:', product.inventory?.reservedStock);
                                        console.log('   Available (Stock - Reserved):', availableStock);
                                        alert('Check browser console for detailed debug info!');
                                    }}
                                    style={{
                                        background: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 15px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        width: '100%'
                                    }}
                                >
                                    🧪 CLICK ME - Check Console for Debug Info
                                </button>
                            </div>
                        )}

                        {/* Inventory Tracker */}
                        <div style={{
                            background: '#e3f2fd',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '2px solid #2196f3'
                        }}>
                            <h3 style={{ 
                                color: '#1565c0', 
                                margin: '0 0 15px 0'
                            }}>
                                📊 INVENTORY STATUS
                            </h3>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '15px',
                                textAlign: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>TOTAL STOCK</div>
                                    <div style={{ fontSize: '24px', color: '#1976d2', fontWeight: 'bold' }}>
                                        {product.inventory?.stock || 0}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>RESERVED</div>
                                    <div style={{ fontSize: '24px', color: '#f57c00', fontWeight: 'bold' }}>
                                        {product.inventory?.reservedStock || 0}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>AVAILABLE</div>
                                    <div style={{ 
                                        fontSize: '24px', 
                                        color: availableStock > 0 ? '#2e7d32' : '#dc3545',
                                        fontWeight: 'bold'
                                    }}>
                                        {availableStock}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Purchase Section */}
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '20px',
                                marginBottom: '20px'
                            }}>
                                <label style={{ fontWeight: '600', fontSize: '18px' }}>Quantity:</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                        style={{
                                            padding: '12px 16px',
                                            border: '1px solid #ddd',
                                            background: quantity <= 1 ? '#f5f5f5' : '#fff',
                                            borderRadius: '6px',
                                            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            minWidth: '50px'
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ 
                                        padding: '12px 24px',
                                        border: '2px solid #2E7D32',
                                        borderRadius: '6px',
                                        minWidth: '80px',
                                        textAlign: 'center',
                                        background: '#f8fff8',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#2E7D32'
                                    }}>
                                        {quantity}
                                    </span>
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        disabled={quantity >= availableStock}
                                        style={{
                                            padding: '12px 16px',
                                            border: '1px solid #ddd',
                                            background: quantity >= availableStock ? '#f5f5f5' : '#fff',
                                            borderRadius: '6px',
                                            cursor: quantity >= availableStock ? 'not-allowed' : 'pointer',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            minWidth: '50px'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            
                            <button 
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: availableStock === 0 ? '#ccc' : '#2E7D32',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: availableStock === 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '18px',
                                    transition: 'all 0.3s ease'
                                }}
                                onClick={handleAddToCart}
                                disabled={availableStock === 0}
                                onMouseOver={(e) => {
                                    if (availableStock > 0) {
                                        e.target.style.opacity = '0.9';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (availableStock > 0) {
                                        e.target.style.opacity = '1';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {availableStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '10px', 
                            marginTop: '20px'
                        }}>
                            <button 
                                onClick={fetchProduct}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #6c757d',
                                    color: '#6c757d',
                                    padding: '8px 15px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                🔄 Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;