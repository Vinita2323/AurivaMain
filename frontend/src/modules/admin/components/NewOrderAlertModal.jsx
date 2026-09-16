import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, CheckCircle, XCircle, MapPin, User, Phone,
  CreditCard, Package, Clock, X, Bell, ChevronRight
} from 'lucide-react';

/**
 * NewOrderAlertModal
 * 
 * Displayed when a new incoming order is detected via polling.
 * Admin can Accept (→ PACKED) or Reject (cancel with reason) from here.
 *
 * Props:
 *   order          - Formatted order object
 *   onAccept(id)   - Callback to accept the order (move to PACKED)
 *   onReject(id)   - Callback to reject/cancel the order
 *   onClose()      - Dismiss without action
 *   pendingCount   - How many new orders are waiting (badge)
 */
export default function NewOrderAlertModal({ order, onAccept, onReject, onClose, pendingCount = 1 }) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [elapsed, setElapsed] = useState('Just now');

  // Elapsed time counter
  useEffect(() => {
    if (!order?.createdAt && !order?.time) return;
    const base = order.createdAt ? new Date(order.createdAt) : new Date();

    const updateElapsed = () => {
      const sec = Math.floor((Date.now() - base.getTime()) / 1000);
      if (sec < 60) setElapsed(`${sec}s ago`);
      else if (sec < 3600) setElapsed(`${Math.floor(sec / 60)}m ago`);
      else setElapsed(`${Math.floor(sec / 3600)}h ago`);
    };
    updateElapsed();
    const iv = setInterval(updateElapsed, 10000);
    return () => clearInterval(iv);
  }, [order]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!order) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(order.id || order._id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectConfirm = async () => {
    const reason = rejectReason.trim() || 'Rejected by admin';
    setIsRejecting(true);
    try {
      await onReject(order.id || order._id, reason);
    } finally {
      setIsRejecting(false);
    }
  };

  const payBadge = order.paymentMethod === 'COD'
    ? { label: 'Cash on Delivery', cls: 'bg-amber-100 text-amber-800 border-amber-300' }
    : { label: order.paymentMethod || 'Online', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 font-sans"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
    >
      {/* Glow pulse ring behind card */}
      <div className="absolute w-[420px] h-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none animate-pulse" />

      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-[#D4AF37]/30">

        {/* TOP ALERT BANNER */}
        <div className="bg-gradient-to-r from-[#0E2A1B] to-[#1B3B29] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Pulsing bell icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#D4AF37]/30 animate-ping" />
              <div className="relative w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                New Order Received
              </p>
              <h2 className="text-white font-bold text-base leading-tight">
                #{order.id || order.orderNumber}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 1 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                +{pendingCount - 1} more
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-stone-400 font-medium">
              <Clock className="w-3 h-3" />
              {elapsed}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ORDER BODY */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[55vh]" data-lenis-prevent>

          {/* Customer Row */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <div className="w-9 h-9 rounded-full bg-[#0E2A1B]/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#0E2A1B]" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-stone-900 truncate">{order.customer}</p>
              <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {order.phone || 'N/A'}
              </p>
              {order.address && (
                <p className="text-[11px] text-stone-400 flex items-start gap-1 mt-0.5 leading-snug">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="truncate">
                    {order.address.street}{order.address.city ? `, ${order.address.city}` : ''}
                    {order.address.state ? `, ${order.address.state}` : ''}
                    {order.address.pincode ? ` - ${order.address.pincode}` : ''}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Package className="w-3 h-3" /> Ordered Items
            </h4>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white">
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={it.name}
                      className="w-9 h-9 rounded-lg object-cover border border-stone-100 bg-stone-50 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#0E2A1B]/5 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-[#0E2A1B]/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-900 truncate">{it.name}</p>
                    <p className="text-[11px] text-stone-400 font-normal">{it.weight || '150g'} &middot; Qty {it.qty || 1}</p>
                  </div>
                  <span className="text-xs font-bold text-stone-700 shrink-0">
                    Rs.{(it.price || 0) * (it.qty || 1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Row */}
          <div className="flex items-center justify-between gap-3">
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${payBadge.cls}`}>
              <CreditCard className="w-3 h-3" />
              {payBadge.label}
            </span>
            <div className="text-right">
              <p className="text-[10px] text-stone-400 font-medium uppercase">Total</p>
              <p className="text-lg font-extrabold text-[#0E2A1B] leading-tight">Rs.{order.total}</p>
            </div>
          </div>

          {/* Reject Reason (shown inline) */}
          {showRejectInput && (
            <div className="space-y-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 animate-in fade-in duration-150">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">Rejection Reason</p>
              <textarea
                autoFocus
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Out of stock, delivery unavailable in area..."
                className="w-full text-xs rounded-lg border border-rose-300 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none text-stone-800 placeholder:text-stone-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRejectConfirm}
                  disabled={isRejecting}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isRejecting ? (
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : <XCircle className="w-3.5 h-3.5" />}
                  {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
                <button
                  onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                  className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {!showRejectInput && (
          <div className="px-5 py-4 border-t border-stone-100 bg-[#FAF7F2] flex gap-3">
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={isAccepting || isRejecting}
              className="flex-1 py-2.5 rounded-xl border-2 border-rose-300 bg-white text-rose-600 text-sm font-bold uppercase tracking-wide hover:bg-rose-50 hover:border-rose-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject Order
            </button>

            <button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#0E2A1B] to-[#1B3B29] text-[#D4AF37] text-sm font-bold uppercase tracking-wide hover:from-[#163820] hover:to-[#234831] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isAccepting ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : <CheckCircle className="w-4 h-4" />}
              {isAccepting ? 'Accepting...' : 'Accept Order'}
            </button>
          </div>
        )}

        {/* View-in-orders hint */}
        <div className="px-5 py-2 border-t border-stone-100 bg-stone-50 flex items-center justify-center">
          <a
            href="/admin/orders"
            className="text-[11px] text-stone-400 hover:text-[#0E2A1B] flex items-center gap-1 font-medium transition-colors"
          >
            Open full Orders panel
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
