import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'https://bloomsoko.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'userid',
    'x-user-id'
  ]
}));

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

// API Routes
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
app.use('/api/promotions', promotionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bloomsoko Backend is running!',
    api: 'All API endpoints are under /api/',
    health: '/api/health'
  });
});

// ✅ FIXED: Use a simple 404 handler without wildcard issues
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found`,
    available: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/cart',
      '/api/products',
      '/api/health'
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: https://bloomsoko.vercel.app`);
});