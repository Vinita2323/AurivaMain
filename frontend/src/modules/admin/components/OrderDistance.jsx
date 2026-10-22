import React, { useEffect, useState } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { adminOrderApi } from '../../../utils/api';

/**
 * Real store -> customer distance for an order (straight line, resolved from pincodes by the backend).
 * variant "chip" = compact pill (alerts); "row" = labelled line (order details).
 */
export default function OrderDistance({ orderId, variant = 'row' }) {
  const [state, setState] = useState({ status: 'loading', km: null, basis: '', message: '' });

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    setState({ status: 'loading', km: null, basis: '', message: '' });
    adminOrderApi
      .getDistance(orderId)
      .then((res) => {
        if (cancelled) return;
        const d = res?.data?.distance;
        if (d && Number.isFinite(d.km)) {
          setState({ status: 'ok', km: d.km, basis: d.basis, message: '' });
        } else {
          setState({ status: 'unavailable', km: null, basis: '', message: d?.message || 'Distance unavailable' });
        }
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'unavailable', km: null, basis: '', message: err.message || 'Distance unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const note = state.basis === 'city' ? 'approx. • city level' : 'approx. • straight line';

  if (variant === 'chip') {
    if (state.status === 'unavailable') return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 text-sky-800 font-medium border border-sky-100">
        {state.status === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
        {state.status === 'loading' ? 'Calculating distance…' : `About ${state.km} km from store`}
      </span>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D5] space-y-1 text-xs">
      <span className="text-stone-400 block text-[10px] font-bold uppercase">Distance from store</span>
      <div className="flex items-center gap-1.5 text-stone-700">
        {state.status === 'loading' && (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" /> Calculating…
          </>
        )}
        {state.status === 'ok' && (
          <>
            <Navigation className="w-3.5 h-3.5 text-sky-700" />
            <strong className="text-stone-900">About {state.km} km</strong>
            <span className="text-stone-400">({note})</span>
          </>
        )}
        {state.status === 'unavailable' && <span className="text-stone-400">{state.message}</span>}
      </div>
    </div>
  );
}
