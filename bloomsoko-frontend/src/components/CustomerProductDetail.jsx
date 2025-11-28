import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './CustomerProductDetail.module.css';

const CustomerProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, getCartCount } = useCart();
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [cartCount, setCartCount] = useState(0);
    const [debugMode] = useState(true); // Added debug mode

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchProduct();
        updateCartCount();
        
        // Listen for inventory updates
        const handleInventoryUpdate = () => {
            console.log('🔄 Inventory update detected, refreshing product...');
            fetchProduct();
        };

        const handleRefreshAllProducts = () => {
            console.log('🔄 Refreshing product...');
            fetchProduct();
        };

        window.addEventListener('inventoryUpdated', handleInventoryUpdate);
        window.addEventListener('refreshAllProducts', handleRefreshAllProducts);
        
        return () => {
            window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
            window.removeEventListener('refreshAllProducts', handleRefreshAllProducts);
        };
    }, [id]);

    useEffect(() => {
        const count = getCartCount();
        console.log('Current cart count:', count);
        setCartCount(count || 0);
    }, [getCartCount]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API_URL}/products/${id}`);
            
            if (!response.ok) {
                throw new Error('Product not found');
            }
            
            const productData = await response.json();
            setProduct(productData);
            
            // Debug: Log inventory data
            if (debugMode && productData) {
                const availableStock = productData.inventory ? 
                    (productData.inventory.stock - (productData.inventory.reservedStock || 0)) : 0;
                
                console.log('🧪 PRODUCT DETAIL INVENTORY DEBUG:', {
                    name: productData.name,
                    id: productData._id,
                    stock: productData.inventory?.stock,
                    reservedStock: productData.inventory?.reservedStock,
                    availableStock: availableStock,
                    showsInStock: productData.inventory?.stock > 0,
                    shouldShowAvailable: availableStock > 0
                });
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateCartCount = () => {
        const count = getCartCount();
        console.log('Updating cart count:', count);
        setCartCount(count || 0);
    };

    // Debug function to test inventory data
    const testInventoryDebug = () => {
        if (!product) return;
        
        console.log('🧪 MANUAL INVENTORY DEBUG TEST - PRODUCT DETAIL:');
        const availableStock = product.inventory ? 
            (product.inventory.stock - (product.inventory.reservedStock || 0)) : 0;
        
        console.log('📦 PRODUCT INVENTORY DETAILS:', {
            name: product.name,
            id: product._id,
            stock: product.inventory?.stock,
            reservedStock: product.inventory?.reservedStock,
            availableStock: availableStock,
            showsInStock: product.inventory?.stock > 0,
            shouldShowAvailable: availableStock > 0,
            maxQuantity: availableStock
        });
        
        alert('Check browser console for product inventory debug info!');
    };

    const getCategoryClass = (category) => {
        let categoryName = '';

        if (typeof category === 'string') {
            categoryName = category;
        } else if (Array.isArray(category)) {
            const first = category[0];
            if (typeof first === 'string') {
                categoryName = first;
            } else if (first && typeof first === 'object') {
                categoryName = first.name || '';
            }
        } else if (category && typeof category === 'object') {
            categoryName = category.name || '';
        }

        if (typeof categoryName !== 'string') {
            categoryName = '';
        }

        const categoryMap = {
            'agricultural produce': 'farm',
            'agriculture': 'farm',
            'beauty': 'cosmetics',
            'fashion': 'fashion',
            'household': 'home',
            'house & garden': 'home',
        };

        const lowerName = String(categoryName).toLowerCase();
        return categoryMap[lowerName] || 'farm';
    };

    const isFarmProduct = (product) => {
        if (!product) return false;

        let categoryName = '';
        const category = product.category;

        if (typeof category === 'string') {
            categoryName = category;
        } else if (Array.isArray(category)) {
            const first = category[0];
            if (typeof first === 'string') {
                categoryName = first;
            } else if (first && typeof first === 'object') {
                categoryName = first.name || '';
            }
        } else if (category && typeof category === 'object') {
            categoryName = category.name || '';
        }

        if (typeof categoryName !== 'string') {
            return false;
        }

        const lower = String(categoryName).toLowerCase();
        return lower.includes('agriculture') || lower.includes('farm');
    };

    const getCategoryName = (category) => {
        let categoryName = '';

        if (typeof category === 'string') {
            categoryName = category;
        } else if (Array.isArray(category)) {
            const first = category[0];
            if (typeof first === 'string') {
                categoryName = first;
            } else if (first && typeof first === 'object') {
                categoryName = first.name || '';
            }
        } else if (category && typeof category === 'object') {
            categoryName = category.name || '';
        }

        if (typeof categoryName !== 'string') {
            categoryName = 'Uncategorized';
        }
        
        return categoryName || 'Uncategorized';
    };

    // Calculate available stock
    const getAvailableStock = () => {
        if (!product || !product.inventory) return 0;
        return product.inventory.stock - (product.inventory.reservedStock || 0);
    };

    const handleAddToCart = () => {
        if (!product) return;
        
        // Check if user is authenticated
        const user = localStorage.getItem('bloomsoko-user');
        if (!user) {
            navigate('/login', { 
                state: { from: `/product/${product._id}` },
                replace: true 
            });
            return;
        }

        const categoryName = getCategoryName(product.category);
        const isFarm = isFarmProduct(product);
        const isReady = product.productType === 'ready';
        const shouldBook = isFarm && !isReady;
        const availableStock = getAvailableStock();

        // Check stock availability for ready products
        if (isReady && availableStock === 0) {
            alert('❌ Sorry, this product is out of stock!');
            return;
        }

        // Check if quantity exceeds available stock
        if (isReady && quantity > availableStock) {
            alert(`❌ Only ${availableStock} units available!`);
            return;
        }

        addToCart(product, quantity, shouldBook);
        updateCartCount();

        // Refresh product to get updated inventory
        setTimeout(() => {
            fetchProduct();
        }, 500);

        const message = shouldBook 
            ? `📅 ${product.name} booked successfully! We'll contact you when ready.`
            : `🛒 ${product.name} (${quantity}) added to cart!`;
        
        alert(message);
    };

    const getGrowingProgress = (product) => {
        if (product.productType === 'ready') return null;
        
        const progress = product.growingDetails?.progress || 50;
        const stage = product.growingDetails?.currentStage || 'growing';
        
        const stageLabels = {
            'planting': ' Planting',
            'growing': ' Growing', 
            'almost-ready': ' Almost Ready',
            'ready': ' Ready'
        };
        
        return {
            label: stageLabels[stage] || ' Growing',
            progress: progress,
            expectedDate: product.growingDetails?.expectedReadyDate 
                ? new Date(product.growingDetails.expectedReadyDate).toLocaleDateString()
                : null
        };
    };

    // Calculate total price based on quantity
    const calculateTotalPrice = () => {
        if (!product) return 0;
        return product.price * quantity;
    };

    // Get product badges
    const getProductBadges = (product) => {
        const badges = [];
        const availableStock = getAvailableStock();
        
        if (availableStock <= 0) {
            badges.push({ text: 'Out of Stock', class: 'outOfStock' });
        }
        
        if (product.productType === 'growing') {
            badges.push({ text: '🌱 Growing', class: 'growing' });
        } else if (product.productType === 'pre-order') {
            badges.push({ text: '📅 Pre-order', class: 'preOrder' });
        }
        
        if (product.flags?.isNew) badges.push({ text: '🆕 New', class: 'new' });
        if (product.flags?.isLimited) badges.push({ text: '⏰ Limited', class: 'limited' });
        if (product.flags?.onSale) badges.push({ text: '🏷️ Offer', class: 'sale' });
        if (product.flags?.isBestSeller) badges.push({ text: '🔥 Best Seller', class: 'bestSeller' });
        
        return badges.slice(0, 2);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div>Loading product...</div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={styles.errorContainer}>
                <h2>Product Not Found</h2>
                <p>{error || 'The product you are looking for does not exist.'}</p>
                <Link to="/products" className={styles.backButton}>
                    ← Back to Products
                </Link>
            </div>
        );
    }

    const categoryClass = getCategoryClass(product.category);
    const isFarm = isFarmProduct(product);
    const isReady = product.productType === 'ready';
    const buttonText = isFarm && !isReady ? 'Book Now' : 'Add to Cart';
    const growingProgress = getGrowingProgress(product);
    const availableStock = getAvailableStock();
    const badges = getProductBadges(product);

    const allImages = [
        product.featuredImage,
        ...(product.images || [])
    ].filter(img => img && img.url);

    return (
        <div className={styles.customerProductDetail}>
        

            {/* Cart Header */}
            <div className={styles.cartHeader}>
                <Link to="/cart" className={styles.cartLink}>
                    <span className={styles.cartIcon}>🛒</span>
                    {cartCount > 0 && (
                        <span className={styles.cartCount}>{cartCount}</span>
                    )}
                    <span className={styles.cartText}>Cart</span>
                </Link>
            </div>

            <div className={styles.breadcrumbs}>
                <Link to="/">Home</Link> &gt; 
                <Link to="/products">Products</Link> &gt; 
                <span>{product.name}</span>
            </div>

            <div className={styles.productContainer}>
                {/* Product Images */}
                <div className={styles.imageSection}>
                    <div className={styles.mainImage}>
                        {allImages.length > 0 ? (
                            <img 
                                src={allImages[selectedImage]?.url} 
                                alt={allImages[selectedImage]?.alt || product.name}
                            />
                        ) : (
                            <div className={styles.noImage}>No Image Available</div>
                        )}
                        
                        {/* Badges on main image */}
                        <div className={styles.badgeContainer}>
                            {badges.map((badge, index) => (
                                <span key={index} className={`${styles.productBadge} ${styles[badge.class]}`}>
                                    {badge.text}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {allImages.length > 1 && (
                        <div className={styles.thumbnailContainer}>
                            {allImages.map((image, index) => (
                                <div 
                                    key={index}
                                    className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <img src={image.url} alt={image.alt || `${product.name} ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className={styles.infoSection}>
                    <div className={styles.categoryBadge}>
                        {getCategoryName(product.category)}
                    </div>

                    <h1 className={styles.productTitle}>{product.name}</h1>
                    
                    <p className={styles.productDescription}>{product.description}</p>

                    {product.tags && product.tags.length > 0 && (
                        <div className={styles.tags}>
                            {product.tags.map((tag, index) => (
                                <span key={index} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Growing Progress */}
                    {growingProgress && (
                        <div className={styles.growingInfo}>
                            <h3>Growing Progress</h3>
                            <div className={styles.progressLabel}>{growingProgress.label}</div>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill}
                                    style={{ width: `${growingProgress.progress}%` }}
                                ></div>
                            </div>
                            <div className={styles.progressText}>
                                {growingProgress.progress}% Complete
                                {growingProgress.expectedDate && (
                                    <span> • Expected: {growingProgress.expectedDate}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Price Section */}
                    <div className={styles.priceSection}>
                        <span className={`${styles.currentPrice} ${styles[categoryClass]}`}>
                            KSh {product.price?.toLocaleString()}
                        </span>
                        {product.comparePrice > product.price && (
                            <span className={styles.comparePrice}>
                                KSh {product.comparePrice?.toLocaleString()}
                            </span>
                        )}
                        {product.flags?.onSale && (
                            <span className={styles.discountBadge}>
                                Save {Math.round((1 - product.price / product.comparePrice) * 100)}%
                            </span>
                        )}
                    </div>

                    {/* Total Price for Quantity */}
                    {quantity > 1 && (
                        <div className={styles.totalPriceSection}>
                            <span className={styles.totalPriceLabel}>Total for {quantity} items:</span>
                            <span className={`${styles.totalPrice} ${styles[categoryClass]}`}>
                                KSh {calculateTotalPrice().toLocaleString()}
                            </span>
                        </div>
                    )}

                    {/* Stock Information - UPDATED with proper inventory calculation */}
                    <div className={styles.stockInfo}>
                        {isReady ? (
                            <>
                                <span className={`${styles.stockStatus} ${availableStock > 0 ? styles.inStock : styles.outOfStock}`}>
                                    {availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                                {availableStock > 0 && (
                                    <span className={styles.stockQuantity}>
                                        {availableStock} units available
                                        {/* Show detailed inventory info in debug mode */}
                                        {debugMode && product.inventory?.reservedStock > 0 && (
                                            <span style={{
                                                fontSize: '0.8em', 
                                                color: '#666', 
                                                display: 'block',
                                                fontStyle: 'italic',
                                                marginTop: '5px'
                                            }}>
                                                ({product.inventory.stock} total - {product.inventory.reservedStock} reserved)
                                            </span>
                                        )}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className={styles.preOrderStatus}>
                                📅 Available for Pre-order
                            </span>
                        )}
                    </div>

                    {/* Additional Flags */}
                    <div className={styles.additionalFlags}>
                        {product.flags?.isEcoFriendly && <span title="Eco Friendly">🌱 Eco Friendly</span>}
                        {product.flags?.isOrganic && <span title="Organic">🍃 Organic</span>}
                        {product.flags?.isHandmade && <span title="Handmade">✋ Handmade</span>}
                        {product.flags?.isLocal && <span title="Local">🏠 Local</span>}
                        {product.flags?.isPremium && <span title="Premium">💎 Premium</span>}
                        {product.flags?.isQuickDelivery && <span title="Quick Delivery">🚚 Fast Delivery</span>}
                        {product.flags?.isSeasonal && <span title="Seasonal">🍂 Seasonal</span>}
                    </div>

                    {/* Add to Cart Section */}
                    <div className={styles.actionSection}>
                        <div className={styles.quantitySelector}>
                            <label>Quantity:</label>
                            <div className={styles.quantityControls}>
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span>{quantity}</span>
                                <button 
                                    onClick={() => setQuantity(quantity + 1)}
                                    disabled={isReady && availableStock && quantity >= availableStock}
                                >
                                    +
                                </button>
                            </div>
                            {isReady && availableStock > 0 && (
                                <div className={styles.maxQuantityNote}>
                                    Maximum: {availableStock} units
                                </div>
                            )}
                        </div>

                        <button 
                            className={`${styles.addToCartButton} ${styles[categoryClass]}`}
                            onClick={handleAddToCart}
                            disabled={availableStock === 0 && isReady}
                        >
                            {availableStock === 0 && isReady
                                ? 'Out of Stock' 
                                : `${buttonText} (${quantity})`
                            }
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                        <Link to="/products" className={styles.continueShopping}>
                            ← Continue Shopping
                        </Link>
                        <Link to="/cart" className={styles.viewCart}>
                            View Cart →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerProductDetail;