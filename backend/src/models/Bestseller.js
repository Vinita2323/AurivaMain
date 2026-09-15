import mongoose from 'mongoose';

const bestsellerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required for bestseller item'],
      unique: true // Strictly prevents duplicate product entries in Bestsellers
    },
    productName: {
      type: String,
      required: false // Optional to not break existing records
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Compound index for sorted active queries
bestsellerSchema.index({ isActive: 1, displayOrder: 1 });

export const Bestseller = mongoose.model('Bestseller', bestsellerSchema);
export default Bestseller;
