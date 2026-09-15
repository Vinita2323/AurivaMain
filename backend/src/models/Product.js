import mongoose from 'mongoose';

const weightOptionSchema = new mongoose.Schema(
  {
    weight: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true
    },
    subtitle: {
      type: String,
      trim: true,
      default: ''
    },
    tagline: {
      type: String,
      trim: true,
      default: ''
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    category: {
      type: String,
      trim: true,
      default: 'flavoured-makhana',
      index: true
    },
    flavor: {
      type: String,
      trim: true,
      default: ''
    },
    diet: {
      type: [String],
      default: ['gluten-free', 'vegan', 'low-calorie']
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    oldPrice: {
      type: Number,
      default: 0,
      min: [0, 'Old price cannot be negative']
    },
    discountPercent: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    weight: {
      type: String,
      default: '150g'
    },
    weightOptions: [weightOptionSchema],
    inStock: {
      type: Boolean,
      default: true,
      index: true
    },
    stockCount: {
      type: Number,
      default: 150,
      min: 0
    },
    badge: {
      type: String,
      default: 'BESTSELLER'
    },
    badgeType: {
      type: String,
      default: 'bestseller'
    },
    isBestseller: {
      type: Boolean,
      default: false
    },
    isNewLaunch: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    image: {
      type: String,
      required: [true, 'Product image is required']
    },
    gallery: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    details: {
      type: String,
      trim: true,
      default: ''
    },
    productDetails: {
      type: String,
      trim: true,
      default: ''
    },
    ingredients: {
      type: String,
      trim: true,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Product = mongoose.model('Product', productSchema);
export default Product;
