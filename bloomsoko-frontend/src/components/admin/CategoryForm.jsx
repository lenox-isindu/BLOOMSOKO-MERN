import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const CategoryForm = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: '',
    level: 1,
    status: 'active',
    seo: {
      title: '',
      description: '',
      slug: ''
    }
  });
  
  const [categories, setCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories for parent selection
  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data || []);
      
      // Get main categories (level 1)
      const mainCats = await categoryAPI.getMain();
      setMainCategories(mainCats.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent: category.parent?._id || category.parent || '',
        level: category.level || 1,
        status: category.status || 'active',
        seo: {
          title: category.seo?.title || '',
          description: category.seo?.description || '',
          slug: category.seo?.slug || ''
        }
      });

      // If category has parent, load subcategories for that parent
      if (category.parent) {
        fetchSubCategories(category.parent);
      }
    }
  }, [category]);

  // Fetch subcategories when parent changes
  const fetchSubCategories = async (parentId) => {
    try {
      const response = await categoryAPI.getSubcategories(parentId);
      setSubCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('seo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (!category && formData.name && !formData.seo.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          slug: slug
        }
      }));
    }
  }, [formData.name, category]);

  // Update level when parent changes
  useEffect(() => {
    if (formData.parent) {
      const parentCategory = categories.find(cat => cat._id === formData.parent);
      if (parentCategory) {
        setFormData(prev => ({
          ...prev,
          level: parentCategory.level + 1
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        level: 1
      }));
    }
  }, [formData.parent, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.name.trim()) {
        toast.error('Category name is required');
        setLoading(false);
        return;
      }

      // Prepare data for API
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parent: formData.parent || null,
        level: parseInt(formData.level),
        status: formData.status,
        seo: {
          title: formData.seo.title.trim(),
          description: formData.seo.description.trim(),
          slug: formData.seo.slug.trim()
        }
      };

      if (category) {
        // Update existing category
        await categoryAPI.update(category._id, submitData);
        toast.success('Category updated successfully!');
      } else {
        // Create new category
        await categoryAPI.create(submitData);
        toast.success('Category created successfully!');
      }

      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(`Failed to ${category ? 'update' : 'create'} category`);
    } finally {
      setLoading(false);
    }
  };

  const handleParentChange = (e) => {
    const parentId = e.target.value;
    setFormData(prev => ({
      ...prev,
      parent: parentId
    }));

    if (parentId) {
      fetchSubCategories(parentId);
    } else {
      setSubCategories([]);
    }
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
        maxWidth: '600px',
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
              {category ? '✏️' : '➕'}
            </span>
            {category ? 'Edit Category' : 'Add New Category'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
              
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
                    <label className="form-label">Category Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter category name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="Enter category description"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Parent Category */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Hierarchy
                </h4>
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Parent Category</label>
                    <select
                      name="parent"
                      value={formData.parent}
                      onChange={handleParentChange}
                      className="form-select"
                    >
                      <option value="">No Parent (Main Category)</option>
                      {mainCategories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name} (Level {cat.level})
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginTop: 'var(--space-2)' }}>
                      {formData.parent 
                        ? `This will be a Level ${formData.level} category` 
                        : 'This will be a Main Category (Level 1)'}
                    </p>
                  </div>

                  {/* Show subcategories if parent is selected */}
                  {formData.parent && subCategories.length > 0 && (
                    <div style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-light)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        Existing subcategories:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {subCategories.map(cat => (
                          <span 
                            key={cat._id}
                            style={{
                              background: 'var(--accent-gold)',
                              color: 'var(--text-dark)',
                              padding: 'var(--space-1) var(--space-2)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: '500'
                            }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Information */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  SEO Settings
                </h4>
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">SEO Title</label>
                    <input
                      type="text"
                      name="seo.title"
                      value={formData.seo.title}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="SEO title for search engines"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SEO Description</label>
                    <textarea
                      name="seo.description"
                      value={formData.seo.description}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="SEO description for search engines"
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">URL Slug</label>
                    <input
                      type="text"
                      name="seo.slug"
                      value={formData.seo.slug}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="URL-friendly slug"
                    />
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginTop: 'var(--space-2)' }}>
                      This will be used in the URL. Auto-generated from name if left empty.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Status
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleInputChange}
                    />
                    <span>Active</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleInputChange}
                    />
                    <span>Inactive</span>
                  </label>
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
              disabled={loading}
            >
              {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;