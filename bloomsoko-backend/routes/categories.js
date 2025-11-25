import express from 'express';
import {
  getCategories,
  getCategoryTree,
  getCategoryById,
  getCategoriesByLevel,
  getSubcategoriesByParent,
  createCategory,
  getMainCategories  // Make sure this is imported
} from '../controllers/categoryController.js';

const router = express.Router();

// GET /api/categories - Get all categories (flat list)
router.get('/', getCategories);

// GET /api/categories/main - Get main categories (level 1)
router.get('/main', getMainCategories);  // Use the specific function

// GET /api/categories/level/:level - Get categories by level (1, 2, 3)
router.get('/level/:level', getCategoriesByLevel);

// GET /api/categories/subcategories/:parentId - Get subcategories by parent ID
router.get('/subcategories/:parentId', getSubcategoriesByParent);

// GET /api/categories/hierarchy - Get category tree (hierarchical)
router.get('/hierarchy', getCategoryTree);

// GET /api/categories/:id - Get single category by ID
router.get('/:id', getCategoryById);

// POST /api/categories - Create category
router.post('/', createCategory);

export default router;