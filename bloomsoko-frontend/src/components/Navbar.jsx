// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { getCartCount } = useCart();
    const [cartCount, setCartCount] = useState(0);
    const location = useLocation();

    useEffect(() => {
        // Check if user is logged in
        const userData = localStorage.getItem('bloomsoko-user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        setCartCount(getCartCount());
    }, [getCartCount, location]);

    const handleLogout = () => {
        localStorage.removeItem('bloomsoko-token');
        localStorage.removeItem('bloomsoko-user');
        setUser(null);
        setIsMenuOpen(false);
        window.location.reload(); // Refresh to update the UI
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                {/* Logo */}
                <Link to="/" className={styles.logo} onClick={closeMenu}>
                    🌺 Bloom<span>Soko</span>
                </Link>

                {/* Desktop Navigation */}
                <div className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuActive : ''}`}>
                    <Link 
                        to="/" 
                        className={styles.navLink}
                        onClick={closeMenu}
                    >
                        Home
                    </Link>
                    <Link 
                        to="/products" 
                        className={styles.navLink}
                        onClick={closeMenu}
                    >
                        Products
                    </Link>
                    <Link 
                        to="/categories" 
                        className={styles.navLink}
                        onClick={closeMenu}
                    >
                        Categories
                    </Link>
                    
                    {/* User Menu for Desktop */}
                    {user ? (
                        <div className={styles.userSection}>
                            <div className={styles.userMenu}>
                                <span className={styles.userGreeting}>
                                    👋 Hello, {user.firstName}
                                </span>
                                <div className={styles.userDropdown}>
                                    <Link to="/profile" className={styles.dropdownItem} onClick={closeMenu}>
                                        My Profile
                                    </Link>
                                    <Link to="/orders" className={styles.dropdownItem} onClick={closeMenu}>
                                        My Orders
                                    </Link>
                                    <button 
                                        onClick={handleLogout} 
                                        className={styles.dropdownItem}
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                            <Link to="/cart" className={styles.cartLink} onClick={closeMenu}>
                                <span className={styles.cartIcon}>🛒</span>
                                {cartCount > 0 && (
                                    <span className={styles.cartCount}>{cartCount}</span>
                                )}
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.authSection}>
                            <Link to="/login" className={styles.authLink} onClick={closeMenu}>
                                Login
                            </Link>
                            <Link to="/register" className={styles.authLink} onClick={closeMenu}>
                                Register
                            </Link>
                            <Link to="/cart" className={styles.cartLink} onClick={closeMenu}>
                                <span className={styles.cartIcon}>🛒</span>
                                {cartCount > 0 && (
                                    <span className={styles.cartCount}>{cartCount}</span>
                                )}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className={styles.menuToggle}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className={styles.hamburger}></span>
                    <span className={styles.hamburger}></span>
                    <span className={styles.hamburger}></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;