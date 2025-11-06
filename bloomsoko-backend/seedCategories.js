import mongoose from 'mongoose';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const categoriesData = [
  // Level 1: Main Categories
  {
    name: "Agricultural Produce",
    description: "Fresh farm products, livestock, and agricultural goods",
    level: 1,
    status: "active",
    seo: { slug: "agricultural-produce" }
  },
  {
    name: "Beauty",
    description: "Beauty products, cosmetics, and personal care items",
    level: 1,
    status: "active",
    seo: { slug: "beauty" }
  },
  {
    name: "Fashion",
    description: "Clothing, accessories, and fashion items for all",
    level: 1,
    status: "active",
    seo: { slug: "fashion" }
  },
  {
    name: "Household",
    description: "Home essentials, decor, and household items",
    level: 1,
    status: "active",
    seo: { slug: "household" }
  }
];

const subcategoriesData = [
  // Agricultural Produce Subcategories (Level 2)
  {
    name: "Farm Produce",
    description: "Fresh vegetables, fruits, and crops",
    level: 2,
    parent: null, 
    status: "active",
    seo: { slug: "farm-produce" }
  },
  {
    name: "Livestock Produce",
    description: "Animal products and livestock",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "livestock-produce" }
  },

  // Beauty Subcategories (Level 2)
  {
    name: "Make Up",
    description: "Cosmetics and makeup products",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "make-up" }
  },
  {
    name: "Skin Care",
    description: "Skincare products and treatments",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "skin-care" }
  },
  {
    name: "Hair Care",
    description: "Hair care products and treatments",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "hair-care" }
  },
  {
    name: "Nail Care",
    description: "Nail care products and accessories",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "nail-care" }
  },

  // Fashion Subcategories (Level 2)
  {
    name: "Men's Wear",
    description: "Clothing and accessories for men",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "mens-wear" }
  },
  {
    name: "Women's Wear",
    description: "Clothing and accessories for women",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "womens-wear" }
  },
  {
    name: "Children's Wear",
    description: "Clothing and accessories for children",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "childrens-wear" }
  },

  // Household Subcategories (Level 2)
  {
    name: "Curtains",
    description: "Window treatments and curtains",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "curtains" }
  },
  {
    name: "Beddings",
    description: "Bed linens and bedding accessories",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "beddings" }
  },
  {
    name: "Carpets",
    description: "Floor coverings and carpets",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "carpets" }
  },
  {
    name: "Doormats",
    description: "Entrance mats and door coverings",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "doormats" }
  },
  {
    name: "Utensils",
    description: "Kitchen utensils and cookware",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "utensils" }
  },
  {
    name: "Decor",
    description: "Home decoration items",
    level: 2,
    parent: null,
    status: "active",
    seo: { slug: "decor" }
  }
];

// Level 3 Subcategories for Fashion
const fashionSubSubcategories = [
  // Men's Wear Subcategories (Level 3)
  { name: "Trousers", level: 3, seo: { slug: "mens-trousers" } },
  { name: "Shirts", level: 3, seo: { slug: "mens-shirts" } },
  { name: "T-Shirts", level: 3, seo: { slug: "mens-tshirts" } },
  { name: "Coldwear", level: 3, seo: { slug: "mens-coldwear" } },
  { name: "Accessories", level: 3, seo: { slug: "mens-accessories" } },
  { name: "Shoes", level: 3, seo: { slug: "mens-shoes" } },
  { name: "Others", level: 3, seo: { slug: "mens-others" } },

  // Women's Wear Subcategories (Level 3)
  { name: "Trousers", level: 3, seo: { slug: "womens-trousers" } },
  { name: "Shirts", level: 3, seo: { slug: "womens-shirts" } },
  { name: "T-Shirts", level: 3, seo: { slug: "womens-tshirts" } },
  { name: "Coldwear", level: 3, seo: { slug: "womens-coldwear" } },
  { name: "Accessories", level: 3, seo: { slug: "womens-accessories" } },
  { name: "Shoes", level: 3, seo: { slug: "womens-shoes" } },
  { name: "Others", level: 3, seo: { slug: "womens-others" } },

  // Children's Wear Subcategories (Level 3)
  { name: "Trousers", level: 3, seo: { slug: "childrens-trousers" } },
  { name: "Shirts", level: 3, seo: { slug: "childrens-shirts" } },
  { name: "T-Shirts", level: 3, seo: { slug: "childrens-tshirts" } },
  { name: "Coldwear", level: 3, seo: { slug: "childrens-coldwear" } },
  { name: "Accessories", level: 3, seo: { slug: "childrens-accessories" } },
  { name: "Shoes", level: 3, seo: { slug: "childrens-shoes" } },
  { name: "Others", level: 3, seo: { slug: "childrens-others" } }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloomsoko');
    console.log(' Connected to MongoDB');

    // Drop the existing unique index on name field
    try {
      await mongoose.connection.collection('categories').dropIndex('name_1');
      console.log(' Dropped unique index on name field');
    } catch (error) {
      console.log(' No existing unique index on name field, or already dropped');
    }
   await Category.deleteMany({});
    console.log(' Cleared existing categories');
    
    // Create main categories (Level 1)
    const mainCategories = await Category.insertMany(categoriesData);
    console.log('Main categories created');

    // Map main category names to IDs
    const mainCategoryMap = {};
    mainCategories.forEach(cat => {
      mainCategoryMap[cat.name] = cat._id;
    });

    // Assign parents to subcategories (Level 2)
    const subcategoriesWithParents = subcategoriesData.map(subcat => {
      let parentId;

      if (['Farm Produce', 'Livestock Produce'].includes(subcat.name)) {
        parentId = mainCategoryMap['Agricultural Produce'];
      } else if (['Make Up', 'Skin Care', 'Hair Care', 'Nail Care'].includes(subcat.name)) {
        parentId = mainCategoryMap['Beauty'];
      } else if (['Men\'s Wear', 'Women\'s Wear', 'Children\'s Wear'].includes(subcat.name)) {
        parentId = mainCategoryMap['Fashion'];
      } else if (['Curtains', 'Beddings', 'Carpets', 'Doormats', 'Utensils', 'Decor'].includes(subcat.name)) {
        parentId = mainCategoryMap['Household'];
      }

      return { ...subcat, parent: parentId };
    });

    // Create subcategories (Level 2)
    const subCategories = await Category.insertMany(subcategoriesWithParents);
    console.log('Subcategories created');

    // Map subcategory names to IDs for Level 3
    const subCategoryMap = {};
    subCategories.forEach(cat => {
      subCategoryMap[cat.name] = cat._id;
    });

    // Create Level 3 categories for fashion
   // Create Level 3 categories for fashion - 
console.log('Creating Level 3 categories...');
console.log('Total fashion sub-subcategories:', fashionSubSubcategories.length);

const fashionSubSubsWithParents = fashionSubSubcategories.map((subsub, index) => {
  let parentId;
  let categoryType;

  if (index < 7) {
    parentId = subCategoryMap["Men's Wear"];
    categoryType = "Men's";
  } else if (index < 14) {
    parentId = subCategoryMap["Women's Wear"];
    categoryType = "Women's";
  } else {
    parentId = subCategoryMap["Children's Wear"];
    categoryType = "Children's";
  }

  console.log(`Index ${index}: ${subsub.name} -> ${categoryType} Wear (Parent ID: ${parentId})`);

  return {
    ...subsub,
    parent: parentId,
    level: 3,
    status: 'active',
    description: `${subsub.name} for ${categoryType.toLowerCase()}`
  };
});

await Category.insertMany(fashionSubSubsWithParents);
console.log('Fashion sub-subcategories created');

// VERIFY THE CREATION
console.log('\nVerifying category creation:');
const mensChildren = await Category.find({ parent: subCategoryMap["Men's Wear"] });
const womensChildren = await Category.find({ parent: subCategoryMap["Women's Wear"] });
const childrensChildren = await Category.find({ parent: subCategoryMap["Children's Wear"] });

console.log(`Men's Wear children: ${mensChildren.length}`);
console.log(`Women's Wear children: ${womensChildren.length}`);
console.log(`Children's Wear children: ${childrensChildren.length}`);

// Log the actual children names
console.log('\nMen\'s Wear children:', mensChildren.map(c => c.name));
console.log('Women\'s Wear children:', womensChildren.map(c => c.name));
console.log('Children\'s Wear children:', childrensChildren.map(c => c.name));
    // Final counts
    const totalCategories = await Category.countDocuments();
    const level1Count = await Category.countDocuments({ level: 1 });
    const level2Count = await Category.countDocuments({ level: 2 });
    const level3Count = await Category.countDocuments({ level: 3 });

    console.log(` Categories seeded successfully!`);
    console.log(`Total Categories: ${totalCategories}`);
    console.log(` Main Categories (Level 1): ${level1Count}`);
    console.log(`Subcategories (Level 2): ${level2Count}`);
    console.log(` Sub-subcategories (Level 3): ${level3Count}`);
    console.log(` Ready for real products!`);

    // Show the complete category tree
    console.log('\n Category Tree:');
    const mainCats = await Category.find({ level: 1 }).populate({
      path: 'subcategories',
      populate: {
        path: 'children'
      }
    });
    
    mainCats.forEach(mainCat => {
      console.log(`\n ${mainCat.name}`);
      Category.find({ parent: mainCat._id, level: 2 }).then(subCats => {
        subCats.forEach(subCat => {
          console.log(`   ${subCat.name}`);
          Category.find({ parent: subCat._id, level: 3 }).then(childCats => {
            childCats.forEach(childCat => {
              console.log(`   │    ${childCat.name}`);
            });
          });
        });
      });
    });

    process.exit(0);
  } catch (error) {
    console.error(' Error seeding categories:', error);
    process.exit(1);
  }
};


process.on('unhandledRejection', (err) => {
  console.error(' Unhandled Promise Rejection:', err);
  process.exit(1);
});

seedCategories();