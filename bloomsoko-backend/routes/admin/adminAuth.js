import express from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { handleValidationErrors } from '../../middleware/validation.js';

const router = express.Router();

// Admin login validation
const adminLoginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// REAL Admin login route
router.post('/login', adminLoginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 ADMIN login attempt:', email);

    // Find user by email with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ ADMIN Login failed: User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('❌ ADMIN Login failed: Not an admin');
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required. Please use regular user login.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log('❌ ADMIN Login failed: Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate admin token with role
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET || 'your-fallback-secret-key',
      { expiresIn: '30d' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log('✅ ADMIN logged in successfully:', user.email);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ ADMIN Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in as admin',
      error: error.message
    });
  }
});

export default router;