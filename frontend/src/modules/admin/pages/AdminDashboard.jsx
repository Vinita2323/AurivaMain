import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Eye, ArrowUpRight, RefreshCw
} from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { formatOrder } from '../../../context/AuthContext';
import { adminDashboardApi } from '../../../utils/api';

function formatTrend(pct) {
  const n = Number(pct) || 0;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}

function TrendBadge({ pct }) {
  const n = Number(pct) || 0;
  const up = n >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 font-sans border ${
        up
          ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
          : 'text-rose-800 bg-rose-50 border-rose-200'
      }`}
    >
      <Icon className="w-3 h-3" /> {formatTrend(n)}
    </span>
  );
}

function buildChartPoints(revenueChart = []) {
  const values = revenueChart.map((m) => Number(m.revenue) || 0);
  const max = Math.max(...values, 1);
  const n = revenueChart.length || 1;
  const padX = 50;
  const usableW = 500;
  const topY = 24;
  const bottomY = 170;

  return revenueChart.map((m, i) => {
    const cx = n === 1 ? 300 : padX + (usableW * i) / (n - 1);
    const ratio = (Number(m.revenue) || 0) / max;
    const cy = bottomY - ratio * (bottomY - topY);
    return {
      cx,
      cy,
      val: m.label || `₹${Math.round(m.revenue || 0)}`,
      m: m.month || '',
      revenue: m.revenue || 0
    };
  });
}

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await adminDashboardApi.getSummary();
      const data = res?.data || res;
      setSummary(data || null);
    } catch (err) {
      console.warn('[AdminDashboard] summary fetch failed:', err.message);
      setLoadError(err.message || 'Failed to load dashboard');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const kpis = summary?.kpis || {};
  const quick = summary?.quick || {};
  const revenueChart = summary?.revenueChart || [];
  const chartPoints = buildChartPoints(revenueChart);
  const linePath =
    chartPoints.length > 0
      ? chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ')
      : '';
  const areaPath =
    chartPoints.length > 0
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].cx} 190 L ${chartPoints[0].cx} 190 Z`
      : '';

  const topProducts = summary?.topProducts || [];
  const recentOrders = (summary?.recentOrders || []).map(formatOrder);
  const productCount = quick.productCount ?? 0;
  const queueCount = quick.queueCount ?? 0;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        badges={{
          orders: quick.queueCount,
          coupons: quick.couponCount,
          notifications: quick.unreadNotifications
        }}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Executive Dashboard" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          {loadError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
              <span>Could not refresh live stats: {loadError}</span>
              <button
                type="button"
                onClick={fetchSummary}
                className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[#0E2A1B]"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans w-full">
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Total Revenue</span>
                {!isLoading && <TrendBadge pct={kpis.revenueTrendPct} />}
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                {isLoading ? '—' : `₹${Number(kpis.totalRevenue || 0).toLocaleString('en-IN')}`}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Live gross transactions sync</p>
            </div>

            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Total Orders</span>
                {!isLoading && <TrendBadge pct={kpis.ordersTrendPct} />}
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                {isLoading ? '—' : Number(kpis.totalOrders || 0).toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Quick Commerce & Courier Orders</p>
            </div>

            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Total Customers</span>
                {!isLoading && <TrendBadge pct={kpis.customersTrendPct} />}
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                {isLoading ? '—' : Number(kpis.totalCustomers || 0).toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Registered customer accounts</p>
            </div>

            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Repeat Rate</span>
                <span className="text-[11px] font-semibold text-[#0E2A1B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 rounded-full font-sans">
                  {isLoading ? '—' : `${kpis.repeatRate ?? 0}% Rate`}
                </span>
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                {isLoading ? '—' : Number(kpis.repeatCustomers || 0).toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Customers with 2+ orders</p>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans w-full">
            <Link
              to="/admin/products"
              className="p-3 bg-white rounded-xl border border-[#E8E2D5] hover:border-[#0E2A1B] flex items-center justify-between group shadow-2xs transition-all"
            >
              <div>
                <span className="text-stone-400 text-[10.5px] font-medium uppercase font-sans">Manage Catalog</span>
                <h4 className="font-sans font-semibold text-xs sm:text-[13px] text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors">
                  {isLoading ? '—' : `${productCount} Products`}
                </h4>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#0E2A1B] transition-colors" />
            </Link>

            <Link
              to="/admin/inventory"
              className="p-3 bg-white rounded-xl border border-[#E8E2D5] hover:border-[#0E2A1B] flex items-center justify-between group shadow-2xs transition-all"
            >
              <div>
                <span className="text-stone-400 text-[10.5px] font-medium uppercase font-sans">Warehouse Hub</span>
                <h4 className="font-sans font-semibold text-xs sm:text-[13px] text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors">Stock Health</h4>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#0E2A1B] transition-colors" />
            </Link>

            <Link
              to="/admin/orders"
              className="p-3.5 bg-white rounded-xl border border-[#E8E2D5] hover:border-[#0E2A1B] flex items-center justify-between group shadow-2xs transition-all"
            >
              <div>
                <span className="text-stone-400 text-[10.5px] font-medium uppercase font-sans">Live Fulfillment</span>
                <h4 className="font-sans font-semibold text-xs sm:text-[13px] text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors">
                  {isLoading ? '—' : `${queueCount} Queue`}
                </h4>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#0E2A1B] transition-colors" />
            </Link>

            <Link
              to="/admin/analytics"
              className="p-3.5 bg-white rounded-xl border border-[#E8E2D5] hover:border-[#0E2A1B] flex items-center justify-between group shadow-2xs transition-all"
            >
              <div>
                <span className="text-stone-400 text-[10.5px] font-medium uppercase font-sans">Performance</span>
                <h4 className="font-sans font-semibold text-xs sm:text-[13px] text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors">BI Analytics</h4>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#0E2A1B] transition-colors" />
            </Link>
          </div>

          {/* Charts & Top Products Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch font-sans w-full">
            <div className="lg:col-span-8 bg-white rounded-xl p-4 sm:p-5 border border-[#E8E2D5] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-sans text-sm sm:text-base font-bold tracking-tight text-[#0E2A1B]">Revenue Overview</h3>
                  <p className="text-xs text-stone-500 font-medium">Last 5 months · live order totals</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-stone-700 font-sans">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1B3B29]" /> Revenue Trend
                  </span>
                </div>
              </div>

              <div className="h-52 w-full pt-2">
                {isLoading || chartPoints.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-stone-400">
                    {isLoading ? 'Loading chart…' : 'No revenue data yet'}
                  </div>
                ) : (
                  <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible font-sans">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1B3B29" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1B3B29" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <line x1="0" y1="40" x2="600" y2="40" stroke="#F0ECE1" strokeWidth="1" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="#F0ECE1" strokeWidth="1" />
                    <line x1="0" y1="140" x2="600" y2="140" stroke="#F0ECE1" strokeWidth="1" />
                    <line x1="0" y1="190" x2="600" y2="190" stroke="#E8E2D5" strokeWidth="1" />

                    <path d={areaPath} fill="url(#chartGrad)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#1B3B29"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {chartPoints.map((pt, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle cx={pt.cx} cy={pt.cy} r="4.5" fill="#D4AF37" stroke="#0E2A1B" strokeWidth="2" />
                        <text x={pt.cx} y={pt.cy - 10} textAnchor="middle" fontSize="11" fontFamily="var(--font-sans)" fontWeight="700" fill="#0E2A1B">
                          {pt.val}
                        </text>
                        <text x={pt.cx} y="208" textAnchor="middle" fontSize="11" fontFamily="var(--font-sans)" fontWeight="600" fill="#8E958E">
                          {pt.m}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 font-sans">
                <span>
                  Average Order Value (AOV):{' '}
                  <strong className="text-stone-800 font-bold">
                    {isLoading ? '—' : `₹${Number(summary?.aov || 0).toLocaleString('en-IN')}`}
                  </strong>
                </span>
                <span className="text-emerald-800 font-bold">
                  {isLoading ? '—' : `${summary?.deliveredRate ?? 0}% Delivered`}
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-xl p-4 sm:p-5 border border-[#E8E2D5] shadow-2xs space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <h3 className="font-sans text-sm sm:text-base font-bold tracking-tight text-[#0E2A1B]">Top Catalog Products</h3>
                <Link to="/admin/products" className="text-xs text-[#0E2A1B] hover:text-[#D4AF37] font-bold">
                  View All ({productCount})
                </Link>
              </div>

              <div className="space-y-2">
                {isLoading && (
                  <p className="text-xs text-stone-400 py-6 text-center">Loading products…</p>
                )}
                {!isLoading && topProducts.length === 0 && (
                  <p className="text-xs text-stone-400 py-6 text-center">No product sales yet</p>
                )}
                {!isLoading &&
                  topProducts.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between gap-2.5 p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-[#1B3B29] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <img
                          src={p.image || 'https://placehold.co/80x80?text=Auriva'}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover border border-stone-200 bg-white"
                        />
                        <div>
                          <h4 className="font-sans text-xs sm:text-sm font-bold text-[#0E2A1B] truncate max-w-[130px]">{p.name}</h4>
                          <p className="text-[11px] text-stone-500 font-medium">
                            ₹{p.price} • {p.stockCount ?? 0} in stock
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 font-sans">{p.sold || 0} sold</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Live Orders Table */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E8E2D5] shadow-2xs space-y-3.5 font-sans w-full">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-sans text-sm sm:text-base font-bold tracking-tight text-[#0E2A1B]">Recent Incoming Orders</h3>
                <p className="text-xs text-stone-500 font-medium">Live order queue from across India</p>
              </div>
              <Link
                to="/admin/orders"
                className="px-3.5 py-2 bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold uppercase rounded-lg tracking-wider transition-colors font-sans shadow-2xs"
              >
                Manage All Orders
              </Link>
            </div>

            <div className="overflow-x-auto font-sans w-full">
              <table className="w-full text-left">
                <thead className="bg-[#FAF7F2] text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-xs sm:text-[12px]">
                  <tr>
                    <th className="py-3 px-3.5">Order ID</th>
                    <th className="py-3 px-3.5">Customer</th>
                    <th className="py-3 px-3.5">Amount</th>
                    <th className="py-3 px-3.5">Type</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-xs sm:text-sm">
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">Loading orders…</td>
                    </tr>
                  )}
                  {!isLoading && recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">No orders yet</td>
                    </tr>
                  )}
                  {!isLoading &&
                    recentOrders.map((ord) => (
                      <tr key={ord.id || ord._id} className="hover:bg-stone-50 transition-colors font-sans">
                        <td className="py-3 px-3.5 font-bold text-[#0E2A1B]">#{ord.id}</td>
                        <td className="py-3 px-3.5 font-semibold text-stone-800">{ord.customer}</td>
                        <td className="py-3 px-3.5 font-bold text-stone-900">₹{ord.total}</td>
                        <td className="py-3 px-3.5">
                          <span className="text-xs font-medium text-stone-600">{ord.deliveryType}</span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              ord.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : ord.status === 'Out for Delivery'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-stone-500 text-xs font-medium">{ord.date}</td>
                        <td className="py-3 px-3.5 text-right">
                          <Link
                            to="/admin/orders"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0E2A1B] hover:text-[#D4AF37]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
