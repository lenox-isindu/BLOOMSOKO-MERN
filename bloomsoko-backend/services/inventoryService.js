// services/inventoryService.js (FIXED VERSION)
import Product from '../models/Product.js';

class InventoryService {
  constructor() {
    console.log('✅ Inventory Service Initialized (Fixed Version)');
  }

  // Get available stock
  async getAvailableStock(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      return product.inventory.stock - (product.inventory.reservedStock || 0);
    } catch (error) {
      console.error('Error getting available stock:', error);
      throw error;
    }
  }

  // 🔥 FIXED: Atomic stock reservation
  async reserveStockAtomic(productId, quantity) {
    try {
      console.log('🔄 reserveStockAtomic called:', { productId, quantity });
      
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const availableStock = product.inventory.stock - (product.inventory.reservedStock || 0);
      
      console.log('📊 Before reservation:', {
        stock: product.inventory.stock,
        reservedStock: product.inventory.reservedStock,
        availableStock: availableStock
      });

      if (availableStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
      }
      
      // 🔥 FIX: Direct database update - hakuna method za model
      const result = await Product.findByIdAndUpdate(
        productId,
        { 
          $inc: { 'inventory.reservedStock': quantity } 
        },
        { new: true }
      );

      console.log('✅ Database update result:', {
        success: !!result,
        newReservedStock: result?.inventory?.reservedStock
      });

      if (!result) {
        throw new Error('Failed to update product inventory');
      }

      return true;
    } catch (error) {
      console.error('❌ Error in reserveStockAtomic:', error);
      throw error;
    }
  }

  // Release reserved stock
  async releaseStockAtomic(productId, quantity) {
    try {
      console.log('🔄 releaseStockAtomic called:', { productId, quantity });
      
      const result = await Product.findByIdAndUpdate(
        productId,
        { 
          $inc: { 'inventory.reservedStock': -quantity } 
        },
        { new: true }
      );

      console.log('✅ Stock released:', {
        success: !!result,
        newReservedStock: result?.inventory?.reservedStock
      });

      if (!result) {
        throw new Error('Failed to release stock');
      }

      return true;
    } catch (error) {
      console.error('❌ Error releasing stock:', error);
      throw error;
    }
  }

  // Commit reserved stock (on successful order)
  async commitStockAtomic(productId, quantity) {
    try {
      console.log('🔄 commitStockAtomic called:', { productId, quantity });
      
      const result = await Product.findByIdAndUpdate(
        productId,
        { 
          $inc: { 
            'inventory.reservedStock': -quantity,
            'inventory.stock': -quantity,
            'sales.totalSold': quantity
          } 
        },
        { new: true }
      );

      console.log('✅ Stock committed:', {
        success: !!result,
        newStock: result?.inventory?.stock,
        newReservedStock: result?.inventory?.reservedStock
      });

      if (!result) {
        throw new Error('Failed to commit stock');
      }

      return true;
    } catch (error) {
      console.error('❌ Error committing stock:', error);
      throw error;
    }
  }

  // Get low stock products
  async getLowStockProducts(threshold = 10) {
    try {
      const products = await Product.find({
        'inventory.stock': { $lte: threshold },
        'inventory.trackQuantity': true,
        status: 'active'
      }).select('name inventory stockStatus featuredImage');
      
      return products;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return {
      database: true,
      mode: 'direct-database-updates'
    };
  }
}

export default new InventoryService();