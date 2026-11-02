import React, { useCallback, useEffect, useState } from 'react';
import { Wallet, Plus, Minus, Loader2 } from 'lucide-react';
import { adminWalletApi } from '../../../utils/api';
import { formatDateTime } from '../../../utils/orderDisplay';

const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** Wallet section of the admin customer drawer: live balance, recent history, add / deduct credit. */
export default function AdminCustomerWallet({ customerId }) {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState('CREDIT');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { ok, text }

  const load = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await adminWalletApi.get(customerId, { limit: 8 });
      setBalance(Number(res?.data?.balance) || 0);
      setTransactions(res?.data?.transactions || []);
    } catch (err) {
      setMessage({ ok: false, text: err?.message || 'Could not load wallet.' });
    }
  }, [customerId]);

  useEffect(() => {
    setBalance(null);
    setTransactions([]);
    setMessage(null);
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage({ ok: false, text: 'Enter an amount greater than 0.' });
      return;
    }
    if (note.trim().length < 3) {
      setMessage({ ok: false, text: 'Add a short note explaining this change.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await adminWalletApi.adjust(customerId, { type, amount: value, note: note.trim() });
      setBalance(Number(res?.data?.balance) || 0);
      setAmount('');
      setNote('');
      setMessage({ ok: true, text: type === 'CREDIT' ? `₹${value} added.` : `₹${value} deducted.` });
      load();
    } catch (err) {
      setMessage({ ok: false, text: err?.message || 'Could not update the wallet.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-sans text-sm sm:text-base font-bold text-[#0E2A1B] flex items-center gap-2">
        <Wallet className="w-4 h-4 text-[#D4AF37]" /> Wallet
        <span className="ml-auto text-base font-extrabold text-[#0E2A1B]">{balance === null ? '—' : inr(balance)}</span>
      </h4>

      <form onSubmit={submit} className="rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] p-3 space-y-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('CREDIT')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              type === 'CREDIT' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-stone-300 text-stone-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Add credit
          </button>
          <button
            type="button"
            onClick={() => setType('DEBIT')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              type === 'DEBIT' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-stone-300 text-stone-700'
            }`}
          >
            <Minus className="w-3.5 h-3.5" /> Deduct
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount ₹"
            className="col-span-1 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
          />
          <input
            type="text"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (shown to the customer)"
            className="col-span-2 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#1B3B29] disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {type === 'CREDIT' ? 'Add to wallet' : 'Deduct from wallet'}
        </button>
        {message && (
          <p role="status" className={`text-[11px] font-semibold ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
            {message.text}
          </p>
        )}
      </form>

      {transactions.length > 0 && (
        <ul className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-stone-800 truncate">{t.reason || t.source}</p>
                <p className="text-[10.5px] text-stone-400">
                  {formatDateTime(t.createdAt)}
                  {t.orderNumber ? ` · #${t.orderNumber}` : ''}
                </p>
              </div>
              <span className={`font-bold shrink-0 ${t.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {t.type === 'CREDIT' ? '+' : '−'}
                {inr(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
