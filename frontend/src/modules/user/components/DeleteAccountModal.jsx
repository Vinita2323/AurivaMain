import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

/**
 * Confirmation dialog for permanently deleting the customer's account.
 * The user must type DELETE before the button is enabled.
 */
export default function DeleteAccountModal({ isOpen, onClose, onConfirm }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTyped('');
      setError('');
      setBusy(false);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  const canDelete = typed.trim().toUpperCase() === 'DELETE' && !busy;

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err?.message || 'Could not delete your account. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-base text-stone-900">Delete your account?</h3>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Close" className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 text-xs text-stone-600 leading-relaxed">
          <p>This permanently removes your personal data and cannot be undone.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Deleted:</strong> your profile, saved addresses, cart, wishlist and notifications.</li>
            <li><strong>Kept:</strong> past orders and invoices (needed for accounting and returns), without your profile link.</li>
            <li>You will be signed out. You can sign up again later with the same number.</li>
          </ul>

          <label className="block pt-1 text-[11px] font-bold uppercase tracking-wider text-stone-700">
            Type DELETE to confirm
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              placeholder="DELETE"
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-semibold tracking-widest focus:outline-none focus:border-rose-500"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800 font-semibold">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2.5 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {busy ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  );
}
