import express from 'express';

const router = express.Router();

// Temp admin auth routes
router.post('/login', (req, res) => {
  res.json({ 
    message: 'Admin login successful', 
    token: 'temp-admin-token',
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@bloomsoko.com',
      role: 'admin'
    }
  });
});

export default router;