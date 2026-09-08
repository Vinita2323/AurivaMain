import mongoose from 'mongoose';

const bestsellerConfigSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: true
    },
    sectionLabel: {
      type: String,
      trim: true,
      default: 'OUR BESTSELLERS'
    },
    sectionHeading: {
      type: String,
      trim: true,
      default: 'DISCOVER OUR MOST LOVED FLAVOURS'
    },
    viewAllText: {
      type: String,
      trim: true,
      default: 'VIEW ALL PRODUCTS'
    },
    viewAllLink: {
      type: String,
      trim: true,
      default: '/shop'
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

export const BestsellerConfig = mongoose.model('BestsellerConfig', bestsellerConfigSchema);
export default BestsellerConfig;
