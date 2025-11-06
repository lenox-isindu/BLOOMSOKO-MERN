import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api.js';
import styles from './Home.module.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    farmers: 0,
    products: 0,
    satisfaction: 0,
    delivery: 0
  });
  const [loading, setLoading] = useState(true);
  const headerRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const productsResponse = await productAPI.getAll();
        const allProducts = productsResponse.data.products || [];
        const featured = allProducts
          .filter(product => product.flags?.isFeatured)
          .slice(0, 6);
        setFeaturedProducts(featured);

        const categoriesResponse = await categoryAPI.getMain();
        setCategories(categoriesResponse.data);

        setStats({
          farmers: 500,
          products: allProducts.length,
          satisfaction: 95,
          delivery: 24
        });

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
    setupAnimations();
  }, []);

  const setupAnimations = () => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 50) {
          headerRef.current.classList.add(styles.scrolled);
        } else {
          headerRef.current.classList.remove(styles.scrolled);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div>Loading Bloomsoko...</div>
      </div>
    );
  }

  return (
    <div className={styles.homePage}>
      {/* Header */}
      <header ref={headerRef} className={styles.mainHeader}>
        <div className={styles.logo}>Bloom <span>Soko</span></div>
        <nav className={styles.nav}>
          <ul>
            <li><Link to="/" className={styles.navLink}>Home</Link></li>
            <li><Link to="/products" className={styles.navLink}>Products</Link></li>
            <li><Link to="/categories" className={styles.navLink}>Categories</Link></li>
            <li><a href="#about" className={styles.navLink}>About</a></li>
            <li><Link to="/products" className={styles.shopNowBtn}>Shop Now</Link></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Fresh From Farm <span className={styles.accent}>To Your Home</span>
            </h1>
            <p className={styles.heroDescription}>
              Discover the finest agricultural products, beauty essentials, fashion items, 
              and household goods. Book growing products and secure the best prices directly from producers.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/products" className={styles.ctaPrimary}>
                Shop Products
              </Link>
              <Link to="/categories" className={styles.ctaSecondary}>
                Browse Categories
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.floatingElement}></div>
            <div className={styles.floatingElement}></div>
            <div className={styles.floatingElement}></div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <h2>Shop By Category</h2>
          <p>Explore our diverse collection of products</p>
        </div>
        <div className={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <CategoryCard key={category._id} category={category} index={index} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2>Featured Products</h2>
          <p>Handpicked items just for you</p>
        </div>
        <div className={styles.productsGrid}>
          {featuredProducts.map((product, index) => (
            <ProductCard key={product._id} product={product} index={index} />
          ))}
        </div>
        {featuredProducts.length === 0 && (
          <div className={styles.noProducts}>
            <p>No featured products available yet</p>
            <Link to="/products" className={styles.ctaSecondary}>
              Explore All Products
            </Link>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statsContent}>
            <h2>Why Choose Bloom Soko?</h2>
            <p>We're committed to bringing you the best products with exceptional service</p>
          </div>
          <div className={styles.statsGrid}>
            <StatItem number={stats.farmers} label="Active Farmers" suffix="+" />
            <StatItem number={stats.products} label="Products" suffix="+" />
            <StatItem number={stats.satisfaction} label="Satisfaction Rate" suffix="%" />
            <StatItem number={stats.delivery} label="Delivery Time" suffix="hr" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Ready to Explore?</h2>
          <p>Join thousands of satisfied customers shopping with Bloom Soko</p>
          <Link to="/products" className={styles.ctaPrimary}>
            Start Shopping Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>Bloom Soko</div>
            <p>Connecting growers with buyers since 2023</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Shop</h4>
              <Link to="/products">All Products</Link>
              <Link to="/categories">Categories</Link>
              <Link to="/featured">Featured</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#careers">Careers</a>
            </div>
            <div className={styles.linkGroup}>
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#shipping">Shipping</a>
              <a href="#returns">Returns</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 Bloom Soko. All rights reserved.</p>
          <div className={styles.socialLinks}>
            <a href="#" aria-label="Facebook"><span>FB</span></a>
            <a href="#" aria-label="Twitter"><span>TW</span></a>
            <a href="#" aria-label="Instagram"><span>IG</span></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, index }) => {
  const getCategoryLink = (categoryName) => {
    const categoryMap = {
      'Agricultural Produce': 'farm',
      'Beauty': 'cosmetics',
      'Fashion': 'fashion',
      'Household': 'home'
    };
    return `/products?category=${categoryMap[categoryName] || 'all'}`;
  };

  return (
    <Link to={getCategoryLink(category.name)} className={styles.categoryCard}>
      <div className={styles.categoryIcon}></div>
      <div className={styles.categoryContent}>
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
      <div className={styles.categoryArrow}>→</div>
    </Link>
  );
};

// Product Card Component
const ProductCard = ({ product, index }) => {
  const isReady = product.productType === 'ready';
  const badge = getProductBadge(product);

  return (
    <Link to={`/product/${product._id}`} className={styles.productCard}>
      <div className={styles.productImage}>
        {badge && <span className={`${styles.productBadge} ${styles[badge.class]}`}>{badge.text}</span>}
      </div>
      <div className={styles.productInfo}>
        <h3 className={styles.productTitle}>{product.name}</h3>
        <p className={styles.productDescription}>
          {product.description?.substring(0, 60)}...
        </p>
        <div className={styles.productMeta}>
          <span className={styles.productPrice}>KSh {product.price?.toLocaleString()}</span>
          <span className={`${styles.productStatus} ${isReady ? styles.inStock : styles.preOrder}`}>
            {isReady ? 'In Stock' : 'Pre-order'}
          </span>
        </div>
      </div>
    </Link>
  );
};

// Stat Item Component
const StatItem = ({ number, label, suffix }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const increment = number / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= number) {
        clearInterval(timer);
        current = number;
      }
      setCount(Math.floor(current));
    }, 16);

    return () => clearInterval(timer);
  }, [number]);

  return (
    <div className={styles.statItem}>
      <div className={styles.statNumber}>
        {count}{suffix}
      </div>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
};

// Helper functions
const getProductBadge = (product) => {
  if (product.inventory?.stock === 0) return { text: 'Out of Stock', class: 'outOfStock' };
  if (product.flags?.isNew) return { text: 'New', class: 'new' };
  if (product.flags?.onSale) return { text: 'Sale', class: 'sale' };
  if (product.flags?.isLimited) return { text: 'Limited', class: 'limited' };
  if (product.productType !== 'ready') return { text: 'Growing', class: 'growing' };
  return null;
};

export default Home;