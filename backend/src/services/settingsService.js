import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import { ALLOWED_SETTINGS_FIELDS } from '../validations/settingsValidation.js';

export const DEFAULT_SETTINGS = {
  configKey: 'default_store_settings',
  gstRate: 5,
  standardDeliveryFee: 40,
  codDeliveryFee: 60,
  freeDeliveryThreshold: 499,
  lowStockThreshold: 30,
  warehouseName: 'AURIVÁ Warehouse — Sonipat',
  warehouseAddress: 'House no. 1213, Sector 15',
  warehouseCity: 'Sonipat',
  warehouseState: 'Haryana',
  warehousePincode: '131001',
  warehousePhone: '+91 76781 54795',
  hubAddress: 'House no. 1213, Sector 15, Sonipat, Haryana - 131001',
  storeName: 'AURIVÁ Foods Private Limited',
  storeEmail: 'Supportauriva77@gmail.com',
  supportEmail: 'Supportauriva77@gmail.com',
  storePhone: '+91 76781 54795',
  supportPhone: '+91 76781 54795',
  storeAddress: 'House no. 1213, Sector 15, Sonipat, Haryana - 131001',
  currency: '₹',
  timezone: 'Asia/Kolkata',
  helpSupport: {
    title: 'Help & Support',
    subtitle:
      'Reach customer care or browse quick answers about orders, shipping, and payments.',
    phone: '+91 76781 54795',
    phoneHours: 'Mon–Sat, 9 AM – 6 PM',
    email: 'supportauriva77@gmail.com',
    emailNote: 'Reply within 24 hours',
    writeTitle: 'Write to us',
    writeLink: '/contact',
    writeNote: 'Orders, refunds & feedback',
    fullHelpLink: '/help-support',
    faqs: [
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
};

function sanitizeHelpSupport(raw = {}, fallback = DEFAULT_SETTINGS.helpSupport) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const faqs = Array.isArray(src.faqs)
    ? src.faqs
        .map((f) => ({
          q: String(f?.q || '').trim(),
          a: String(f?.a || '').trim()
        }))
        .filter((f) => f.q && f.a)
        .slice(0, 20)
    : fallback.faqs;

  return {
    title: String(src.title ?? fallback.title).trim() || fallback.title,
    subtitle: String(src.subtitle ?? fallback.subtitle).trim() || fallback.subtitle,
    phone: String(src.phone ?? fallback.phone).trim(),
    phoneHours: String(src.phoneHours ?? fallback.phoneHours).trim() || fallback.phoneHours,
    email: String(src.email ?? fallback.email).trim().toLowerCase(),
    emailNote: String(src.emailNote ?? fallback.emailNote).trim() || fallback.emailNote,
    writeTitle: String(src.writeTitle ?? fallback.writeTitle).trim() || fallback.writeTitle,
    writeLink: String(src.writeLink ?? fallback.writeLink).trim() || fallback.writeLink,
    writeNote: String(src.writeNote ?? fallback.writeNote).trim() || fallback.writeNote,
    fullHelpLink: String(src.fullHelpLink ?? fallback.fullHelpLink).trim() || fallback.fullHelpLink,
    faqs: faqs.length ? faqs : fallback.faqs
  };
}

class SettingsService {
  constructor() {
    this._cachedSettings = null;
    this._cacheExpiry = 0;
    this._cacheTTL = 60 * 1000; // 60 seconds
  }

  /**
   * Clear in-memory settings cache
   */
  clearCache() {
    this._cachedSettings = null;
    this._cacheExpiry = 0;
  }

  /**
   * Get active store settings (singleton pattern with offline fallback & caching)
   * @returns {Promise<object>}
   */
  async getSettings() {
    const now = Date.now();
    if (this._cachedSettings && now < this._cacheExpiry) {
      return this._cachedSettings;
    }

    // If MongoDB is not connected, safely return defaults
    if (mongoose.connection.readyState !== 1) {
      return { ...DEFAULT_SETTINGS };
    }

    let settings = await Settings.findOne({ configKey: 'default_store_settings' }).lean();

    if (!settings) {
      // First-time initialization: create the singleton record
      const created = await Settings.create({
        ...DEFAULT_SETTINGS,
        configKey: 'default_store_settings'
      });
      settings = created.toObject();
    } else {
      // Migrate legacy Indore hub → Sonipat pickup address (Shiprocket warehouse)
      const isLegacyIndore =
        settings.warehousePincode === '452015' ||
        String(settings.warehouseCity || '').toLowerCase().includes('indore');
      if (isLegacyIndore) {
        const migrated = {
          warehouseName: DEFAULT_SETTINGS.warehouseName,
          warehouseAddress: DEFAULT_SETTINGS.warehouseAddress,
          warehouseCity: DEFAULT_SETTINGS.warehouseCity,
          warehouseState: DEFAULT_SETTINGS.warehouseState,
          warehousePincode: DEFAULT_SETTINGS.warehousePincode,
          warehousePhone: DEFAULT_SETTINGS.warehousePhone,
          hubAddress: DEFAULT_SETTINGS.hubAddress,
          storeAddress: DEFAULT_SETTINGS.storeAddress
        };
        await Settings.updateOne({ configKey: 'default_store_settings' }, { $set: migrated });
        settings = { ...settings, ...migrated };
        console.log('[Settings] Migrated warehouse pickup address to Sonipat, Haryana 131001');
      }
    }

    this._cachedSettings = settings;
    this._cacheExpiry = now + this._cacheTTL;

    return settings;
  }

  /**
   * Get public customer-facing store rules (masks warehouse & internal administrative fields)
   * @returns {Promise<object>}
   */
  async getPublicSettings() {
    const settings = await this.getSettings();

    return {
      storeName: settings.storeName || DEFAULT_SETTINGS.storeName,
      storeEmail: settings.storeEmail || settings.supportEmail || DEFAULT_SETTINGS.storeEmail,
      supportEmail: settings.supportEmail || settings.storeEmail || DEFAULT_SETTINGS.supportEmail,
      storePhone: settings.storePhone || settings.supportPhone || DEFAULT_SETTINGS.storePhone,
      supportPhone: settings.supportPhone || settings.storePhone || DEFAULT_SETTINGS.supportPhone,
      storeAddress: settings.storeAddress || DEFAULT_SETTINGS.storeAddress,
      currency: settings.currency || DEFAULT_SETTINGS.currency,
      timezone: settings.timezone || DEFAULT_SETTINGS.timezone,
      gstRate: typeof settings.gstRate === 'number' ? settings.gstRate : DEFAULT_SETTINGS.gstRate,
      standardDeliveryFee: typeof settings.standardDeliveryFee === 'number' ? settings.standardDeliveryFee : DEFAULT_SETTINGS.standardDeliveryFee,
      codDeliveryFee: typeof settings.codDeliveryFee === 'number' ? settings.codDeliveryFee : DEFAULT_SETTINGS.codDeliveryFee,
      freeDeliveryThreshold: typeof settings.freeDeliveryThreshold === 'number' ? settings.freeDeliveryThreshold : DEFAULT_SETTINGS.freeDeliveryThreshold,
      helpSupport: sanitizeHelpSupport(
        {
          ...(settings.helpSupport || {}),
          phone: settings.helpSupport?.phone || settings.supportPhone || settings.storePhone || '',
          email: settings.helpSupport?.email || settings.supportEmail || settings.storeEmail || ''
        },
        DEFAULT_SETTINGS.helpSupport
      )
    };
  }

  /**
   * Update store settings (Admin only)
   * @param {object} updateData
   * @returns {Promise<object>}
   */
  async updateSettings(updateData) {
    if (!updateData || typeof updateData !== 'object') {
      const err = new Error('Settings update data must be an object.');
      err.statusCode = 400;
      throw err;
    }

    const sanitized = {};
    for (const key of ALLOWED_SETTINGS_FIELDS) {
      if (updateData[key] !== undefined) {
        if (['gstRate', 'standardDeliveryFee', 'codDeliveryFee', 'freeDeliveryThreshold', 'lowStockThreshold'].includes(key)) {
          sanitized[key] = Number(updateData[key]);
        } else if (key === 'helpSupport') {
          sanitized.helpSupport = sanitizeHelpSupport(updateData.helpSupport);
        } else if (typeof updateData[key] === 'string') {
          sanitized[key] = updateData[key].trim();
        } else {
          sanitized[key] = updateData[key];
        }
      }
    }

    // Keep store-wide support contacts in sync with Help & Support page fields
    if (sanitized.helpSupport?.email) {
      sanitized.supportEmail = sanitized.helpSupport.email;
      if (!sanitized.storeEmail) sanitized.storeEmail = sanitized.helpSupport.email;
    }
    if (sanitized.helpSupport?.phone) {
      sanitized.supportPhone = sanitized.helpSupport.phone;
      if (!sanitized.storePhone) sanitized.storePhone = sanitized.helpSupport.phone;
    }

    // Bidirectional sync for aliases
    if (sanitized.supportEmail && !sanitized.storeEmail) {
      sanitized.storeEmail = sanitized.supportEmail;
    } else if (sanitized.storeEmail && !sanitized.supportEmail) {
      sanitized.supportEmail = sanitized.storeEmail;
    }

    if (sanitized.supportPhone && !sanitized.storePhone) {
      sanitized.storePhone = sanitized.supportPhone;
    } else if (sanitized.storePhone && !sanitized.supportPhone) {
      sanitized.supportPhone = sanitized.storePhone;
    }

    if (!sanitized.hubAddress && (sanitized.warehouseName || sanitized.warehouseAddress || sanitized.warehouseCity || sanitized.warehouseState || sanitized.warehousePincode)) {
      const current = await this.getSettings();
      const wName = sanitized.warehouseName || current.warehouseName || DEFAULT_SETTINGS.warehouseName;
      const wAddr = sanitized.warehouseAddress || current.warehouseAddress || DEFAULT_SETTINGS.warehouseAddress;
      const wCity = sanitized.warehouseCity || current.warehouseCity || DEFAULT_SETTINGS.warehouseCity;
      const wState = sanitized.warehouseState || current.warehouseState || DEFAULT_SETTINGS.warehouseState;
      const wPin = sanitized.warehousePincode || current.warehousePincode || DEFAULT_SETTINGS.warehousePincode;
      sanitized.hubAddress = `${wName}, ${wAddr}, ${wCity}, ${wState} - ${wPin}`;
    }

    const updated = await Settings.findOneAndUpdate(
      { configKey: 'default_store_settings' },
      { $set: sanitized },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    // Immediately invalidate cache
    this.clearCache();
    this._cachedSettings = updated;
    this._cacheExpiry = Date.now() + this._cacheTTL;

    return updated;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
