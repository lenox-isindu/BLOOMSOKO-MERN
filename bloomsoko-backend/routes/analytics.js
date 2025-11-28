import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getTrends, recordDailyStats } from '../services/analyticsService.js';

const router = express.Router();

// Get trends data
router.get('/trends', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const trends = await getTrends(period);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends'
    });
  }
});

// Manually record daily stats (for testing)
router.post('/record-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    await recordDailyStats();
    res.json({
      success: true,
      message: 'Daily stats recorded successfully'
    });
  } catch (error) {
    console.error('Record stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record stats'
    });
  }
});

export default router;