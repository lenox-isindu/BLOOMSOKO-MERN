import React, { useState, useEffect } from 'react';
import { productAPI, categoryAPI, uploadAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const ProductForm = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: '', // Final category ID
    mainCategory: '', // Level 1
    subCategory: '', // Level 2
    childCategory: '', // Level 3
    inventory: {
      stock: 0,
      sku: '',
      trackQuantity: true
    },
    productType: 'ready',
    growingDetails: {
      expectedReadyDate: '',
      currentStage: 'growing',
      progress: 0
    },
    status: 'active',
    tags: [],
    flags: {
      isFeatured: false,
      onSale: false,
      isNew: false,
      isLimited: false,
      isBestSeller: false,
      isEcoFriendly: false,
      isOrganic: false,
      isHandmade: false,
      isLocal: false,
      isPremium: false,
      isQuickDelivery: false,
      isSeasonal: false,
    },
    images: [],
    featuredImage: { url: '', alt: '' }
  });
  
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categoryPath, setCategoryPath] = useState('');

  // Fetch main categories - FIXED
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        console.log('Fetching main categories...');
        const response = await categoryAPI.getMain();
        console.log('Main categories loaded:', response);
        setMainCategories(response || []); // FIXED: Use response directly, not response.data
      } catch (error) {
        console.error('Error fetching main categories:', error);
        toast.error('Failed to load categories');
      }
    };
    
    fetchMainCategories();
  }, []);

  // Function to get category path for display
  const getCategoryPath = async (categoryId) => {
    try {
      const response = await categoryAPI.getById(categoryId);
      const category = response; // FIXED: Use response directly
      
      let path = category.name;
      let currentCategory = category;
      
      // Build path by traversing up the hierarchy
      while (currentCategory.parent) {
        const parentResponse = await categoryAPI.getById(currentCategory.parent);
        currentCategory = parentResponse; // FIXED: Use response directly
        path = `${currentCategory.name} > ${path}`;
      }
      
      return path;
    } catch (error) {
      console.error('Error getting category path:', error);
      return 'Unknown Category';
    }
  };

  // Update category path when final category changes
  useEffect(() => {
    if (formData.category) {
      getCategoryPath(formData.category).then(path => {
        setCategoryPath(path);
      });
    } else {
      setCategoryPath('');
    }
  }, [formData.category]);

  // Populate form if editing - FIXED
  useEffect(() => {
    if (product) {
      const populateCategoryHierarchy = async () => {
        try {
          // First set the basic form data - FIXED: Ensure arrays are safe
          setFormData(prev => ({
            ...prev,
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            comparePrice: product.comparePrice || '',
            category: product.category?._id || product.category || '',
            inventory: {
              stock: product.inventory?.stock || 0,
              sku: product.inventory?.sku || '',
              trackQuantity: product.inventory?.trackQuantity !== false
            },
            productType: product.productType || 'ready',
            growingDetails: {
              expectedReadyDate: product.growingDetails?.expectedReadyDate 
                ? new Date(product.growingDetails.expectedReadyDate).toISOString().split('T')[0]
                : '',
              currentStage: product.growingDetails?.currentStage || 'growing',
              progress: product.growingDetails?.progress || 0
            },
            status: product.status || 'active',
            tags: product.tags || [],
            flags: {
              isFeatured: product.flags?.isFeatured || false,
              onSale: product.flags?.onSale || false,
              isNew: product.flags?.isNew || false,
              isLimited: product.flags?.isLimited || false,
              isBestSeller: product.flags?.isBestSeller || false,
              isEcoFriendly: product.flags?.isEcoFriendly || false,
              isOrganic: product.flags?.isOrganic || false,
              isHandmade: product.flags?.isHandmade || false,
              isLocal: product.flags?.isLocal || false,
              isPremium: product.flags?.isPremium || false,
              isQuickDelivery: product.flags?.isQuickDelivery || false,
              isSeasonal: product.flags?.isSeasonal || false,
            },
            images: product.images || [], // FIXED: Ensure array
            featuredImage: product.featuredImage || { url: '', alt: '' } // FIXED: Ensure object
          }));

          // If editing and category exists, populate the hierarchy
          if (product.category) {
            const categoryId = product.category._id || product.category;
            const categoryResponse = await categoryAPI.getById(categoryId);
            const currentCategory = categoryResponse; // FIXED: Use response directly
            
            let mainCatId = '';
            let subCatId = '';
            let childCatId = '';

            // Traverse up the hierarchy to find all parent levels
            let tempCategory = currentCategory;
            const hierarchy = [];

            while (tempCategory) {
              hierarchy.unshift(tempCategory);
              if (tempCategory.parent) {
                const parentResponse = await categoryAPI.getById(tempCategory.parent);
                tempCategory = parentResponse; // FIXED: Use response directly
              } else {
                tempCategory = null;
              }
            }

            // Assign levels based on hierarchy
            if (hierarchy.length >= 1) {
              mainCatId = hierarchy[0]._id;
            }
            if (hierarchy.length >= 2) {
              subCatId = hierarchy[1]._id;
            }
            if (hierarchy.length >= 3) {
              childCatId = hierarchy[2]._id;
            }

            // Set the hierarchy state
            setFormData(prev => ({
              ...prev,
              mainCategory: mainCatId,
              subCategory: subCatId,
              childCategory: childCatId
            }));

            // Load subcategories if main category exists
            if (mainCatId) {
              const subResponse = await categoryAPI.getSubcategories(mainCatId);
              setSubCategories(subResponse || []); // FIXED: Use response directly
            }

            // Load child categories if sub category exists
            if (subCatId) {
              const childResponse = await categoryAPI.getSubcategories(subCatId);
              setChildCategories(childResponse || []); // FIXED: Use response directly
            }
          }
        } catch (error) {
          console.error('Error populating category hierarchy:', error);
        }
      };

      populateCategoryHierarchy();
    }
  }, [product]);

  // Image upload handlers - FIXED
  const handleImageUpload = async (file, isFeatured = false) => {
    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await uploadAPI.uploadSingle(uploadFormData);
      const imageData = {
        url: response.data?.url || response.url, // FIXED: Safe access
        alt: file.name || 'Product image'
      };

      if (isFeatured) {
        setFormData(prev => ({
          ...prev,
          featuredImage: imageData
        }));
        toast.success('Featured image uploaded successfully!');
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), imageData] // FIXED: Safe array spread
        }));
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleImageUpload = async (files) => {
    try {
      setUploading(true);
      const uploadFormData = new FormData();
      Array.from(files).forEach(file => {
        uploadFormData.append('images', file);
      });

      const response = await uploadAPI.uploadMultiple(uploadFormData);
      
      const newImages = (response.data?.images || response.images || []).map(img => ({ // FIXED: Safe access
        url: img.url,
        alt: 'Product image'
      }));

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages] // FIXED: Safe array spread
      }));

      toast.success(`${files.length} images uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index, isFeatured = false) => {
    if (isFeatured) {
      setFormData(prev => ({
        ...prev,
        featuredImage: { url: '', alt: '' }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        images: (prev.images || []).filter((_, i) => i !== index) // FIXED: Safe array filter
      }));
    }
  };

  const setAsFeatured = (image) => {
    setFormData(prev => ({
      ...prev,
      featuredImage: image,
      images: (prev.images || []).filter(img => img.url !== image.url) // FIXED: Safe array filter
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('inventory.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.startsWith('growingDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        growingDetails: {
          ...prev.growingDetails,
          [field]: field === 'progress' ? parseInt(value) : value
        }
      }));
    } else if (name.startsWith('flags.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        flags: {
          ...prev.flags,
          [field]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate category
      if (!formData.category) {
        toast.error('Please select a category');
        setLoading(false);
        return;
      }

      // Validate featured image
      if (!formData.featuredImage.url) {
        toast.error('Please upload a featured image');
        setLoading(false);
        return;
      }

      // Prepare data for API
      const submitData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : 0,
        category: formData.category,
        inventory: {
          ...formData.inventory,
          stock: parseInt(formData.inventory.stock),
          sku: formData.inventory.sku || undefined
        },
        productType: formData.productType,
        growingDetails: formData.productType !== 'ready' ? {
          ...formData.growingDetails,
          expectedReadyDate: formData.growingDetails.expectedReadyDate 
            ? new Date(formData.growingDetails.expectedReadyDate)
            : undefined,
          progress: parseInt(formData.growingDetails.progress)
        } : undefined,
        status: formData.status,
        tags: formData.tags,
        flags: formData.flags,
        images: formData.images,
        featuredImage: formData.featuredImage
      };

      if (product) {
        await productAPI.update(product._id, submitData);
        toast.success('Product updated successfully!');
      } else {
        await productAPI.create(submitData);
        toast.success('Product created successfully!');
      }

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to ${product ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
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
        maxWidth: '800px',
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
              {product ? '✏️' : '➕'}
            </span>
            {product ? 'Edit Product' : 'Add New Product'}
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
                    <label className="form-label">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter product name"
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
                      placeholder="Enter product description"
                      rows="4"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">Price (KSH) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Compare Price (KSH)</label>
                      <input
                        type="number"
                        name="comparePrice"
                        value={formData.comparePrice}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cascading Category Selection - FIXED */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Category Selection
                </h4>
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  
                  {/* Main Category */}
                  <div className="form-group">
                    <label className="form-label">Main Category *</label>
                    <select
                      name="mainCategory"
                      value={formData.mainCategory || ''}
                      onChange={async (e) => {
                        const mainCatId = e.target.value;
                        console.log('Selected main category:', mainCatId);
                        
                        setFormData(prev => ({
                          ...prev,
                          mainCategory: mainCatId,
                          subCategory: '',
                          childCategory: '',
                          category: '' // Reset final category
                        }));

                        if (mainCatId) {
                          try {
                            console.log('Fetching subcategories for main category:', mainCatId);
                            const response = await categoryAPI.getSubcategories(mainCatId);
                            console.log('Subcategories loaded:', response);
                            setSubCategories(response || []); // FIXED: Use response directly
                            setChildCategories([]);
                            
                            // If no subcategories, set main category as final category
                            if ((response || []).length === 0) { // FIXED: Safe length check
                              console.log('No subcategories, setting main as final category');
                              setFormData(prev => ({
                                ...prev,
                                category: mainCatId
                              }));
                            }
                          } catch (error) {
                            console.error('Error fetching subcategories:', error);
                            toast.error('Failed to load subcategories');
                            setSubCategories([]);
                            setChildCategories([]);
                          }
                        } else {
                          setSubCategories([]);
                          setChildCategories([]);
                        }
                      }}
                      className="form-select"
                      required
                      disabled={mainCategories.length === 0}
                    >
                      <option value="">
                        {mainCategories.length === 0 ? 'Loading categories...' : 'Select Main Category'}
                      </option>
                      {mainCategories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {mainCategories.length === 0 && (
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)', 
                        color: 'var(--text-light)',
                        marginTop: 'var(--space-2)'
                      }}>
                        Loading categories from server...
                      </div>
                    )}
                  </div>

                  {/* Sub Category - Show when main category is selected */}
                  {formData.mainCategory && (
                    <div className="form-group">
                      <label className="form-label">
                        Sub Category {subCategories.length === 0 && '(No subcategories available)'}
                      </label>
                      <select
                        name="subCategory"
                        value={formData.subCategory || ''}
                        onChange={async (e) => {
                          const subCatId = e.target.value;
                          console.log('Selected subcategory:', subCatId);
                          
                          setFormData(prev => ({
                            ...prev,
                            subCategory: subCatId,
                            childCategory: '',
                            category: subCatId // Set as final category by default
                          }));

                          if (subCatId) {
                            try {
                              console.log('Fetching child categories for:', subCatId);
                              const response = await categoryAPI.getSubcategories(subCatId);
                              console.log('Child categories loaded:', response);
                              const children = response || []; // FIXED: Use response directly
                              setChildCategories(children);
                              
                              // If children exist, reset final category (will be set when child is selected)
                              if (children.length > 0) {
                                setFormData(prev => ({
                                  ...prev,
                                  category: ''
                                }));
                              }
                              // If no children, subcategory is the final category (already set above)
                            } catch (error) {
                              console.error('Error fetching child categories:', error);
                              toast.error('Failed to load child categories');
                              setChildCategories([]);
                              // Keep subcategory as final category even if error
                            }
                          } else {
                            setChildCategories([]);
                            setFormData(prev => ({
                              ...prev,
                              category: ''
                            }));
                          }
                        }}
                        className="form-select"
                        disabled={subCategories.length === 0}
                      >
                        <option value="">
                          {subCategories.length === 0 ? 'No subcategories available' : 'Select Sub Category'}
                        </option>
                        {subCategories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {subCategories.length === 0 && (
                        <div style={{ 
                          fontSize: 'var(--font-size-sm)', 
                          color: 'var(--text-light)',
                          marginTop: 'var(--space-2)'
                        }}>
                          This category doesn't have any subcategories. The main category will be used.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Child Category - Show when sub category has children */}
                  {formData.subCategory && childCategories.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">
                        {childCategories[0]?.level === 3 ? 'Specific Category' : 'Child Category'}
                      </label>
                      <select
                        name="childCategory"
                        value={formData.childCategory || ''}
                        onChange={(e) => {
                          const childCatId = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            childCategory: childCatId,
                            category: childCatId // Set as final category
                          }));
                        }}
                        className="form-select"
                      >
                        <option value="">Select {childCategories[0]?.level === 3 ? 'Specific Category' : 'Child Category'}</option>
                        {childCategories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Display selected category path */}
                  {categoryPath && (
                    <div style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{ 
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-light)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Selected Category:
                      </div>
                      <div style={{ 
                        fontWeight: '600',
                        color: 'var(--accent-gold)'
                      }}>
                        {categoryPath}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload Section - FIXED */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Product Images
                </h4>
                
                {/* Featured Image */}
                <div className="form-group">
                  <label className="form-label">Featured Image *</label>
                  <div style={{ 
                    border: '2px dashed var(--border-medium)', 
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-5)',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-light)',
                    transition: 'all 0.2s ease',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-light)';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-light)';
                    
                    if (!uploading && e.dataTransfer.files.length > 0) {
                      handleImageUpload(e.dataTransfer.files[0], true);
                    }
                  }}
                  >
                    {formData.featuredImage.url ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={formData.featuredImage.url} 
                          alt="Featured" 
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: 'var(--radius-md)',
                            border: '3px solid var(--accent-gold)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(null, true)}
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
                          📷
                        </div>
                        <p style={{ marginBottom: 'var(--space-3)', color: 'var(--text-light)' }}>
                          {uploading ? 'Uploading...' : 'Drag & drop featured image or click to browse'}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleImageUpload(e.target.files[0], true);
                            }
                          }}
                          style={{ display: 'none' }}
                          id="featuredImage"
                          disabled={uploading}
                        />
                        <label 
                          htmlFor="featuredImage"
                          className="btn btn-gold"
                          style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                        >
                          {uploading ? 'Uploading...' : 'Choose Featured Image'}
                        </label>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginTop: 'var(--space-2)' }}>
                    This will be the main image displayed for your product
                  </p>
                </div>

                {/* Additional Images - FIXED: Safe length checks */}
                <div className="form-group">
                  <label className="form-label">Additional Images</label>
                  <div style={{ 
                    border: '2px dashed var(--border-medium)', 
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-5)',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-light)',
                    transition: 'all 0.2s ease',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-light)';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-light)';
                    
                    if (!uploading && e.dataTransfer.files.length > 0) {
                      handleMultipleImageUpload(e.dataTransfer.files);
                    }
                  }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>
                      🖼️
                    </div>
                    <p style={{ marginBottom: 'var(--space-3)', color: 'var(--text-light)' }}>
                      {uploading ? 'Uploading...' : 'Drag & drop multiple images or click to browse'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files.length > 0) {
                          handleMultipleImageUpload(e.target.files);
                        }
                      }}
                      style={{ display: 'none' }}
                      id="additionalImages"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="additionalImages"
                      className="btn btn-secondary"
                      style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                    >
                      {uploading ? 'Uploading...' : 'Choose Additional Images'}
                    </label>
                  </div>
                  
                  {/* Display additional images - FIXED: Safe length checks */}
                  {(formData.images && formData.images.length > 0) && (
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <h5 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-dark)' }}>
                        Additional Images ({(formData.images || []).length})
                      </h5>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: 'var(--space-3)'
                      }}>
                        {(formData.images || []).map((image, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img 
                              src={image.url} 
                              alt={`Product ${index + 1}`}
                              style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--border-light)'
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              display: 'flex',
                              gap: '2px'
                            }}>
                              <button
                                type="button"
                                onClick={() => setAsFeatured(image)}
                                style={{
                                  background: 'var(--accent-gold)',
                                  color: 'var(--text-dark)',
                                  border: 'none',
                                  borderRadius: '2px',
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}
                                title="Set as featured"
                              >
                                ⭐
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                style={{
                                  background: 'var(--error)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '2px',
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Type */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Product Type
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="productType"
                      value="ready"
                      checked={formData.productType === 'ready'}
                      onChange={handleInputChange}
                    />
                    <span>Ready to Buy</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="productType"
                      value="growing"
                      checked={formData.productType === 'growing'}
                      onChange={handleInputChange}
                    />
                    <span>Growing/Pre-order</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="productType"
                      value="pre-order"
                      checked={formData.productType === 'pre-order'}
                      onChange={handleInputChange}
                    />
                    <span>Pre-order Only</span>
                  </label>
                </div>
              </div>

              {/* Growing Details - Show only for non-ready products */}
              {formData.productType !== 'ready' && (
                <div>
                  <h4 style={{ 
                    marginBottom: 'var(--space-4)',
                    color: 'var(--text-dark)',
                    borderBottom: '2px solid var(--accent-gold)',
                    paddingBottom: 'var(--space-2)'
                  }}>
                    Growing & Pre-order Details
                  </h4>
                  <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">Expected Ready Date *</label>
                      <input
                        type="date"
                        name="growingDetails.expectedReadyDate"
                        value={formData.growingDetails.expectedReadyDate}
                        onChange={handleInputChange}
                        className="form-input"
                        required={formData.productType !== 'ready'}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Current Growth Stage</label>
                      <select
                        name="growingDetails.currentStage"
                        value={formData.growingDetails.currentStage}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="planting">Planting</option>
                        <option value="growing">Growing</option>
                        <option value="almost-ready">Almost Ready</option>
                        <option value="ready">Ready</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Growth Progress: {formData.growingDetails.progress}%
                      </label>
                      <input
                        type="range"
                        name="growingDetails.progress"
                        value={formData.growingDetails.progress}
                        onChange={handleInputChange}
                        className="form-input"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Inventory
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      name="inventory.stock"
                      value={formData.inventory.stock}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU (Optional)</label>
                    <input
                      type="text"
                      name="inventory.sku"
                      value={formData.inventory.sku}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Product SKU"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="inventory.trackQuantity"
                      checked={formData.inventory.trackQuantity}
                      onChange={handleInputChange}
                    />
                    <span>Track quantity</span>
                  </label>
                </div>
              </div>

              {/* Enhanced Flags */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Product Flags & Attributes
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: 'var(--space-3)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isFeatured"
                      checked={formData.flags.isFeatured}
                      onChange={handleInputChange}
                    />
                    <span>⭐ Featured Product</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.onSale"
                      checked={formData.flags.onSale}
                      onChange={handleInputChange}
                    />
                    <span>🏷️ on offer</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isNew"
                      checked={formData.flags.isNew}
                      onChange={handleInputChange}
                    />
                    <span>🆕 New Arrival</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isLimited"
                      checked={formData.flags.isLimited}
                      onChange={handleInputChange}
                    />
                    <span>⏰ Limited Edition</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isBestSeller"
                      checked={formData.flags.isBestSeller}
                      onChange={handleInputChange}
                    />
                    <span>🔥 Best Seller</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isEcoFriendly"
                      checked={formData.flags.isEcoFriendly}
                      onChange={handleInputChange}
                    />
                    <span>🌱 Eco Friendly</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isOrganic"
                      checked={formData.flags.isOrganic}
                      onChange={handleInputChange}
                    />
                    <span>🍃 Organic</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isHandmade"
                      checked={formData.flags.isHandmade}
                      onChange={handleInputChange}
                    />
                    <span>✋ Handmade</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isLocal"
                      checked={formData.flags.isLocal}
                      onChange={handleInputChange}
                    />
                    <span>🏠 Local Product</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isPremium"
                      checked={formData.flags.isPremium}
                      onChange={handleInputChange}
                    />
                    <span>💎 Premium Quality</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isQuickDelivery"
                      checked={formData.flags.isQuickDelivery}
                      onChange={handleInputChange}
                    />
                    <span>🚚 Quick Delivery</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="flags.isSeasonal"
                      checked={formData.flags.isSeasonal}
                      onChange={handleInputChange}
                    />
                    <span>🍂 Seasonal Product</span>
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 style={{ 
                  marginBottom: 'var(--space-4)',
                  color: 'var(--text-dark)',
                  borderBottom: '2px solid var(--accent-gold)',
                  paddingBottom: 'var(--space-2)'
                }}>
                  Tags
                </h4>
                <div className="form-group">
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="form-input"
                      placeholder="Add a tag"
                      style={{ flex: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={handleAddTag}
                    >
                      Add
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {formData.tags.map(tag => (
                      <span 
                        key={tag}
                        style={{
                          background: 'var(--accent-gold)',
                          color: 'var(--text-dark)',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontWeight: '500'
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-dark)'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
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
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={handleInputChange}
                    />
                    <span>Draft</span>
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
              disabled={loading || uploading || !formData.category}
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;