import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, X, MessageCircle, Send, Mail } from 'lucide-react';
import { APP_STORE_LINKS, APP_SHARE_TITLE, buildShareText } from '../../../utils/appLinks';

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * "Share App" — opens the phone's native share sheet when available (WhatsApp, Messages, etc.);
 * otherwise shows a window with both store links, Copy and WhatsApp.
 * `className` styles the trigger button; `children` is its label.
 */
export default function ShareAppButton({ className = '', children }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Always open our own window (WhatsApp / Telegram / Email / Copy). The device's native share sheet
  // is offered inside it as "More apps…" — on a computer that sheet only lists a few Windows apps.
  const handleShare = () => setOpen(true);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: APP_SHARE_TITLE, text: buildShareText() });
    } catch {
      /* user closed the sheet or it is unavailable — nothing to do */
    }
  };
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async (key, value) => {
    if (await copyText(value)) {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const rows = [
    { key: 'android', label: 'Google Play', url: APP_STORE_LINKS.android }
  ];

  return (
    <>
      <button type="button" onClick={handleShare} className={className}>
        {children || (
          <>
            <Share2 className="w-4 h-4" />
            <span>Share App</span>
          </>
        )}
      </button>

      {open && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#0E2A1B]" /> Share the AURIVÁ app
              </h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {rows.map((r) => (
                <div key={r.key} className="rounded-xl border border-stone-200 bg-[#FAF7F2] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">{r.label}</p>
                  <p className="mt-1 text-[11px] text-stone-500 break-all">{r.url}</p>
                  <button
                    type="button"
                    onClick={() => copy(r.key, r.url)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#0E2A1B] hover:text-[#C89038]"
                  >
                    {copied === r.key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === r.key ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(buildShareText())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 inline-flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(APP_STORE_LINKS.android)}&text=${encodeURIComponent(buildShareText())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-sky-700 inline-flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Telegram
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(APP_SHARE_TITLE)}&body=${encodeURIComponent(buildShareText())}`}
                  className="py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
                <button
                  type="button"
                  onClick={() => copy('all', buildShareText())}
                  className="py-2.5 rounded-xl border border-stone-300 text-stone-800 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 inline-flex items-center justify-center gap-1.5"
                >
                  {copied === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'all' ? 'Copied' : 'Copy message'}
                </button>
              </div>

              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 rounded-xl border border-[#0E2A1B]/30 text-[#0E2A1B] text-xs font-bold uppercase tracking-wider hover:bg-[#FAF7F2] inline-flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> More apps…
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
