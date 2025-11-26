// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔐 Auth middleware - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('🔐 Decoded token:', decoded);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (!user.isActive) {
      console.log('❌ User account inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    req.user = {
      id: user._id,
      role: user.role
    };
    
    console.log('✅ User authenticated:', req.user);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Authorization check:', req.user.role, 'required:', roles);
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};