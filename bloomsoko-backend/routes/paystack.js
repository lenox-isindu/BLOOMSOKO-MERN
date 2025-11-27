import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  initializePayment,
  verifyPayment,
  paystackWebhook
} from '../controllers/paystackController.js';

const router = express.Router();

// Protected routes - require authentication
// REMOVE '/paystack' from these routes since the router is already mounted at '/api/paystack'
router.post('/initialize', authenticate, initializePayment);
router.get('/verify/:reference', authenticate, verifyPayment);

// Webhook route - no authentication needed (handled by Paystack signature)
router.post('/webhook', paystackWebhook);

// Add a test route to verify the routes are working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Paystack routes are working!',
    availableEndpoints: [
      'POST /api/paystack/initialize',
      'GET  /api/paystack/verify/:reference', 
      'POST /api/paystack/webhook'
    ]
  });
});

export default router;