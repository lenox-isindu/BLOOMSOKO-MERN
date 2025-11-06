import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get user's cart
router.get('/', async (req, res) => {
  try {
    // For demo - in real app, get user from auth middleware
    const userId = req.headers.userid || 'demo-user'; // Temporary for demo
    
    let cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price featuredImage inventory productType growingDetails');
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
});

// Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1, isBooking = false } = req.body;
    const userId = req.headers.userid || 'demo-user'; // Temporary for demo

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.isBooking === isBooking
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        isBooking,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name price featuredImage inventory productType growingDetails');

    // Get cart count
    const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.json({
      message: isBooking ? 'Product booked successfully' : 'Product added to cart',
      cart,
      count: cartCount
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

// Update cart item quantity
router.put('/update/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.headers.userid || 'demo-user';

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity < 1) {
      // Remove item if quantity is 0
      cart.items.pull({ _id: itemId });
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name price featuredImage inventory productType growingDetails');

    res.json(cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.headers.userid || 'demo-user';

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    await cart.populate('items.product', 'name price featuredImage inventory productType growingDetails');

    res.json(cart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
});

// Get cart count
router.get('/count', async (req, res) => {
  try {
    const userId = req.headers.userid || 'demo-user';
    
    const cart = await Cart.findOne({ user: userId });
    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ message: 'Error getting cart count', error: error.message });
  }
});

// Clear cart
router.delete('/clear', async (req, res) => {
  try {
    const userId = req.headers.userid || 'demo-user';
    
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

export default router;