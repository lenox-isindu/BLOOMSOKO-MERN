import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './CategoryPage.module.css';

const CategoryPage = () => {
    const { categorySlug } = useParams();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSort, setCurrentSort] = useState('createdAt:desc');
    const [currentMaxPrice, setCurrentMaxPrice] = useState(200000);

    useEffect(() => {
        fetchCategoryAndProducts();
    }, [categorySlug, currentSort, currentMaxPrice]);

    const getCategoryNameFromSlug = (slug) => {
        const categoryMap = {
            'agricultural-produce': 'Agricultural Produce',
            'beauty': 'Beauty',
            'fashion': 'Fashion',
            'household': 'Household'
        };
        return categoryMap[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const fetchCategoryAndProducts = async () => {
        try {
            setLoading(true);
            const categoryName = getCategoryNameFromSlug(categorySlug);
            
            const params = new URLSearchParams();
            params.append('category', categoryName);
            params.append('sort', currentSort);
            params.append('maxPrice', currentMaxPrice);

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/products?${params.toString()}`);
            
            if (response.ok) {
                const data = await response.json();
                const productsData = data.products || data || [];
                setProducts(productsData.filter(product => product.price <= currentMaxPrice));
            }

            setCategory({
                name: categoryName,
                description: `Discover our amazing ${categoryName} collection`
            });

        } catch (error) {
            console.error('Error fetching category products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryClass = (categoryName) => {
        const categoryMap = {
            'Agricultural Produce': 'farm',
            'Beauty': 'cosmetics',
            'Fashion': 'fashion',
            'Household': 'home'
        };
        return categoryMap[categoryName] || 'farm';
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
        
        if (product.flags?.isFeatured) badges.push({ text: '⭐ Featured', class: 'featured' });
        if (product.flags?.onSale) badges.push({ text: '🏷️ Sale', class: 'sale' });
        
        return badges.slice(0, 2);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div>Loading {getCategoryNameFromSlug(categorySlug)}...</div>
            </div>
        );
    }

    return (
        <div className={styles.categoryPage}>
            <div className={styles.categoryHeader}>
                <div className={styles.breadcrumbs}>
                    <Link to="/">Home</Link> &gt; 
                    <Link to="/products">Products</Link> &gt; 
                    <span>{category?.name}</span>
                </div>
                <h1>{category?.name}</h1>
                <p>{category?.description}</p>
            </div>

            <div className={styles.categoryContent}>
                <aside className={styles.categoryFilters}>
                    <div className={styles.filterSection}>
                        <h3>Sort By</h3>
                        <select 
                            value={currentSort}
                            onChange={(e) => setCurrentSort(e.target.value)}
                            className={styles.sortFilter}
                        >
                            <option value="createdAt:desc">Newest Arrivals</option>
                            <option value="price:asc">Price: Low to High</option>
                            <option value="price:desc">Price: High to Low</option>
                            <option value="name:asc">Name: A-Z</option>
                        </select>
                    </div>

                    <div className={styles.filterSection}>
                        <h3>Price Range</h3>
                        <div className={styles.priceRangeContainer}>
                            <input 
                                type="range" 
                                min="0" 
                                max="200000" 
                                value={currentMaxPrice} 
                                onChange={(e) => setCurrentMaxPrice(parseInt(e.target.value))}
                                className={styles.priceRange}
                            />
                            <div className={styles.priceInputGroup}>
                                <span>Max Price: KSh {currentMaxPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className={styles.productsGrid}>
                    {products.length === 0 ? (
                        <div className={styles.noProducts}>
                            <h3>No products found in {category?.name}</h3>
                            <p>Try adjusting your filters or check back later</p>
                            <Link to="/products" className={styles.ctaButton}>
                                Browse All Products
                            </Link>
                        </div>
                    ) : (
                        products.map(product => {
                            const categoryClass = getCategoryClass(category?.name);
                            const badges = getProductBadges(product);

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
                                        <h3 className={styles.productTitle}>{product.name}</h3>
                                        
                                        <p className={styles.productDescription}>
                                            {product.description?.substring(0, 80)}...
                                        </p>

                                        <div className={styles.priceSection}>
                                            <span className={`${styles.currentPrice} ${styles['price' + categoryClass.charAt(0).toUpperCase() + categoryClass.slice(1)]}`}>
                                                KSh {product.price?.toLocaleString() || '0'}
                                            </span>
                                            {product.comparePrice > product.price && (
                                                <span className={styles.comparePrice}>
                                                    KSh {product.comparePrice?.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className={styles.stockInfo}>
                                            <span className={`${styles.stockStatus} ${product.inventory?.stock > 0 ? styles.inStock : styles.outOfStock}`}>
                                                {product.inventory?.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </div>

                                        <button 
                                            className={`${styles.addToCart} ${styles['btn' + categoryClass.charAt(0).toUpperCase() + categoryClass.slice(1)]}`}
                                        >
                                            Add to Cart
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

export default CategoryPage;