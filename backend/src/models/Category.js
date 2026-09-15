import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    },
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    order: {
      type: Number,
      default: 1
    },
    image: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters long'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
      index: true
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    subtext: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    badge: {
      type: String,
      trim: true,
      default: 'Popular'
    },
    popular: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true
    },
    sortOrder: {
      type: Number,
      default: 1,
      index: true
    },
    order: {
      type: Number,
      default: 1
    },
    subcategories: {
      type: [subcategorySchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      }
    }
  }
);

// Keep order and sortOrder in sync
categorySchema.pre('save', function (next) {
  if (this.sortOrder !== undefined && this.order === undefined) {
    this.order = this.sortOrder;
  } else if (this.order !== undefined && this.sortOrder === undefined) {
    this.sortOrder = this.order;
  }
  next();
});

export const Category = mongoose.model('Category', categorySchema);
export default Category;
