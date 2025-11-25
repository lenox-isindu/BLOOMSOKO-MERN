// routes/orders.js
import express from 'express';
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
router.get('/admin', getAllOrders);
router.get('/admin/stats', getOrderStats);
router.put('/admin/:id/status', updateOrderStatus);

// User routes
router.get('/user', getUserOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

export default router;