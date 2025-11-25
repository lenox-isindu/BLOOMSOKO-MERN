import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const hierarchicalCategories = [
  // Level 1: Main Categories
  {
    name: "Agricultural Produce",
    description: "Fresh farm products, livestock, and agricultural goods",
    level: 1,
    status: "active",
    seo: { slug: "agricultural-produce" },
    children: [
      // Level 2: Subcategories ONLY - NO Level 3
      {
        name: "Farm Produce",
        description: "Fresh vegetables, fruits, and crops",
        level: 2,
        status: "active",
        seo: { slug: "farm-produce" }
        // NO children array here - no level 3 categories
      },
      {
        name: "Livestock Produce",
        description: "Animal products and livestock",
        level: 2,
        status: "active",
        seo: { slug: "livestock-produce" }
        // NO children array here - no level 3 categories
      }
    ]
  },
  {
    name: "Beauty",
    description: "Beauty products, cosmetics, and personal care items",
    level: 1,
    status: "active",
    seo: { slug: "beauty" },
    children: [
      {
        name: "Make Up",
        description: "Cosmetics and makeup products",
        level: 2,
        status: "active",
        seo: { slug: "make-up" }
      },
      {
        name: "Skin Care",
        description: "Skincare products and treatments",
        level: 2,
        status: "active",
        seo: { slug: "skin-care" }
      },
      {
        name: "Hair Care",
        description: "Hair care products and treatments",
        level: 2,
        status: "active",
        seo: { slug: "hair-care" }
      },
      {
        name: "Nail Care",
        description: "Nail care products and accessories",
        level: 2,
        status: "active",
        seo: { slug: "nail-care" }
      }
    ]
  },
  {
    name: "Fashion",
    description: "Clothing, accessories, and fashion items for all",
    level: 1,
    status: "active",
    seo: { slug: "fashion" },
    children: [
      {
        name: "Men's Wear",
        description: "Clothing and accessories for men",
        level: 2,
        status: "active",
        seo: { slug: "mens-wear" },
        children: [
          { name: "Trousers", level: 3, seo: { slug: "mens-trousers" } },
          { name: "Shirts", level: 3, seo: { slug: "mens-shirts" } },
          { name: "T-Shirts", level: 3, seo: { slug: "mens-tshirts" } },
          { name: "Coldwear", level: 3, seo: { slug: "mens-coldwear" } },
          { name: "Accessories", level: 3, seo: { slug: "mens-accessories" } },
          { name: "Shoes", level: 3, seo: { slug: "mens-shoes" } }
        ]
      },
      {
        name: "Women's Wear",
        description: "Clothing and accessories for women",
        level: 2,
        status: "active",
        seo: { slug: "womens-wear" },
        children: [
          { name: "Trousers", level: 3, seo: { slug: "womens-trousers" } },
          { name: "Shirts", level: 3, seo: { slug: "womens-shirts" } },
          { name: "T-Shirts", level: 3, seo: { slug: "womens-tshirts" } },
          { name: "Coldwear", level: 3, seo: { slug: "womens-coldwear" } },
          { name: "Accessories", level: 3, seo: { slug: "womens-accessories" } },
          { name: "Shoes", level: 3, seo: { slug: "womens-shoes" } }
        ]
      },
      {
        name: "Children's Wear",
        description: "Clothing and accessories for children",
        level: 2,
        status: "active",
        seo: { slug: "childrens-wear" },
        children: [
          { name: "Trousers", level: 3, seo: { slug: "childrens-trousers" } },
          { name: "Shirts", level: 3, seo: { slug: "childrens-shirts" } },
          { name: "T-Shirts", level: 3, seo: { slug: "childrens-tshirts" } },
          { name: "Coldwear", level: 3, seo: { slug: "childrens-coldwear" } },
          { name: "Accessories", level: 3, seo: { slug: "childrens-accessories" } },
          { name: "Shoes", level: 3, seo: { slug: "childrens-shoes" } }
        ]
      }
    ]
  },
  {
    name: "Household",
    description: "Home essentials, decor, and household items",
    level: 1,
    status: "active",
    seo: { slug: "household" },
    children: [
      {
        name: "Curtains",
        description: "Window treatments and curtains",
        level: 2,
        status: "active",
        seo: { slug: "curtains" }
      },
      {
        name: "Beddings",
        description: "Bed linens and bedding accessories",
        level: 2,
        status: "active",
        seo: { slug: "beddings" }
      },
      {
        name: "Carpets",
        description: "Floor coverings and carpets",
        level: 2,
        status: "active",
        seo: { slug: "carpets" }
      },
      {
        name: "Doormats",
        description: "Entrance mats and door coverings",
        level: 2,
        status: "active",
        seo: { slug: "doormats" }
      },
      {
        name: "Utensils",
        description: "Kitchen utensils and cookware",
        level: 2,
        status: "active",
        seo: { slug: "utensils" }
      },
      {
        name: "Decor",
        description: "Home decoration items",
        level: 2,
        status: "active",
        seo: { slug: "decor" }
      }
    ]
  }
];

// Recursive function to create categories with hierarchy
const createCategoryHierarchy = async (categories, parentId = null) => {
  const createdCategories = [];
  
  for (const categoryData of categories) {
    const { children, ...categoryFields } = categoryData;
    
    const category = new Category({
      ...categoryFields,
      parent: parentId
    });
    
    await category.save();
    createdCategories.push(category);
    
    // Recursively create children only if they exist
    if (children && children.length > 0) {
      const childCategories = await createCategoryHierarchy(children, category._id);
      createdCategories.push(...childCategories);
    }
  }
  
  return createdCategories;
};

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomsoko');
    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️ Cleared existing categories');

    // Create category hierarchy
    const allCategories = await createCategoryHierarchy(hierarchicalCategories);
    console.log('✅ Categories created with hierarchy');

    // Get counts
    const totalCategories = await Category.countDocuments();
    const level1Count = await Category.countDocuments({ level: 1 });
    const level2Count = await Category.countDocuments({ level: 2 });
    const level3Count = await Category.countDocuments({ level: 3 });

    console.log(`\n📊 Category Statistics:`);
    console.log(`   Total Categories: ${totalCategories}`);
    console.log(`   Main Categories (Level 1): ${level1Count}`);
    console.log(`   Subcategories (Level 2): ${level2Count}`);
    console.log(`   Sub-subcategories (Level 3): ${level3Count}`);

    // Display the category tree
    console.log('\n🌳 Category Tree Structure:');
    const mainCategories = await Category.find({ level: 1 });
    
    for (const mainCat of mainCategories) {
      console.log(`\n📁 ${mainCat.name}`);
      
      const subCategories = await Category.find({ parent: mainCat._id, level: 2 });
      for (const subCat of subCategories) {
        console.log(`   ├── 📂 ${subCat.name}`);
        
        const childCategories = await Category.find({ parent: subCat._id, level: 3 });
        for (const childCat of childCategories) {
          console.log(`   │   ├── 📄 ${childCat.name}`);
        }
        if (childCategories.length === 0) {
          console.log(`   │   └── (No subcategories)`);
        }
      }
      if (subCategories.length === 0) {
        console.log(`   └── (No subcategories)`);
      }
    }

    console.log('\n✅ Category hierarchy seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();