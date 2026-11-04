import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, CreditCard, Loader2, RefreshCw, RotateCcw, Search, ShieldCheck, X, XCircle
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AdminPagination from '../components/AdminPagination';
import { adminPaymentApi } from '../../../utils/api';

const PAGE_SIZE = 20;

const VIEWS = [
  { key: 'all', label: 'All payments' },
  { key: 'needs_reconciliation', label: 'Needs reconciliation' },
  { key: 'reconciled', label: 'Successfully reconciled' },
  { key: 'failed', label: 'Failed payments' },
  { key: 'refund_required', label: 'Refund required' }
];

const EMPTY_TEXT = {
  all: 'No payments yet.',
  needs_reconciliation: 'Nothing needs reconciliation. 🎉',
  reconciled: 'No payments have been reconciled yet.',
  failed: 'No failed payments.',
  refund_required: 'No refunds are waiting for a retry.'
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const shortId = (id) => (id ? `…${String(id).slice(-8)}` : '—');

const STATUS_STYLE = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  REFUND_PENDING: 'bg-sky-50 text-sky-700 border-sky-200',
  PARTIALLY_REFUNDED: 'bg-violet-50 text-violet-700 border-violet-200',
  REFUNDED: 'bg-stone-100 text-stone-700 border-stone-300'
};

const RECON_STYLE = {
  OPEN: 'bg-rose-50 text-rose-700 border-rose-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NONE: 'bg-stone-50 text-stone-400 border-stone-200'
};
const RECON_LABEL = { OPEN: 'Needs reconciliation', RESOLVED: 'Reconciled', NONE: 'Not flagged' };

function Badge({ className = '', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

function Field({ label, children, mono }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">{label}</dt>
      <dd className={`text-sm text-stone-800 break-all ${mono ? 'font-mono text-xs' : ''}`}>{children || '—'}</dd>
    </div>
  );
}

function DetailModal({ paymentId, onClose, onChanged }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [confirmRetry, setConfirmRetry] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminPaymentApi.getPaymentById(paymentId);
      setPayment(res?.data?.payment || null);
    } catch (err) {
      setError(err?.message || 'Could not load this payment.');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReconcile = async () => {
    if (busy) return;
    setBusy('reconcile');
    setError('');
    setNotice('');
    try {
      const res = await adminPaymentApi.reconcilePayment(paymentId, note.trim());
      setPayment(res?.data?.payment || payment);
      setNote('');
      setNotice('Marked as reconciled.');
      onChanged();
    } catch (err) {
      setError(err?.message || 'Could not mark as reconciled.');
    } finally {
      setBusy('');
    }
  };

  const handleRetry = async () => {
    if (busy) return;
    setBusy('retry');
    setError('');
    setNotice('');
    try {
      const res = await adminPaymentApi.retryRefund(paymentId);
      setPayment(res?.data?.payment || payment);
      setConfirmRetry(false);
      setNotice(res?.message || 'Refund retry submitted. The status updates when Razorpay confirms it.');
      onChanged();
    } catch (err) {
      setError(err?.message || 'Could not retry the refund.');
      setConfirmRetry(false);
      load();
      onChanged();
    } finally {
      setBusy('');
    }
  };

  const rec = payment?.reconciliation;
  const rr = payment?.refundRetry;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-3 sm:p-6" data-lenis-prevent>
      <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-xl w-full max-w-3xl my-4">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-5 h-5 text-[#0E2A1B] shrink-0" />
            <h2 className="font-semibold text-[#0E2A1B] truncate">Payment {payment ? shortId(payment._id) : ''}</h2>
            {payment && <Badge className={STATUS_STYLE[payment.status] || STATUS_STYLE.PENDING}>{payment.status}</Badge>}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {loading && !payment && (
            <div className="flex items-center gap-2 text-stone-500 text-sm py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading payment…
            </div>
          )}
          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}
          {notice && (
            <div role="status" className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{notice}</span>
            </div>
          )}

          {payment && (
            <>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Payment ID" mono>{String(payment._id)}</Field>
                <Field label="Razorpay payment ID" mono>{payment.razorpayPaymentId}</Field>
                <Field label="Razorpay order ID" mono>{payment.gatewayOrderId}</Field>
                <Field label="Amount paid">{money(payment.amount)} ({payment.currency || 'INR'})</Field>
                <Field label="Customer">
                  {payment.user ? `${payment.user.name || 'Customer'} · ${payment.user.phone || ''}` : ''}
                </Field>
                <Field label="Order">
                  {payment.order ? `#${payment.order.orderNumber || ''} · ${payment.order.status || ''}` : 'No order created'}
                </Field>
                <Field label="Method">{payment.paymentMethod}</Field>
                <Field label="Created">{when(payment.createdAt)}</Field>
                <Field label="Refunded">
                  {money(payment.refundedAmount)}
                  {payment.refundPendingAmount > 0 ? ` (+ ${money(payment.refundPendingAmount)} in progress)` : ''}
                </Field>
                <Field label="Failure reason">{payment.failureReason}</Field>
              </dl>

              {/* Reconciliation */}
              <section className="rounded-xl border border-stone-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-[#0E2A1B] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Reconciliation
                  </h3>
                  <Badge className={RECON_STYLE[rec?.status || 'NONE']}>{RECON_LABEL[rec?.status || 'NONE']}</Badge>
                </div>
                {rec?.reason && <p className="text-sm text-stone-700">{rec.reason}</p>}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {rec?.openedAt && <Field label="Flagged on">{when(rec.openedAt)}</Field>}
                  {rec?.reconciledAt && <Field label="Reconciled on">{when(rec.reconciledAt)}</Field>}
                  {rec?.reconciledBy && <Field label="Reconciled by" mono>{rec.reconciledBy}</Field>}
                  {rec?.note && <Field label="Resolution note">{rec.note}</Field>}
                </dl>

                {rec?.needsReconciliation && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-medium text-stone-600" htmlFor="reconcile-note">
                      How was this resolved? (required — recorded in the audit trail)
                    </label>
                    <textarea
                      id="reconcile-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={500}
                      rows={2}
                      placeholder="e.g. Refunded ₹100 from the Razorpay dashboard on 3 Nov"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                    />
                    <button
                      type="button"
                      onClick={handleReconcile}
                      disabled={busy !== '' || note.trim().length < 5}
                      className="px-4 py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {busy === 'reconcile' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Mark as reconciled
                    </button>
                    <p className="text-[11px] text-stone-400">
                      This only closes the item. It does not refund anything or change the payment status.
                    </p>
                  </div>
                )}
              </section>

              {/* Refund retry */}
              {(rr?.required || rr?.inProgress) && (
                <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-3">
                  <h3 className="font-semibold text-sm text-[#0E2A1B] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Refund {rr.required ? 'required' : 'in progress'}
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    <Field label="Refund amount">{money(rr.retryAmount)}</Field>
                    <Field label="Still refundable">{money(rr.remainingRefundable)}</Field>
                    <Field label="Failure reason">{rr.failureReason}</Field>
                    <Field label="Needed since">{when(rr.requiredAt)}</Field>
                    {rr.lastRetriedAt && <Field label="Last retried">{`${when(rr.lastRetriedAt)} by ${rr.lastRetriedBy || ''}`}</Field>}
                  </dl>

                  {rr.inProgress && (
                    <p className="text-sm text-sky-700">
                      A refund is already being processed by Razorpay. This page updates once Razorpay confirms it.
                    </p>
                  )}

                  {rr.canRetry && !confirmRetry && (
                    <button
                      type="button"
                      onClick={() => setConfirmRetry(true)}
                      disabled={busy !== ''}
                      className="px-4 py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider disabled:opacity-40 flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retry refund
                    </button>
                  )}
                  {rr.canRetry && confirmRetry && (
                    <div className="rounded-lg border border-stone-300 bg-white p-3 space-y-2">
                      <p className="text-sm text-stone-800">
                        Send a refund of <strong>{money(rr.retryAmount)}</strong> to the customer through Razorpay?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleRetry}
                          disabled={busy !== ''}
                          className="px-4 py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider disabled:opacity-40 flex items-center gap-2"
                        >
                          {busy === 'retry' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Yes, retry refund
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRetry(false)}
                          disabled={busy !== ''}
                          className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Refund history */}
              {payment.refunds?.length > 0 && (
                <section className="space-y-2">
                  <h3 className="font-semibold text-sm text-[#0E2A1B]">Refunds</h3>
                  <div className="overflow-x-auto border border-stone-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider">
                        <tr>
                          <th className="text-left p-2">Razorpay refund</th>
                          <th className="text-right p-2">Amount</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Reason / failure</th>
                          <th className="text-left p-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payment.refunds.map((r) => (
                          <tr key={r._id || r.requestKey} className="border-t border-stone-100">
                            <td className="p-2 font-mono break-all">{r.refundId || '—'}</td>
                            <td className="p-2 text-right">{money(r.amount)}</td>
                            <td className="p-2"><Badge className={STATUS_STYLE[r.status === 'PROCESSED' ? 'PAID' : r.status] || STATUS_STYLE.PENDING}>{r.status}</Badge></td>
                            <td className="p-2">{r.failureReason || r.reason || '—'}</td>
                            <td className="p-2 whitespace-nowrap">{when(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Audit trail */}
              {payment.auditTrail?.length > 0 && (
                <section className="space-y-2">
                  <h3 className="font-semibold text-sm text-[#0E2A1B]">Audit trail</h3>
                  <ol className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {[...payment.auditTrail].reverse().map((a, i) => (
                      <li key={i} className="text-xs text-stone-600 flex flex-wrap gap-x-2">
                        <span className="text-stone-400 whitespace-nowrap">{when(a.at)}</span>
                        <span className="font-semibold text-stone-800">{a.action}</span>
                        <span className="font-mono">{a.actor}</span>
                        {a.meta?.note && <span>— {a.meta.note}</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPayments() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ payments: [], pagination: { totalItems: 0, totalPages: 1 }, stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [view, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminPaymentApi.getPayments({ view, search, page, limit: PAGE_SIZE });
      setData(res?.data || { payments: [], pagination: { totalItems: 0, totalPages: 1 }, stats: {} });
    } catch (err) {
      setError(err?.message || 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }, [view, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const { payments, pagination, stats } = data;
  const totalItems = pagination?.totalItems || 0;
  const pager = useMemo(
    () => ({
      page,
      setPage,
      totalItems,
      totalPages: Math.max(1, pagination?.totalPages || 1),
      from: totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
      to: Math.min(page * PAGE_SIZE, totalItems)
    }),
    [page, totalItems, pagination?.totalPages]
  );

  const kpis = [
    { key: 'needs_reconciliation', label: 'Needs reconciliation', value: stats.needsReconciliationCount, tone: 'text-rose-700' },
    { key: 'refund_required', label: 'Refund required', value: stats.refundRequiredCount, tone: 'text-amber-700' },
    { key: 'failed', label: 'Failed payments', value: stats.failedCount, tone: 'text-stone-700' },
    { key: 'reconciled', label: 'Reconciled', value: stats.reconciledCount, tone: 'text-emerald-700' }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Payments & Reconciliation" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setView(k.key)}
                className={`text-left bg-white rounded-xl p-3.5 border shadow-2xs transition-colors ${view === k.key ? 'border-[#0E2A1B]' : 'border-[#E8E2D5] hover:border-stone-400'}`}
              >
                <div className="text-[11px] uppercase tracking-wider font-medium text-stone-500">{k.label}</div>
                <div className={`text-2xl font-semibold ${k.tone}`}>{k.value ?? 0}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Payment views">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  role="tab"
                  aria-selected={view === v.key}
                  onClick={() => setView(v.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    view === v.key ? 'bg-[#0E2A1B] text-[#D4AF37] border-[#0E2A1B]' : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search Razorpay payment / order ID"
                  className="pl-9 pr-3 py-2 w-64 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <button
                type="button"
                onClick={load}
                aria-label="Refresh"
                className="p-2 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E8E2D5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="text-left p-3">Payment ID</th>
                    <th className="text-left p-3">Razorpay payment ID</th>
                    <th className="text-left p-3">Razorpay order ID</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-right p-3">Paid amount</th>
                    <th className="text-left p-3">Payment status</th>
                    <th className="text-left p-3 min-w-[220px]">Reconciliation reason</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Reconciliation</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading && payments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-stone-500">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading payments…
                      </td>
                    </tr>
                  )}
                  {!loading && payments.length === 0 && !error && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-stone-500">{EMPTY_TEXT[view]}</td>
                    </tr>
                  )}
                  {payments.map((p) => (
                    <tr key={p._id} className="border-t border-stone-100 hover:bg-[#FAF7F2]/60 align-top">
                      <td className="p-3 font-mono text-xs" title={String(p._id)}>{shortId(p._id)}</td>
                      <td className="p-3 font-mono text-xs break-all max-w-[170px]">{p.razorpayPaymentId || '—'}</td>
                      <td className="p-3 font-mono text-xs break-all max-w-[170px]">{p.gatewayOrderId || '—'}</td>
                      <td className="p-3">
                        <div className="font-medium text-stone-800">{p.user?.name || '—'}</div>
                        <div className="text-xs text-stone-500">{p.user?.phone || ''}</div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap font-medium">{money(p.amount)}</td>
                      <td className="p-3"><Badge className={STATUS_STYLE[p.status] || STATUS_STYLE.PENDING}>{p.status}</Badge></td>
                      <td className="p-3 text-xs text-stone-700">
                        {p.reconciliation?.reason || '—'}
                        {p.refundRetry?.required && (
                          <div className="mt-1 text-amber-700">
                            Refund failed: {p.refundRetry.failureReason || 'no reason recorded'}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-xs whitespace-nowrap">{when(p.createdAt)}</td>
                      <td className="p-3">
                        <Badge className={RECON_STYLE[p.reconciliation?.status || 'NONE']}>
                          {RECON_LABEL[p.reconciliation?.status || 'NONE']}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(p._id)}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-[#0E2A1B] hover:bg-stone-50 whitespace-nowrap"
                        >
                          {p.refundRetry?.required || p.reconciliation?.needsReconciliation ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination pagination={pager} label="payments" />
          </div>
        </main>
      </div>

      {selectedId && (
        <DetailModal paymentId={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />
      )}
    </div>
  );
}
