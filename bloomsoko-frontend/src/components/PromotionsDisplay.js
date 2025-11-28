import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PromotionsDisplay = ({ position = 'all' }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Build URL based on position filter
      let url = `${API_URL}/promotions/active`;
      if (position !== 'all') {
        url += `?position=${position}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      console.log(`🎯 ${position} promotions response:`, data);

      if (data.success) {
        setPromotions(data.data || []);
      } else {
        setPromotions([]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [position]);

  const getPromotionBadgeColor = (type) => {
    switch (type) {
      case 'flash_sale': return '#dc2626'; // red
      case 'seasonal': return '#16a34a'; // green
      case 'special_offer': return '#ea580c'; // orange
      case 'black_friday': return '#000000'; // black
      default: return '#6b7280'; // gray
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading promotions...
      </div>
    );
  }

  if (promotions.length === 0) {
    return null; // Don't show anything if no promotions
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '1rem',
      marginBottom: '2rem'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '2rem', 
        color: '#1f2937',
        fontSize: '1.875rem',
        fontWeight: '700'
      }}>
        🎉 Special Offers & Promotions
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {promotions.map((promotion) => (
          <div
            key={promotion._id}
            style={{
              border: `2px solid ${getPromotionBadgeColor(promotion.type)}`,
              borderRadius: '12px',
              padding: '1.5rem',
              backgroundColor: promotion.backgroundColor || '#ffffff',
              color: promotion.textColor || '#1f2937',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Promotion Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: getPromotionBadgeColor(promotion.type),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {promotion.type.replace('_', ' ')}
            </div>

            {/* Banner Image */}
            {promotion.bannerImage?.url && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img
                  src={promotion.bannerImage.url}
                  alt={promotion.bannerImage.alt || promotion.title}
                  style={{
                    maxWidth: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              </div>
            )}

            {/* Promotion Title */}
            <h3 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: promotion.textColor || '#1f2937'
            }}>
              {promotion.title}
            </h3>

            {/* Promotion Description */}
            <p style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              opacity: 0.8,
              lineHeight: '1.5'
            }}>
              {promotion.description}
            </p>

            {/* Discount Info */}
            {promotion.discountValue && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <span style={{
                  backgroundColor: getPromotionBadgeColor(promotion.type),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {promotion.discountValue}
                  {promotion.discountType === 'percentage' ? '% OFF' : ' KSh OFF'}
                </span>
                
                {promotion.minimumOrderAmount > 0 && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    Min. order: KSh {promotion.minimumOrderAmount}
                  </span>
                )}
              </div>
            )}

            {/* Time Remaining */}
            <div style={{
              fontSize: '0.75rem',
              opacity: 0.7,
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '4px'
            }}>
              ⏰ Ends: {new Date(promotion.endDate).toLocaleDateString()} at{' '}
              {new Date(promotion.endDate).toLocaleTimeString()}
            </div>

            {/* Call to Action */}
            <button
              onClick={() => window.location.href = promotion.ctaLink || '/products'}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: getPromotionBadgeColor(promotion.type),
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {promotion.ctaText || 'Shop Now'} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsDisplay;