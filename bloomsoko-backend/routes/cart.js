
import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = express.Router();

// Helper to get user ID from request (authenticated or demo)
const getUserId = (req) => {
    // 🔥 CRITICAL: Priority 1 - Authenticated user from token
    if (req.user && req.user._id) {
        console.log('🔐 Using authenticated user ID:', req.user._id);
        return req.user._id;
    }
    
    // Priority 2 - User ID from header (for authenticated requests)
    if (req.headers.userid && req.headers.userid.startsWith('66')) {
        console.log('🔐 Using header user ID (likely authenticated):', req.headers.userid);
        return req.headers.userid;
    }
    
    // Priority 3 - Demo user from header
    if (req.headers.userid) {
        console.log('👤 Using demo user ID from header:', req.headers.userid);
        return req.headers.userid;
    }
    
    // Priority 4 - User ID from header (backward compatibility)
    if (req.headers.userId) {
        console.log('👤 Using userId from header:', req.headers.userId);
        return req.headers.userId;
    }
    
    // Fallback: Generate demo user
    const demoUserId = `demo-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('👤 Generated new demo user ID:', demoUserId);
    return demoUserId;
};

// Get user's cart - supports both auth and demo users
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log('🛒 Fetching cart for user:', userId);
    
    let cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price featuredImage inventory productType growingDetails');
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
      console.log('✅ Created new cart for user:', userId);
    }
    
    console.log(`✅ Found cart with ${cart.items.length} items for user:`, userId);
    res.json(cart);
  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
});

// routes/cart.js - Fix the add to cart route
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1, isBooking = false } = req.body;
    const userId = getUserId(req);

    console.log('🛒 Adding to cart:', { userId, productId, quantity, isBooking });

    // Get product details with inventory
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Find or create cart FIRST
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      console.log('✅ Created new cart for user:', userId);
    }

    // 🔥 CRITICAL: Real-time inventory check for regular purchases
    if (!isBooking) {
      if (product.inventory < quantity) {
        return res.status(400).json({ 
          success: false,
          message: `Only ${product.inventory} items available in stock`,
          availableStock: product.inventory
        });
      }

      // Check current cart quantity + new quantity doesn't exceed inventory
      const existingCartItem = cart.items.find(
        item => item.product.toString() === productId && !item.isBooking
      );
      
      if (existingCartItem) {
        const totalRequestedQuantity = existingCartItem.quantity + quantity;
        if (totalRequestedQuantity > product.inventory) {
          const availableToAdd = product.inventory - existingCartItem.quantity;
          return res.status(400).json({ 
            success: false,
            message: `Cannot add more than ${availableToAdd} items. You already have ${existingCartItem.quantity} in cart.`,
            availableToAdd,
            currentInCart: existingCartItem.quantity
          });
        }
      }
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.isBooking === isBooking
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
      console.log('✅ Updated existing item quantity to:', cart.items[existingItemIndex].quantity);
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        isBooking,
        price: product.price
      });
      console.log('✅ Added new item to cart');
    }

    await cart.save();
    await cart.populate('items.product', 'name price featuredImage inventory productType growingDetails');

    const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    console.log(`✅ Cart updated successfully. Total items: ${cartCount}`);

    res.json({
      success: true,
      message: isBooking ? 'Product booked successfully' : 'Product added to cart',
      cart,
      count: cartCount
    });
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding to cart', 
      error: error.message 
    });
  }
});
// routes/cart.js - Update the update quantity route

// routes/cart.js - Fix the update quantity route
router.put('/update/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = getUserId(req);

    console.log('🛒 Updating cart item:', { userId, itemId, quantity });

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      console.log('❌ Cart not found for user:', userId);
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      console.log('❌ Item not found in cart:', itemId);
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    // 🔥 CRITICAL: Inventory validation for regular purchases
    if (!item.isBooking && item.product) {
      if (quantity > item.product.inventory) {
        return res.status(400).json({ 
          success: false,
          message: `Only ${item.product.inventory} items available in stock`,
          availableStock: item.product.inventory
        });
      }
    }

    if (quantity < 1) {
      // Remove item if quantity is 0
      cart.items.pull({ _id: itemId });
      console.log('✅ Removed item from cart (quantity 0)');
    } else {
      item.quantity = quantity;
      console.log('✅ Updated item quantity to:', quantity);
    }

    await cart.save();
    await cart.populate('items.product', 'name price featuredImage inventory productType growingDetails');

    console.log('✅ Cart updated successfully');
    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('❌ Error updating cart:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating cart', 
      error: error.message 
    });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = getUserId(req);

    console.log('🛒 Removing item from cart:', { userId, itemId });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log('❌ Cart not found for user:', userId);
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    await cart.populate('items.product', 'name price featuredImage inventory productType growingDetails');

    console.log('✅ Item removed from cart successfully');
    res.json(cart);
  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
});

// Get cart count
router.get('/count', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const cart = await Cart.findOne({ user: userId });
    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    
    console.log(`🛒 Cart count for user ${userId}: ${count}`);
    res.json({ count });
  } catch (error) {
    console.error('❌ Error getting cart count:', error);
    res.status(500).json({ message: 'Error getting cart count', error: error.message });
  }
});

// Clear cart
router.delete('/clear', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log('🛒 Clearing cart for user:', userId);

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
      console.log('✅ Cart cleared successfully');
    }
    
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

// Migrate cart from demo user to authenticated user
router.post('/migrate', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    
    console.log('🔄 Migrating cart:', { fromUserId, toUserId });

    if (!fromUserId || !toUserId) {
      return res.status(400).json({ message: 'Both fromUserId and toUserId are required' });
    }

    // Find source cart
    const sourceCart = await Cart.findOne({ user: fromUserId });
    // Find target cart
    const targetCart = await Cart.findOne({ user: toUserId });
    
    console.log('📊 Migration stats:', {
      sourceCartExists: !!sourceCart,
      sourceItems: sourceCart?.items?.length || 0,
      targetCartExists: !!targetCart,
      targetItems: targetCart?.items?.length || 0
    });

    if (!sourceCart || sourceCart.items.length === 0) {
      console.log('✅ No cart to migrate');
      return res.json({ 
        message: 'No cart to migrate', 
        cart: targetCart || { user: toUserId, items: [] } 
      });
    }
    
    if (!targetCart) {
      // Create new cart for target user with source items
      const newCart = new Cart({
        user: toUserId,
        items: sourceCart.items
      });
      await newCart.save();
      await newCart.populate('items.product', 'name price featuredImage inventory productType growingDetails');
      
      // Delete source cart
      await Cart.deleteOne({ user: fromUserId });
      
      console.log('✅ Cart migrated successfully (new target cart)');
      
      return res.json({
        message: 'Cart migrated successfully',
        cart: newCart
      });
    } else {
      // Merge carts - avoid duplicates
      let mergedItems = [...targetCart.items];
      
      sourceCart.items.forEach(sourceItem => {
        const existingItemIndex = mergedItems.findIndex(
          targetItem => targetItem.product.toString() === sourceItem.product.toString() && 
                       targetItem.isBooking === sourceItem.isBooking
        );
        
        if (existingItemIndex > -1) {
          // Update quantity if item exists
          mergedItems[existingItemIndex].quantity += sourceItem.quantity;
          console.log(`✅ Merged item: ${sourceItem.product} (quantity: ${mergedItems[existingItemIndex].quantity})`);
        } else {
          // Add new item
          mergedItems.push(sourceItem);
          console.log(`✅ Added new item: ${sourceItem.product}`);
        }
      });
      
      targetCart.items = mergedItems;
      await targetCart.save();
      await targetCart.populate('items.product', 'name price featuredImage inventory productType growingDetails');
      
      // Delete source cart
      await Cart.deleteOne({ user: fromUserId });
      
      console.log('✅ Cart merged successfully');
      
      res.json({
        message: 'Cart merged successfully',
        cart: targetCart
      });
    }
  } catch (error) {
    console.error('❌ Error migrating cart:', error);
    res.status(500).json({ message: 'Error migrating cart', error: error.message });
  }
});

export default router;