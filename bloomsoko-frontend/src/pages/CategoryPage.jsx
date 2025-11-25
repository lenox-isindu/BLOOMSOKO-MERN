import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './CategoryPage.module.css';

const CategoryPage = () => {
    const { categorySlug } = useParams();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSort, setCurrentSort] = useState('createdAt:desc');
    const [currentMaxPrice, setCurrentMaxPrice] = useState(200000);
    const [selectedFlags, setSelectedFlags] = useState([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [apiError, setApiError] = useState('');
    
    const { addToCart } = useCart();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Category themes with flexible category name matching
    const categoryThemes = {
        'agricultural-produce': {
            names: ['Agricultural Produce', 'Agriculture'], // Try both names
            displayName: 'Agricultural Produce',
            color: '#FF9800',
            accentColor: '#FF9800',
            gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            badgeColor: '#FF9800',
            buttonColor: '#FF9800',
            bannerImage: 'images/farm-banner.jpg',
            subcategories: ['Farm Produce', 'Livestock Produce']
        },
        'beauty': {
            names: ['Beauty'],
            displayName: 'Beauty & Cosmetics',
            color: '#9C27B0',
            accentColor: '#9C27B0',
            gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
            badgeColor: '#9C27B0',
            buttonColor: '#9C27B0',
            bannerImage: 'images/cosmetics-banner.jpg',
            subcategories: ['Make Up', 'Skin Care', 'Hair Care', 'Nail Care']
        },
        'fashion': {
            names: ['Fashion'],
            displayName: 'Fashion & Apparel',
            color: '#FF6B8B',
            accentColor: '#FF6B8B',
            gradient: 'linear-gradient(135deg, #FF6B8B 0%, #FF5A6E 100%)',
            badgeColor: '#FF6B8B',
            buttonColor: '#FF6B8B',
            bannerImage: 'images/fashion-banner.jpg',
            genders: ["Men's Wear", "Women's Wear", "Children's Wear"],
            categories: ['Trousers', 'Shirts', 'T-Shirts', 'Coldwear', 'Accessories', 'Shoes', 'Others']
        },
        'household': {
            names: ['Household', 'House & Garden'], // Try both names
            displayName: 'Home & Living',
            color: '#009688',
            accentColor: '#009688',
            gradient: 'linear-gradient(135deg, #009688 0%, #00796B 100%)',
            badgeColor: '#009688',
            buttonColor: '#2196F3',
            bannerImage: 'images/home-living-banner.jpg',
            subcategories: ['Curtains', 'Beddings', 'Carpets', 'Doormats', 'Utensils', 'Decor']
        }
    };

    const currentTheme = categoryThemes[categorySlug] || categoryThemes['agricultural-produce'];

    useEffect(() => {
        fetchAllProductsForDebug(); // Debug first to see what we have
        fetchCategoryAndProducts();
    }, [categorySlug, currentSort, currentMaxPrice, selectedFlags, selectedSubcategories, searchQuery]);

    const fetchCategoryAndProducts = async () => {
        try {
            setLoading(true);
            setApiError('');
            
            console.log('🔄 Fetching products for category slug:', categorySlug);
            console.log('🔄 Trying category names:', currentTheme.names);
            
            // Try each possible category name until we find products
            let productsData = [];
            
            for (const categoryName of currentTheme.names) {
                console.log(`🔄 Trying category name: "${categoryName}"`);
                
                const params = new URLSearchParams();
                params.append('category', categoryName);
                
                // Add subcategory filters if any are selected
                if (selectedSubcategories.length > 0) {
                    selectedSubcategories.forEach(subcat => {
                        params.append('subcategory', subcat);
                    });
                }
                
                // Add search
                if (searchQuery.trim()) {
                    params.append('search', searchQuery.trim());
                }

                // Add sorting
                const [sortField, sortDirection] = currentSort.split(':');
                params.append('sort', `${sortField}:${sortDirection}`);
                
                // Add price filter
                params.append('maxPrice', currentMaxPrice);

                // Add flag filters
                selectedFlags.forEach(flag => {
                    params.append(flag, 'true');
                });

                const url = `${API_URL}/products?${params.toString()}`;
                console.log('📡 API URL:', url);

                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    const fetchedProducts = data.products || data || [];
                    console.log(`✅ Found ${fetchedProducts.length} products for category "${categoryName}"`);
                    
                    if (fetchedProducts.length > 0) {
                        productsData = fetchedProducts;
                        break; // Stop trying other names if we found products
                    }
                } else {
                    console.log(`❌ No products found for category "${categoryName}"`);
                }
            }

            console.log(`🎯 Final result: ${productsData.length} products for ${currentTheme.displayName}`);
            
            // Debug: Check product categories
            productsData.forEach(product => {
                console.log(`📦 Product: ${product.name}, Category: ${product.category?.name || product.category || 'No category'}`);
            });
            
            setProducts(productsData);

            setCategory({
                name: currentTheme.displayName,
                description: getCategoryDescription(currentTheme.displayName),
                slug: categorySlug
            });

        } catch (error) {
            console.error('❌ Error fetching category products:', error);
            setApiError(`Network error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Test function to check all products (for debugging)
    const fetchAllProductsForDebug = async () => {
        try {
            console.log('🔍 Debug: Fetching ALL products to check categories...');
            const response = await fetch(`${API_URL}/products`);
            if (response.ok) {
                const data = await response.json();
                const allProducts = data.products || data || [];
                console.log('📊 TOTAL PRODUCTS:', allProducts.length);
                
                // Group by category for easy viewing
                const byCategory = {};
                allProducts.forEach(product => {
                    const catName = product.category?.name || product.category || 'Unknown';
                    if (!byCategory[catName]) {
                        byCategory[catName] = [];
                    }
                    byCategory[catName].push({
                        name: product.name,
                        id: product._id,
                        price: product.price
                    });
                });
                console.log('📋 PRODUCTS BY CATEGORY:', byCategory);
                
                // Show category counts
                Object.keys(byCategory).forEach(cat => {
                    console.log(`📈 ${cat}: ${byCategory[cat].length} products`);
                });
            }
        } catch (error) {
            console.error('Debug fetch error:', error);
        }
    };

    const getCategoryDescription = (categoryName) => {
        const descriptions = {
            'Agricultural Produce': 'Fresh farm products, livestock, and agricultural goods from local farmers',
            'Beauty & Cosmetics': 'Premium beauty products, cosmetics, and personal care items for your self-care routine',
            'Fashion & Apparel': 'Trendy clothing, accessories, and fashion items for the whole family',
            'Home & Living': 'Quality home essentials, decor, and household items to enhance your living space'
        };
        return descriptions[categoryName] || `Discover our amazing ${categoryName} collection`;
    };

    const toggleFlagFilter = (flag) => {
        setSelectedFlags(prev => 
            prev.includes(flag) 
                ? prev.filter(f => f !== flag)
                : [...prev, flag]
        );
    };

    const toggleSubcategoryFilter = (subcategory) => {
        setSelectedSubcategories(prev => 
            prev.includes(subcategory) 
                ? prev.filter(s => s !== subcategory)
                : [...prev, subcategory]
        );
    };

    const clearAllFilters = () => {
        setCurrentSort('createdAt:desc');
        setCurrentMaxPrice(200000);
        setSelectedFlags([]);
        setSelectedSubcategories([]);
        setSearchQuery('');
    };

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

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchCategoryAndProducts();
    };

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
        
        if (product.flags?.isNew) badges.push({ text: '🆕 New', class: 'new' });
        if (product.flags?.isLimited) badges.push({ text: '⏰ Limited', class: 'limited' });
        if (product.flags?.onSale) badges.push({ text: '🏷️ Offer', class: 'sale' });
        if (product.flags?.isBestSeller) badges.push({ text: '🔥 Best Seller', class: 'bestSeller' });
        
        return badges.slice(0, 2);
    };

    const getGrowingProgress = (product) => {
        if (product.productType === 'ready') return null;
        
        const progress = product.growingDetails?.progress || 50;
        const stage = product.growingDetails?.currentStage || 'growing';
        
        const stageLabels = {
            'planting': 'Planting',
            'growing': 'Growing', 
            'almost-ready': 'Almost Ready',
            'ready': 'Ready'
        };
        
        return {
            label: stageLabels[stage] || 'Growing',
            progress: progress
        };
    };

    // Render gender navigation for fashion category
    const renderGenderNavigation = () => {
        if (categorySlug !== 'fashion') return null;

        return (
            <div className={styles.genderNavigation}>
                <div className={styles.genderNavContainer}>
                    {currentTheme.genders.map(gender => (
                        <button
                            key={gender}
                            className={`${styles.genderNavItem} ${
                                selectedSubcategories.includes(gender) ? styles.genderNavActive : ''
                            }`}
                            onClick={() => toggleSubcategoryFilter(gender)}
                            style={{
                                background: selectedSubcategories.includes(gender) ? currentTheme.color : 'transparent',
                                color: selectedSubcategories.includes(gender) ? 'white' : currentTheme.color,
                                borderColor: currentTheme.color
                            }}
                        >
                            {gender}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div>Loading {currentTheme.displayName}...</div>
            </div>
        );
    }

    return (
        <div className={styles.categoryPage}>
            {/* Debug Info - Remove in production */}
            {apiError && (
                <div className={styles.debugInfo}>
                    <strong>API Error:</strong> {apiError}
                </div>
            )}

            {/* Category Header with Theme */}
            <div 
                className={styles.categoryHeader}
                style={{
                    background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${currentTheme.bannerImage}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className={styles.breadcrumbs}>
                    <Link to="/">Home</Link> &gt; 
                    <Link to="/products">Products</Link> &gt; 
                    <span>{category?.name}</span>
                </div>
                <h1>{category?.name}</h1>
                <p>{category?.description}</p>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                    <input 
                        type="text" 
                        placeholder={`Search ${category?.name.toLowerCase()}...`}
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    <button 
                        type="submit" 
                        className={styles.searchButton}
                        style={{ background: currentTheme.color }}
                    >
                        🔍 Search
                    </button>
                </form>
            </div>

            {/* Gender Navigation for Fashion */}
            {renderGenderNavigation()}

            <div className={styles.categoryContent}>
                {/* Sidebar Filters */}
                <aside className={styles.categoryFilters}>
                    {/* Debug Info in Sidebar */}
                    <div className={styles.filterSection}>
                        <h3 style={{ color: currentTheme.color }}>Debug Info</h3>
                        <div className={styles.debugInfo}>
                            <p><strong>Category:</strong> {currentTheme.displayName}</p>
                            <p><strong>Trying Names:</strong> {currentTheme.names.join(', ')}</p>
                            <p><strong>Products Found:</strong> {products.length}</p>
                            <p><strong>Subcategories:</strong> {selectedSubcategories.join(', ') || 'None'}</p>
                            <button onClick={fetchAllProductsForDebug} className={styles.debugButton}>
                                Check All Products
                            </button>
                        </div>
                    </div>

                    {/* Subcategories Filter */}
                    <div className={styles.filterSection}>
                        <h3 style={{ color: currentTheme.color }}>Categories</h3>
                        
                        {categorySlug === 'fashion' ? (
                            // Fashion specific categories
                            <div className={styles.filterGroup}>
                                <h4>Product Types</h4>
                                <ul className={styles.categoryList}>
                                    {currentTheme.categories.map(cat => (
                                        <li key={cat}>
                                            <button
                                                className={`${styles.categoryLink} ${
                                                    selectedSubcategories.includes(cat) ? styles.categoryActive : ''
                                                }`}
                                                onClick={() => toggleSubcategoryFilter(cat)}
                                                style={{
                                                    color: selectedSubcategories.includes(cat) ? 'white' : '#555',
                                                    background: selectedSubcategories.includes(cat) ? currentTheme.color : 'transparent'
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            // Other categories subcategories
                            <div className={styles.filterGroup}>
                                <h4>Subcategories</h4>
                                <ul className={styles.categoryList}>
                                    <li>
                                        <button
                                            className={`${styles.categoryLink} ${
                                                selectedSubcategories.length === 0 ? styles.categoryActive : ''
                                            }`}
                                            onClick={() => setSelectedSubcategories([])}
                                            style={{
                                                color: selectedSubcategories.length === 0 ? 'white' : '#555',
                                                background: selectedSubcategories.length === 0 ? currentTheme.color : 'transparent'
                                            }}
                                        >
                                            All {category?.name}
                                        </button>
                                    </li>
                                    {currentTheme.subcategories?.map(subcat => (
                                        <li key={subcat}>
                                            <button
                                                className={`${styles.categoryLink} ${
                                                    selectedSubcategories.includes(subcat) ? styles.categoryActive : ''
                                                }`}
                                                onClick={() => toggleSubcategoryFilter(subcat)}
                                                style={{
                                                    color: selectedSubcategories.includes(subcat) ? 'white' : '#555',
                                                    background: selectedSubcategories.includes(subcat) ? currentTheme.color : 'transparent'
                                                }}
                                            >
                                                {subcat}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Rest of the filters remain the same... */}
                    <div className={styles.filterSection}>
                        <h3 style={{ color: currentTheme.color }}>Product Features</h3>
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

                    <div className={styles.filterSection}>
                        <h3 style={{ color: currentTheme.color }}>Sort By</h3>
                        <select 
                            value={currentSort}
                            onChange={(e) => setCurrentSort(e.target.value)}
                            className={styles.sortFilter}
                            style={{ borderColor: currentTheme.color }}
                        >
                            <option value="createdAt:desc">Newest Arrivals</option>
                            <option value="price:asc">Price: Low to High</option>
                            <option value="price:desc">Price: High to Low</option>
                            <option value="name:asc">Name: A-Z</option>
                            <option value="flags.isFeatured:desc">Featured First</option>
                        </select>
                    </div>

                    <div className={styles.filterSection}>
                        <h3 style={{ color: currentTheme.color }}>Price Range</h3>
                        <div className={styles.priceRangeContainer}>
                            <input 
                                type="range" 
                                min="0" 
                                max="200000" 
                                value={currentMaxPrice} 
                                onChange={(e) => setCurrentMaxPrice(parseInt(e.target.value))}
                                className={styles.priceRange}
                                style={{ 
                                    background: `linear-gradient(to right, ${currentTheme.color} 0%, ${currentTheme.color} ${(currentMaxPrice/200000)*100}%, #e8f5e9 ${(currentMaxPrice/200000)*100}%, #e8f5e9 100%)`
                                }}
                            />
                            <div className={styles.priceInputGroup}>
                                <span>Max Price: KSh {currentMaxPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(selectedFlags.length > 0 || selectedSubcategories.length > 0 || currentMaxPrice < 200000 || searchQuery) && (
                        <div className={styles.filterSection}>
                            <h3 style={{ color: currentTheme.color }}>Active Filters</h3>
                            <div className={styles.activeFilters}>
                                {searchQuery && (
                                    <span 
                                        className={styles.activeFilter}
                                        style={{ background: currentTheme.color }}
                                    >
                                        Search: "{searchQuery}"
                                        <button onClick={() => setSearchQuery('')}>×</button>
                                    </span>
                                )}
                                {currentMaxPrice < 200000 && (
                                    <span 
                                        className={styles.activeFilter}
                                        style={{ background: currentTheme.color }}
                                    >
                                        Max: KSh {currentMaxPrice.toLocaleString()}
                                        <button onClick={() => setCurrentMaxPrice(200000)}>×</button>
                                    </span>
                                )}
                                {selectedSubcategories.map(subcat => (
                                    <span 
                                        key={subcat} 
                                        className={styles.activeFilter}
                                        style={{ background: currentTheme.color }}
                                    >
                                        {subcat}
                                        <button onClick={() => toggleSubcategoryFilter(subcat)}>×</button>
                                    </span>
                                ))}
                                {selectedFlags.map(flag => (
                                    <span 
                                        key={flag} 
                                        className={styles.activeFilter}
                                        style={{ background: currentTheme.color }}
                                    >
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
                <main className={styles.productsGrid}>
                    {products.length === 0 ? (
                        <div className={styles.noProducts}>
                            <h3>No products found in {category?.name}</h3>
                            <p>We tried these category names: {currentTheme.names.join(', ')}</p>
                            <p>This could be because:</p>
                            <ul style={{ textAlign: 'left', display: 'inline-block', marginBottom: '2rem' }}>
                                <li>No products are assigned to these categories in the database</li>
                                <li>The category names don't match between frontend and backend</li>
                                <li>Your filters are too restrictive</li>
                            </ul>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button 
                                    className={styles.ctaButton}
                                    onClick={clearAllFilters}
                                    style={{ background: currentTheme.color }}
                                >
                                    Clear Filters
                                </button>
                                <button 
                                    className={styles.ctaButton}
                                    onClick={fetchAllProductsForDebug}
                                    style={{ background: '#2196F3' }}
                                >
                                    Debug: Check All Products
                                </button>
                                <Link 
                                    to="/products" 
                                    className={styles.ctaButton}
                                    style={{ background: '#4CAF50' }}
                                >
                                    Browse All Products
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.resultsInfo}>
                                <p>Showing {products.length} product{products.length !== 1 ? 's' : ''} in {category?.name}</p>
                            </div>
                            <div className={styles.productsContainer}>
                                {products.map(product => {
                                    const isFarmProduct = category?.name.toLowerCase().includes('agriculture') || 
                                                        category?.name.toLowerCase().includes('farm');
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
                                                        <span 
                                                            key={index} 
                                                            className={`${styles.productBadge} ${styles[badge.class]}`}
                                                            style={{ 
                                                                background: badge.class === 'outOfStock' ? '#d32f2f' : 
                                                                          badge.class === 'growing' ? '#38a169' :
                                                                          badge.class === 'preOrder' ? '#dd6b20' :
                                                                          currentTheme.color
                                                            }}
                                                        >
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
                                                <h3 className={styles.productTitle}>{product.name}</h3>
                                                
                                                <p className={styles.productDescription}>
                                                    {product.description?.substring(0, 100)}...
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
                                                                style={{ 
                                                                    width: `${growingProgress.progress}%`,
                                                                    background: currentTheme.gradient
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={styles.priceSection}>
                                                    <span 
                                                        className={styles.currentPrice}
                                                        style={{ color: currentTheme.color }}
                                                    >
                                                        KSh {product.price?.toLocaleString() || '0'}
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
                                                    className={styles.addToCart}
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={product.flags?.isOutOfStock || (isReady && product.inventory?.stock === 0)}
                                                    style={{ 
                                                        background: product.flags?.isOutOfStock || (isReady && product.inventory?.stock === 0) ? 
                                                            '#cccccc' : currentTheme.buttonColor,
                                                        opacity: product.flags?.isOutOfStock || (isReady && product.inventory?.stock === 0) ? 0.7 : 1
                                                    }}
                                                >
                                                    {product.flags?.isOutOfStock || (isReady && product.inventory?.stock === 0) 
                                                        ? 'Out of Stock' 
                                                        : buttonText
                                                    }
                                                </button>

                                                <Link 
                                                    to={`/product/${product._id}`} 
                                                    className={styles.quickView}
                                                    style={{ color: currentTheme.color }}
                                                >
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CategoryPage;