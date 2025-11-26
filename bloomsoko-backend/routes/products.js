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

    // SUBCATEGORY FILTER - For direct subcategory filtering
    if (req.query.subcategory) {
      console.log('🔍 FILTERING BY SUBCATEGORY:', req.query.subcategory);
      
      const subcategoryDoc = await Category.findOne({
        $or: [
          { 'seo.slug': { $regex: new RegExp(req.query.subcategory, 'i') } },
          { name: { $regex: new RegExp(req.query.subcategory, 'i') } }
        ]
      });
      
      if (subcategoryDoc) {
        console.log('📊 Found subcategory:', subcategoryDoc.name);
        query.category = subcategoryDoc._id;
      }
    }

    // ITEM FILTER - For level 3 items
    if (req.query.item) {
      console.log('🔍 FILTERING BY ITEM:', req.query.item);
      
      const itemDoc = await Category.findOne({
        $or: [
          { 'seo.slug': { $regex: new RegExp(req.query.item, 'i') } },
          { name: { $regex: new RegExp(req.query.item, 'i') } }
        ],
        level: 3
      });
      
      if (itemDoc) {
        console.log('📊 Found item:', itemDoc.name);
        query.category = itemDoc._id;
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

// Debug route to check Agricultural Produce hierarchy
router.get('/debug/agricultural-hierarchy', async (req, res) => {
  try {
    const agCategory = await Category.findOne({ name: 'Agricultural Produce' });
    
    if (!agCategory) {
      return res.json({ error: 'Agricultural Produce category not found' });
    }
    
    console.log('🚜 Agricultural Produce Category:', agCategory);
    
    // Get direct children
    const children = await Category.find({ parent: agCategory._id });
    console.log('🌱 Direct children:', children.map(c => c.name));
    
    // Get all products in Agricultural Produce hierarchy
    const hierarchyIds = await getCategoryHierarchyIds(agCategory._id);
    console.log('🎯 Hierarchy IDs:', hierarchyIds);
    
    const products = await Product.find({ category: { $in: hierarchyIds } })
      .populate('category', 'name level');
    
    console.log('📦 Products in Agricultural hierarchy:');
    products.forEach(p => {
      console.log(`   - ${p.name} → ${p.category?.name} (Level ${p.category?.level})`);
    });
    
    res.json({
      mainCategory: agCategory,
      children: children,
      hierarchyIds: hierarchyIds,
      products: products
    });
    
  } catch (error) {
    console.error('Error:', error);
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
    
    // Specifically check for agricultural categories
    const agCategories = await Category.find({
      name: { $regex: 'agricultural|farm|livestock', $options: 'i' }
    });
    
    console.log('🚜 AGRICULTURAL-RELATED CATEGORIES:');
    agCategories.forEach(cat => {
      console.log(`   - "${cat.name}" → seo.slug: "${cat.seo?.slug}"`);
    });
    
    res.json({
      allCategories: categoryInfo,
      agriculturalCategories: agCategories.map(cat => ({
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

// Test agricultural category specifically
router.get('/test/agricultural', async (req, res) => {
  try {
    console.log('🧪 TESTING AGRICULTURAL CATEGORY FILTERING...');
    
    // Test different ways to find the category
    const tests = [
      { method: 'By SEO slug', query: { 'seo.slug': 'agricultural-produce' } },
      { method: 'By name exact', query: { name: 'Agricultural Produce' } },
      { method: 'By name partial', query: { name: { $regex: 'agricultural', $options: 'i' } } },
      { method: 'By name farm', query: { name: { $regex: 'farm', $options: 'i' } } }
    ];
    
    for (const test of tests) {
      const result = await Category.findOne(test.query);
      console.log(`🔍 ${test.method}:`, result ? `FOUND - ${result.name}` : 'NOT FOUND');
    }
    
    // Test the actual hierarchy building
    const agCategory = await Category.findOne({ name: 'Agricultural Produce' });
    if (agCategory) {
      console.log('🚜 Found Agricultural Produce category, building hierarchy...');
      const hierarchyIds = await getCategoryHierarchyIds(agCategory._id);
      
      const products = await Product.find({ category: { $in: hierarchyIds } })
        .populate('category', 'name level');
      
      console.log(`📦 Found ${products.length} products in agricultural hierarchy`);
      products.forEach(p => {
        console.log(`   - ${p.name} → ${p.category?.name} (Level ${p.category?.level})`);
      });
      
      res.json({
        agriculturalCategory: agCategory,
        hierarchyIds,
        products: products.map(p => ({
          name: p.name,
          category: p.category?.name,
          categoryLevel: p.category?.level
        }))
      });
    } else {
      res.json({ error: 'Agricultural Produce category not found' });
    }
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify the fix is working
router.get('/verify-fix', async (req, res) => {
  try {
    // Test agricultural category
    const agCategory = await Category.findOne({ 
      'seo.slug': 'agricultural-produce' 
    });
    
    if (!agCategory) {
      return res.json({ error: 'Agricultural category not found by seo.slug' });
    }
    
    // Build hierarchy
    const hierarchyIds = await getCategoryHierarchyIds(agCategory._id);
    
    // Find products
    const products = await Product.find({ 
      category: { $in: hierarchyIds } 
    }).populate('category', 'name level');
    
    res.json({
      success: true,
      agriculturalCategory: {
        name: agCategory.name,
        seoSlug: agCategory.seo.slug,
        _id: agCategory._id
      },
      hierarchyIds: hierarchyIds,
      productsFound: products.length,
      products: products.map(p => ({
        name: p.name,
        category: p.category?.name,
        categoryId: p.category?._id
      }))
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;