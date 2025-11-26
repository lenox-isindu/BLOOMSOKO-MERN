import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Promotion title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Promotion description is required'],
  },
  type: {
    type: String,
    enum: ['banner', 'flash_sale', 'seasonal', 'special_offer', 'black_friday'],
    default: 'banner',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'scheduled', 'inactive', 'expired'],
    default: 'inactive',
  },
  // Visual settings
  bannerImage: {
    url: String,
    alt: String,
  },
  backgroundColor: {
    type: String,
    default: '#ffffff',
  },
  textColor: {
    type: String,
    default: '#333333',
  },
  // Promotion details
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping', 'bogo'],
  },
  discountValue: {
    type: Number,
    min: 0,
  },
  // Target products/categories
  targetType: {
    type: String,
    enum: ['all_products', 'specific_categories', 'specific_products', 'collection'],
    default: 'all_products',
  },
  targetCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  targetProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  // Scheduling
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  // Display settings
  position: {
    type: String,
    enum: ['top_banner', 'hero', 'sidebar', 'popup', 'product_page'],
    default: 'top_banner',
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  // Tracking
  clicks: {
    type: Number,
    default: 0,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  // Call to action
  ctaText: {
    type: String,
    default: 'Shop Now',
  },
  ctaLink: {
    type: String,
    default: '/products',
  },
  // Conditions
  minimumOrderAmount: {
    type: Number,
    default: 0,
  },
  usageLimit: {
    type: Number,
    default: 0, // 0 means unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Check if promotion is currently active
promotionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Update status based on dates
promotionSchema.methods.updateStatus = function() {
  const now = new Date();
  if (this.endDate < now) {
    this.status = 'expired';
  } else if (this.startDate <= now && this.endDate >= now) {
    this.status = 'active';
  }
  return this.save();
};

export default mongoose.model('Promotion', promotionSchema);