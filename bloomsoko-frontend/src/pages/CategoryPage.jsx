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
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [apiError, setApiError] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [activeGender, setActiveGender] = useState(null); // For fashion only
    
    const { addToCart } = useCart();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Category themes with hierarchical structure for Fashion
    const categoryThemes = {
        'agricultural-produce': {
            slug: 'agricultural-produce',
            displayName: 'Agricultural Produce',
            color: '#FF9800',
            gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            subcategories: [
                { name: 'Farm Produce', slug: 'farm-produce', level: 2 },
                { name: 'Livestock Produce', slug: 'livestock-produce', level: 2 }
            ]
        },
        'beauty': {
            slug: 'beauty',
            displayName: 'Beauty & Cosmetics',
            color: '#9C27B0',
            gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
            subcategories: [
                { name: 'Make Up', slug: 'make-up', level: 2 },
                { name: 'Skin Care', slug: 'skin-care', level: 2 },
                { name: 'Hair Care', slug: 'hair-care', level: 2 },
                { name: 'Nail Care', slug: 'nail-care', level: 2 }
            ]
        },
        'fashion': {
            slug: 'fashion',
            displayName: 'Fashion & Apparel',
            color: '#FF6B8B',
            gradient: 'linear-gradient(135deg, #FF6B8B 0%, #FF5A6E 100%)',
            // Level 2: Gender categories
            genders: [
                { 
                    name: "Men's Wear", 
                    slug: 'mens-wear',
                    subcategories: [
                        { name: 'Trousers', slug: 'mens-trousers', level: 3 },
                        { name: 'Shirts', slug: 'mens-shirts', level: 3 },
                        { name: 'T-Shirts', slug: 'mens-tshirts', level: 3 },
                        { name: 'Coldwear', slug: 'mens-coldwear', level: 3 },
                        { name: 'Accessories', slug: 'mens-accessories', level: 3 },
                        { name: 'Shoes', slug: 'mens-shoes', level: 3 }
                    ]
                },
                { 
                    name: "Women's Wear", 
                    slug: 'womens-wear',
                    subcategories: [
                        { name: 'Trousers', slug: 'womens-trousers', level: 3 },
                        { name: 'Shirts', slug: 'womens-shirts', level: 3 },
                        { name: 'T-Shirts', slug: 'womens-tshirts', level: 3 },
                        { name: 'Coldwear', slug: 'womens-coldwear', level: 3 },
                        { name: 'Accessories', slug: 'womens-accessories', level: 3 },
                        { name: 'Shoes', slug: 'womens-shoes', level: 3 }
                    ]
                },
                { 
                    name: "Children's Wear", 
                    slug: 'childrens-wear',
                    subcategories: [
                        { name: 'Trousers', slug: 'childrens-trousers', level: 3 },
                        { name: 'Shirts', slug: 'childrens-shirts', level: 3 },
                        { name: 'T-Shirts', slug: 'childrens-tshirts', level: 3 },
                        { name: 'Coldwear', slug: 'childrens-coldwear', level: 3 },
                        { name: 'Accessories', slug: 'childrens-accessories', level: 3 },
                        { name: 'Shoes', slug: 'childrens-shoes', level: 3 }
                    ]
                }
            ]
        },
        'household': {
            slug: 'household',
            displayName: 'Home & Living',
            color: '#009688',
            gradient: 'linear-gradient(135deg, #009688 0%, #00796B 100%)',
            subcategories: [
                { name: 'Curtains', slug: 'curtains', level: 2 },
                { name: 'Beddings', slug: 'beddings', level: 2 },
                { name: 'Carpets', slug: 'carpets', level: 2 },
                { name: 'Doormats', slug: 'doormats', level: 2 },
                { name: 'Utensils', slug: 'utensils', level: 2 },
                { name: 'Decor', slug: 'decor', level: 2 }
            ]
        }
    };

    const currentTheme = categoryThemes[categorySlug] || categoryThemes['agricultural-produce'];
    const isFashion = categorySlug === 'fashion';

    useEffect(() => {
        fetchCategoryProducts();
    }, [categorySlug, currentSort, currentMaxPrice, selectedFlags, selectedSubcategories, selectedItems, activeGender, searchQuery]);

    const fetchCategoryProducts = async () => {
        try {
            setLoading(true);
            setApiError('');
            
            console.log('🔄 Fetching products for category slug:', currentTheme.slug);
            console.log('🎯 Selected subcategories:', selectedSubcategories);
            console.log('🎯 Selected items:', selectedItems);
            console.log('🎯 Active gender:', activeGender);
            
            const params = new URLSearchParams();
            
            // Use the EXACT slug that matches your backend categories
            params.append('category', currentTheme.slug);

            // SPECIAL HANDLING FOR FASHION CATEGORY
            if (isFashion) {
                // If a gender is selected, filter by that gender's subcategories
                if (activeGender) {
                    const gender = currentTheme.genders.find(g => g.slug === activeGender);
                    if (gender) {
                        // Add all items from this gender if no specific items are selected
                        if (selectedItems.length === 0) {
                            gender.subcategories.forEach(item => {
                                params.append('item', item.slug);
                            });
                            console.log('🔍 Filtering by gender:', activeGender);
                        }
                    }
                }

                // Add specific item filters
                if (selectedItems.length > 0) {
                    selectedItems.forEach(itemSlug => {
                        params.append('item', itemSlug);
                    });
                    console.log('🔍 Filtering by items:', selectedItems);
                }
            } 
            // HANDLING FOR OTHER CATEGORIES (2-level hierarchy)
            else {
                if (selectedSubcategories.length > 0) {
                    selectedSubcategories.forEach(slug => {
                        params.append('subcategory', slug);
                    });
                    console.log('🔍 Filtering by subcategories:', selectedSubcategories);
                }
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
                
                console.log(`✅ Found ${fetchedProducts.length} products`);
                
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

    const toggleItemFilter = (itemSlug) => {
        setSelectedItems(prev => 
            prev.includes(itemSlug) 
                ? prev.filter(s => s !== itemSlug)
                : [...prev, itemSlug]
        );
    };

    const selectGender = (genderSlug) => {
        setActiveGender(genderSlug);
        setSelectedItems([]); // Clear item selections when changing gender
    };

    const clearAllFilters = () => {
        setCurrentSort('createdAt:desc');
        setCurrentMaxPrice(200000);
        setSelectedFlags([]);
        setSelectedSubcategories([]);
        setSelectedItems([]);
        setActiveGender(null);
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
                    {/* SPECIAL HANDLING FOR FASHION CATEGORY */}
                    {isFashion ? (
                        <div className={styles.fashionFilters}>
                            {/* Gender Selection */}
                            <div className={styles.genderFilters}>
                                <button
                                    className={`${styles.genderBtn} ${!activeGender ? styles.active : ''}`}
                                    onClick={() => setActiveGender(null)}
                                >
                                    All Fashion
                                </button>
                                {currentTheme.genders.map(gender => (
                                    <button
                                        key={gender.slug}
                                        className={`${styles.genderBtn} ${
                                            activeGender === gender.slug ? styles.active : ''
                                        }`}
                                        onClick={() => selectGender(gender.slug)}
                                        style={{
                                            background: activeGender === gender.slug ? currentTheme.color : 'transparent',
                                            color: activeGender === gender.slug ? 'white' : currentTheme.color,
                                            borderColor: currentTheme.color
                                        }}
                                    >
                                        {gender.name}
                                    </button>
                                ))}
                            </div>

                            {/* Item Selection (only show when gender is selected) */}
                            {activeGender && (
                                <div className={styles.itemFilters}>
                                    <span className={styles.filterLabel}>Items:</span>
                                    {currentTheme.genders
                                        .find(g => g.slug === activeGender)
                                        ?.subcategories.map(item => (
                                            <button
                                                key={item.slug}
                                                className={`${styles.itemBtn} ${
                                                    selectedItems.includes(item.slug) ? styles.active : ''
                                                }`}
                                                onClick={() => toggleItemFilter(item.slug)}
                                                style={{
                                                    background: selectedItems.includes(item.slug) ? currentTheme.color : 'transparent',
                                                    color: selectedItems.includes(item.slug) ? 'white' : currentTheme.color,
                                                    borderColor: currentTheme.color
                                                }}
                                            >
                                                {item.name}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    ) : (
                        /* REGULAR CATEGORIES (2-level hierarchy) */
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
                    )}

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
                        {(selectedFlags.length > 0 || selectedSubcategories.length > 0 || selectedItems.length > 0 || activeGender || currentMaxPrice < 200000 || searchQuery) && (
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
                        {(selectedSubcategories.length > 0 || selectedItems.length > 0 || activeGender || searchQuery) && (
                            <span className={styles.filterInfo}>
                                {activeGender && ` • ${currentTheme.genders.find(g => g.slug === activeGender)?.name}`}
                                {selectedItems.length > 0 && ` • Items: ${selectedItems.map(slug => {
                                    const allItems = currentTheme.genders?.flatMap(g => g.subcategories) || [];
                                    const item = allItems.find(s => s.slug === slug);
                                    return item?.name || slug;
                                }).join(', ')}`}
                                {selectedSubcategories.length > 0 && ` • ${selectedSubcategories.map(slug => {
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