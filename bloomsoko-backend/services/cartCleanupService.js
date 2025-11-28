import Cart from '../models/Cart.js';
import inventoryService from './inventoryService.js';

class CartCleanupService {
  constructor() {
    this.cleanupInterval = 30 * 60 * 1000; // 30 minutes
  }

  start() {
    console.log('🔄 Starting cart cleanup service...');
    setInterval(() => {
      this.cleanupExpiredCarts();
    }, this.cleanupInterval);
  }

  async cleanupExpiredCarts() {
    try {
      console.log('🧹 Cleaning up expired carts...');
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const expiredCarts = await Cart.find({
        userType: 'demo',
        lastActive: { $lt: oneHourAgo },
        'items.stockReserved': true
      });

      console.log(`📊 Found ${expiredCarts.length} expired carts with reserved stock`);

      for (const cart of expiredCarts) {
        try {
          // Release reserved stock
          for (const item of cart.items) {
            if (!item.isBooking && item.stockReserved) {
              await inventoryService.releaseStockAtomic(item.product, item.quantity);
            }
          }
          
          // Clear the cart
          cart.items = [];
          await cart.save();
          
          console.log(`✅ Cleared expired cart for user: ${cart.user}`);
        } catch (error) {
          console.error(`❌ Error cleaning up cart ${cart._id}:`, error);
        }
      }
      
      console.log('✅ Cart cleanup completed');
    } catch (error) {
      console.error('❌ Error in cart cleanup service:', error);
    }
  }
}

export default new CartCleanupService();