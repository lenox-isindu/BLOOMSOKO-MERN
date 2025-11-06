import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './ProductCatalog.module.css';

const ProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentCategory, setCurrentCategory] = useState('all');
    const [currentSort, setCurrentSort] = useState('createdAt:desc');
    const [currentMaxPrice, setCurrentMaxPrice] = useState(200000);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFlags, setSelectedFlags] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const { addToCart, getCartCount } = useCart();
    const [cartCount, setCartCount] = useState(0);
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const urlCategory = searchParams.get('category');
        if (urlCategory) {
            setCurrentCategory(urlCategory);
        }
        
        fetchCategories();
        fetchProducts();
    }, [currentCategory, currentSort, currentMaxPrice, searchQuery, selectedFlags]);

    useEffect(() => {
        setCartCount(getCartCount());
    }, [getCartCount]);

    // Fetch categories from backend
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/categories`);
            if (response.ok) {
                const data = await response.json();
                // Get only main categories (level 1)
                const mainCategories = (data.categories || data || []).filter(cat => cat.level === 1);
                setCategories(mainCategories);
            } else {
                console.error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Fetch products 
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams();

            // Add category filter
            if (currentCategory !== 'all') {
                params.append('category', currentCategory);
            }

            // Add search filter
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            // Add price filter
            params.append('maxPrice', currentMaxPrice);
            
            // Add sort - convert to backend format
            const [sortField, sortDirection] = currentSort.split(':');
            params.append('sort', `${sortField}:${sortDirection}`);

            // Add flags
            selectedFlags.forEach(flag => {
                params.append(flag, 'true');
            });

            const queryString = params.toString();
            const url = `${API_URL}/products?${queryString}`;

            console.log('Fetching products from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }
            
            const data = await response.json();
            const productsData = data.products || data || [];
            
            console.log('Fetched products:', productsData.length);
            setProducts(productsData);
            
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products. Please check if the server is running.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle category selection
    const handleCategoryClick = (categoryName) => {
        setCurrentCategory(categoryName);
        navigate(`/products?category=${encodeURIComponent(categoryName)}`, { replace: true });
        setIsSidebarOpen(false);
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    // Handle price filter change
    const handlePriceFilterChange = (value) => {
        const priceValue = parseInt(value);
        setCurrentMaxPrice(priceValue);
    };

    // Handle price input change
    const handlePriceInputChange = (e) => {
        let value = parseInt(e.target.value) || 0;
        if (value > 200000) value = 200000;
        if (value < 0) value = 0;
        setCurrentMaxPrice(value);
    };

    // Handle flag filters
    const toggleFlagFilter = (flag) => {
        setSelectedFlags(prev => 
            prev.includes(flag) 
                ? prev.filter(f => f !== flag)
                : [...prev, flag]
        );
    };

    // Toggle sidebar for mobile
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Add to cart handler
    const handleAddToCart = (product) => {
        const categoryName = product.category?.name || product.category || 'Uncategorized';
        const isFarmProduct = categoryName.toLowerCase().includes('agriculture') || 
                            categoryName.toLowerCase().includes('farm');
        const isReady = product.productType === 'ready';
        
        const shouldBook = isFarmProduct && !isReady;
        
        addToCart(product, 1, shouldBook);
        
        if (shouldBook) {
            alert(`📅 ${product.name} booked successfully! We'll contact you when ready.`);
        } else {
            alert(`🛒 ${product.name} added to cart!`);
        }
    };

    // Get category class for styling
    const getCategoryClass = (categoryName) => {
        const categoryMap = {
            'Agricultural Produce': 'farm',
            'Agriculture': 'farm',
            'Beauty': 'cosmetics',
            'Fashion': 'fashion',
            'Household': 'home',
            'House & Garden': 'home'
        };
        return categoryMap[categoryName] || 'farm';
    };

    // Get product badges
    const getProductBadges = (product) => {
    const badges = [];
    
    if (product.flags?.isOutOfStock || product.inventory?.stock === 0) {
        badges.push({ text: 'Out of Stock', class: 'outOfStock' });
    }
    
    if (product.productType === 'growing') {
        badges.push({ text: '🌱 Growing', class: 'growing' });
    } else if (product.productType === 'pre-order') {
        badges.push({ text: '📅 Pre-order', class: 'preOrder' });
    }
    
    // Updated badge priorities
    if (product.flags?.isNew) badges.push({ text: '🆕 New', class: 'new' });
    if (product.flags?.isLimited) badges.push({ text: '⏰ Limited', class: 'limited' });
    if (product.flags?.onSale) badges.push({ text: '🏷️ Offer', class: 'sale' });
    if (product.flags?.isBestSeller) badges.push({ text: '🔥 Best Seller', class: 'bestSeller' });
    
    return badges.slice(0, 2);
};

    // Get growing progress for growing products
    const getGrowingProgress = (product) => {
        if (product.productType === 'ready') return null;
        
        const progress = product.growingDetails?.progress || 50;
        const stage = product.growingDetails?.currentStage || 'growing';
        
        const stageLabels = {
            'planting': 'Planting',
            'growing': ' Growing', 
            'almost-ready': ' Almost Ready',
            'ready': ' Ready'
        };
        
        return {
            label: stageLabels[stage] || ' Growing',
            progress: progress
        };
    };

    // Clear all filters
    const clearAllFilters = () => {
        setCurrentCategory('all');
        setCurrentMaxPrice(200000);
        setSelectedFlags([]);
        setSearchQuery('');
        navigate('/products', { replace: true });
    };

    return (
        <div className={styles.productCatalog}>
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

            {/* Mobile Sidebar Toggle */}
            <button className={styles.sidebarToggle} onClick={toggleSidebar}>
                ☰ Filters
            </button>

            {isSidebarOpen && (
                <div className={styles.sidebarOverlay} onClick={toggleSidebar}></div>
            )}

            {/* Top Search Bar */}
            <div className={styles.topSearchBar}>
                <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                    <input 
                        type="text" 
                        placeholder="Search products by name, description, or tags..." 
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <button type="submit" className={styles.searchButton}>
                        🔍 Search
                    </button>
                </form>
            </div>

            {/* Header */}
            <div className={styles.shopHeader}>
                <h1>
                    {currentCategory === 'all' ? 'All Products' : currentCategory}
                    {products.length > 0 && ` (${products.length} items)`}
                </h1>
                <div className={styles.breadcrumbs}>
                    <Link to="/">Home</Link> &gt; 
                    <Link to="/products">Products</Link> &gt; 
                    <span>{currentCategory === 'all' ? 'All Categories' : currentCategory}</span>
                </div>
            </div>
            
            {/* Main Content */}
            <div className={styles.shopContainer}>
                {/* Sidebar Filters */}
                <aside className={`${styles.filters} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <h3>Filters & Categories</h3>
                        <button className={styles.closeSidebar} onClick={toggleSidebar}>×</button>
                    </div>
                    
                    {/* Categories Section */}
                    <div className={styles.filterSection}>
                        <h3>Categories</h3>
                        <ul className={styles.categoryList}>
                            <li>
                                <button 
                                    className={currentCategory === 'all' ? styles.active : ''}
                                    onClick={() => handleCategoryClick('all')}
                                >
                                    All Products
                                </button>
                            </li>
                            {categories.map(category => (
                                <li key={category._id}>
                                    <button 
                                        className={currentCategory === category.name ? styles.active : ''}
                                        onClick={() => handleCategoryClick(category.name)}
                                    >
                                        {category.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Product Features */}
<div className={styles.filterSection}>
    <h3>Product Features</h3>
    <div className={styles.flagFilters}>
        <label className={styles.flagOption}>
            <input
                type="checkbox"
                checked={selectedFlags.includes('isNew')}
                onChange={() => toggleFlagFilter('isNew')}
            />
            <span>🆕 New Arrivals</span>
        </label>
        <label className={styles.flagOption}>
            <input
                type="checkbox"
                checked={selectedFlags.includes('isLimited')}
                onChange={() => toggleFlagFilter('isLimited')}
            />
            <span>⏰ Limited Edition</span>
        </label>
        <label className={styles.flagOption}>
            <input
                type="checkbox"
                checked={selectedFlags.includes('onSale')}
                onChange={() => toggleFlagFilter('onSale')}
            />
            <span>🏷️ On Offer</span>
        </label>
        <label className={styles.flagOption}>
            <input
                type="checkbox"
                checked={selectedFlags.includes('isBestSeller')}
                onChange={() => toggleFlagFilter('isBestSeller')}
            />
            <span>🔥 Best Seller</span>
        </label>
    </div>
</div>
                    {/* Price Range */}
                    <div className={styles.filterSection}>
                        <h3>Price Range</h3>
                        <div className={styles.priceRangeContainer}>
                            <input 
                                type="range" 
                                min="0" 
                                max="200000" 
                                value={currentMaxPrice} 
                                className={styles.priceRange} 
                                onChange={(e) => handlePriceFilterChange(e.target.value)}
                            />
                            <div className={styles.priceInputGroup}>
                                <input 
                                    type="number" 
                                    min="0" 
                                    max="200000" 
                                    value={currentMaxPrice} 
                                    className={styles.priceInput} 
                                    onChange={handlePriceInputChange}
                                    placeholder="Enter max price"
                                />
                            </div>
                            <div className={styles.priceValues}>
                                <span>KSh 0</span>
                                <span>KSh {currentMaxPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sort Options */}
                    <div className={styles.filterSection}>
                        <h3>Sort By</h3>
                        <select 
                            className={styles.sortFilter} 
                            value={currentSort}
                            onChange={(e) => setCurrentSort(e.target.value)}
                        >
                            <option value="createdAt:desc">Newest Arrivals</option>
                            <option value="price:asc">Price: Low to High</option>
                            <option value="price:desc">Price: High to Low</option>
                            <option value="name:asc">Name: A-Z</option>
                            <option value="flags.isFeatured:desc">Featured First</option>
                        </select>
                    </div>

                    {/* Active Filters */}
                    {(selectedFlags.length > 0 || currentCategory !== 'all' || currentMaxPrice < 200000) && (
                        <div className={styles.filterSection}>
                            <h3>Active Filters</h3>
                            <div className={styles.activeFilters}>
                                {currentCategory !== 'all' && (
                                    <span className={styles.activeFilter}>
                                        Category: {currentCategory}
                                        <button onClick={() => handleCategoryClick('all')}>×</button>
                                    </span>
                                )}
                                {currentMaxPrice < 200000 && (
                                    <span className={styles.activeFilter}>
                                        Max: KSh {currentMaxPrice.toLocaleString()}
                                        <button onClick={() => setCurrentMaxPrice(200000)}>×</button>
                                    </span>
                                )}
                                {selectedFlags.map(flag => (
                                    <span key={flag} className={styles.activeFilter}>
                                        {flag.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
                                        <button onClick={() => toggleFlagFilter(flag)}>×</button>
                                    </span>
                                ))}
                                <button 
                                    className={styles.clearAll}
                                    onClick={clearAllFilters}
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
                
                {/* Products Grid */}
                <main className={styles.productGrid}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.loadingSpinner}></div>
                            Loading products...
                        </div>
                    ) : error ? (
                        <div className={styles.errorMessage}>
                            <p>{error}</p>
                            <p>Please make sure your backend server is running on http://localhost:5000</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className={styles.noProducts}>
                            <h3>No products found</h3>
                            <p>Try adjusting your filters or search terms</p>
                            <button 
                                className={styles.ctaSecondary}
                                onClick={clearAllFilters}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        products.map(product => {
                            const categoryName = product.category?.name || product.category || 'Uncategorized';
                            const categoryClass = getCategoryClass(categoryName);
                            const isFarmProduct = categoryName.toLowerCase().includes('agriculture') || 
                                                categoryName.toLowerCase().includes('farm');
                            const isReady = product.productType === 'ready';
                            const buttonText = isFarmProduct && !isReady ? 'Book Now' : 'Add to Cart';
                            const badges = getProductBadges(product);
                            const growingProgress = getGrowingProgress(product);

                            return (
                                <div key={product._id} className={styles.productCard}>
                                    <div 
                                        className={styles.productImage} 
                                        style={{
                                            backgroundImage: product.featuredImage?.url || product.images?.[0]?.url ? 
                                                `url('${product.featuredImage?.url || product.images?.[0]?.url}')` : 'none',
                                            backgroundColor: !product.featuredImage?.url && !product.images?.[0]?.url ? '#f8f9fa' : 'transparent'
                                        }}
                                    >
                                        <div className={styles.badgeContainer}>
                                            {badges.map((badge, index) => (
                                                <span key={index} className={`${styles.productBadge} ${styles[badge.class]}`}>
                                                    {badge.text}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        {!product.featuredImage?.url && !product.images?.[0]?.url && (
                                            <div className={styles.noImagePlaceholder}>
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.productInfo}>
                                        <div className={styles.categoryTag}>
                                            {categoryName}
                                        </div>

                                        <h3 className={styles.productTitle}>{product.name}</h3>
                                        
                                        <p className={styles.productDescription}>
                                            {product.description}
                                        </p>

                                        {product.tags && product.tags.length > 0 && (
                                            <div className={styles.productTags}>
                                                {product.tags.slice(0, 3).map((tag, index) => (
                                                    <span key={index} className={styles.tag}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {growingProgress && (
                                            <div className={styles.growingProgress}>
                                                <div className={styles.progressLabel}>
                                                    {growingProgress.label} • {growingProgress.progress}%
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div 
                                                        className={styles.progressFill}
                                                        style={{ width: `${growingProgress.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className={styles.priceSection}>
                                            <span className={`${styles.currentPrice} ${styles['price' + categoryClass.charAt(0).toUpperCase() + categoryClass.slice(1)]}`}>
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

                                        <div className={styles.stockInfo}>
                                            {isReady ? (
                                                <>
                                                    <span className={`${styles.stockStatus} ${product.inventory?.stock > 0 ? styles.inStock : styles.outOfStock}`}>
                                                        {product.inventory?.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                                    </span>
                                                    {product.inventory?.stock > 0 && (
                                                        <span className={styles.stockQuantity}>
                                                            {product.inventory.stock} available
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className={styles.preOrderStatus}>
                                                    Pre-order Available
                                                </span>
                                            )}
                                        </div>

                                        <button 
                                            className={`${styles.addToCart} ${styles['btn' + categoryClass.charAt(0).toUpperCase() + categoryClass.slice(1)]}`}
                                            onClick={() => handleAddToCart(product)}
                                            disabled={product.flags?.isOutOfStock || (isReady && product.inventory?.stock === 0)}
                                        >
                                            {product.flags?.isOutOfStock || (isReady && product.inventory?.stock === 0) 
                                                ? 'Out of Stock' 
                                                : buttonText
                                            }
                                        </button>

                                        <Link 
    to={`/product/${product._id}`} 
    className={styles.quickView}
>
    View Details →
</Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductCatalog;