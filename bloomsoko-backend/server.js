import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// FIXED CORS Configuration - CRITICAL
app.use(cors({
  origin: [
    'https://bloomsoko.vercel.app',     // Your actual Vercel frontend
    'http://localhost:3000',            // Local development
    'http://localhost:5173'             // Vite dev server
  ],
  credentials: true,                     // Allow cookies/authorization
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'userid',                           // ADD THIS - your custom header
    'x-user-id'                         // Alternative if you prefer
  ]
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import authRoutes from './routes/auth.js';
import adminAuthRoutes from './routes/admin/adminAuth.js';
import adminProductRoutes from './routes/admin/adminProducts.js';
import categoryRoutes from './routes/categories.js';
import uploadRoutes from './routes/upload.js';
import productRoutes from './routes/products.js'; 
import cartRoutes from './routes/cart.js'; 
import orderRoutes from './routes/orders.js'; 
import paystackRoutes from './routes/paystack.js';
import promotionRoutes from './routes/promotions.js';
import adminUsersRoutes from './routes/admin/adminUsers.js';
import analyticsRoutes from './routes/analytics.js';

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomsoko');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

await connectDB();

// API Routes - MUST start with /api
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/cart', cartRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/paystack', paystackRoutes);
app.use('/api/promotions', promotionRoutes);  // FIXED: Added /api prefix
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bloomsoko Backend is running!',
    api: 'Use /api/ endpoints for API requests',
    health: '/api/health for health check'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `API endpoint ${req.originalUrl} not found` 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Bloomsoko server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: https://bloomsoko.vercel.app`);
});