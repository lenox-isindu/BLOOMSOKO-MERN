// routes/paystack.js
import express from 'express';
import {
  initializePayment,
  verifyPayment,
  paystackWebhook
} from '../controllers/paystackController.js';

const router = express.Router();

router.post('/initialize', initializePayment);
router.get('/verify/:reference', verifyPayment);
router.post('/webhook', paystackWebhook);

export default router;