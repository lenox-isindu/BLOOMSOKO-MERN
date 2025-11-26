import express from 'express';
import {
  getPromotions,
  getActivePromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  updatePromotionStatus,
  trackPromotionClick,
} from '../controllers/promotionController.js';

const router = express.Router();

// Public routes
router.get('/active', getActivePromotions);
router.post('/:id/track-click', trackPromotionClick);

// Admin routes
router.get('/', getPromotions);
router.get('/:id', getPromotionById);
router.post('/', createPromotion);
router.put('/:id', updatePromotion);
router.delete('/:id', deletePromotion);
router.patch('/:id/status', updatePromotionStatus);

export default router;