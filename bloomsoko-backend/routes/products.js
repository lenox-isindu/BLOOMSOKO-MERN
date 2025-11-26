import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

// ROBUST Helper function for your specific category structure
async function getCategoryHierarchyIds(mainCategoryId) {
  try {
    const categoryIds = [mainCategoryId];
    
    console.log('🌳 Building category hierarchy for:', mainCategoryId);
    
    // Get the main category
    const mainCategory = await Category.findById(mainCategoryId);
    if (!mainCategory) {
      console.log('❌ Main category not found');
      return categoryIds;
    }
    
    console.log('📊 Main category:', mainCategory.name, 'Level:', mainCategory.level);
    
    // METHOD 1: Find direct children by parent reference
    const directChildren = await Category.find({ parent: mainCategoryId });
    console.log('👶 Direct children:', directChildren.map(c => c.name));
    
    directChildren.forEach(child => {
      categoryIds.push(child._id);
    });
    
    // METHOD 2: Handle specific categories by name (fallback)
    if (mainCategory.name === 'Agricultural Produce') {
      console.log('🚜 Processing Agricultural Produce hierarchy...');
      
      // Add Farm Produce (should already be included via parent, but just in case)
      const farmProduce = await Category.findOne({ name: 'Farm Produce' });
      if (farmProduce && !categoryIds.some(id => id.equals(farmProduce._id))) {
        categoryIds.push(farmProduce._id);
        console.log('✅ Added Farm Produce');
      }
      
      // Add Livestock Produce (should already be included via parent, but just in case)
      const livestockProduce = await Category.findOne({ name: 'Livestock Produce' });
      if (livestockProduce && !categoryIds.some(id => id.equals(livestockProduce._id))) {
        categoryIds.push(livestockProduce._id);
        console.log('✅ Added Livestock Produce');
      }
    }
    
    // For Fashion: Include level 3 items
    else if (mainCategory.name === 'Fashion') {
      console.log('👗 Processing Fashion hierarchy...');
      
      // Get all level 2 categories under Fashion
      const level2Categories = await Category.find({ parent: mainCategoryId });
      
      for (const level2Cat of level2Categories) {
        // Add level 3 categories under each level 2 category
        const level3Items = await Category.find({ parent: level2Cat._id });
        level3Items.forEach(item => {
          if (!categoryIds.some(id => id.equals(item._id))) {
            categoryIds.push(item._id);
          }
        });
      }
      
      console.log('✅ Added level 3 fashion items');
    }
    
    // For Beauty: Include all level 2 categories
    else if (mainCategory.name === 'Beauty') {
      console.log('💄 Processing Beauty hierarchy...');
      
      const beautySubcategories = await Category.find({ 
        $or: [
          { name: 'Make Up' },
          { name: 'Skin Care' },
          { name: 'Hair Care' },
          { name: 'Nail Care' }
        ]
      });
      
      beautySubcategories.forEach(subcat => {
        if (!categoryIds.some(id => id.equals(subcat._id))) {
          categoryIds.push(subcat._id);
        }
      });
      
      console.log('✅ Added beauty subcategories');
    }
    
    // For Household: Include all level 2 categories
    else if (mainCategory.name === 'Household') {
      console.log('🏠 Processing Household hierarchy...');
      
      const householdSubcategories = await Category.find({
        $or: [
          { name: 'Curtains' },
          { name: 'Beddings' },
          { name: 'Carpets' },
          { name: 'Doormats' },
          { name: 'Utensils' },
          { name: 'Decor' }
        ]
      });
      
      householdSubcategories.forEach(subcat => {
        if (!categoryIds.some(id => id.equals(subcat._id))) {
          categoryIds.push(subcat._id);
        }
      });
      
      console.log('✅ Added household subcategories');
    }
    
    console.log('✅ Final category IDs for filtering:', categoryIds.map(id => id.toString()));
    return categoryIds;
    
  } catch (error) {
    console.error('❌ Error building category hierarchy:', error);
    return [mainCategoryId];
  }
}

// GET /api/products - Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 20,
      ...filters
    } = req.query;

    // Build query object
    let query = { status: 'active' };

    console.log('🔄 Received query parameters:', req.query);

    // CATEGORY FILTER - HIERARCHICAL SEARCH
    if (category && category !== 'all') {
      console.log('🔍 FILTERING BY CATEGORY HIERARCHY:', category);
      
      let categoryDoc = null;
      
      // FIXED: Look for slug in seo.slug field
      categoryDoc = await Category.findOne({
        $or: [
          { 'seo.slug': { $regex: new RegExp('^' + category + '$', 'i') } },
          { name: { $regex: new RegExp('^' + category + '$', 'i') } }
        ]
      });
      
      if (categoryDoc) {
        console.log('✅ Found category:', {
          name: categoryDoc.name,
          seoSlug: categoryDoc.seo?.slug,
          level: categoryDoc.level,
          _id: categoryDoc._id
        });
        
        // Get ALL category IDs in this hierarchy
        const categoryIds = await getCategoryHierarchyIds(categoryDoc._id);
        console.log('🎯 Filtering by category IDs:', categoryIds);
        
        query.category = { $in: categoryIds };
      } else {
        console.log('❌ Category not found:', category);
      }
    }

    // SUBCATEGORY FILTER - For direct subcategory filtering (Level 2)
    if (req.query.subcategory) {
      console.log('🔍 FILTERING BY SUBCATEGORY:', req.query.subcategory);
      
      const subcategorySlugs = Array.isArray(req.query.subcategory) 
        ? req.query.subcategory 
        : [req.query.subcategory];
      
      const subcategoryDocs = await Category.find({
        $or: [
          { 'seo.slug': { $in: subcategorySlugs } },
          { name: { $in: subcategorySlugs.map(s => new RegExp(s, 'i')) } }
        ]
      });
      
      if (subcategoryDocs.length > 0) {
        console.log('📊 Found subcategories:', subcategoryDocs.map(doc => doc.name));
        
        // If we already have a category filter, combine with $and for proper hierarchy
        if (query.category) {
          const existingCategoryIds = query.category.$in;
          const subcategoryIds = subcategoryDocs.map(doc => doc._id);
          
          // Find intersection: products that are in both the main category AND the selected subcategories
          query.$and = [
            { category: { $in: existingCategoryIds } },
            { category: { $in: subcategoryIds } }
          ];
          delete query.category;
        } else {
          query.category = { $in: subcategoryDocs.map(doc => doc._id) };
        }
      }
    }

    // ITEM FILTER - For level 3 items (SPECIFICALLY FOR FASHION)
    if (req.query.item) {
      console.log('🔍 FILTERING BY ITEM:', req.query.item);
      
      const itemSlugs = Array.isArray(req.query.item) 
        ? req.query.item 
        : [req.query.item];
      
      const itemDocs = await Category.find({
        $or: [
          { 'seo.slug': { $in: itemSlugs } },
          { name: { $in: itemSlugs.map(s => new RegExp(s, 'i')) } }
        ]
      });
      
      if (itemDocs.length > 0) {
        console.log('📊 Found items:', itemDocs.map(doc => doc.name));
        
        const itemIds = itemDocs.map(doc => doc._id);
        
        // If we already have a category filter, combine with $and
        if (query.category) {
          if (query.$and) {
            // Already have $and from subcategory filter, add item filter
            query.$and.push({ category: { $in: itemIds } });
          } else {
            const existingCategoryIds = query.category.$in;
            query.$and = [
              { category: { $in: existingCategoryIds } },
              { category: { $in: itemIds } }
            ];
            delete query.category;
          }
        } else {
          query.category = { $in: itemIds };
        }
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Flag filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === 'true') {
        query[`flags.${key}`] = true;
      }
    });

    // Build sort object
    let sortOptions = {};
    if (sort) {
      const [field, direction] = sort.split(':');
      sortOptions[field] = direction === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    console.log('🎯 FINAL QUERY:', JSON.stringify(query, null, 2));

    // Execute query
    const products = await Product.find(query)
      .populate("category", "name slug level parent description seo")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    console.log(`✅ QUERY RESULTS: Found ${products.length} products out of ${total} total`);

    // Debug: Show what categories the products belong to
    console.log('📦 PRODUCT CATEGORIES:');
    products.forEach(product => {
      console.log(`   - ${product.name} → ${product.category?.name} (Level ${product.category?.level})`);
    });

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Fix category slugs route
router.post('/fix-category-slugs', async (req, res) => {
  try {
    const categories = await Category.find({});
    
    const updatePromises = categories.map(async (category) => {
      const slug = category.name.toLowerCase().replace(/\s+/g, '-');
      await Category.findByIdAndUpdate(category._id, { slug });
      console.log(`✅ Added slug "${slug}" to "${category.name}"`);
    });
    
    await Promise.all(updatePromises);
    
    res.json({ 
      success: true, 
      message: 'Fixed all category slugs' 
    });
    
  } catch (error) {
    console.error('Error fixing slugs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fixing slugs', 
      error: error.message 
    });
  }
});

// Debug route to check Fashion hierarchy
router.get('/debug/fashion-hierarchy', async (req, res) => {
  try {
    const fashionCategory = await Category.findOne({ name: 'Fashion' });
    
    if (!fashionCategory) {
      return res.json({ error: 'Fashion category not found' });
    }
    
    console.log('👗 Fashion Category:', fashionCategory);
    
    // Get direct children (Level 2)
    const level2Categories = await Category.find({ parent: fashionCategory._id });
    console.log('🌱 Level 2 categories:', level2Categories.map(c => c.name));
    
    // Get all level 3 items
    const level3Items = [];
    for (const level2Cat of level2Categories) {
      const items = await Category.find({ parent: level2Cat._id });
      level3Items.push(...items);
      console.log(`   ${level2Cat.name} items:`, items.map(i => i.name));
    }
    
    // Get all products in Fashion hierarchy
    const hierarchyIds = await getCategoryHierarchyIds(fashionCategory._id);
    console.log('🎯 Hierarchy IDs:', hierarchyIds);
    
    const products = await Product.find({ category: { $in: hierarchyIds } })
      .populate('category', 'name level');
    
    console.log('📦 Products in Fashion hierarchy:');
    products.forEach(p => {
      console.log(`   - ${p.name} → ${p.category?.name} (Level ${p.category?.level})`);
    });
    
    res.json({
      mainCategory: fashionCategory,
      level2Categories: level2Categories,
      level3Items: level3Items,
      hierarchyIds: hierarchyIds,
      products: products
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Fashion filtering specifically
router.get('/test/fashion-filter', async (req, res) => {
  try {
    const { item, subcategory } = req.query;
    
    console.log('🧪 TESTING FASHION FILTERING...');
    console.log('   Query params:', { item, subcategory });
    
    // Test the fashion category
    const fashionCategory = await Category.findOne({ 'seo.slug': 'fashion' });
    if (!fashionCategory) {
      return res.json({ error: 'Fashion category not found' });
    }
    
    // Build base query with fashion hierarchy
    const hierarchyIds = await getCategoryHierarchyIds(fashionCategory._id);
    let query = { 
      status: 'active',
      category: { $in: hierarchyIds }
    };
    
    console.log('   Base fashion hierarchy IDs:', hierarchyIds);
    
    // Test item filtering
    if (item) {
      const itemSlugs = Array.isArray(item) ? item : [item];
      const itemDocs = await Category.find({
        'seo.slug': { $in: itemSlugs }
      });
      
      console.log('   Found items:', itemDocs.map(doc => doc.name));
      
      if (itemDocs.length > 0) {
        const itemIds = itemDocs.map(doc => doc._id);
        query.$and = [
          { category: { $in: hierarchyIds } },
          { category: { $in: itemIds } }
        ];
        delete query.category;
      }
    }
    
    console.log('   Final query:', JSON.stringify(query, null, 2));
    
    const products = await Product.find(query)
      .populate('category', 'name level');
    
    console.log(`   Found ${products.length} products`);
    products.forEach(p => {
      console.log(`     - ${p.name} → ${p.category?.name}`);
    });
    
    res.json({
      fashionCategory: fashionCategory,
      query: query,
      productsFound: products.length,
      products: products.map(p => ({
        name: p.name,
        category: p.category?.name,
        categoryLevel: p.category?.level
      }))
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check all category slugs
router.get('/debug/category-slugs', async (req, res) => {
  try {
    const categories = await Category.find({});
    
    const categoryInfo = categories.map(cat => ({
      name: cat.name,
      seoSlug: cat.seo?.slug,
      level: cat.level,
      _id: cat._id,
      parent: cat.parent
    }));
    
    console.log('📊 ALL CATEGORIES IN DATABASE:');
    categoryInfo.forEach(cat => {
      console.log(`   - "${cat.name}" → seo.slug: "${cat.seoSlug}" (Level ${cat.level})`);
    });
    
    // Specifically check for fashion categories
    const fashionCategories = await Category.find({
      name: { $regex: 'fashion|men|women|children|trousers|shirts', $options: 'i' }
    });
    
    console.log('👗 FASHION-RELATED CATEGORIES:');
    fashionCategories.forEach(cat => {
      console.log(`   - "${cat.name}" → seo.slug: "${cat.seo?.slug}" (Level ${cat.level})`);
    });
    
    res.json({
      allCategories: categoryInfo,
      fashionCategories: fashionCategories.map(cat => ({
        name: cat.name,
        seoSlug: cat.seo?.slug,
        level: cat.level,
        _id: cat._id
      }))
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify the fix is working
router.get('/verify-fix', async (req, res) => {
  try {
    // Test fashion category
    const fashionCategory = await Category.findOne({ 
      'seo.slug': 'fashion' 
    });
    
    if (!fashionCategory) {
      return res.json({ error: 'Fashion category not found by seo.slug' });
    }
    
    // Build hierarchy
    const hierarchyIds = await getCategoryHierarchyIds(fashionCategory._id);
    
    // Find products
    const products = await Product.find({ 
      category: { $in: hierarchyIds } 
    }).populate('category', 'name level');
    
    res.json({
      success: true,
      fashionCategory: {
        name: fashionCategory.name,
        seoSlug: fashionCategory.seo.slug,
        _id: fashionCategory._id
      },
      hierarchyIds: hierarchyIds,
      productsFound: products.length,
      products: products.map(p => ({
        name: p.name,
        category: p.category?.name,
        categoryLevel: p.category?.level
      }))
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
});
// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Fetching single product by ID:', id);
    
    // Validate ID format
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Find product by ID and populate category details
    const product = await Product.findById(id)
      .populate("category", "name slug level parent description seo");
    
    if (!product) {
      console.log('❌ Product not found with ID:', id);
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is active
    if (product.status !== 'active') {
      console.log('❌ Product is not active:', id);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ Found product:', product.name);
    
    res.json(product);
    
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

export default router;