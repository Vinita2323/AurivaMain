/**
 * Order status lifecycle for the admin UI — mirrors the backend ALLOWED_TRANSITIONS matrix
 * (backend/src/services/orderService.js) so admins are only offered valid next steps and
 * can never try to move an order back to an earlier status.
 */

export const STATUS_LABEL_TO_RAW = {
  'Order Received': 'CONFIRMED',
  Accepted: 'ACCEPTED',
  Packed: 'PACKED',
  'Ready for Dispatch': 'SHIPPED',
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  Delivered: 'DELIVERED',
  Cancelled: 'CANCELLED'
};

const RAW_TO_LABEL = {
  PENDING: 'Order Received',
  CONFIRMED: 'Order Received',
  ACCEPTED: 'Accepted',
  PROCESSING: 'Accepted',
  PACKED: 'Packed',
  SHIPPED: 'Ready for Dispatch',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

const ALLOWED_NEXT_RAW = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACCEPTED', 'PACKED', 'CANCELLED'],
  ACCEPTED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  PROCESSING: ['ACCEPTED', 'PACKED', 'SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

const toRaw = (order) => {
  const raw = String(order?.rawStatus || '').toUpperCase().replace(/\s+/g, '_');
  if (raw && ALLOWED_NEXT_RAW[raw]) return raw;
  return STATUS_LABEL_TO_RAW[order?.status] || 'CONFIRMED';
};

/** Display labels the order may move to next (excludes the current status). */
export function getNextStatusLabels(order) {
  const next = ALLOWED_NEXT_RAW[toRaw(order)] || [];
  const labels = [];
  next.forEach((raw) => {
    const label = RAW_TO_LABEL[raw];
    if (label && label !== order?.status && !labels.includes(label)) labels.push(label);
  });
  return labels;
}

/** Dropdown options: the current status (so the select shows it) followed by valid next steps. */
export function getStatusOptions(order) {
  return [order?.status || 'Order Received', ...getNextStatusLabels(order)];
}

/** True when no further status change is possible. */
export function isTerminalStatus(order) {
  return getNextStatusLabels(order).length === 0;
}

/** Turn the server's technical transition error into a plain message for admins. */
export function friendlyStatusError(message, order, targetLabel) {
  if (/invalid order status transition/i.test(String(message || ''))) {
    const next = getNextStatusLabels(order);
    const current = order?.status || 'its current status';
    return next.length
      ? `This order is already "${current}". You can't move it back to "${targetLabel}". Next allowed: ${next.join(', ')}.`
      : `This order is "${current}" and can't be changed any further.`;
  }
  return message || 'Could not update the order status.';
}
