import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Banknote, CheckCircle2, Eye, Loader2, RefreshCw, Search, ShieldCheck, X, XCircle
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AdminPagination from '../components/AdminPagination';
import { adminCodApi } from '../../../utils/api';

const PAGE_SIZE = 15;

const CODE_FILTERS = [
  { key: 'all', label: 'All customers' },
  { key: 'enabled', label: 'COD enabled' },
  { key: 'disabled', label: 'COD disabled' }
];
const HISTORY_FILTERS = [
  { key: 'all', label: 'Any order history' },
  { key: 'delivered', label: 'Has successful deliveries' },
  { key: 'high_cancellation', label: 'High cancellations / refusals' },
  { key: 'eligible', label: 'Eligible for review' }
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—');

function Badge({ className = '', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

function StatusBadges({ customer }) {
  return (
    <div className="flex flex-col items-start gap-1">
      {customer.codAccess.isEnabled ? (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">COD Enabled</Badge>
      ) : (
        <Badge className="bg-stone-100 text-stone-700 border-stone-300">COD Disabled</Badge>
      )}
      {customer.eligibleForReview && (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200" >Eligible for Review</Badge>
      )}
    </div>
  );
}

const ORDER_STATUS_STYLE = {
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200'
};

/** Confirmation dialog — always asks for the internal reason before a permission changes. */
function ConfirmDialog({ customer, enable, busy, error, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 3;
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="cod-confirm-title">
      <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${enable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
            {enable ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h2 id="cod-confirm-title" className="font-semibold text-[#0E2A1B]">
              {enable ? 'Enable' : 'Disable'} Cash on Delivery?
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {enable
                ? <>This customer (<strong>{customer.name || customer.phone}</strong>) will be able to choose Cash on Delivery at checkout.</>
                : <>This customer (<strong>{customer.name || customer.phone}</strong>) will no longer be able to place Cash on Delivery orders. Orders already placed are not affected.</>}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cod-reason" className="block text-xs font-medium text-stone-600">
            Internal reason (required — saved in the audit log, never shown to the customer)
          </label>
          <textarea
            id="cod-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            autoFocus
            placeholder={enable ? 'e.g. 6 delivered orders, no cancellations' : 'e.g. Refused delivery twice'}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
          />
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={busy || !valid}
            className="px-4 py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {enable ? 'Yes, enable COD' : 'Yes, disable COD'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-[#FAF7F2] p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">{label}</div>
      <div className="text-lg font-semibold text-[#0E2A1B]">{value}</div>
    </div>
  );
}

/** Right-hand drawer: statistics, order history and the audit trail for one customer. */
function CustomerDrawer({ customerId, onClose, onAskToggle, refreshKey }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminCodApi.get(customerId);
      setDetail(res?.data || null);
    } catch (err) {
      setError(err?.message || 'Could not load this customer.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const c = detail?.customer;
  const s = c?.stats;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-lenis-prevent>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside className="relative bg-white w-full max-w-xl h-full overflow-y-auto border-l border-[#E8E2D5] shadow-xl" role="dialog" aria-modal="true" aria-label="Customer details">
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 border-b border-stone-200">
          <div className="flex items-center gap-2 min-w-0">
            <Banknote className="w-5 h-5 text-[#0E2A1B] shrink-0" />
            <h2 className="font-semibold text-[#0E2A1B] truncate">{c ? c.name || c.phone : 'Customer'}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {loading && !detail && (
            <div className="flex items-center gap-2 text-stone-500 text-sm py-10 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading customer…
            </div>
          )}
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>
          )}

          {c && (
            <>
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <StatusBadges customer={c} />
                  <button
                    type="button"
                    onClick={() => onAskToggle(c)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      c.codAccess.isEnabled
                        ? 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                        : 'bg-[#0E2A1B] text-[#D4AF37]'
                    }`}
                  >
                    {c.codAccess.isEnabled ? 'Disable COD' : 'Enable COD'}
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-[11px] uppercase tracking-wider text-stone-400">Mobile</dt><dd>{c.phone}</dd></div>
                  <div><dt className="text-[11px] uppercase tracking-wider text-stone-400">Email</dt><dd className="break-all">{c.email || '—'}</dd></div>
                  <div><dt className="text-[11px] uppercase tracking-wider text-stone-400">Registered</dt><dd>{day(c.registeredAt)}</dd></div>
                  <div><dt className="text-[11px] uppercase tracking-wider text-stone-400">Last COD change</dt><dd>{when(c.codAccess.isEnabled ? c.codAccess.enabledAt : c.codAccess.disabledAt)}</dd></div>
                </dl>
                {c.codAccess.reason && (
                  <p className="text-xs text-stone-600 bg-[#FAF7F2] border border-stone-200 rounded-lg p-2.5">
                    <span className="font-semibold">Internal reason:</span> {c.codAccess.reason}
                  </p>
                )}
                {c.eligibleForReview && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    Recommendation only: this customer has a clean delivery record. You decide whether to enable COD.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-[#0E2A1B]">Order statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <StatBox label="Total orders" value={s.totalOrders} />
                  <StatBox label="Delivered" value={s.deliveredOrders} />
                  <StatBox label="Cancelled" value={s.cancelledOrders} />
                  <StatBox label="Refused / rejected" value={s.refusedOrders} />
                  <StatBox label="COD orders" value={s.codOrders} />
                  <StatBox label="COD delivered" value={s.codDeliveredOrders} />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-[#0E2A1B]">Order history (latest 25)</h3>
                {detail.recentOrders.length === 0 ? (
                  <p className="text-sm text-stone-500">This customer has not placed any orders yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-stone-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider">
                        <tr>
                          <th className="text-left p-2">Order</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Payment</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-left p-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.recentOrders.map((o) => (
                          <tr key={o.id} className="border-t border-stone-100 align-top">
                            <td className="p-2 font-mono">{o.orderNumber}</td>
                            <td className="p-2">
                              <Badge className={ORDER_STATUS_STYLE[o.status] || 'bg-stone-50 text-stone-700 border-stone-200'}>{o.status}</Badge>
                              {o.refused && <div className="text-[10px] text-rose-700 mt-0.5">Returned by courier</div>}
                              {o.cancelReason && <div className="text-[10px] text-stone-500 mt-0.5">{o.cancelReason}</div>}
                            </td>
                            <td className="p-2">{o.paymentMethod} · {o.paymentStatus}</td>
                            <td className="p-2 text-right whitespace-nowrap">{money(o.total)}</td>
                            <td className="p-2 whitespace-nowrap">{day(o.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-[#0E2A1B]">COD permission history</h3>
                {detail.auditTrail.length === 0 ? (
                  <p className="text-sm text-stone-500">COD has never been changed for this customer.</p>
                ) : (
                  <ol className="space-y-2">
                    {detail.auditTrail.map((a) => (
                      <li key={a.id} className="text-xs text-stone-600 border border-stone-200 rounded-lg p-2.5">
                        <div className="flex flex-wrap gap-x-2 items-center">
                          <span className={`font-semibold ${a.newEnabled ? 'text-emerald-700' : 'text-rose-700'}`}>{a.newEnabled ? 'Enabled' : 'Disabled'}</span>
                          <span className="text-stone-400">{when(a.at)}</span>
                          <span>by {a.adminName || a.adminEmail || 'admin'}</span>
                        </div>
                        <div className="mt-0.5 text-stone-700">{a.reason}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function AdminCodPermission() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [codStatus, setCodStatus] = useState('all');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ customers: [], pagination: { total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerId, setDrawerId] = useState(null);
  const [drawerKey, setDrawerKey] = useState(0);
  const [confirm, setConfirm] = useState(null); // { customer, enable }
  const [saving, setSaving] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [toast, setToast] = useState(null); // { type, text }

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, codStatus, filter]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminCodApi.list({ search, codStatus, filter, page, limit: PAGE_SIZE });
      setData(res?.data || { customers: [], pagination: { total: 0, totalPages: 1 } });
    } catch (err) {
      setError(err?.message || 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, [search, codStatus, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const { customers, pagination } = data;
  const total = pagination?.total || 0;
  const pager = useMemo(
    () => ({
      page,
      setPage,
      totalItems: total,
      totalPages: Math.max(1, pagination?.totalPages || 1),
      from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
      to: Math.min(page * PAGE_SIZE, total)
    }),
    [page, total, pagination?.totalPages]
  );

  const askToggle = (customer) => {
    setConfirmError('');
    setConfirm({ customer, enable: !customer.codAccess.isEnabled });
  };

  const doToggle = async (reason) => {
    if (!confirm || saving) return;
    setSaving(true);
    setConfirmError('');
    try {
      await adminCodApi.setPermission(confirm.customer.id, { enabled: confirm.enable, reason });
      setToast({ type: 'success', text: `Cash on Delivery ${confirm.enable ? 'enabled' : 'disabled'} for ${confirm.customer.name || confirm.customer.phone}.` });
      setConfirm(null);
      setDrawerKey((k) => k + 1);
      load();
    } catch (err) {
      setConfirmError(err?.message || 'Could not update COD permission.');
    } finally {
      setSaving(false);
    }
  };

  const hasFilters = search || codStatus !== 'all' || filter !== 'all';
  const selectClass = 'px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Customer COD Permission" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full">
          <p className="text-sm text-stone-600 max-w-3xl">
            Cash on Delivery is <strong>off for every customer</strong> until you enable it here. Review a customer's delivery
            history first. “Eligible for Review” is only a suggestion — you always decide.
          </p>

          <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
            <div className="flex flex-wrap gap-2">
              <select value={codStatus} onChange={(e) => setCodStatus(e.target.value)} className={selectClass} aria-label="COD status">
                {CODE_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClass} aria-label="Order history filter">
                {HISTORY_FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 xl:flex-none">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search name or mobile number"
                  aria-label="Search customers"
                  className="pl-9 pr-3 py-2 w-full xl:w-72 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <button type="button" onClick={load} aria-label="Refresh" className="p-2 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-50">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-center justify-between gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <span>{error}</span>
              <button type="button" onClick={load} className="px-3 py-1 rounded-md border border-rose-300 text-xs font-semibold hover:bg-rose-100">Try again</button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E8E2D5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Mobile</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Registered</th>
                    <th className="text-right p-3">Orders</th>
                    <th className="text-right p-3">Delivered</th>
                    <th className="text-right p-3">Cancelled</th>
                    <th className="text-right p-3">Refused</th>
                    <th className="text-right p-3">COD orders</th>
                    <th className="text-right p-3">COD delivered</th>
                    <th className="text-left p-3">COD status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && customers.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-stone-500">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading customers…
                      </td>
                    </tr>
                  )}
                  {!loading && customers.length === 0 && !error && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-stone-500">
                        {hasFilters ? 'No customers match these filters.' : 'No customers have registered yet.'}
                      </td>
                    </tr>
                  )}
                  {customers.map((c) => (
                    <tr key={c.id} className="border-t border-stone-100 hover:bg-[#FAF7F2]/60 align-top">
                      <td className="p-3 font-medium text-stone-800">{c.name || '—'}</td>
                      <td className="p-3 whitespace-nowrap">{c.phone}</td>
                      <td className="p-3 text-xs break-all max-w-[180px]">{c.email || '—'}</td>
                      <td className="p-3 text-xs whitespace-nowrap">{day(c.registeredAt)}</td>
                      <td className="p-3 text-right">{c.stats.totalOrders}</td>
                      <td className="p-3 text-right">{c.stats.deliveredOrders}</td>
                      <td className="p-3 text-right">{c.stats.cancelledOrders}</td>
                      <td className="p-3 text-right">{c.stats.refusedOrders}</td>
                      <td className="p-3 text-right">{c.stats.codOrders}</td>
                      <td className="p-3 text-right">{c.stats.codDeliveredOrders}</td>
                      <td className="p-3"><StatusBadges customer={c} /></td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDrawerId(c.id)}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-[#0E2A1B] hover:bg-stone-50 whitespace-nowrap flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            type="button"
                            onClick={() => askToggle(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                              c.codAccess.isEnabled
                                ? 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                                : 'bg-[#0E2A1B] text-[#D4AF37]'
                            }`}
                          >
                            {c.codAccess.isEnabled ? 'Disable COD' : 'Enable COD'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination pagination={pager} label="customers" />
          </div>
        </main>
      </div>

      {drawerId && (
        <CustomerDrawer customerId={drawerId} refreshKey={drawerKey} onClose={() => setDrawerId(null)} onAskToggle={askToggle} />
      )}

      {confirm && (
        <ConfirmDialog
          customer={confirm.customer}
          enable={confirm.enable}
          busy={saving}
          error={confirmError}
          onCancel={() => setConfirm(null)}
          onConfirm={doToggle}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[70] max-w-sm flex items-start gap-2 p-3 rounded-lg border shadow-lg text-sm ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
