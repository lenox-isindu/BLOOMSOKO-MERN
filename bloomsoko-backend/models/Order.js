// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  isBooking: {
    type: Boolean,
    default: false
  },
  name: String,
  image: String
});

const recipientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  idNumber: {
    type: String,
    required: true,
    trim: true
  }
});

const pickupSchema = new mongoose.Schema({
  option: {
    type: String,
    required: true,
    enum: ['easycoach', 'guardian', 'mashpoa']
  },
  station: {
    type: String,
    required: true
  },
  county: {
    type: String,
    required: true
  },
  stationDetails: {
    address: String,
    hours: String,
    contact: String,
    facilities: [String],
    directions: String
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      // Generate order number as default
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      return `BSO${year}${month}${day}${random}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  recipient: recipientSchema,
  pickup: pickupSchema,
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  specialInstructions: {
    type: String,
    default: ''
  },
 status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paystackReference: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentMethod: {
    type: String,
    default: 'paystack'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Remove the pre-save hook and use default value instead
// The default function will generate orderNumber automatically

// Virtual for full recipient name
orderSchema.virtual('recipient.fullName').get(function() {
  return `${this.recipient.firstName} ${this.recipient.lastName}`;
});

// Method to mark as ready for pickup
orderSchema.methods.markAsReadyForPickup = function() {
  this.status = 'ready_for_pickup';
  return this.save();
};

// Method to mark as picked up
orderSchema.methods.markAsPickedUp = function() {
  this.status = 'picked_up';
  return this.save();
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status }).populate('items.product');
};

// Static method to get orders by user
orderSchema.statics.getUserOrders = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 }).populate('items.product');
};

export default mongoose.model('Order', orderSchema);