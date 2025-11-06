// src/components/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/products/${id}`);
            if (!response.ok) throw new Error('Failed to fetch product');
            
            const productData = await response.json();
            setProduct(productData);
        } catch (error) {
            console.error('Error fetching product:', error);
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
            const response = await fetch(`${API_BASE_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product._id || product.id,
                    quantity: quantity
                })
            });

            if (!response.ok) throw new Error('Failed to add to cart');
            
            alert(`${product.name} added to cart!`);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add to cart. Please try again.');
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
            <div className="loading" style={{ 
                textAlign: 'center', 
                padding: 'var(--space-8)',
                color: 'var(--primary-main)'
            }}>
                Loading product...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="error-message" style={{ 
                textAlign: 'center', 
                padding: 'var(--space-8)',
                color: 'var(--error-main)'
            }}>
                Product not found.
            </div>
        );
    }

    const categoryClass = getCategoryClass(product.category);
    const isFarmProduct = product.category?.toLowerCase() === 'farm';
    const isReady = isFarmProduct ? 
        !(product.subcategory && product.subcategory.toLowerCase().includes('notready')) : 
        true;

    return (
        <div className="product-detail">
            <div className="breadcrumbs" style={{ 
                padding: 'var(--space-4) 5%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
            }}>
                <Link to="/" style={{ color: 'var(--primary-main)', textDecoration: 'none' }}>
                    Home
                </Link> &gt;{' '}
                <Link to="/products" style={{ color: 'var(--primary-main)', textDecoration: 'none' }}>
                    Products
                </Link> &gt;{' '}
                <span>{product.name}</span>
            </div>
            
            <div style={{ 
                display: 'flex', 
                padding: 'var(--space-8) 5%',
                gap: 'var(--space-8)',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Product Images */}
                <div style={{ flex: 1 }}>
                    <div style={{ 
                        background: 'var(--bg-white)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        boxShadow: 'var(--shadow-md)',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <img 
                            src={product.images?.[selectedImage] || '/images/default-product.jpg'} 
                            alt={product.name}
                            style={{ 
                                width: '100%', 
                                height: '400px',
                                objectFit: 'cover',
                                borderRadius: 'var(--radius-md)'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto' }}>
                        {product.images?.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt={`${product.name} ${index + 1}`}
                                style={{ 
                                    width: '80px',
                                    height: '80px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    border: index === selectedImage ? '2px solid var(--primary-main)' : '1px solid var(--border-light)',
                                    opacity: index === selectedImage ? 1 : 0.7
                                }}
                                onClick={() => setSelectedImage(index)}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Product Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ 
                        background: 'var(--bg-white)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-6)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <h1 style={{ 
                            fontSize: 'var(--font-size-2xl)',
                            marginBottom: 'var(--space-4)',
                            color: 'var(--text-dark)'
                        }}>
                            {product.name}
                        </h1>
                        
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <span style={{ 
                                display: 'inline-block',
                                padding: 'var(--space-1) var(--space-3)',
                                borderRadius: '50px',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '600',
                                color: 'var(--text-light)',
                                background: `var(--${categoryClass}-pink)` 
                            }}>
                                {product.category}
                            </span>
                        </div>
                        
                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <span style={{ 
                                fontSize: 'var(--font-size-3xl)',
                                fontWeight: '700',
                                color: `var(--${categoryClass}-pink)`
                            }}>
                                KSh {product.price?.toLocaleString() || '0'}
                            </span>
                        </div>
                        
                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <p style={{ 
                                color: 'var(--text-secondary)',
                                lineHeight: '1.6'
                            }}>
                                {product.description || 'No description available.'}
                            </p>
                        </div>
                        
                        {/* Purchase Section */}
                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 'var(--space-4)',
                                marginBottom: 'var(--space-4)'
                            }}>
                                <label style={{ fontWeight: '600' }}>Quantity:</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                        style={{
                                            padding: 'var(--space-2)',
                                            border: '1px solid var(--border-light)',
                                            background: 'var(--bg-white)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                                            opacity: quantity <= 1 ? 0.5 : 1
                                        }}
                                    >
                                        -
                                    </button>
                                    <span style={{ 
                                        padding: 'var(--space-2) var(--space-4)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-sm)',
                                        minWidth: '50px',
                                        textAlign: 'center'
                                    }}>
                                        {quantity}
                                    </span>
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        disabled={product.stock !== undefined && quantity >= product.stock}
                                        style={{
                                            padding: 'var(--space-2)',
                                            border: '1px solid var(--border-light)',
                                            background: 'var(--bg-white)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: (product.stock !== undefined && quantity >= product.stock) ? 'not-allowed' : 'pointer',
                                            opacity: (product.stock !== undefined && quantity >= product.stock) ? 0.5 : 1
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                <button 
                                    style={{
                                        flex: 1,
                                        padding: 'var(--space-4)',
                                        background: `var(--${categoryClass}-pink)`,
                                        color: 'var(--text-light)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: '600',
                                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                                        opacity: product.stock === 0 ? 0.5 : 1
                                    }}
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                >
                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                
                                {isFarmProduct && !isReady && (
                                    <button style={{
                                        flex: 1,
                                        padding: 'var(--space-4)',
                                        background: `var(--${categoryClass}-pink)`,
                                        color: 'var(--text-light)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}>
                                        Book Now
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Product Meta */}
                        <div style={{ 
                            padding: 'var(--space-4)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{ marginBottom: 'var(--space-2)' }}>
                                <strong>Availability:</strong>{' '}
                                <span style={{ 
                                    color: product.stock > 0 ? 'var(--success-main)' : 'var(--error-main)',
                                    fontWeight: '600'
                                }}>
                                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>
                            {isFarmProduct && (
                                <div>
                                    <strong>Status:</strong>{' '}
                                    <span style={{ 
                                        color: isReady ? 'var(--success-main)' : 'var(--warning-main)',
                                        fontWeight: '600'
                                    }}>
                                        {isReady ? 'Available Now' : 'Pre-order'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;