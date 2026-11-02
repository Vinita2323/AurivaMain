import React from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import useWallet from '../../../hooks/useWallet';
import { formatDateTime } from '../../../utils/orderDisplay';

const SOURCE_LABEL = {
  ADMIN_CREDIT: 'Credit added by store',
  ADMIN_DEBIT: 'Deducted by store',
  ORDER_PAYMENT: 'Used for an order',
  ORDER_REFUND: 'Order refund'
};

const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** "My Wallet" tab: live balance + full transaction history. */
export default function WalletPanel() {
  const { balance, transactions, pagination, loading, loadingMore, error, updatedAt, hasMore, refresh, loadMore } =
    useWallet({ enabled: true, intervalMs: 15000, limit: 15 });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Balance card */}
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 bg-gradient-to-tr from-[#0E2A1B] to-[#1B3B29] text-white shadow-lg border border-[#D4AF37]/30">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            <Wallet className="w-4 h-4" /> AURIVÁ Wallet
          </span>
          <button
            type="button"
            onClick={() => refresh()}
            className="p-1.5 rounded-lg text-[#A2B5A8] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Refresh wallet"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="mt-3 text-[11px] text-[#A2B5A8]">Available balance</p>
        <p className="font-sans text-3xl sm:text-5xl font-extrabold tracking-tight">
          {balance === null ? '—' : inr(balance)}
        </p>

        <p className="mt-3 text-[11px] text-[#A2B5A8] flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
        </p>
        <p className="mt-2 text-[11px] text-[#A2B5A8] leading-relaxed">
          Use your balance at checkout on Cash on Delivery orders. Refunds for cancelled orders paid with your wallet
          come back here automatically.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E2D5] overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-[#0E2A1B]">Transaction history</h3>
          <span className="text-[11px] text-stone-400">{pagination.total || 0} total</span>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-stone-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your wallet…
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-10 px-6 text-center text-xs text-stone-500">
            No wallet activity yet. Credits from the store and refunds will appear here.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {transactions.map((t) => {
              const credit = t.type === 'CREDIT';
              return (
                <li key={t.id} className="flex items-start gap-3 px-4 sm:px-6 py-3.5">
                  <span
                    className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      credit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {credit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-stone-900">{SOURCE_LABEL[t.source] || (credit ? 'Credit' : 'Debit')}</p>
                    {t.reason && <p className="text-[11px] text-stone-500 break-words">{t.reason}</p>}
                    <p className="text-[10.5px] text-stone-400 mt-0.5">
                      {formatDateTime(t.createdAt)}
                      {t.orderNumber ? ` · Order #${t.orderNumber}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs sm:text-sm font-bold ${credit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {credit ? '+' : '−'}
                      {inr(t.amount)}
                    </p>
                    <p className="text-[10.5px] text-stone-400">Bal {inr(t.balanceAfter)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore && (
          <div className="px-4 sm:px-6 py-3 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs font-bold text-[#0E2A1B] hover:text-[#C89038] disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
