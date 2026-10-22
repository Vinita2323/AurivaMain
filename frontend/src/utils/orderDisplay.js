/**
 * Single source of truth for how order dates / delivery estimates / status times are displayed.
 * Used by formatOrder() so the user app and the admin panel always show the SAME values.
 */

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // matches the backend's default delivery window

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "22 Oct 2026, 12:04 PM" in the viewer's local timezone */
export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/** "24 Oct 2026" */
export function formatDateOnly(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Expected delivery, derived from the order itself.
 * Returns { label, value } or null (cancelled orders have no delivery estimate).
 */
export function getExpectedDelivery({ status, rawTimeline, estimatedDelivery, createdAt, updatedAt }) {
  if (status === 'Cancelled') return null;

  if (status === 'Delivered') {
    const step = (rawTimeline || []).find((t) => t.status === 'Delivered' && t.timestamp);
    const when = formatDateTime(step?.timestamp || updatedAt);
    return { label: 'Delivered on', value: when || 'Delivered' };
  }

  const est = toDate(estimatedDelivery);
  if (est) return { label: 'Expected delivery', value: formatDateOnly(est) };

  const created = toDate(createdAt);
  if (created) return { label: 'Expected delivery', value: formatDateOnly(new Date(created.getTime() + TWO_DAYS_MS)) };

  return { label: 'Expected delivery', value: 'To be confirmed' };
}

const STEP_LABELS = ['Order Received', 'Accepted', 'Packed', 'Ready for Dispatch', 'Out for Delivery', 'Delivered'];

/**
 * Timeline steps with real, consistently formatted times.
 * Done steps show their recorded timestamp; the first step falls back to the order's creation time;
 * pending steps show no time (never a made-up one).
 */
export function buildTimeline({ status, rawTimeline, createdAt }) {
  const recorded = Array.isArray(rawTimeline) ? rawTimeline : [];
  const byLabel = new Map(recorded.map((t) => [t.status, t]));
  const currentIdx = STEP_LABELS.indexOf(status);

  const steps = STEP_LABELS.map((label, idx) => {
    const rec = byLabel.get(label);
    // A cancelled order was still received; later steps count only if they were actually reached
    const done = status === 'Cancelled' ? idx === 0 || Boolean(rec?.done) : currentIdx >= 0 ? idx <= currentIdx : Boolean(rec?.done);
    const current = status !== 'Cancelled' && idx === currentIdx;
    let when = '';
    if (done) {
      when = formatDateTime(rec?.timestamp) || (idx === 0 ? formatDateTime(createdAt) : '') || rec?.time || '';
    }
    return { status: label, done, current, time: when };
  });

  if (status === 'Cancelled') {
    const rec = byLabel.get('Cancelled');
    steps.push({
      status: 'Cancelled',
      done: true,
      current: true,
      time: formatDateTime(rec?.timestamp) || rec?.time || ''
    });
  }
  return steps;
}
