import mongoose from 'mongoose';
import Order from '../models/Order.js';
import settingsService from './settingsService.js';
import { HTTP_STATUS } from '../constants/status.js';

/**
 * Store -> customer distance for an order.
 *
 * Orders only store the delivery pincode/city, so coordinates are resolved from the
 * pincode (falling back to the city) using OpenStreetMap Nominatim. Only pincode / city / state
 * text is sent - never names, phone numbers or street addresses. Results are cached in memory
 * and requests are spaced >= 1.1s apart to respect Nominatim's usage policy.
 *
 * The result is a STRAIGHT-LINE (as-the-crow-flies) distance between the two areas,
 * so it is labelled approximate in the UI.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'AurivaFoods-Admin/1.0 (order distance lookup)';
const MIN_GAP_MS = 1100;
const REQUEST_TIMEOUT_MS = 8000;

const geoCache = new Map(); // key -> { lat, lon, basis } | null
let lastRequestAt = 0;
let queue = Promise.resolve();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Serialise outbound geocoding calls and keep them >= MIN_GAP_MS apart
function throttled(task) {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => {});
  return run;
}

async function nominatimSearch(params) {
  const url = `${NOMINATIM_URL}?${new URLSearchParams({ format: 'json', limit: '1', countrycodes: 'in', ...params })}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
    if (!res.ok) return null;
    const rows = await res.json();
    const hit = Array.isArray(rows) ? rows[0] : null;
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeArea({ pincode, city, state }) {
  const pin = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  const cityName = String(city || '').trim();
  const stateName = String(state || '').trim();

  const key = `${pin}|${cityName.toLowerCase()}|${stateName.toLowerCase()}`;
  if (geoCache.has(key)) return geoCache.get(key);

  let result = null;
  if (pin.length === 6) {
    const hit = await throttled(() => nominatimSearch({ postalcode: pin }));
    if (hit) result = { ...hit, basis: 'pincode' };
  }
  if (!result && cityName) {
    const hit = await throttled(() => nominatimSearch({ q: [cityName, stateName, 'India'].filter(Boolean).join(', ') }));
    if (hit) result = { ...hit, basis: 'city' };
  }

  // Only cache successes for long; remember failures briefly by not caching them (a retry may work)
  if (result) geoCache.set(key, result);
  return result;
}

const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * @returns {Promise<{ km: number|null, approximate: boolean, basis: string, message?: string }>}
 */
export async function getOrderDistance(orderId) {
  const query = mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
  const order = await Order.findOne(query).select('shippingAddress orderNumber');
  if (!order) {
    const err = new Error(`Order "${orderId}" not found`);
    err.statusCode = HTTP_STATUS.NOT_FOUND;
    throw err;
  }

  const settings = await settingsService.getSettings();
  const store = {
    pincode: settings?.warehousePincode,
    city: settings?.warehouseCity,
    state: settings?.warehouseState
  };
  const ship = order.shippingAddress || {};
  const customer = { pincode: ship.postalCode, city: ship.city, state: ship.state };

  const [from, to] = [await geocodeArea(store), await geocodeArea(customer)];
  if (!from || !to) {
    return {
      km: null,
      approximate: true,
      basis: 'unavailable',
      message: !from
        ? 'Store location could not be resolved. Check the warehouse pincode in Settings.'
        : 'Delivery location could not be resolved from the address.'
    };
  }

  const km = Math.round(haversineKm(from, to) * 10) / 10;
  // If either side fell back to the city centre, the figure is coarser
  const basis = from.basis === 'pincode' && to.basis === 'pincode' ? 'pincode' : 'city';
  return { km, approximate: true, basis };
}

export default { getOrderDistance, haversineKm };
