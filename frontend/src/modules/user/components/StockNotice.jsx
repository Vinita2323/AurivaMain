import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

/** Small red toast shown when a cart action is limited by available stock. */
export default function StockNotice() {
  const { stockNotice, hideStockNotice } = useCart();
  if (!stockNotice) return null;

  return (
    <div
      role="alert"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] w-[calc(100vw-32px)] max-w-sm"
    >
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-amber-900 shadow-lg">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <p className="flex-1 text-xs font-semibold leading-snug">{stockNotice.message}</p>
        <button onClick={hideStockNotice} aria-label="Dismiss" className="text-amber-700 hover:text-amber-900">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
