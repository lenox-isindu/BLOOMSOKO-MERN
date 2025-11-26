import Promotion from '../models/Promotion.js';
import Product from '../models/Product.js';

// Get all promotions
export const getPromotions = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const promotions = await Promotion.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Promotion.countDocuments(query);

    res.json({
      success: true,
      data: promotions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPromotions: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching promotions',
      error: error.message,
    });
  }
};

// Get active promotions for frontend
export const getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    
    const promotions = await Promotion.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
    .sort({ priority: -1, isFeatured: -1 })
    .limit(10);

    res.json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active promotions',
      error: error.message,
    });
  }
};

// Get single promotion
export const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('targetCategories', 'name')
      .populate('targetProducts', 'name price featuredImage');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    res.json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching promotion',
      error: error.message,
    });
  }
};

// Create promotion
export const createPromotion = async (req, res) => {
  try {
    const promotion = new Promotion(req.body);
    await promotion.save();

    // Populate for response
    await promotion.populate('targetCategories', 'name');
    await promotion.populate('targetProducts', 'name price featuredImage');

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating promotion',
      error: error.message,
    });
  }
};

// Update promotion
export const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('targetCategories', 'name')
    .populate('targetProducts', 'name price featuredImage');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating promotion',
      error: error.message,
    });
  }
};

// Delete promotion
export const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    res.json({
      success: true,
      message: 'Promotion deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting promotion',
      error: error.message,
    });
  }
};

// Update promotion status
export const updatePromotionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    res.json({
      success: true,
      message: 'Promotion status updated successfully',
      data: promotion,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating promotion status',
      error: error.message,
    });
  }
};

// Track promotion click
export const trackPromotionClick = async (req, res) => {
  try {
    await Promotion.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } }
    );

    res.json({
      success: true,
      message: 'Click tracked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error tracking click',
      error: error.message,
    });
  }
};