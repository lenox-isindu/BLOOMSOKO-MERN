import express from 'express';

const router = express.Router();

// Temp auth routes 
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented', token: 'temp-token' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

export default router;