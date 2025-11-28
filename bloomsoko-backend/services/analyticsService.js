import DailyStats from '../models/Analytics.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Promotion from '../models/Promotion.js';

// Record daily stats (call this once per day, maybe via cron job)
export const recordDailyStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get orders data
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    // Calculate revenue from completed orders
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    
    // Get products data
    const products = await Product.find({ status: 'active' });
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stockStatus === 'low-stock').length;
    const outOfStockItems = products.filter(p => p.stockStatus === 'out-of-stock').length;
    const preOrderItems = products.filter(p => p.productType === 'pre-order').length;
    
    // Calculate total bookings
    const totalBookings = products.reduce((sum, product) => 
      sum + (product.preOrders?.length || 0), 0
    );
    
    // Get active promotions
    const now = new Date();
    const activePromotions = await Promotion.countDocuments({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    // Calculate average order value
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    
    // Save daily stats
    await DailyStats.findOneAndUpdate(
      { date: today },
      {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        totalProducts,
        lowStockItems,
        outOfStockItems,
        preOrderItems,
        totalBookings,
        activePromotions,
        averageOrderValue
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Daily stats recorded for:', today);
  } catch (error) {
    console.error('❌ Error recording daily stats:', error);
  }
};

// Get trends compared to previous period
export const getTrends = async (period = 'month') => {
  try {
    const today = new Date();
    const currentPeriodStart = new Date(today);
    const previousPeriodStart = new Date(today);
    
    // Set date ranges based on period
    if (period === 'week') {
      currentPeriodStart.setDate(today.getDate() - 7);
      previousPeriodStart.setDate(today.getDate() - 14);
    } else if (period === 'month') {
      currentPeriodStart.setMonth(today.getMonth() - 1);
      previousPeriodStart.setMonth(today.getMonth() - 2);
    }
    
    // Get current period stats (average of daily stats)
    const currentStats = await DailyStats.aggregate([
      { $match: { date: { $gte: currentPeriodStart, $lte: today } } },
      {
        $group: {
          _id: null,
          avgTotalOrders: { $avg: '$totalOrders' },
          avgTotalRevenue: { $avg: '$totalRevenue' },
          avgCompletedOrders: { $avg: '$completedOrders' },
          avgPendingOrders: { $avg: '$pendingOrders' },
          avgTotalBookings: { $avg: '$totalBookings' },
          avgAverageOrderValue: { $avg: '$averageOrderValue' }
        }
      }
    ]);
    
    // Get previous period stats
    const previousStats = await DailyStats.aggregate([
      { $match: { date: { $gte: previousPeriodStart, $lt: currentPeriodStart } } },
      {
        $group: {
          _id: null,
          avgTotalOrders: { $avg: '$totalOrders' },
          avgTotalRevenue: { $avg: '$totalRevenue' },
          avgCompletedOrders: { $avg: '$completedOrders' },
          avgPendingOrders: { $avg: '$pendingOrders' },
          avgTotalBookings: { $avg: '$totalBookings' },
          avgAverageOrderValue: { $avg: '$averageOrderValue' }
        }
      }
    ]);
    
    const current = currentStats[0] || {};
    const previous = previousStats[0] || {};
    
    // Calculate percentage changes
    const calculateChange = (currentVal, previousVal) => {
      if (!previousVal || previousVal === 0) return currentVal > 0 ? 100 : 0;
      return ((currentVal - previousVal) / previousVal) * 100;
    };
    
    return {
      totalRevenue: calculateChange(current.avgTotalRevenue || 0, previous.avgTotalRevenue || 0),
      totalOrders: calculateChange(current.avgTotalOrders || 0, previous.avgTotalOrders || 0),
      completedOrders: calculateChange(current.avgCompletedOrders || 0, previous.avgCompletedOrders || 0),
      pendingOrders: calculateChange(current.avgPendingOrders || 0, previous.avgPendingOrders || 0),
      totalBookings: calculateChange(current.avgTotalBookings || 0, previous.avgTotalBookings || 0),
      averageOrderValue: calculateChange(current.avgAverageOrderValue || 0, previous.avgAverageOrderValue || 0)
    };
    
  } catch (error) {
    console.error('❌ Error calculating trends:', error);
    return {};
  }
};