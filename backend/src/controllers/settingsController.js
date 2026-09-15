import settingsService from '../services/settingsService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Admin: Retrieve full store settings and business rules
 * GET /api/v1/admin/settings
 */
export const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    return sendSuccess(res, 'Admin store settings retrieved successfully', { settings }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update store settings and business rules
 * PUT /api/v1/admin/settings
 */
export const updateAdminSettings = async (req, res, next) => {
  try {
    const updatedSettings = await settingsService.updateSettings(req.body);
    return sendSuccess(res, 'Store settings updated successfully', { settings: updatedSettings }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

/**
 * Public: Retrieve customer-facing business rules (masks internal admin & warehouse details)
 * GET /api/v1/settings
 */
export const getPublicSettings = async (req, res, next) => {
  try {
    const publicSettings = await settingsService.getPublicSettings();
    return sendSuccess(res, 'Public store settings retrieved successfully', { settings: publicSettings }, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

export default {
  getAdminSettings,
  updateAdminSettings,
  getPublicSettings
};
