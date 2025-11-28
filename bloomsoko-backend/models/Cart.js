import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  isBooking: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    required: true
  },
  // Track if stock is reserved for this item
  stockReserved: {
    type: Boolean,
    default: false
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['authenticated', 'demo'],
    default: 'demo'
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  // Track last activity for cart expiry
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActive on save and calculate total
cartSchema.pre('save', function(next) {
  this.lastActive = new Date();
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Auto-detect user type
  if (mongoose.Types.ObjectId.isValid(this.user) && typeof this.user !== 'string') {
    this.userType = 'authenticated';
  } else {
    this.userType = 'demo';
  }
  
  next();
});

// Index for cart expiry (demo carts expire after 1 hour)
cartSchema.index({ lastActive: 1 }, { expireAfterSeconds: 3600 });

// Check if user is authenticated
cartSchema.methods.isAuthenticatedUser = function() {
  return mongoose.Types.ObjectId.isValid(this.user) && typeof this.user !== 'string';
};

// Method to reserve stock for all items in cart
cartSchema.methods.reserveStockForCart = async function() {
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    if (!item.isBooking && !item.stockReserved) {
      try {
        const product = await Product.findById(item.product);
        if (product) {
          await product.reserveStock(item.quantity);
          item.stockReserved = true;
        }
      } catch (error) {
        console.error(`Failed to reserve stock for product ${item.product}:`, error);
        throw error;
      }
    }
  }
  
  return await this.save();
};

// Method to release reserved stock for all items in cart
cartSchema.methods.releaseReservedStock = async function() {
  const Product = mongoose.model('Product');
  
  for (const item of this.items) {
    if (!item.isBooking && item.stockReserved) {
      try {
        const product = await Product.findById(item.product);
        if (product) {
          await product.releaseReservedStock(item.quantity);
          item.stockReserved = false;
        }
      } catch (error) {
        console.error(`Failed to release stock for product ${item.product}:`, error);
      }
    }
  }
  
  return await this.save();
};

export default mongoose.model('Cart', cartSchema);