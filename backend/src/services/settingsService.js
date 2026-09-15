import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import { ALLOWED_SETTINGS_FIELDS } from '../validations/settingsValidation.js';

export const DEFAULT_SETTINGS = {
  configKey: 'default_store_settings',
  gstRate: 5,
  standardDeliveryFee: 40,
  freeDeliveryThreshold: 499,
  lowStockThreshold: 30,
  warehouseName: 'AURIVÁ Central Fulfillment Hub',
  warehouseAddress: 'Plot 14, Sanwer Road Industrial Area',
  warehouseCity: 'Indore',
  warehouseState: 'Madhya Pradesh',
  warehousePincode: '452015',
  warehousePhone: '+91 9876543210',
  hubAddress: 'AURIVÁ Central Fulfillment Hub, Plot 14, Sanwer Road Industrial Area, Indore, MP - 452015',
  storeName: 'AURIVÁ Foods Private Limited',
  storeEmail: 'care@aurivafoods.com',
  supportEmail: 'care@aurivafoods.com',
  storePhone: '+91 9876543210',
  supportPhone: '+91 9876543210',
  storeAddress: 'AURIVÁ Central Fulfillment Hub, Plot 14, Sanwer Road Industrial Area, Indore, MP - 452015',
  currency: '₹',
  timezone: 'Asia/Kolkata'
};

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
      freeDeliveryThreshold: typeof settings.freeDeliveryThreshold === 'number' ? settings.freeDeliveryThreshold : DEFAULT_SETTINGS.freeDeliveryThreshold
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
        if (['gstRate', 'standardDeliveryFee', 'freeDeliveryThreshold', 'lowStockThreshold'].includes(key)) {
          sanitized[key] = Number(updateData[key]);
        } else if (typeof updateData[key] === 'string') {
          sanitized[key] = updateData[key].trim();
        } else {
          sanitized[key] = updateData[key];
        }
      }
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
