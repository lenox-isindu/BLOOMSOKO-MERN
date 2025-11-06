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
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
cartSchema.pre('save', function(next) {
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

// check if user is authenticated
cartSchema.methods.isAuthenticatedUser = function() {
  return mongoose.Types.ObjectId.isValid(this.user) && typeof this.user !== 'string';
};

export default mongoose.model('Cart', cartSchema);