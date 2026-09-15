import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    productId: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: 0
    },
    oldPrice: {
      type: Number,
      default: 0
    },
    slug: {
      type: String,
      default: ''
    }
  },
  { _id: true, timestamps: true }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    guestId: {
      type: String
    },
    items: [wishlistItemSchema]
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

// Indexes with partial filter expressions to prevent null collision on guest sessions
wishlistSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
);
wishlistSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } }
);

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
