import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  description: {
    type: String,
  },
  image: {
    url: String,
    alt: String,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  level: {
    type: Number,
    enum: [1, 2, 3],
    default: 1,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  seo: {
    title: String,
    description: String,
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  // Add path for easier querying
  path: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Virtual for children (all levels)
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Update path before saving
categorySchema.pre('save', async function(next) {
  if (this.parent && this.isModified('parent')) {
    const parent = await mongoose.model('Category').findById(this.parent);
    this.path = parent ? `${parent.path}/${parent.name}` : this.name;
  } else if (!this.path) {
    this.path = this.name;
  }
  next();
});

// Static method to build category tree
categorySchema.statics.buildTree = function(categories) {
  const map = {};
  const tree = [];
  
  categories.forEach(cat => {
    map[cat._id] = { ...cat.toObject(), children: [] };
  });
  
  categories.forEach(cat => {
    if (cat.parent) {
      if (map[cat.parent]) {
        map[cat.parent].children.push(map[cat._id]);
      }
    } else {
      tree.push(map[cat._id]);
    }
  });
  
  return tree;
};

export default mongoose.model('Category', categorySchema);