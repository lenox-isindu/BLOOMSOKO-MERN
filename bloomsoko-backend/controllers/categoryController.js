import Category from '../models/Category.js';
import mongoose from 'mongoose';

// Get all categories with hierarchy
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' })
      .sort({ level: 1, name: 1 })
      .populate('parent', 'name');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get category tree (hierarchical)
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' })
      .populate('parent', 'name');
    
    const categoryTree = Category.buildTree(categories);
    
    res.json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      error: error.message
    });
  }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// Get categories by level
export const getCategoriesByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const targetLevel = parseInt(level);
    
    console.log(`📁 Fetching level ${targetLevel} categories...`);
    
    const categories = await Category.find({ 
      level: targetLevel, 
      status: 'active' 
    }).sort({ name: 1 });

    console.log(`✅ Found ${categories.length} level ${targetLevel} categories`);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching categories by level:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories by level',
      error: error.message
    });
  }
};

// Get subcategories by parent ID
export const getSubcategoriesByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    console.log('📁 Fetching subcategories for parent:', parentId);
    
    // Validate if parentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category ID format' 
      });
    }

    const categories = await Category.find({ 
      parent: new mongoose.Types.ObjectId(parentId),
      status: 'active' 
    }).sort({ name: 1 });

    console.log(`✅ Found ${categories.length} subcategories for parent ${parentId}`);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching subcategories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load subcategories',
      error: error.message 
    });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get category with children (detailed hierarchy)
export const getCategoryWithChildren = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get direct children
    const children = await Category.find({ 
      parent: category._id,
      status: 'active' 
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        children
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category with children',
      error: error.message
    });
  }
};

// Get main categories (level 1) - specific endpoint
export const getMainCategories = async (req, res) => {
  try {
    console.log('📁 Fetching main categories...');
    const categories = await Category.find({ 
      level: 1, 
      status: 'active' 
    }).sort({ name: 1 });
    
    console.log(`✅ Found ${categories.length} main categories`);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching main categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching main categories',
      error: error.message
    });
  }
};