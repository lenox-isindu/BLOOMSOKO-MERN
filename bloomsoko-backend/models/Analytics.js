import mongoose from 'mongoose';

const dailyStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  // Order metrics
  totalOrders: Number,
  pendingOrders: Number,
  completedOrders: Number,
  cancelledOrders: Number,
  totalRevenue: Number,
  
  // Product metrics
  totalProducts: Number,
  lowStockItems: Number,
  outOfStockItems: Number,
  preOrderItems: Number,
  
  // Business metrics
  totalBookings: Number,
  activePromotions: Number,
  averageOrderValue: Number,
  
  // Additional metrics for trends
  newCustomers: Number,
  returningCustomers: Number
}, {
  timestamps: true
});

// Ensure we have one document per day
dailyStatsSchema.index({ date: 1 }, { unique: true });

export default mongoose.model('DailyStats', dailyStatsSchema);