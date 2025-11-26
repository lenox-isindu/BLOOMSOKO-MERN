import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PromotionForm from '../../components/admin/PromotionForm.jsx';

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/promotions?status=${statusFilter}&type=${typeFilter}`);
      
      if (!response.ok) throw new Error('Failed to fetch promotions');
      
      const data = await response.json();
      setPromotions(data.data || []);
      
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter, typeFilter]);

  // Delete promotion
  const handleDeletePromotion = async (promotionId) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/promotions/${promotionId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete promotion');
        
        toast.success('Promotion deleted successfully');
        fetchPromotions();
      } catch (error) {
        console.error('Error deleting promotion:', error);
        toast.error('Failed to delete promotion');
      }
    }
  };

  // Update promotion status
  const handleStatusUpdate = async (promotionId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/promotions/${promotionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success(`Promotion ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchPromotions();
    } catch (error) {
      console.error('Error updating promotion status:', error);
      toast.error('Failed to update promotion status');
    }
  };

  // Edit promotion
  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setShowForm(true);
  };

  // Add new promotion
  const handleAddPromotion = () => {
    setEditingPromotion(null);
    setShowForm(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'scheduled': return 'var(--info)';
      case 'inactive': return 'var(--warning)';
      case 'expired': return 'var(--error)';
      default: return 'var(--text-light)';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'banner': return '🖼️';
      case 'flash_sale': return '⚡';
      case 'seasonal': return '🎄';
      case 'special_offer': return '🎁';
      case 'black_friday': return '🖤';
      default: return '📢';
    }
  };

  // Check if promotion is currently active
  const isCurrentlyActive = (promotion) => {
    const now = new Date();
    return promotion.status === 'active' && 
           new Date(promotion.startDate) <= now && 
           new Date(promotion.endDate) >= now;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 'var(--space-6)'
      }}>
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-size-2xl)', 
            color: 'var(--text-dark)',
            marginBottom: 'var(--space-2)'
          }}>
            Promotions <span className="accent-gold">Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage banners, flash sales, and promotional campaigns
          </p>
        </div>
        <button 
          className="btn btn-gold"
          onClick={handleAddPromotion}
        >
          <span>+</span>
          Create Promotion
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select"
              >
                <option value="all">All Types</option>
                <option value="banner">Banner</option>
                <option value="flash_sale">Flash Sale</option>
                <option value="seasonal">Seasonal</option>
                <option value="special_offer">Special Offer</option>
                <option value="black_friday">Black Friday</option>
              </select>
            </div>

            <button 
              onClick={fetchPromotions}
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-end' }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>📢</span>
            All Promotions ({promotions.length})
          </h3>
        </div>
        
        <div className="card-body">
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              Loading promotions...
            </div>
          ) : promotions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              <p>No promotions found.</p>
              <button 
                className="btn btn-gold"
                onClick={handleAddPromotion}
                style={{ marginTop: 'var(--space-4)' }}
              >
                Create Your First Promotion
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--space-5)'
            }}>
              {promotions.map((promotion) => (
                <div 
                  key={promotion._id}
                  className="card"
                  style={{ 
                    border: isCurrentlyActive(promotion) ? '2px solid var(--accent-gold)' : '1px solid var(--border-light)',
                    position: 'relative'
                  }}
                >
                  {/* Promotion Header */}
                  <div style={{
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--space-2)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {getTypeIcon(promotion.type)}
                        </span>
                        <h4 style={{ 
                          margin: 0, 
                          color: 'var(--text-dark)',
                          fontSize: 'var(--font-size-lg)'
                        }}>
                          {promotion.title}
                        </h4>
                      </div>
                      <p style={{ 
                        margin: 0, 
                        color: 'var(--text-light)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        {promotion.description}
                      </p>
                    </div>
                    
                    <span 
                      style={{ 
                        backgroundColor: getStatusColor(promotion.status),
                        color: 'white',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}
                    >
                      {promotion.status}
                      {isCurrentlyActive(promotion) && ' 🔥'}
                    </span>
                  </div>

                  {/* Promotion Image */}
                  {promotion.bannerImage?.url && (
                    <div style={{
                      padding: 'var(--space-4)',
                      borderBottom: '1px solid var(--border-light)'
                    }}>
                      <img 
                        src={promotion.bannerImage.url} 
                        alt={promotion.bannerImage.alt || promotion.title}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  )}

                  {/* Promotion Details */}
                  <div style={{ padding: 'var(--space-4)' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-4)'
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          color: 'var(--text-light)',
                          marginBottom: 'var(--space-1)'
                        }}>
                          Type
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-dark)',
                          textTransform: 'capitalize'
                        }}>
                          {promotion.type.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          color: 'var(--text-light)',
                          marginBottom: 'var(--space-1)'
                        }}>
                          Position
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-dark)',
                          textTransform: 'capitalize'
                        }}>
                          {promotion.position.replace('_', ' ')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          color: 'var(--text-light)',
                          marginBottom: 'var(--space-1)'
                        }}>
                          Discount
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--success)'
                        }}>
                          {promotion.discountType === 'percentage' && `${promotion.discountValue}% OFF`}
                          {promotion.discountType === 'fixed' && `KSh ${promotion.discountValue} OFF`}
                          {promotion.discountType === 'free_shipping' && 'FREE SHIPPING'}
                          {promotion.discountType === 'bogo' && 'BUY 1 GET 1'}
                          {!promotion.discountType && 'No Discount'}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          color: 'var(--text-light)',
                          marginBottom: 'var(--space-1)'
                        }}>
                          Priority
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-dark)'
                        }}>
                          {promotion.priority}
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div style={{ 
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-4)'
                    }}>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)', 
                        color: 'var(--text-light)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        Campaign Period
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: 'var(--space-2)',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <div>
                          <strong>Start:</strong> {formatDate(promotion.startDate)}
                        </div>
                        <div>
                          <strong>End:</strong> {formatDate(promotion.endDate)}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-light)',
                      marginBottom: 'var(--space-4)'
                    }}>
                      <div>
                        <strong>{promotion.clicks || 0}</strong> Clicks
                      </div>
                      <div>
                        <strong>{promotion.impressions || 0}</strong> Views
                      </div>
                      <div>
                        <strong>{promotion.usedCount || 0}</strong> Used
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: 'var(--space-2)' }}
                        onClick={() => handleEditPromotion(promotion)}
                      >
                        Edit
                      </button>
                      
                      {promotion.status === 'active' ? (
                        <button 
                          className="btn btn-warning"
                          style={{ padding: 'var(--space-2)' }}
                          onClick={() => handleStatusUpdate(promotion._id, 'inactive')}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          className="btn btn-success"
                          style={{ padding: 'var(--space-2)' }}
                          onClick={() => handleStatusUpdate(promotion._id, 'active')}
                        >
                          Activate
                        </button>
                      )}
                      
                      <button 
                        className="btn btn-danger"
                        style={{ padding: 'var(--space-2)' }}
                        onClick={() => handleDeletePromotion(promotion._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Promotion Form Modal */}
      {showForm && (
        <PromotionForm 
          promotion={editingPromotion}
          onClose={() => {
            setShowForm(false);
            setEditingPromotion(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingPromotion(null);
            fetchPromotions();
          }}
        />
      )}
    </div>
  );
};

export default PromotionsManagement;