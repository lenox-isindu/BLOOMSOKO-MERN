// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const { getCartCount } = useCart();

    const [cartCount, setCartCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const location = useLocation();

    // Listen for auth changes
    useEffect(() => {
        const onAuthChanged = () => {
            console.log("Navbar detected auth change");
            setForceUpdate(prev => prev + 1);
        };

        window.addEventListener("authChanged", onAuthChanged);
        return () => window.removeEventListener("authChanged", onAuthChanged);
    }, []);

    // Listen for cart updates
    useEffect(() => {
        const onCartUpdated = () => {
            console.log("Navbar detected cart update");
            setCartCount(getCartCount());
        };

        window.addEventListener("cartUpdated", onCartUpdated);
        return () => window.removeEventListener("cartUpdated", onCartUpdated);
    }, [getCartCount]);

    // Update cart count whenever anything changes
    useEffect(() => {
        setCartCount(getCartCount());
    }, [getCartCount, location, user, forceUpdate]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isUserMenuOpen && !event.target.closest(`.${styles.userMenu}`)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    if (loading) return null;

    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                <Link to="/" className={styles.logo} onClick={closeMenu}>🌺 Bloom<span>Soko</span></Link>

                <div className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuActive : ''}`}>
                    <Link to="/" className={styles.navLink} onClick={closeMenu}>Home</Link>
                    <Link to="/products" className={styles.navLink} onClick={closeMenu}>Products</Link>
                    <Link to="/categories" className={styles.navLink} onClick={closeMenu}>Categories</Link>

                    {isAuthenticated && user ? (
                        <div className={styles.userSection}>
                            <div className={styles.userMenu}>
                                <button 
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                                    className={styles.userGreeting}
                                >
                                    👋 Hello, {user.firstName}
                                </button>
                                {isUserMenuOpen && (
                                    <div className={styles.userDropdown}>
                                        <Link to="/profile" className={styles.dropdownItem} onClick={closeMenu}>My Profile</Link>
                                        <Link to="/orders" className={styles.dropdownItem} onClick={closeMenu}>My Orders</Link>
                                        <button className={styles.dropdownItem} onClick={handleLogout}>Logout</button>
                                    </div>
                                )}
                            </div>

                            <Link to="/cart" className={styles.cartLink} onClick={closeMenu}>
                                🛒 
                                {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
                            </Link>
                        </div>
                    ) : (
                        <div className={styles.authSection}>
                            <Link to="/login" className={styles.authLink} onClick={closeMenu}>Login</Link>
                            <Link to="/register" className={styles.authLink} onClick={closeMenu}>Register</Link>
                            <Link to="/cart" className={styles.cartLink} onClick={closeMenu}>
                                🛒 
                                {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
                            </Link>
                        </div>
                    )}
                </div>

                <button 
                    className={styles.menuToggle} 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
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