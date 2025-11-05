import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  comparePrice: {
    type: Number,
    default: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required'],
  },
  subcategory: {
    type: String,
    trim: true,
  },
  images: [{
    url: String,
    alt: String,
  }],
  featuredImage: {
    url: String,
    alt: String,
  },
  inventory: {
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    trackQuantity: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
  },
  // Product type and pre-order system
  productType: {
    type: String,
    enum: ['ready', 'growing', 'pre-order'],
    default: 'ready',
    required: true,
  },
  growingDetails: {
    expectedReadyDate: {
      type: Date,
      required: function() { return this.productType !== 'ready'; }
    },
    currentStage: {
      type: String,
      enum: ['planting', 'growing', 'almost-ready', 'ready'],
      default: 'growing'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  // Pre-order/booking system
  preOrders: [{
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    bookedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['booked', 'ready-for-purchase', 'cancelled', 'fulfilled'],
      default: 'booked'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active',
  },
  tags: [String],
  seo: {
    title: String,
    description: String,
  },
  //  FLAGS SYSTEM
  flags: {
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isOutOfStock: {
      type: Boolean,
      default: false,
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    canPreOrder: {
      type: Boolean,
      default: false,
    },
    
    isLimited: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isEcoFriendly: {
      type: Boolean,
      default: false,
    },
    isOrganic: {
      type: Boolean,
      default: false,
    },
    isHandmade: {
      type: Boolean,
      default: false,
    },
    isLocal: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isQuickDelivery: {
      type: Boolean,
      default: false,
    },
    isSeasonal: {
      type: Boolean,
      default: false,
    },
  },
  sales: {
    totalSold: {
      type: Number,
      default: 0,
    },
  },
  // Stock management
  stockStatus: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'pre-order'],
    default: 'in-stock'
  },
}, {
  timestamps: true,
});

// Update flags automatically
productSchema.pre('save', function(next) {
  // Update out of stock flag
  this.flags.isOutOfStock = this.inventory.stock === 0;
  
  // Update pre-order flag
  this.flags.canPreOrder = this.productType !== 'ready';
  
  // Update stock status
  if (this.inventory.stock === 0) {
    this.stockStatus = 'out-of-stock';
  } else if (this.inventory.stock <= this.inventory.lowStockThreshold) {
    this.stockStatus = 'low-stock';
  } else if (this.productType !== 'ready') {
    this.stockStatus = 'pre-order';
  } else {
    this.stockStatus = 'in-stock';
  }
  
  next();
});

// Virtual for checking if product is low stock
productSchema.virtual('isLowStock').get(function() {
  return this.inventory.stock > 0 && this.inventory.stock <= this.inventory.lowStockThreshold;
});

// Virtual for checking if product is available for pre-order
productSchema.virtual('isAvailableForPreOrder').get(function() {
  return this.productType !== 'ready' && this.growingDetails.currentStage !== 'ready';
});

export default mongoose.model('Product', productSchema);