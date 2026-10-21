import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Shows why an order was cancelled / rejected (set by the admin or the customer).
 * Renders nothing for orders that are not cancelled.
 */
export default function CancellationNotice({ order, compact = false }) {
  if (!order || order.status !== 'Cancelled') return null;

  const byAdmin = String(order.cancelledBy || '').toUpperCase() === 'ADMIN';
  const title = byAdmin ? 'Order rejected by the store' : 'Order cancelled';
  const reason = order.cancelReason || (byAdmin ? 'No reason was provided by the store.' : 'No reason provided.');
  const when = order.cancelledAt
    ? new Date(order.cancelledAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 ${compact ? 'p-2.5' : 'p-3 sm:p-4'}`}
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
      <div className="min-w-0">
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[11px] sm:text-xs mt-0.5 break-words">
          <span className="font-semibold">Reason:</span> {reason}
        </p>
        {when && <p className="text-[10px] text-rose-700/80 mt-0.5">{when}</p>}
      </div>
    </div>
  );
}
