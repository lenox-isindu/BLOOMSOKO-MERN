import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar.jsx';
import styles from './CategoryPage.module.css';

const CategoryPage = () => {
    const { categorySlug } = useParams();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSort, setCurrentSort] = useState('createdAt:desc');
    const [currentMaxPrice, setCurrentMaxPrice] = useState(200000);
    const [selectedFlags, setSelectedFlags] = useState([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [apiError, setApiError] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    
    const { addToCart } = useCart();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Category themes with EXACT slugs from your backend
    const categoryThemes = {
        'agricultural-produce': {
            slug: 'agricultural-produce',
            displayName: 'Agricultural Produce',
            color: '#FF9800',
            gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            subcategories: [
                { name: 'Farm Produce', slug: 'farm-produce' },
                { name: 'Livestock Produce', slug: 'livestock-produce' }
            ]
        },
        'beauty': {
            slug: 'beauty',
            displayName: 'Beauty & Cosmetics',
            color: '#9C27B0',
            gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
            subcategories: [
                { name: 'Make Up', slug: 'make-up' },
                { name: 'Skin Care', slug: 'skin-care' },
                { name: 'Hair Care', slug: 'hair-care' },
                { name: 'Nail Care', slug: 'nail-care' }
            ]
        },
        'fashion': {
            slug: 'fashion',
            displayName: 'Fashion & Apparel',
            color: '#FF6B8B',
            gradient: 'linear-gradient(135deg, #FF6B8B 0%, #FF5A6E 100%)',
            subcategories: [
                { name: "Men's Wear", slug: 'mens-wear' },
                { name: "Women's Wear", slug: 'womens-wear' },
                { name: "Children's Wear", slug: 'childrens-wear' },
                // Level 3 items for Fashion only
                { name: 'Trousers', slug: 'trousers', level: 3 },
                { name: 'Shirts', slug: 'shirts', level: 3 },
                { name: 'T-Shirts', slug: 'tshirts', level: 3 },
                { name: 'Coldwear', slug: 'coldwear', level: 3 },
                { name: 'Accessories', slug: 'accessories', level: 3 },
                { name: 'Shoes', slug: 'shoes', level: 3 }
            ]
        },
        'household': {
            slug: 'household',
            displayName: 'Home & Living',
            color: '#009688',
            gradient: 'linear-gradient(135deg, #009688 0%, #00796B 100%)',
            subcategories: [
                { name: 'Curtains', slug: 'curtains' },
                { name: 'Beddings', slug: 'beddings' },
                { name: 'Carpets', slug: 'carpets' },
                { name: 'Doormats', slug: 'doormats' },
                { name: 'Utensils', slug: 'utensils' },
                { name: 'Decor', slug: 'decor' }
            ]
        }
    };

    const currentTheme = categoryThemes[categorySlug] || categoryThemes['agricultural-produce'];

    useEffect(() => {
        fetchCategoryProducts();
    }, [categorySlug, currentSort, currentMaxPrice, selectedFlags, selectedSubcategories, searchQuery]);

   const fetchCategoryProducts = async () => {
    try {
        setLoading(true);
        setApiError('');
        
        console.log('🔄 Fetching products for category slug:', currentTheme.slug);
        console.log('🎯 Selected subcategories:', selectedSubcategories);
        
        const params = new URLSearchParams();
        
        // Use the EXACT slug that matches your backend categories
        params.append('category', currentTheme.slug);

        // IMPROVED: Handle multiple subcategory filters
        if (selectedSubcategories.length > 0) {
            // For multiple subcategories, we need to handle them differently
            // Since the backend can only filter by one category at a time,
            // we'll fetch all products and filter client-side for multiple selections
            
            // But for single subcategory, we can use backend filtering
            if (selectedSubcategories.length === 1) {
                const subcatSlug = selectedSubcategories[0];
                const subcat = currentTheme.subcategories.find(s => s.slug === subcatSlug);
                
                if (subcat) {
                    if (subcat.level === 3) {
                        params.append('item', subcat.slug);
                        console.log('🔍 Filtering by item:', subcat.slug);
                    } else {
                        params.append('subcategory', subcat.slug);
                        console.log('🔍 Filtering by subcategory:', subcat.slug);
                    }
                }
            }
            // For multiple subcategories, we'll handle client-side filtering
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
            let fetchedProducts = data.products || data || [];
            
            console.log(`✅ Found ${fetchedProducts.length} products before client-side filtering`);
            
            // IMPROVED: Client-side filtering for multiple subcategories
            if (selectedSubcategories.length > 1) {
                console.log('🔍 Applying client-side subcategory filtering...');
                
                fetchedProducts = fetchedProducts.filter(product => {
                    const productCategoryName = product.category?.name?.toLowerCase();
                    const productCategorySlug = product.category?.seo?.slug?.toLowerCase();
                    
                    // Check if product matches any of the selected subcategories
                    return selectedSubcategories.some(selectedSlug => {
                        const selectedSubcat = currentTheme.subcategories.find(s => s.slug === selectedSlug);
                        if (!selectedSubcat) return false;
                        
                        const selectedName = selectedSubcat.name.toLowerCase();
                        const selectedSlugLower = selectedSlug.toLowerCase();
                        
                        // Match by category name or slug
                        return productCategoryName?.includes(selectedName) || 
                               productCategorySlug?.includes(selectedSlugLower) ||
                               productCategoryName?.includes(selectedSlugLower);
                    });
                });
                
                console.log(`✅ After client-side filtering: ${fetchedProducts.length} products`);
            }
            
            // Debug: Show product categories
            fetchedProducts.forEach(product => {
                console.log(`📦 ${product.name} - Category: ${product.category?.name} (Level: ${product.category?.level})`);
            });
            
            setProducts(fetchedProducts);
            setFilteredProducts(fetchedProducts);
        } else {
            console.log('❌ No products found');
            setProducts([]);
            setFilteredProducts([]);
        }

        setCategory({
            name: currentTheme.displayName,
            description: getCategoryDescription(currentTheme.displayName),
            slug: categorySlug
        });

    } catch (error) {
        console.error('❌ Error fetching products:', error);
        setApiError(`Network error: ${error.message}`);
        setProducts([]);
        setFilteredProducts([]);
    } finally {
        setLoading(false);
    }
};

    const getCategoryDescription = (categoryName) => {
        const descriptions = {
            'Agricultural Produce': 'Fresh farm products, livestock, and agricultural goods from local farmers',
            'Beauty & Cosmetics': 'Premium beauty products, cosmetics, and personal care items',
            'Fashion & Apparel': 'Trendy clothing, accessories, and fashion items for everyone',
            'Home & Living': 'Quality home essentials, decor, and household items'
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

    const toggleSubcategoryFilter = (subcategorySlug) => {
        setSelectedSubcategories(prev => 
            prev.includes(subcategorySlug) 
                ? prev.filter(s => s !== subcategorySlug)
                : [...prev, subcategorySlug]
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
        const user = localStorage.getItem('bloomsoko-user');
        if (!user) {
            alert('Please login to add items to cart');
            return;
        }

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
        fetchCategoryProducts();
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
        if (product.flags?.onSale) badges.push({ text: '🏷️ Sale', class: 'sale' });
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
            <Navbar />
            
            {/* Category Header */}
            <div 
                className={styles.categoryHeader}
                style={{
                    background: currentTheme.gradient,
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
                        placeholder={`Search in ${category?.name}...`}
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

            {/* Filters Navbar */}
            <nav className={styles.filtersNavbar}>
                <div className={styles.navbarContent}>
                    {/* Subcategory Filters */}
                    <div className={styles.subcategoryFilters}>
                        <button
                            className={`${styles.subcategoryBtn} ${selectedSubcategories.length === 0 ? styles.active : ''}`}
                            onClick={() => setSelectedSubcategories([])}
                        >
                            All {category?.name}
                        </button>
                        {currentTheme.subcategories.map(subcat => (
                            <button
                                key={subcat.slug}
                                className={`${styles.subcategoryBtn} ${
                                    selectedSubcategories.includes(subcat.slug) ? styles.active : ''
                                }`}
                                onClick={() => toggleSubcategoryFilter(subcat.slug)}
                                style={{
                                    background: selectedSubcategories.includes(subcat.slug) ? currentTheme.color : 'transparent',
                                    color: selectedSubcategories.includes(subcat.slug) ? 'white' : currentTheme.color,
                                    borderColor: currentTheme.color
                                }}
                            >
                                {subcat.name}
                            </button>
                        ))}
                    </div>

                    {/* Right Side Controls */}
                    <div className={styles.navbarControls}>
                        {/* Sort Dropdown */}
                        <select 
                            value={currentSort}
                            onChange={(e) => setCurrentSort(e.target.value)}
                            className={styles.sortDropdown}
                        >
                            <option value="createdAt:desc">Newest</option>
                            <option value="price:asc">Price: Low to High</option>
                            <option value="price:desc">Price: High to Low</option>
                            <option value="name:asc">Name: A-Z</option>
                        </select>

                        {/* Filter Toggle */}
                        <button 
                            className={styles.filterToggle}
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        >
                            🎛️ Filters
                        </button>
                    </div>
                </div>

                {/* Expanded Filters Panel */}
                {isFiltersOpen && (
                    <div className={styles.expandedFilters}>
                        <div className={styles.filterSection}>
                            <h4>Price Range</h4>
                            <div className={styles.priceFilter}>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="200000" 
                                    value={currentMaxPrice} 
                                    onChange={(e) => setCurrentMaxPrice(parseInt(e.target.value))}
                                    className={styles.priceRange}
                                />
                                <span>Up to KSh {currentMaxPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className={styles.filterSection}>
                            <h4>Features</h4>
                            <div className={styles.flagFilters}>
                                {['isNew', 'onSale', 'isBestSeller'].map(flag => (
                                    <label key={flag} className={styles.flagOption}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFlags.includes(flag)}
                                            onChange={() => toggleFlagFilter(flag)}
                                        />
                                        <span>
                                            {flag === 'isNew' && '🆕 New'}
                                            {flag === 'onSale' && '🏷️ On Sale'}
                                            {flag === 'isBestSeller' && '🔥 Best Seller'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(selectedFlags.length > 0 || selectedSubcategories.length > 0 || currentMaxPrice < 200000 || searchQuery) && (
                            <div className={styles.activeFilters}>
                                <button onClick={clearAllFilters} className={styles.clearAll}>
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Products Grid */}
            <main className={styles.productsMain}>
                <div className={styles.resultsInfo}>
                    <p>
                        Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} in {category?.name}
                        {(selectedSubcategories.length > 0 || searchQuery) && (
                            <span className={styles.filterInfo}>
                                {selectedSubcategories.length > 0 && ` • Filtered by: ${selectedSubcategories.map(slug => {
                                    const subcat = currentTheme.subcategories.find(s => s.slug === slug);
                                    return subcat?.name || slug;
                                }).join(', ')}`}
                                {searchQuery && ` • Search: "${searchQuery}"`}
                            </span>
                        )}
                    </p>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className={styles.noProducts}>
                        <h3>No products found in {category?.name}</h3>
                        <p>Try adjusting your filters or search terms</p>
                        <button 
                            className={styles.ctaButton}
                            onClick={clearAllFilters}
                            style={{ background: currentTheme.color }}
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className={styles.productsGrid}>
                        {filteredProducts.map(product => {
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
                                        }}
                                    >
                                        <div className={styles.badgeContainer}>
                                            {badges.map((badge, index) => (
                                                <span 
                                                    key={index} 
                                                    className={`${styles.productBadge} ${styles[badge.class]}`}
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
                                            {product.description?.substring(0, 80)}...
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
                                                    '#ccc' : currentTheme.color,
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
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CategoryPage;