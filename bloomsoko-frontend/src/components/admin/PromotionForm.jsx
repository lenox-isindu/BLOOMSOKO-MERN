import React, { useState, useEffect } from 'react';
import { uploadAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const PromotionForm = ({ promotion, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'banner',
    status: 'inactive',
    bannerImage: { url: '', alt: '' },
    backgroundColor: '#ffffff',
    textColor: '#333333',
    discountType: 'percentage',
    discountValue: 0,
    targetType: 'all_products',
    targetCategories: [],
    targetProducts: [],
    startDate: '',
    endDate: '',
    position: 'top_banner',
    priority: 1,
    isFeatured: false,
    ctaText: 'Shop Now',
    ctaLink: '/products',
    minimumOrderAmount: 0,
    usageLimit: 0,
  });
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch categories and products for targeting
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data || categoriesData || []);

        const productsResponse = await fetch('http://localhost:5000/api/admin/products');
        const productsData = await productsResponse.json();
        setProducts(productsData.products || productsData.data || productsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (promotion) {
      // Format dates for input fields
      const formatDateForInput = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
      };

      setFormData({
        title: promotion.title || '',
        description: promotion.description || '',
        type: promotion.type || 'banner',
        status: promotion.status || 'inactive',
        bannerImage: promotion.bannerImage || { url: '', alt: '' },
        backgroundColor: promotion.backgroundColor || '#ffffff',
        textColor: promotion.textColor || '#333333',
        discountType: promotion.discountType || 'percentage',
        discountValue: promotion.discountValue || 0,
        targetType: promotion.targetType || 'all_products',
        targetCategories: promotion.targetCategories || [],
        targetProducts: promotion.targetProducts || [],
        startDate: promotion.startDate ? formatDateForInput(promotion.startDate) : '',
        endDate: promotion.endDate ? formatDateForInput(promotion.endDate) : '',
        position: promotion.position || 'top_banner',
        priority: promotion.priority || 1,
        isFeatured: promotion.isFeatured || false,
        ctaText: promotion.ctaText || 'Shop Now',
        ctaLink: promotion.ctaLink || '/products',
        minimumOrderAmount: promotion.minimumOrderAmount || 0,
        usageLimit: promotion.usageLimit || 0,
      });
    } else {
      // Set default start date to today and end date to 7 days from now
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        startDate: today,
        endDate: nextWeek,
      }));
    }
  }, [promotion]);

  // Image upload handler
  const handleImageUpload = async (file) => {
    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await uploadAPI.uploadSingle(uploadFormData);
      const imageData = {
        url: response.data?.url || response.url,
        alt: file.name || 'Promotion banner'
      };

      setFormData(prev => ({
        ...prev,
        bannerImage: imageData
      }));
      
      toast.success('Banner image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (name, value, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [name]: isChecked 
        ? [...prev[name], value]
        : prev[name].filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dates
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast.error('End date must be after start date');
        setLoading(false);
        return;
      }

      // Validate discount value
      if (formData.discountValue < 0) {
        toast.error('Discount value cannot be negative');
        setLoading(false);
        return;
      }

      // Prepare data for API
      const submitData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        priority: parseInt(formData.priority),
        minimumOrderAmount: parseFloat(formData.minimumOrderAmount),
        usageLimit: parseInt(formData.usageLimit),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      const url = promotion 
        ? `http://localhost:5000/api/promotions/${promotion._id}`
        : 'http://localhost:5000/api/promotions';
      
      const method = promotion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error('Failed to save promotion');

      const result = await response.json();
      
      toast.success(promotion ? 'Promotion updated successfully!' : 'Promotion created successfully!');
      onSave();
      
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error(`Failed to ${promotion ? 'update' : 'create'} promotion`);
    } finally {
      setLoading(false);
    }
  };

  // Preview styles based on form data
  const previewStyle = {
    backgroundColor: formData.backgroundColor,
    color: formData.textColor,
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '20px',
    border: '2px dashed #ddd',
    minHeight: '100px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="card-header">
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>
              {promotion ? '✏️' : '➕'}
            </span>
            {promotion ? 'Edit Promotion' : 'Create New Promotion'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
              
              {/* Basic Information */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Basic Information
                </h4>
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Promotion Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter promotion title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="Enter promotion description"
                      rows="3"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">Promotion Type *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                      >
                        <option value="banner">Banner</option>
                        <option value="flash_sale">Flash Sale</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="special_offer">Special Offer</option>
                        <option value="black_friday">Black Friday</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Display Position *</label>
                      <select
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                      >
                        <option value="top_banner">Top Banner</option>
                        <option value="hero">Hero Section</option>
                        <option value="sidebar">Sidebar</option>
                        <option value="popup">Popup</option>
                        <option value="product_page">Product Page</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="inactive">Inactive</option>
                        <option value="active">Active</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Priority (1-10)</label>
                      <input
                        type="number"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="form-input"
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleInputChange}
                      />
                      <span>Featured Promotion (will be highlighted)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Banner Image
                </h4>
                
                <div className="form-group">
                  <label className="form-label">Banner Image</label>
                  <div style={{ 
                    border: '2px dashed var(--border-medium)', 
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-5)',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-light)',
                    transition: 'all 0.2s ease',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1
                  }}>
                    {formData.bannerImage.url ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={formData.bannerImage.url} 
                          alt="Banner preview" 
                          style={{
                            maxWidth: '300px',
                            maxHeight: '150px',
                            borderRadius: 'var(--radius-md)',
                            border: '2px solid var(--accent-gold)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, bannerImage: { url: '', alt: '' } }))}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--error)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>
                          🖼️
                        </div>
                        <p style={{ marginBottom: 'var(--space-3)', color: 'var(--text-light)' }}>
                          {uploading ? 'Uploading...' : 'Click to upload banner image'}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleImageUpload(e.target.files[0]);
                            }
                          }}
                          style={{ display: 'none' }}
                          id="bannerImage"
                          disabled={uploading}
                        />
                        <label 
                          htmlFor="bannerImage"
                          className="btn btn-gold"
                          style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                        >
                          {uploading ? 'Uploading...' : 'Choose Banner Image'}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Design Settings */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Design Settings
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Background Color</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        type="color"
                        name="backgroundColor"
                        value={formData.backgroundColor}
                        onChange={handleInputChange}
                        style={{
                          width: '50px',
                          height: '40px',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        name="backgroundColor"
                        value={formData.backgroundColor}
                        onChange={handleInputChange}
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Text Color</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        type="color"
                        name="textColor"
                        value={formData.textColor}
                        onChange={handleInputChange}
                        style={{
                          width: '50px',
                          height: '40px',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        name="textColor"
                        value={formData.textColor}
                        onChange={handleInputChange}
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <label className="form-label">Preview</label>
                  <div style={previewStyle}>
                    {formData.bannerImage.url ? (
                      <img 
                        src={formData.bannerImage.url} 
                        alt="Banner preview" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '120px',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    ) : (
                      <>
                        <h3 style={{ margin: '0 0 10px 0', color: formData.textColor }}>
                          {formData.title || 'Promotion Title'}
                        </h3>
                        <p style={{ margin: 0, color: formData.textColor }}>
                          {formData.description || 'Promotion description will appear here'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Discount Settings */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Discount Settings
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Discount Type</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Fixed Amount Off</option>
                      <option value="free_shipping">Free Shipping</option>
                      <option value="bogo">Buy One Get One</option>
                    </select>
                  </div>

                  {(formData.discountType === 'percentage' || formData.discountType === 'fixed') && (
                    <div className="form-group">
                      <label className="form-label">
                        {formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                      </label>
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        className="form-input"
                        min="0"
                        max={formData.discountType === 'percentage' ? '100' : undefined}
                        step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Targeting */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Targeting
                </h4>
                
                <div className="form-group">
                  <label className="form-label">Target Type</label>
                  <select
                    name="targetType"
                    value={formData.targetType}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="all_products">All Products</option>
                    <option value="specific_categories">Specific Categories</option>
                    <option value="specific_products">Specific Products</option>
                    <option value="collection">Collection</option>
                  </select>
                </div>

                {formData.targetType === 'specific_categories' && (
                  <div className="form-group">
                    <label className="form-label">Select Categories</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                      {categories.map(category => (
                        <label key={category._id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.targetCategories.includes(category._id)}
                            onChange={(e) => handleArrayChange('targetCategories', category._id, e.target.checked)}
                          />
                          <span>{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.targetType === 'specific_products' && (
                  <div className="form-group">
                    <label className="form-label">Select Products</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                      {products.map(product => (
                        <label key={product._id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.targetProducts.includes(product._id)}
                            onChange={(e) => handleArrayChange('targetProducts', product._id, e.target.checked)}
                          />
                          <span>{product.name} - KSh {product.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Schedule
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Call to Action
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Button Text</label>
                    <input
                      type="text"
                      name="ctaText"
                      value={formData.ctaText}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Shop Now, Learn More"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Button Link</label>
                    <input
                      type="text"
                      name="ctaLink"
                      value={formData.ctaLink}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., /products, /sale"
                    />
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Conditions & Limits
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Minimum Order Amount (KSh)</label>
                    <input
                      type="number"
                      name="minimumOrderAmount"
                      value={formData.minimumOrderAmount}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Usage Limit (0 = unlimited)</label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="card-footer" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 'var(--space-3)'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-gold" 
              disabled={loading || uploading}
            >
              {loading ? 'Saving...' : (promotion ? 'Update Promotion' : 'Create Promotion')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionForm;