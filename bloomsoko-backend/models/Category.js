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
    enum: [1, 2, 3], // 1: Main category, 2: Subcategory, 3: Sub-subcategory
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

export default mongoose.model('Category', categorySchema);