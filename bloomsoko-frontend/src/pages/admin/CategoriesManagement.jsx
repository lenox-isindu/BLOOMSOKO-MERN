import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../../services/api.js';
import toast from 'react-hot-toast';
import CategoryForm from '../../components/admin/CategoryForm.jsx';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Fetch categories with hierarchy
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getHierarchy();
      console.log('Categories loaded:', response);
      setCategories(response || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        // Note: You'll need to add a delete endpoint in your backend
        // For now, we'll show a message
        toast.error('Delete endpoint not implemented yet');
        // await categoryAPI.delete(categoryId);
        // toast.success('Category deleted successfully');
        // fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  // Edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  // Add new category
  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Render category tree recursively
  const renderCategoryTree = (categoryList, level = 0) => {
    return categoryList.map((category) => (
      <div key={category._id} style={{ marginLeft: `${level * 24}px` }}>
        {/* Category Item */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: level === 0 ? 'var(--bg-light)' : 'transparent',
          transition: 'background-color 0.2s ease'
        }}>
          {/* Expand/Collapse Button */}
          {category.children && category.children.length > 0 && (
            <button
              onClick={() => toggleCategory(category._id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-2)',
                marginRight: 'var(--space-2)',
                fontSize: 'var(--font-size-lg)',
                color: 'var(--text-light)'
              }}
            >
              {expandedCategories.has(category._id) ? '📂' : '📁'}
            </button>
          )}
          
          {/* Category Icon based on level */}
          <div style={{ marginRight: 'var(--space-3)' }}>
            {level === 0 ? '📁' : level === 1 ? '📂' : '📄'}
          </div>

          {/* Category Info */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: '600', 
              color: 'var(--text-dark)',
              marginBottom: 'var(--space-1)'
            }}>
              {category.name}
              {category.level && (
                <span style={{
                  marginLeft: 'var(--space-2)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-light)',
                  background: 'var(--bg-gray)',
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  Level {category.level}
                </span>
              )}
            </div>
            
            {category.description && (
              <div style={{ 
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-light)',
                marginBottom: 'var(--space-1)'
              }}>
                {category.description}
              </div>
            )}

            <div style={{ 
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-light)'
            }}>
              Slug: {category.seo?.slug || 'No slug'}
              {category.parent && (
                <span style={{ marginLeft: 'var(--space-3)' }}>
                  Parent: {category.parent.name}
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ marginRight: 'var(--space-4)' }}>
            <span 
              style={{ 
                backgroundColor: category.status === 'active' ? 'var(--success)' : 'var(--error)',
                color: 'white',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600'
              }}
            >
              {category.status}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button 
              className="btn btn-secondary"
              style={{ padding: 'var(--space-2) var(--space-3)' }}
              onClick={() => handleEditCategory(category)}
            >
              Edit
            </button>
            <button 
              className="btn btn-danger"
              style={{ padding: 'var(--space-2) var(--space-3)' }}
              onClick={() => handleDeleteCategory(category._id)}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Children */}
        {category.children && category.children.length > 0 && expandedCategories.has(category._id) && (
          <div style={{ 
            borderLeft: level > 0 ? '2px solid var(--border-light)' : 'none',
            marginLeft: level > 0 ? '12px' : '0'
          }}>
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
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
            Categories <span className="accent-gold">Management</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your category hierarchy and organization
          </p>
        </div>
        <button 
          className="btn btn-gold"
          onClick={handleAddCategory}
        >
          <span>+</span>
          Add Category
        </button>
      </div>

      {/* Categories Tree */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent-gold)' }}>📁</span>
            Category Hierarchy ({categories.length} total)
          </h3>
        </div>
        
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-8)',
              color: 'var(--text-light)'
            }}>
              <p>No categories found.</p>
              <button 
                className="btn btn-gold"
                onClick={handleAddCategory}
                style={{ marginTop: 'var(--space-4)' }}
              >
                Add Your First Category
              </button>
            </div>
          ) : (
            <div>
              {/* Header Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-4)',
                borderBottom: '2px solid var(--border-light)',
                backgroundColor: 'var(--bg-light)',
                fontWeight: '600',
                color: 'var(--text-dark)'
              }}>
                <div style={{ width: '40px' }}></div>
                <div style={{ flex: 1 }}>Category Name</div>
                <div style={{ width: '100px', textAlign: 'center' }}>Status</div>
                <div style={{ width: '150px', textAlign: 'center' }}>Actions</div>
              </div>

              {/* Category Tree */}
              {renderCategoryTree(categories)}
            </div>
          )}
        </div>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm 
          category={editingCategory}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingCategory(null);
            fetchCategories(); // Refresh the list
          }}
        />
      )}
    </div>
  );
};

export default CategoriesManagement;