/** Client-side mirror of backend checkout pricing (delivery by COD vs online). */

export function isCodPaymentMethod(paymentMethod) {
  const raw = String(paymentMethod || '').toUpperCase().trim();
  if (!raw) return true;
  if (raw === 'COD') return true;
  if (raw.includes('CASH') || raw.includes('DELIVERY') || raw.includes('DOORSTEP')) return true;
  return false;
}

export function resolveDeliveryFee({ subtotal, paymentMethod, settings = {} }) {
  const amount = Number(subtotal) || 0;
  const freeThreshold = Number(settings.freeDeliveryThreshold ?? 499);
  if (amount <= 0 || amount >= freeThreshold) return 0;

  const onlineFee = Number(settings.standardDeliveryFee ?? 40);
  const codFee =
    settings.codDeliveryFee != null && settings.codDeliveryFee !== ''
      ? Number(settings.codDeliveryFee)
      : onlineFee + 20;

  return isCodPaymentMethod(paymentMethod) ? codFee : onlineFee;
}

export function calculateCheckoutTotals({
  subtotal,
  discountAmount = 0,
  paymentMethod,
  settings = {},
  deliveryFee: deliveryFeeOverride = undefined
}) {
  const base = Math.max(0, Number(subtotal) || 0);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const taxableAmount = Math.max(0, base - discount);
  const gstRate = Number(settings.gstRate ?? 5) / 100;
  const deliveryFee =
    deliveryFeeOverride !== undefined
      ? Math.max(0, Number(deliveryFeeOverride) || 0)
      : resolveDeliveryFee({ subtotal: base, paymentMethod, settings });
  const tax = Math.round(taxableAmount * gstRate);
  const total = Math.max(0, taxableAmount + deliveryFee + tax);

  return { deliveryFee, tax, total, taxableAmount };
}

export function checkoutPaymentMethodKey(uiMethod) {
  if (uiMethod === 'cod') return 'COD';
  return 'UPI'; // online / prepaid
}

/** Rough cart weight for Shiprocket quote (kg). */
export function estimateCartWeightKg(cartItems = []) {
  const parseWeightToKg = (label) => {
    if (label == null || label === '') return null;
    const s = String(label).trim().toLowerCase().replace(/\s+/g, '');
    const m = s.match(/^([\d.]+)(kg|g|gm|grams?)?$/i);
    if (!m) return null;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) return null;
    const unit = (m[2] || 'g').toLowerCase();
    return unit.startsWith('kg') ? n : n / 1000;
  };

  let total = 0;
  for (const item of cartItems) {
    const perUnit = parseWeightToKg(item.weight) || 0.15;
    total += perUnit * (Number(item.qty) || 1);
  }
  return Math.max(0.2, Number(total.toFixed(3)));
}
