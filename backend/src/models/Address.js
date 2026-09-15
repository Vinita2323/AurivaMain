import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 (house/building/street) is required'],
      trim: true,
      maxlength: [200, 'Address line 1 cannot exceed 200 characters']
    },
    addressLine2: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Address line 2 cannot exceed 200 characters']
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Landmark cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Madhya Pradesh',
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code / pincode is required'],
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters']
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    addressType: {
      type: String,
      enum: ['home', 'work', 'other'],
      lowercase: true,
      default: 'home'
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    isDefault: {
      type: Boolean,
      default: false
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

// Compound index to quickly fetch default and recent addresses for a user
addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 });

export const Address = mongoose.model('Address', addressSchema);
export default Address;
