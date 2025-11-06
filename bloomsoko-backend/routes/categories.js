import express from 'express';
import mongoose from 'mongoose'; 
import Category from '../models/Category.js';

const router = express.Router();

// Get all categories with hierarchy
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' })
      .sort({ level: 1, name: 1 })
      .populate('parent', 'name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get main categories (level 1)
router.get('/main', async (req, res) => {
  try {
    console.log(' Fetching main categories...');
    const categories = await Category.find({ 
      level: 1, 
      status: 'active' 
    }).sort({ name: 1 });
    
    console.log(`Found ${categories.length} main categories`);
    res.json(categories);
  } catch (error) {
    console.error(' Error fetching main categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get subcategories by parent ID
router.get('/subcategories/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;
    
    console.log(' Fetching subcategories for parent:', parentId);
    
    // Validate if parentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ 
        message: 'Invalid category ID format' 
      });
    }

    const categories = await Category.find({ 
      parent: new mongoose.Types.ObjectId(parentId),
      status: 'active' 
    }).sort({ name: 1 });

    console.log(`Found ${categories.length} subcategories for parent ${parentId}`);
    
    res.json(categories);
  } catch (error) {
    console.error(' Error fetching subcategories:', error);
    res.status(500).json({ 
      message: 'Failed to load subcategories',
      error: error.message 
    });
  }
});

// Get category hierarchy (all levels)
router.get('/hierarchy', async (req, res) => {
  try {
    const mainCategories = await Category.find({ 
      level: 1, 
      status: 'active' 
    }).sort({ name: 1 });

    const hierarchy = await Promise.all(
      mainCategories.map(async (mainCat) => {
        const subcategories = await Category.find({ 
          parent: mainCat._id,
          status: 'active' 
        }).sort({ name: 1 });

        const subWithChildren = await Promise.all(
          subcategories.map(async (subCat) => {
            const children = await Category.find({ 
              parent: subCat._id,
              status: 'active' 
            }).sort({ name: 1 });
            return {
              ...subCat.toObject(),
              children
            };
          })
        );

        return {
          ...mainCat.toObject(),
          subcategories: subWithChildren
        };
      })
    );

    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//  category
router.post('/', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;