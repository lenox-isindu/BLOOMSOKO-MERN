import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import PromotionsDisplay from '../components/PromotionsDisplay.jsx';
import './PromotionsPage.css'; // Optional: Create CSS for styling

const PromotionsPage = () => {
  return (
    <div className="promotions-page">
      <Navbar />
      
      {/* Page Header */}
      <div className="promotions-header">
        <div className="container">
          <h1>🎉 Special Offers & Promotions</h1>
          <p>Discover amazing deals and exclusive discounts on our beautiful flower collections</p>
          <div className="breadcrumbs">
            <Link to="/">Home</Link> &gt; 
            <span>Promotions</span>
          </div>
        </div>
      </div>

      {/* Promotions Display */}
      <div className="promotions-container">
        <PromotionsDisplay />
      </div>

      {/* CTA Section */}
      <div className="promotions-cta">
        <div className="container">
          <h2>Don't Miss Out on Great Deals!</h2>
          <p>Check back regularly for new promotions and seasonal offers</p>
          <div className="cta-buttons">
            <Link to="/products" className="btn btn-primary">
              Shop All Products
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionsPage;