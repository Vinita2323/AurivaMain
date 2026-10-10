import env from '../config/env.js';
import settingsService from './settingsService.js';
import shiprocketClient from './shiprocketClient.js';
import shiprocketFulfillmentService, { parseWeightToKg } from './shiprocketFulfillmentService.js';
import { isCodPaymentMethod, resolveDeliveryFee } from '../utils/pricing.js';

function pickCourierRate(courier) {
  const rate = Number(
    courier?.rate ?? courier?.freight_charge ?? courier?.total_charges ?? courier?.charge
  );
  return Number.isFinite(rate) && rate > 0 ? Math.ceil(rate) : null;
}

function normalizeCouriers(couriers = []) {
  return couriers
    .map((c) => ({
      id: c.courier_company_id,
      name: c.courier_name,
      rate: pickCourierRate(c),
      etd: c.estimated_delivery_days,
      recommended: Boolean(c.recommended_by)
    }))
    .filter((c) => c.rate != null)
    .sort((a, b) => a.rate - b.rate);
}

function pickBestRate(couriers = []) {
  const normalized = normalizeCouriers(couriers);
  if (!normalized.length) return null;
  const recommended = normalized.find((c) => c.recommended) || normalized[0];
  return {
    fee: recommended.rate,
    courier: recommended.name,
    etd: recommended.etd,
    couriers: normalized.slice(0, 8)
  };
}

export function estimateWeightKgFromItems(items = [], productMap = null) {
  let total = 0;
  for (const item of items) {
    const qty = Number(item.qty) || 1;
    let perUnit = null;
    const product =
      productMap instanceof Map
        ? productMap.get(String(item.product?._id || item.product))
        : null;

    if (product?.shippingWeightKg != null && Number(product.shippingWeightKg) > 0) {
      perUnit = Number(product.shippingWeightKg);
    } else {
      perUnit = parseWeightToKg(item.weight) || parseWeightToKg(product?.weight);
    }
    total += (perUnit || env.SHIPROCKET.DEFAULT_WEIGHT_KG || 0.2) * qty;
  }
  return Math.max(0.2, Number(total.toFixed(3)));
}

function applyFreeDelivery(subtotal, fee, settings) {
  const threshold = Number(settings?.freeDeliveryThreshold ?? 499);
  const amount = Number(subtotal) || 0;
  if (amount <= 0 || amount >= threshold) {
    return { deliveryFee: 0, freeDeliveryApplied: true };
  }
  return { deliveryFee: Math.max(0, Number(fee) || 0), freeDeliveryApplied: false };
}

async function fetchShiprocketRate({ pickupPincode, deliveryPostcode, weight, cod }) {
  const data = await shiprocketClient.checkServiceability({
    pickupPostcode: pickupPincode,
    deliveryPostcode,
    weight,
    cod: cod ? 1 : 0
  });
  return pickBestRate(data?.data?.available_courier_companies || []);
}

/**
 * Resolve live Shiprocket delivery fee (prepaid + COD) for checkout / place-order.
 */
export async function resolveShiprocketDeliveryFee({
  pincode,
  paymentMethod,
  subtotal,
  weightKg,
  items = [],
  productMap = null
} = {}) {
  const settings = await settingsService.getSettings();
  const pickup = await shiprocketFulfillmentService.getPickupContext();
  const deliveryPostcode = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  const amount = Math.max(0, Number(subtotal) || 0);
  const weight = Number(weightKg) || estimateWeightKgFromItems(items, productMap);

  const empty = {
    deliveryFee: 0,
    prepaid: { fee: 0, courier: null, etd: null },
    cod: { fee: 0, courier: null, etd: null },
    weightKg: weight,
    pincode: deliveryPostcode,
    pickupPincode: pickup.pincode || null,
    source: 'shiprocket',
    freeDeliveryApplied: amount >= Number(settings.freeDeliveryThreshold ?? 499),
    error: null
  };

  if (!deliveryPostcode || deliveryPostcode.length !== 6) {
    return { ...empty, error: 'Valid 6-digit pincode required' };
  }

  // Testing / missing credentials: fall back to store settings fees (do not block checkout)
  const quotesEnabled = env.SHIPROCKET.CHECKOUT_QUOTES !== false;
  if (!quotesEnabled || !shiprocketFulfillmentService.isReady() || !pickup.pincode) {
    const prepaidFee = resolveDeliveryFee({
      subtotal: amount,
      paymentMethod: 'UPI',
      settings
    });
    const codFee = resolveDeliveryFee({
      subtotal: amount,
      paymentMethod: 'COD',
      settings
    });
    const selectedFee = isCodPaymentMethod(paymentMethod) ? codFee : prepaidFee;
    return {
      deliveryFee: selectedFee,
      prepaid: { fee: prepaidFee, rawFee: prepaidFee, courier: null, etd: null, couriers: [] },
      cod: { fee: codFee, rawFee: codFee, courier: null, etd: null, couriers: [] },
      weightKg: weight,
      pincode: deliveryPostcode,
      pickupPincode: pickup.pincode || null,
      paymentMethod: isCodPaymentMethod(paymentMethod) ? 'COD' : 'Prepaid',
      source: 'settings',
      freeDeliveryApplied: amount > 0 && amount >= Number(settings.freeDeliveryThreshold ?? 499),
      error: null
    };
  }

  try {
    const [prepaidRate, codRate] = await Promise.all([
      fetchShiprocketRate({
        pickupPincode: pickup.pincode,
        deliveryPostcode,
        weight,
        cod: false
      }),
      fetchShiprocketRate({
        pickupPincode: pickup.pincode,
        deliveryPostcode,
        weight,
        cod: true
      })
    ]);

    const prepaidRaw = prepaidRate?.fee ?? 0;
    const codRaw = codRate?.fee ?? 0;
    const isCod = isCodPaymentMethod(paymentMethod);
    const selectedRaw = isCod ? codRaw : prepaidRaw;
    const { deliveryFee, freeDeliveryApplied } = applyFreeDelivery(amount, selectedRaw, settings);

    return {
      deliveryFee,
      prepaid: {
        fee: applyFreeDelivery(amount, prepaidRaw, settings).deliveryFee,
        rawFee: prepaidRaw,
        courier: prepaidRate?.courier || null,
        etd: prepaidRate?.etd || null,
        couriers: prepaidRate?.couriers || []
      },
      cod: {
        fee: applyFreeDelivery(amount, codRaw, settings).deliveryFee,
        rawFee: codRaw,
        courier: codRate?.courier || null,
        etd: codRate?.etd || null,
        couriers: codRate?.couriers || []
      },
      weightKg: weight,
      pincode: deliveryPostcode,
      pickupPincode: pickup.pincode,
      paymentMethod: isCod ? 'COD' : 'Prepaid',
      source: 'shiprocket',
      freeDeliveryApplied,
      error:
        !prepaidRate && !codRate
          ? 'No couriers available for this pincode'
          : isCod && !codRate
          ? 'No COD couriers available for this pincode'
          : !isCod && !prepaidRate
          ? 'No prepaid couriers available for this pincode'
          : null
    };
  } catch {
    // Live resilience: never block checkout if Shiprocket API is down
    const prepaidFee = resolveDeliveryFee({
      subtotal: amount,
      paymentMethod: 'UPI',
      settings
    });
    const codFee = resolveDeliveryFee({
      subtotal: amount,
      paymentMethod: 'COD',
      settings
    });
    const selectedFee = isCodPaymentMethod(paymentMethod) ? codFee : prepaidFee;
    return {
      deliveryFee: selectedFee,
      prepaid: { fee: prepaidFee, rawFee: prepaidFee, courier: null, etd: null, couriers: [] },
      cod: { fee: codFee, rawFee: codFee, courier: null, etd: null, couriers: [] },
      weightKg: weight,
      pincode: deliveryPostcode,
      pickupPincode: pickup.pincode || null,
      paymentMethod: isCodPaymentMethod(paymentMethod) ? 'COD' : 'Prepaid',
      source: 'settings',
      freeDeliveryApplied: amount > 0 && amount >= Number(settings.freeDeliveryThreshold ?? 499),
      error: null
    };
  }
}

/** Public quote payload for checkout UI */
export async function getShippingQuote(params = {}) {
  const quote = await resolveShiprocketDeliveryFee(params);
  const isCod = isCodPaymentMethod(params.paymentMethod);
  const selected = isCod ? quote.cod : quote.prepaid;

  return {
    pincode: quote.pincode,
    pickupPincode: quote.pickupPincode,
    subtotal: Number(params.subtotal) || 0,
    weightKg: quote.weightKg,
    paymentMethod: quote.paymentMethod,
    deliveryFee: quote.deliveryFee,
    freeDeliveryApplied: quote.freeDeliveryApplied,
    source: quote.source || 'shiprocket',
    selected: {
      fee: quote.deliveryFee,
      rawFee: selected?.rawFee ?? 0,
      courier: selected?.courier ?? null,
      etd: selected?.etd ?? null
    },
    prepaid: quote.prepaid,
    cod: quote.cod,
    error: quote.error
  };
}

export default { getShippingQuote, resolveShiprocketDeliveryFee, estimateWeightKgFromItems };
