// components/PromotionPopup.js
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const PromotionPopup = () => {
  const [promotions, setPromotions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(0);

  useEffect(() => {
    const fetchPopupPromotions = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/promotions/active?position=popup`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          setPromotions(data.data);
          // Show popup after a delay
          setTimeout(() => setShowPopup(true), 3000);
        }
      } catch (error) {
        console.error('Error fetching popup promotions:', error);
      }
    };

    fetchPopupPromotions();
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  if (!showPopup || promotions.length === 0) return null;

  const promotion = promotions[currentPromotion];

  return createPortal(
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="popup-close" onClick={closePopup}>×</button>
        
        {promotion.bannerImage?.url && (
          <img 
            src={promotion.bannerImage.url} 
            alt={promotion.title}
            className="popup-image"
          />
        )}
        
        <h3>{promotion.title}</h3>
        <p>{promotion.description}</p>
        
        {promotion.discountValue && (
          <div className="popup-discount">
            {promotion.discountValue}
            {promotion.discountType === 'percentage' ? '% OFF' : ' KSh OFF'}
          </div>
        )}
        
        <button 
          className="popup-cta"
          onClick={() => {
            window.location.href = promotion.ctaLink || '/products';
            closePopup();
          }}
        >
          {promotion.ctaText || 'Shop Now'}
        </button>

        {/* Navigation dots for multiple popups */}
        {promotions.length > 1 && (
          <div className="popup-dots">
            {promotions.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentPromotion ? 'active' : ''}`}
                onClick={() => setCurrentPromotion(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PromotionPopup;