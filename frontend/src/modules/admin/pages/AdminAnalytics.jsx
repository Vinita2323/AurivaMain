import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw, CalendarDays, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { adminDashboardApi } from '../../../utils/api';

const PRESETS = [
  { id: 'weekly', label: '7 Days' },
  { id: 'monthly', label: 'Month-to-Date' },
  { id: 'quarterly', label: 'Quarter' },
  { id: 'yearly', label: 'Year' }
];

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const compactInr = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
};

const todayISO = () => {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function Trend({ pct }) {
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
        up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
      }`}
    >
      <Icon className="w-3 h-3" /> {up ? '+' : ''}
      {pct}%
    </span>
  );
}

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * Exact window in the admin's own timezone: [from, to) as ISO instants.
 * Custom dates win over the preset buttons. Month/quarter/year start on the 1st of the month.
 */
function buildRange(timeframe, fromDate, toDate) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start;
  let end = addDays(todayStart, 1); // tomorrow 00:00 -> includes all of today

  if (fromDate) {
    start = new Date(`${fromDate}T00:00:00`);
    if (toDate) end = addDays(new Date(`${toDate}T00:00:00`), 1);
    if (end <= start) end = addDays(start, 1);
  } else if (timeframe === 'weekly') {
    start = addDays(end, -7);
  } else if (timeframe === 'quarterly') {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else if (timeframe === 'yearly') {
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1); // month-to-date
  }
  return {
    from: start.toISOString(),
    to: end.toISOString(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  };
}

export default function AdminAnalytics() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isCustom = Boolean(fromDate);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminDashboardApi.getAnalytics({
        range: fromDate ? 'custom' : timeframe,
        ...buildRange(timeframe, fromDate, toDate)
      });
      setData(res?.data || null);
    } catch (err) {
      setError(err.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = data?.kpis;
  const series = useMemo(() => data?.series || [], [data]);
  const channels = data?.channels || [];
  const topProducts = data?.topProducts || [];

  // Chart geometry from real values
  const chart = useMemo(() => {
    const W = 600;
    const padX = 30;
    const top = 28;
    const bottom = 170;
    const max = Math.max(...series.map((p) => p.revenue), 0);
    const n = series.length;
    const points = series.map((p, i) => ({
      ...p,
      x: n === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1),
      y: max > 0 ? bottom - (p.revenue / max) * (bottom - top) : bottom
    }));
    const line = points.map((p) => `${p.x},${p.y}`).join(' ');
    const area = points.length
      ? `M ${points[0].x} ${bottom} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${bottom} Z`
      : '';
    const labelEvery = Math.max(1, Math.ceil(n / 8));
    return { points, line, area, bottom, labelEvery, max };
  }, [series]);

  // Cursor effect: guide line + highlighted point + tooltip that snap to the nearest data point
  const chartBoxRef = useRef(null);
  const [hover, setHover] = useState(null); // { idx, left, top, boxWidth }
  const VB_W = 600;
  const VB_H = 220;

  const handleChartMove = (e) => {
    const box = chartBoxRef.current;
    const svg = box?.querySelector('svg');
    if (!box || !svg || chart.points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    // viewBox is letter-boxed (preserveAspectRatio meet) — map pixels back to viewBox units
    const scale = Math.min(rect.width / VB_W, rect.height / VB_H);
    const offX = (rect.width - VB_W * scale) / 2;
    const offY = (rect.height - VB_H * scale) / 2;
    const vx = (e.clientX - rect.left - offX) / scale;

    let idx = 0;
    let best = Infinity;
    chart.points.forEach((pt, i) => {
      const d = Math.abs(pt.x - vx);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    const pt = chart.points[idx];
    setHover({
      idx,
      left: rect.left - boxRect.left + offX + pt.x * scale,
      top: rect.top - boxRect.top + offY + pt.y * scale,
      boxWidth: boxRect.width
    });
  };

  const rangeLabel = data?.range
    ? `${new Date(data.range.from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${new Date(
        data.range.to
      ).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : '';

  const clearCustom = () => {
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Business Intelligence & Analytics" />

        <main className="p-4 sm:p-8 space-y-8 max-w-7xl">
          {/* Period selector + calendar filter */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0E2A1B]">Financial & Sales Performance</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Live revenue, order and product metrics from your orders
                  {rangeLabel ? ` • ${rangeLabel}` : ''}.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E8E2D5] shadow-xs self-start">
                {PRESETS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      clearCustom();
                      setTimeframe(t.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      !isCustom && timeframe === t.id ? 'bg-[#0E2A1B] text-[#D4AF37]' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 p-3 bg-white rounded-2xl border border-[#E8E2D5] shadow-xs self-start">
              <CalendarDays className="w-4 h-4 text-[#0E2A1B] mb-2.5" />
              <label className="text-[11px] font-bold text-stone-600">
                From
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || todayISO()}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="block mt-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
                />
              </label>
              <label className="text-[11px] font-bold text-stone-600">
                To
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  max={todayISO()}
                  disabled={!fromDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="block mt-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B] disabled:opacity-50"
                />
              </label>
              {isCustom && (
                <button
                  onClick={clearCustom}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </span>
              <button onClick={load} className="inline-flex items-center gap-1 font-bold underline">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {loading && !data && (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-stone-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading analytics…
            </div>
          )}

          {data && (
            <div className={`space-y-8 transition-opacity ${loading ? 'opacity-60' : ''}`}>
              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Gross Revenue (GMV)</span>
                    <Trend pct={kpis.revenueTrendPct} />
                  </div>
                  <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">{inr(kpis.revenue)}</h2>
                  <p className="text-[11px] text-stone-400">Excludes cancelled and failed-payment orders • vs previous period</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Orders</span>
                    <Trend pct={kpis.ordersTrendPct} />
                  </div>
                  <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">{kpis.orders.toLocaleString('en-IN')}</h2>
                  <p className="text-[11px] text-stone-400">Orders placed in this period</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Average Order Value</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        kpis.aovDelta >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {kpis.aovDelta >= 0 ? '+' : '-'}₹{Math.abs(kpis.aovDelta).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">{inr(kpis.aov)}</h2>
                  <p className="text-[11px] text-stone-400">Per order customer spend • vs previous period</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Delivered Rate</span>
                    <span className="text-xs font-bold text-[#0E2A1B] bg-[#D4AF37]/20 px-2 py-0.5 rounded-md">
                      {kpis.deliveredOrders} delivered
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">{kpis.deliveredRate}%</h2>
                  <p className="text-[11px] text-stone-400">Share of orders already delivered</p>
                </div>
              </div>

              {/* Chart + channel split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Revenue & Growth Trajectory</h3>
                    <p className="text-xs text-stone-500">
                      {data.range.bucket === 'month' ? 'Monthly' : 'Daily'} revenue for the selected period (INR)
                    </p>
                  </div>

                  <div
                    ref={chartBoxRef}
                    className="relative h-64 w-full pt-4"
                    onPointerMove={handleChartMove}
                    onPointerLeave={() => setHover(null)}
                  >
                    {chart.max === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-stone-400">
                        No revenue recorded in this period.
                      </div>
                    ) : (
                      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-full overflow-visible cursor-crosshair">
                        <defs>
                          <linearGradient id="analyticsChartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1B3B29" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#1B3B29" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {[28, 76, 124].map((y) => (
                          <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#F0ECE1" strokeWidth="1" />
                        ))}
                        <line x1="0" y1={chart.bottom} x2="600" y2={chart.bottom} stroke="#E8E2D5" strokeWidth="1" />
                        <path d={chart.area} fill="url(#analyticsChartGrad)" />
                        <polyline
                          points={chart.line}
                          fill="none"
                          stroke="#1B3B29"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {hover && chart.points[hover.idx] && (
                          <line
                            x1={chart.points[hover.idx].x}
                            y1="20"
                            x2={chart.points[hover.idx].x}
                            y2={chart.bottom}
                            stroke="#0E2A1B"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                          />
                        )}
                        {chart.points.map((pt, i) => (
                          <g key={i}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hover?.idx === i ? 7 : 4.5}
                              fill={hover?.idx === i ? '#0E2A1B' : '#D4AF37'}
                              stroke={hover?.idx === i ? '#D4AF37' : '#0E2A1B'}
                              strokeWidth="2.5"
                              style={{ transition: 'r 120ms ease' }}
                            />
                            {i % chart.labelEvery === 0 && (
                              <>
                                {pt.revenue > 0 && (
                                  <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0E2A1B">
                                    {compactInr(pt.revenue)}
                                  </text>
                                )}
                                <text x={pt.x} y="195" textAnchor="middle" fontSize="10" fill="#8E958E">
                                  {pt.label}
                                </text>
                              </>
                            )}
                          </g>
                        ))}
                      </svg>
                    )}

                    {hover && chart.points[hover.idx] && (
                      <div
                        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#0E2A1B] px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
                        style={{
                          left: Math.min(Math.max(hover.left, 70), Math.max(70, hover.boxWidth - 70)),
                          top: Math.max(hover.top - 12, 8)
                        }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                          {chart.points[hover.idx].label}
                        </p>
                        <p className="font-bold">{inr(chart.points[hover.idx].revenue)}</p>
                        <p className="text-stone-300">
                          {chart.points[hover.idx].orders} {chart.points[hover.idx].orders === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                    <span>
                      Highest grossing {data.range.bucket === 'month' ? 'month' : 'day'}:{' '}
                      <strong className="text-stone-900">{data.bestPeriod || '—'}</strong>
                    </span>
                    <span className="text-emerald-700 font-bold">{kpis.deliveredRate}% delivered</span>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Logistics Channel Split</h3>
                    <p className="text-xs text-stone-500">Fulfillment mode volume distribution</p>
                  </div>

                  {channels.length === 0 ? (
                    <p className="text-xs text-stone-400">No orders in this period.</p>
                  ) : (
                    <div className="space-y-4">
                      {channels.map((c, idx) => (
                        <div key={c.name}>
                          <div className="flex justify-between text-xs font-bold text-stone-800 mb-1 gap-2">
                            <span className="truncate">{c.name}</span>
                            <span className="text-emerald-700 shrink-0">
                              {c.percent}% • {c.orders}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? 'bg-[#1B3B29]' : 'bg-[#D4AF37]'}`}
                              style={{ width: `${c.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top products */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Top Revenue Generating Snack SKUs</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF7F2] text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Units Sold</th>
                        <th className="py-3 px-4">Total Revenue</th>
                        <th className="py-3 px-4">Stock Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {topProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 px-4 text-center text-stone-400">
                            No product sales in this period.
                          </td>
                        </tr>
                      )}
                      {topProducts.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#0E2A1B]">#{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {p.image ? (
                                <img src={p.image} alt="" className="w-9 h-9 rounded-xl object-cover border border-stone-200" />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200" />
                              )}
                              <div>
                                <div className="font-serif font-bold text-xs text-[#0E2A1B]">{p.name}</div>
                                {p.flavor && <span className="text-[10px] text-stone-400">{p.flavor}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-stone-900">{inr(p.price)}</td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-700">{p.sold.toLocaleString('en-IN')} units</td>
                          <td className="py-3.5 px-4 font-bold text-[#0E2A1B]">{inr(p.revenue)}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                p.stockCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {p.stockCount > 0 ? `${p.stockCount} in stock` : 'Out of stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
