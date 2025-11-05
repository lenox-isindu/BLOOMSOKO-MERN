import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api.js';
import './Home.css'; // We'll create this CSS file
import { initScrollAnimations, initFloatingImages, initSmoothScroll } from '../utils/animations';


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

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fetch featured products
        const productsResponse = await productAPI.getAll();
        const allProducts = productsResponse.data.products || [];
        const featured = allProducts
          .filter(product => product.flags?.isFeatured)
          .slice(0, 6);
        setFeaturedProducts(featured);

        // Fetch main categories
        const categoriesResponse = await categoryAPI.getMain();
        setCategories(categoriesResponse.data);

        // Set stats (you can make these dynamic later)
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
    // Header scroll effect
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 50) {
          headerRef.current.classList.add('scrolled');
        } else {
          headerRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div>Loading Bloomsoko...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Header */}
      <header ref={headerRef} className="main-header">
        <div className="logo">Bloom <span>Soko</span></div>
        <nav>
          <ul>
            <li><a href="#home" className="active">Home</a></li>
            <li><a href="#shop">Products</a></li>
            <li><a href="#categories">Categories</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="/shop" className="shop-now-btn">Shop now!</a></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content animate-on-scroll">
          <h1>
            Grow, Harvest, <span>Thrive</span>
          </h1>
          <p>
            Book agricultural products while they're still growing and secure your harvest at the best prices. 
            Our platform connects you directly with farmers and producers.
          </p>
          <Link to="/shop" className="cta-button animate-pulse">
            Shop Now
          </Link>
        </div>
        <div className="animated-bg">
          <div id="particles-js"></div>
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=500" 
            alt="Farm produce" 
            className="floating-image"
          />
          <img 
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=500" 
            alt="Cosmetics" 
            className="floating-image"
          />
          <img 
            src="https://images.unsplash.com/photo-1470114716159-e389f8712fda?auto=format&fit=crop&w=500" 
            alt="Timber" 
            className="floating-image"
          />
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="category-section">
        <div className="section-title animate-on-scroll">
          <h2>Our Categories</h2>
          <p>Explore our diverse range of products</p>
        </div>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <CategoryCard 
              key={category._id} 
              category={category} 
              delay={index * 0.1}
            />
          ))}
        </div>
      </section>

      {/* Featured Products Slider */}
      <section id="shop" className="products-slider">
        <div className="section-title animate-on-scroll">
          <h2>Featured Products</h2>
          <p>Discover our most popular items</p>
        </div>
        
        <div className="slider-container">
          <div className="product-slider">
            {featuredProducts.map((product, index) => (
              <ProductSlide key={product._id} product={product} index={index} />
            ))}
          </div>
          
          <div className="slider-arrows">
            <div className="slider-arrow prev-arrow">&#10094;</div>
            <div className="slider-arrow next-arrow">&#10095;</div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-title animate-on-scroll">
          <h2>Why Choose Bloom Soko?</h2>
        </div>
        <div className="stats-grid">
          <StatItem 
            number={stats.farmers} 
            label="Active Farmers" 
            delay="0.1s" 
            suffix="+"
          />
          <StatItem 
            number={stats.products} 
            label="Products Available" 
            delay="0.2s" 
            suffix="+"
          />
          <StatItem 
            number={stats.satisfaction} 
            label="Satisfaction Rate" 
            delay="0.3s" 
            suffix="%"
          />
          <StatItem 
            number={stats.delivery} 
            label="Delivery Hours" 
            delay="0.4s" 
            suffix="hr"
          />
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter animate-on-scroll">
        <h2>Stay Updated</h2>
        <p>Subscribe to our newsletter for the latest offers and farming tips</p>
        <form className="newsletter-form">
          <input 
            type="email" 
            placeholder="Your email address" 
            className="newsletter-input" 
            required 
          />
          <button type="submit" className="newsletter-button">
            Subscribe
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-logo">Bloom Soko</div>
        <p>Connecting growers with buyers since 2023</p>
        <div className="social-links">
          <a href="#"><i className="fab fa-facebook-f"></i></a>
          <a href="#"><i className="fab fa-twitter"></i></a>
          <a href="#"><i className="fab fa-instagram"></i></a>
          <a href="#"><i className="fab fa-linkedin-in"></i></a>
        </div>
        <p>&copy; 2025 Bloom Soko. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, delay }) => {
  return (
    <div 
      className="category-card animate-on-scroll" 
      data-delay={delay}
      onMouseMove={(e) => {
        const card = e.currentTarget;
        const xAxis = (window.innerWidth / 2 - e.pageX) / 15;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 15;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg) translateY(-10px) scale(1.03)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(-10px) scale(1.03)';
      }}
    >
      <div 
        className="category-img" 
        style={{ 
          backgroundImage: `url(${getCategoryImage(category.name)})` 
        }}
      ></div>
      <div className="category-info">
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
    </div>
  );
};

// Product Slide Component
const ProductSlide = ({ product, index }) => {
  const isReady = product.productType === 'ready';
  const badge = getProductBadge(product);

  return (
    <div className="product-slide">
      <div className="product-card">
        <div 
          className="product-image" 
          style={{ 
            backgroundImage: `url(${product.featuredImage?.url || 'https://via.placeholder.com/300x200?text=Product+Image'})` 
          }}
        >
          {badge && <span className={`product-badge ${badge.class}`}>{badge.text}</span>}
        </div>
        <div className="product-info">
          <h3 className="product-title">{product.name}</h3>
          <div className="product-price">KSh {product.price?.toLocaleString()}</div>
          <p>{product.description?.substring(0, 80)}...</p>
          <div className="product-meta">
            <span>{isReady ? 'In Stock' : 'Pre-order'}</span>
            <span>{product.inventory?.stock || 0} available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Item Component
const StatItem = ({ number, label, delay, suffix }) => {
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
  setTimeout(() => {
    initScrollAnimations();
    initFloatingImages();
    initSmoothScroll();
  }, 100);

  return (
    <div className="stat-item animate-on-scroll" data-delay={delay}>
      <div className="stat-number">
        {count}{suffix}
      </div>
      <p>{label}</p>
    </div>
  );
};

// Helper functions
const getCategoryImage = (categoryName) => {
  const images = {
    'Agricultural Produce': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600',
    'Beauty': 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600',
    'Fashion': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600',
    'Household': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600'
  };
  return images[categoryName] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600';
};

const getProductBadge = (product) => {
  if (product.inventory?.stock === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
  if (product.flags?.isNew) return { text: 'New', class: 'new' };
  if (product.flags?.onSale) return { text: 'Sale', class: 'sale' };
  if (product.flags?.isLimited) return { text: 'Limited', class: 'limited' };
  if (product.productType !== 'ready') return { text: 'Growing', class: 'growing' };
  return null;
};

export default Home;