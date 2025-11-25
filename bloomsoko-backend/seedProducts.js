import mongoose from 'mongoose';
import Product from './models/Product.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleProducts = [
  // Agriculture - Ready products
  {
    name: "Fresh Organic Tomatoes",
    description: "Freshly harvested organic tomatoes from local farms. Perfect for cooking, salads, and sauces.",
    price: 1500,
    comparePrice: 1800,
    inventory: {
      stock: 50,
      sku: "TOM-001",
      trackQuantity: true
    },
    productType: "ready",
    status: "active",
    flags: {
      isFeatured: true,
      isOutOfStock: false,
      onSale: true,
      isNew: true
    },
    tags: ["organic", "fresh", "vegetables"]
  },
  // Agriculture - Growing products
  {
    name: "Kale - Growing",
    description: "Fresh kale currently growing. Expected to be ready in 3 weeks. Book now to reserve your fresh kale!",
    price: 800,
    comparePrice: 1000,
    inventory: {
      stock: 0,
      sku: "KALE-001",
      trackQuantity: true
    },
    productType: "growing",
    growingDetails: {
      expectedReadyDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      currentStage: "growing",
      progress: 60
    },
    status: "active",
    flags: {
      isFeatured: true,
      isOutOfStock: true,
      onSale: false,
      isNew: false,
      canPreOrder: true
    },
    tags: ["growing", "organic", "vegetables", "pre-order"]
  },
  {
    name: "Spinach - Almost Ready",
    description: "Fresh spinach almost ready for harvest. Expected next week! Book now to secure your order.",
    price: 700,
    comparePrice: 850,
    inventory: {
      stock: 0,
      sku: "SPIN-001",
      trackQuantity: true
    },
    productType: "growing",
    growingDetails: {
      expectedReadyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      currentStage: "almost-ready",
      progress: 85
    },
    status: "active",
    flags: {
      isFeatured: false,
      isOutOfStock: true,
      onSale: true,
      isNew: true,
      canPreOrder: true
    },
    tags: ["growing", "fresh", "vegetables", "pre-order"]
  },
  // Fashion
  {
    name: "African Print Dress",
    description: "Beautiful African print dress made from quality fabric. Available in various sizes.",
    price: 2500,
    comparePrice: 3000,
    inventory: {
      stock: 15,
      sku: "DRESS-001",
      trackQuantity: true
    },
    productType: "ready",
    status: "active",
    flags: {
      isFeatured: true,
      isOutOfStock: false,
      onSale: true,
      isNew: false
    },
    tags: ["fashion", "dress", "african-print"]
  },
  // Beauty
  {
    name: "Shea Butter Cream",
    description: "Natural shea butter cream for skin and hair. 100% organic and handmade.",
    price: 1200,
    comparePrice: 1500,
    inventory: {
      stock: 30,
      sku: "SHEA-001",
      trackQuantity: true
    },
    productType: "ready",
    status: "active",
    flags: {
      isFeatured: false,
      isOutOfStock: false,
      onSale: false,
      isNew: true
    },
    tags: ["beauty", "natural", "skincare"]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomsoko');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');

    // Pre-fetch all categories for efficient assignment
    const categories = await Category.find({}).select('name level _id');
    const categoryMap = {};
    
    categories.forEach(cat => {
      categoryMap[`${cat.name}-${cat.level}`] = cat._id;
    });

    console.log('📊 Available categories for product assignment:');
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (Level ${cat.level})`);
    });

    // Assign categories to products
    const productsWithCategories = sampleProducts.map(product => {
      let categoryId;

      // Category mapping logic
      if (product.name.includes('Tomato') || product.name.includes('Kale') || product.name.includes('Spinach')) {
        categoryId = categoryMap['Vegetables-3'] || categoryMap['Farm Produce-2'] || categoryMap['Agricultural Produce-1'];
      } else if (product.tags.includes('fashion') || product.name.includes('Dress')) {
        categoryId = categoryMap["Women's Wear-2"] || categoryMap['Fashion-1'];
      } else if (product.tags.includes('beauty') || product.name.includes('Shea')) {
        categoryId = categoryMap['Skin Care-2'] || categoryMap['Beauty-1'];
      } else {
        categoryId = categoryMap['Farm Produce-2'] || categoryMap['Agricultural Produce-1'];
      }

      // Final fallback - use first available category
      if (!categoryId && categories.length > 0) {
        categoryId = categories[0]._id;
        console.log(`⚠️  Used fallback category for: ${product.name}`);
      }

      return {
        ...product,
        category: categoryId
      };
    });

    // Add products with categories
    await Product.insertMany(productsWithCategories);
    console.log('✅ Sample products added successfully');

    // Verification
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const growingProducts = await Product.countDocuments({ productType: { $ne: 'ready' } });
    const productsWithCategoriesCount = await Product.countDocuments({ category: { $ne: null } });
    
    console.log(`\n📊 Database seeded successfully!`);
    console.log(`   Total Products: ${productCount}`);
    console.log(`   Products with Categories: ${productsWithCategoriesCount}`);
    console.log(`   Growing/Pre-order Products: ${growingProducts}`);
    console.log(`   Total Categories: ${categoryCount}`);
    console.log(`   Ready for KSH marketplace with pre-orders!`);

    // Show product-category assignments
    console.log('\n🔗 Product-Category Assignments:');
    const products = await Product.find({}).populate('category', 'name level');
    products.forEach(product => {
      console.log(`   ${product.name} → ${product.category?.name || 'No category'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();