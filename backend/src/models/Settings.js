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
      default: 40, // Online / prepaid delivery fee
      min: [0, 'Standard delivery fee cannot be negative']
    },
    codDeliveryFee: {
      type: Number,
      default: 60, // COD delivery fee (usually higher than prepaid)
      min: [0, 'COD delivery fee cannot be negative']
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
      default: 'AURIVÁ Warehouse — Sonipat'
    },
    warehouseAddress: {
      type: String,
      trim: true,
      default: 'House no. 1213, Sector 15'
    },
    warehouseCity: {
      type: String,
      trim: true,
      default: 'Sonipat'
    },
    warehouseState: {
      type: String,
      trim: true,
      default: 'Haryana'
    },
    warehousePincode: {
      type: String,
      trim: true,
      default: '131001'
    },
    warehousePhone: {
      type: String,
      trim: true,
      default: '+91 76781 54795'
    },
    hubAddress: {
      type: String,
      trim: true,
      default: 'House no. 1213, Sector 15, Sonipat, Haryana - 131001'
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
      default: 'Supportauriva77@gmail.com'
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'Supportauriva77@gmail.com'
    },
    storePhone: {
      type: String,
      trim: true,
      default: '+91 76781 54795'
    },
    supportPhone: {
      type: String,
      trim: true,
      default: '+91 76781 54795'
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
    },

    // 6. Help & Support page (admin-managed, shown on Account + /help-support)
    helpSupport: {
      title: {
        type: String,
        trim: true,
        default: 'Help & Support'
      },
      subtitle: {
        type: String,
        trim: true,
        default:
          'Reach customer care or browse quick answers about orders, shipping, and payments.'
      },
      phone: {
        type: String,
        trim: true,
        default: '+91 76781 54795'
      },
      phoneHours: {
        type: String,
        trim: true,
        default: 'Mon–Sat, 9 AM – 6 PM'
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: 'supportauriva77@gmail.com'
      },
      emailNote: {
        type: String,
        trim: true,
        default: 'Reply within 24 hours'
      },
      writeTitle: {
        type: String,
        trim: true,
        default: 'Write to us'
      },
      writeLink: {
        type: String,
        trim: true,
        default: '/contact'
      },
      writeNote: {
        type: String,
        trim: true,
        default: 'Orders, refunds & feedback'
      },
      fullHelpLink: {
        type: String,
        trim: true,
        default: '/help-support'
      },
      faqs: {
        type: [
          {
            q: { type: String, trim: true, required: true },
            a: { type: String, trim: true, required: true }
          }
        ],
        default: () => [
          {
            q: 'How do I track my order?',
            a: 'Open My Orders and tap Track, or use the tracking link from your confirmation message.'
          },
          {
            q: 'What payment methods do you accept?',
            a: 'Pay online with UPI, cards, or net banking (Razorpay), or choose Cash on Delivery where available.'
          },
          {
            q: 'Can I cancel an order?',
            a: 'You can cancel from the order tracking page while the order is still Received, Accepted, or Packed.'
          },
          {
            q: 'How do I update my delivery address?',
            a: 'Go to Saved Addresses to add, edit, or set a default address before placing your next order.'
          },
          {
            q: 'My payment succeeded but I do not see an order.',
            a: 'Wait a few minutes and refresh My Orders. If it still does not appear, email support with your payment ID.'
          }
        ]
      }
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
