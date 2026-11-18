import settingsService from './settingsService.js';
import { geocodeArea, haversineKm } from './distanceService.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Delivery method detection (SELF vs SHIPROCKET) and the single guard that keeps Shiprocket away from
 * self-delivered orders. Pure backend logic, no dependency on the Shiprocket quote/fulfilment code
 * (so the fulfilment service can import this without a circular import).
 *
 * Matching rules (never by city NAME — spellings vary):
 *   1. self delivery must be enabled in Settings
 *   2. delivery pincode must be a valid 6-digit PIN
 *   3. pincode is in the admin's local pincode list            -> SELF (PINCODE)
 *   4. else, if a radius is configured: straight-line distance from the warehouse to the pincode centre,
 *      computed ON THE SERVER (customer-supplied coordinates are never trusted) -> SELF (DISTANCE)
 *   5. anything uncertain (lookup failed / timed out / no coordinates)           -> SHIPROCKET
 */

export const DELIVERY_METHODS = Object.freeze({ SELF: 'SELF', SHIPROCKET: 'SHIPROCKET' });
const PINCODE_RE = /^[1-9][0-9]{5}$/;
const GEOCODE_TIMEOUT_MS = 4000;

export const normalizePincode = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return PINCODE_RE.test(digits) ? digits : '';
};

export const isValidCoordinate = (lat, lon) => {
  if (lat === null || lat === undefined || lat === '' || lon === null || lon === undefined || lon === '') return false;
  const a = Number(lat);
  const b = Number(lon);
  return Number.isFinite(a) && Number.isFinite(b) && a >= -90 && a <= 90 && b >= -180 && b <= 180 && !(a === 0 && b === 0);
};

// Test seam (NODE_ENV=test only): replace the OpenStreetMap lookup with a deterministic one.
let geocoder = geocodeArea;
export const __setGeocoderForTests = (fn) => {
  if (process.env.NODE_ENV !== 'test') throw new Error('__setGeocoderForTests is only available when NODE_ENV=test');
  geocoder = fn || geocodeArea;
};

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

const safeGeocode = async (area) => {
  try {
    const hit = await withTimeout(Promise.resolve(geocoder(area)), GEOCODE_TIMEOUT_MS);
    // A pincode-level result only: a city-centre fallback is too coarse to decide local delivery.
    if (hit && hit.basis === 'pincode' && isValidCoordinate(hit.lat, hit.lon)) return { lat: Number(hit.lat), lon: Number(hit.lon) };
  } catch {
    /* treated as "unknown" */
  }
  return null;
};

export const getSelfDeliveryConfig = (settings = {}) => {
  const sd = settings.selfDelivery || {};
  return {
    enabled: sd.enabled === true,
    pincodes: Array.isArray(sd.pincodes) ? sd.pincodes.map(normalizePincode).filter(Boolean) : [],
    maxRadiusKm: Number.isFinite(Number(sd.maxRadiusKm)) ? Math.max(0, Number(sd.maxRadiusKm)) : 0,
    deliveryCharge: Number.isFinite(Number(sd.deliveryCharge)) ? Math.max(0, Number(sd.deliveryCharge)) : 0,
    freeDeliveryThreshold:
      sd.freeDeliveryThreshold === null || sd.freeDeliveryThreshold === undefined || sd.freeDeliveryThreshold === ''
        ? null
        : Math.max(0, Number(sd.freeDeliveryThreshold) || 0)
  };
};

const warehouseCoordinates = async (settings) => {
  if (isValidCoordinate(settings.warehouseLatitude, settings.warehouseLongitude)) {
    return { lat: Number(settings.warehouseLatitude), lon: Number(settings.warehouseLongitude) };
  }
  const pin = normalizePincode(settings.warehousePincode);
  if (!pin) return null;
  return safeGeocode({ pincode: pin, city: settings.warehouseCity, state: settings.warehouseState });
};

/**
 * Decide the delivery method for a delivery pincode. Never throws: any doubt resolves to SHIPROCKET.
 * @returns {Promise<{ method: 'SELF'|'SHIPROCKET', matchedBy: ''|'PINCODE'|'DISTANCE', distanceKm: number|null, reason: string }>}
 */
export const classifyDelivery = async ({ pincode, settings: provided } = {}) => {
  const settings = provided || (await settingsService.getSettings());
  const cfg = getSelfDeliveryConfig(settings);
  const out = (method, matchedBy, reason, distanceKm = null) => ({ method, matchedBy, reason, distanceKm });

  if (!cfg.enabled) return out('SHIPROCKET', '', 'SELF_DELIVERY_DISABLED');

  const pin = normalizePincode(pincode);
  if (!pin) return out('SHIPROCKET', '', 'INVALID_PINCODE');

  if (cfg.pincodes.includes(pin)) return out('SELF', 'PINCODE', 'PINCODE_IN_LOCAL_LIST');

  if (cfg.maxRadiusKm > 0) {
    const [warehouse, customer] = await Promise.all([
      warehouseCoordinates(settings),
      safeGeocode({ pincode: pin })
    ]);
    if (!warehouse) return out('SHIPROCKET', '', 'WAREHOUSE_LOCATION_UNKNOWN');
    if (!customer) return out('SHIPROCKET', '', 'DELIVERY_LOCATION_UNKNOWN');
    const km = Math.round(haversineKm(warehouse, customer) * 10) / 10;
    if (Number.isFinite(km) && km <= cfg.maxRadiusKm) return out('SELF', 'DISTANCE', 'WITHIN_RADIUS', km);
    return out('SHIPROCKET', '', 'OUTSIDE_RADIUS', Number.isFinite(km) ? km : null);
  }

  return out('SHIPROCKET', '', 'NOT_LOCAL');
};

/** Orders created before the feature have no deliveryMethod: they are Shiprocket-managed. */
export const effectiveDeliveryMethod = (order) =>
  order?.deliveryMethod === DELIVERY_METHODS.SELF ? DELIVERY_METHODS.SELF : DELIVERY_METHODS.SHIPROCKET;

const gateError = (message, code) => {
  const err = new Error(message);
  err.statusCode = HTTP_STATUS.CONFLICT;
  err.code = code;
  // the Shiprocket controllers send `error.shiprocket` as the error body
  err.shiprocket = { code };
  return err;
};

/**
 * THE guard for creating / changing anything on Shiprocket. Every shipment-creation path calls this first.
 * @param {object} order  Order document (or lean object)
 * @param {{ auto?: boolean }} opts  auto=true for the automatic push (also honours "auto-create" setting)
 * @returns {Promise<{ allowed: boolean, code?: string, message?: string }>}
 */
export const getShiprocketGate = async (order, { auto = false } = {}) => {
  if (effectiveDeliveryMethod(order) === DELIVERY_METHODS.SELF) {
    return {
      allowed: false,
      code: 'SELF_DELIVERY_ORDER',
      message: 'This is a self-delivery order. No Shiprocket shipment is created for it. Change the delivery method to Shiprocket first if you want to ship it by courier.'
    };
  }
  const settings = await settingsService.getSettings();
  if (settings.shiprocketEnabled === false) {
    return { allowed: false, code: 'SHIPROCKET_DISABLED', message: 'Shiprocket is switched off in Settings → Delivery Configuration.' };
  }
  if (auto && settings.shiprocketAutoCreate === false) {
    return { allowed: false, code: 'SHIPROCKET_AUTO_CREATE_OFF', message: 'Automatic Shiprocket shipment creation is switched off in Settings.' };
  }
  return { allowed: true };
};

export const assertShiprocketAllowed = async (order, opts = {}) => {
  const gate = await getShiprocketGate(order, opts);
  if (!gate.allowed) throw gateError(gate.message, gate.code);
};

export default {
  DELIVERY_METHODS,
  normalizePincode,
  isValidCoordinate,
  getSelfDeliveryConfig,
  classifyDelivery,
  effectiveDeliveryMethod,
  getShiprocketGate,
  assertShiprocketAllowed
};
