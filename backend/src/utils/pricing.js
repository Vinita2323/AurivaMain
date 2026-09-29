/**
 * Shared checkout pricing helpers (delivery fee by payment type).
 */

export function isCodPaymentMethod(paymentMethod) {
  const raw = String(paymentMethod || '').toUpperCase().trim();
  if (!raw) return true;
  if (raw === 'COD') return true;
  if (raw.includes('CASH') || raw.includes('DELIVERY') || raw.includes('DOORSTEP')) return true;
  return false;
}

/**
 * Resolve shipping/delivery fee for subtotal + payment method.
 * Free when subtotal >= freeDeliveryThreshold.
 */
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

export function calculateOrderTotals({
  subtotal,
  discount = 0,
  paymentMethod,
  settings = {},
  deliveryFee: deliveryFeeOverride = undefined
}) {
  const base = Math.max(0, Number(subtotal) || 0);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxableAmount = Math.max(0, base - discountAmount);
  const gstRate = Number(settings.gstRate ?? 5);
  const deliveryFee =
    deliveryFeeOverride !== undefined
      ? Math.max(0, Number(deliveryFeeOverride) || 0)
      : resolveDeliveryFee({ subtotal: base, paymentMethod, settings });
  const tax = Math.round((taxableAmount * gstRate) / 100);
  const total = Math.max(0, taxableAmount + deliveryFee + tax);

  return { subtotal: base, discount: discountAmount, taxableAmount, deliveryFee, tax, total, gstRate };
}

export default {
  isCodPaymentMethod,
  resolveDeliveryFee,
  calculateOrderTotals
};
