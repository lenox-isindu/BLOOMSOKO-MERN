import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const userId = req.headers.userid || 'demo-user';

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create order
    const order = new Order({
      user: userId,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
        isBooking: item.isBooking
      })),
      totalAmount: cart.totalAmount,
      shippingAddress,
      paymentMethod
    });

    await order.save();
    await order.populate('items.product', 'name featuredImage');

    // Clear the cart after order creation
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get user's orders
router.get('/', async (req, res) => {
  try {
    const userId = req.headers.userid || 'demo-user';
    
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name featuredImage')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name featuredImage description');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

export default router;