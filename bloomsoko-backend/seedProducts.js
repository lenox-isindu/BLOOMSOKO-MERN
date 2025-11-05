import mongoose from 'mongoose';
import Product from './models/Product.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleCategories = [
  {
    name: "Agriculture",
    description: "Fresh farm products, vegetables, and crops",
    status: "active",
    seo: {
      slug: "agriculture"
    }
  },
  {
    name: "Fashion",
    description: "Clothing, accessories, and fashion items",
    status: "active",
    seo: {
      slug: "fashion"
    }
  },
  {
    name: "Beauty",
    description: "Beauty products, cosmetics, and personal care",
    status: "active",
    seo: {
      slug: "beauty"
    }
  },
  {
    name: "House & Garden",
    description: "Home decor, gardening tools, and household items",
    status: "active",
    seo: {
      slug: "house-garden"
    }
  },
  {
    name: "Livestock",
    description: "Animals, poultry, and animal products",
    status: "active",
    seo: {
      slug: "livestock"
    }
  },
  {
    name: "Grains & Cereals",
    description: "Rice, maize, wheat, and other grains",
    status: "active",
    seo: {
      slug: "grains-cereals"
    }
  }
];

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
      expectedReadyDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
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
      expectedReadyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
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
    console.log(' Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log(' Cleared existing data');

    // Create categories first
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(' Categories created successfully');

    // Map category names to IDs for easy reference
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Assign categories to products
    const productsWithCategories = sampleProducts.map(product => {
      let categoryId;
      
      if (product.tags.includes('vegetables') || product.name.includes('Tomato') || product.name.includes('Kale') || product.name.includes('Spinach')) {
        categoryId = categoryMap['Agriculture'];
      } else if (product.tags.includes('fashion') || product.name.includes('Dress')) {
        categoryId = categoryMap['Fashion'];
      } else if (product.tags.includes('beauty') || product.name.includes('Shea')) {
        categoryId = categoryMap['Beauty'];
      } else {
        categoryId = categoryMap['Agriculture']; 
      }

      return {
        ...product,
        category: categoryId
      };
    });

    // Add products with categories
    await Product.insertMany(productsWithCategories);
    console.log(' Sample products added successfully');

    // Verify  data
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const growingProducts = await Product.countDocuments({ productType: { $ne: 'ready' } });
    
    console.log(`Database seeded successfully!`);
    console.log(`Total Products: ${productCount}`);
    console.log(`Growing/Pre-order Products: ${growingProducts}`);
    console.log(` Categories: ${categoryCount}`);
    console.log(` Ready for KSH marketplace with pre-orders!`);

    process.exit(0);
  } catch (error) {
    console.error(' Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();