import settingsService from './settingsService.js';
import { resolveShiprocketDeliveryFee, formatQuotePayload } from './shippingQuoteService.js';
import { classifyDelivery, getSelfDeliveryConfig, normalizePincode, DELIVERY_METHODS } from './deliveryMethodService.js';
import { isCodPaymentMethod } from '../utils/pricing.js';

/**
 * ONE place that turns "pincode + cart + payment method" into a delivery method AND a delivery fee.
 * Used by the checkout quote endpoint, the checkout summary, the prepaid payment session and order placement,
 * so the amount shown, the amount paid and the amount stored on the order can never disagree.
 *
 * SELF      -> local delivery charge from Settings (free above the local / store free-delivery threshold);
 *              no Shiprocket quote is requested.
 * SHIPROCKET-> exactly the existing Shiprocket quote logic (including its fallback to store fees).
 */
export async function resolveDeliveryQuote({ pincode, paymentMethod, subtotal, weightKg, items = [], productMap = null } = {}) {
  const settings = await settingsService.getSettings();
  const classification = await classifyDelivery({ pincode, settings });

  if (classification.method === DELIVERY_METHODS.SELF) {
    const cfg = getSelfDeliveryConfig(settings);
    const amount = Math.max(0, Number(subtotal) || 0);
    const threshold = cfg.freeDeliveryThreshold ?? Number(settings.freeDeliveryThreshold ?? 499);
    const free = amount <= 0 || amount >= threshold;
    const fee = free ? 0 : cfg.deliveryCharge;
    const leg = { fee, rawFee: cfg.deliveryCharge, courier: 'Local delivery', etd: null, couriers: [] };
    return {
      deliveryMethod: DELIVERY_METHODS.SELF,
      deliveryFee: fee,
      prepaid: leg,
      cod: { ...leg },
      weightKg: Number(weightKg) || 0,
      pincode: normalizePincode(pincode),
      pickupPincode: null, // internal warehouse details are not exposed to customers
      paymentMethod: isCodPaymentMethod(paymentMethod) ? 'COD' : 'Prepaid',
      source: 'local',
      freeDeliveryApplied: free && amount > 0,
      error: null,
      classification
    };
  }

  const quote = await resolveShiprocketDeliveryFee({
    pincode,
    paymentMethod,
    subtotal,
    weightKg,
    items,
    productMap,
    forceSettingsFallback: settings.shiprocketEnabled === false
  });
  return { ...quote, deliveryMethod: DELIVERY_METHODS.SHIPROCKET, classification };
}

/** Public quote payload for the checkout UI (never includes internal classification details). */
export async function getDeliveryQuote(params = {}) {
  const quote = await resolveDeliveryQuote(params);
  return formatQuotePayload(quote, params);
}

export default { resolveDeliveryQuote, getDeliveryQuote };
