import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: 'default_store_settings',
      unique: true,
      index: true
    },

    // 1. GST / Tax Configuration
    gstRate: {
      type: Number,
      default: 5, // 5% GST standard
      min: [0, 'GST rate cannot be negative'],
      max: [100, 'GST rate cannot exceed 100%']
    },

    // 2. Delivery Configuration
    standardDeliveryFee: {
      type: Number,
      default: 40, // Standard ₹40 delivery fee
      min: [0, 'Standard delivery fee cannot be negative']
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 499, // Free delivery for orders >= ₹499
      min: [0, 'Free delivery threshold cannot be negative']
    },

    // 3. Inventory Configuration
    lowStockThreshold: {
      type: Number,
      default: 30, // Products with <= 30 units trigger low-stock alert
      min: [0, 'Low stock threshold cannot be negative']
    },

    // 4. Warehouse & Logistics Hub Information
    warehouseName: {
      type: String,
      trim: true,
      default: 'AURIVÁ Central Fulfillment Hub'
    },
    warehouseAddress: {
      type: String,
      trim: true,
      default: 'Plot 14, Sanwer Road Industrial Area'
    },
    warehouseCity: {
      type: String,
      trim: true,
      default: 'Indore'
    },
    warehouseState: {
      type: String,
      trim: true,
      default: 'Madhya Pradesh'
    },
    warehousePincode: {
      type: String,
      trim: true,
      default: '452015'
    },
    warehousePhone: {
      type: String,
      trim: true,
      default: '+91 9876543210'
    },
    hubAddress: {
      type: String,
      trim: true,
      default: 'AURIVÁ Central Fulfillment Hub, Plot 14, Sanwer Road Industrial Area, Indore, MP - 452015'
    },

    // 5. Store Identity & Customer Support Information
    storeName: {
      type: String,
      trim: true,
      default: 'AURIVÁ Foods Private Limited'
    },
    storeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'care@aurivafoods.com'
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'care@aurivafoods.com'
    },
    storePhone: {
      type: String,
      trim: true,
      default: '+91 9876543210'
    },
    supportPhone: {
      type: String,
      trim: true,
      default: '+91 9876543210'
    },
    storeAddress: {
      type: String,
      trim: true,
      default: 'AURIVÁ Central Fulfillment Hub, Plot 14, Sanwer Road Industrial Area, Indore, MP - 452015'
    },
    currency: {
      type: String,
      trim: true,
      default: '₹'
    },
    timezone: {
      type: String,
      trim: true,
      default: 'Asia/Kolkata'
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

// Ensure composite hubAddress stays consistent if individual warehouse components are updated
settingsSchema.pre('save', function (next) {
  if (this.isModified('warehouseName') || this.isModified('warehouseAddress') || this.isModified('warehouseCity') || this.isModified('warehouseState') || this.isModified('warehousePincode')) {
    if (!this.isModified('hubAddress') || !this.hubAddress) {
      this.hubAddress = `${this.warehouseName}, ${this.warehouseAddress}, ${this.warehouseCity}, ${this.warehouseState} - ${this.warehousePincode}`;
    }
  }
  // Sync supportEmail and storeEmail
  if (this.isModified('supportEmail') && !this.isModified('storeEmail')) {
    this.storeEmail = this.supportEmail;
  } else if (this.isModified('storeEmail') && !this.isModified('supportEmail')) {
    this.supportEmail = this.storeEmail;
  }
  // Sync supportPhone and storePhone
  if (this.isModified('supportPhone') && !this.isModified('storePhone')) {
    this.storePhone = this.supportPhone;
  } else if (this.isModified('storePhone') && !this.isModified('supportPhone')) {
    this.supportPhone = this.storePhone;
  }
  next();
});

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
