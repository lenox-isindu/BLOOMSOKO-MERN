import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getAllOrders,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} from '../controllers/orderController.js';

const router = express.Router();

// Admin routes
router.get('/admin', authenticate, requireAdmin, getAllOrders);
router.get('/admin/stats', authenticate, requireAdmin, getOrderStats);
router.put('/admin/:id/status', authenticate, requireAdmin, updateOrderStatus);

// User routes - All protected with authenticate middleware
router.get('/user', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrder);
router.put('/:id/cancel', authenticate, cancelOrder);

export default router;