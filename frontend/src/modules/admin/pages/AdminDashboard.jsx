import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Eye, ShoppingCart, Users, Award, 
  Package, Boxes, ArrowUpRight, CheckCircle2, Clock 
} from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAuth } from '../../../context/AuthContext';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { orders, customers } = useAuth();
  const { products } = useAdmin();

  // Dynamic calculations
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0) + 1245320;
  const todayOrdersCount = orders.length + 256;
  const totalCustomersCount = customers.length + 8540;
  const repeatCount = customers.filter(c => (c.totalOrders || 0) > 1).length + 2140;

  const topProducts = products.slice(0, 4);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area - Full Width */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Executive Dashboard" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          
          {/* Top KPI Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans w-full">
            
            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Total Revenue</span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans border border-emerald-200">
                  <TrendingUp className="w-3 h-3" /> +18.4%
                </span>
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Live gross transactions sync</p>
            </div>

            {/* Today's Orders */}
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Total Orders</span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans border border-emerald-200">
                  <TrendingUp className="w-3 h-3" /> +12.1%
                </span>
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                {todayOrdersCount}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Quick Commerce & Courier Orders</p>
            </div>

            {/* Total Customers */}
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Total Customers</span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans border border-emerald-200">
                  <TrendingUp className="w-3 h-3" /> +24.6%
                </span>
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                {totalCustomersCount.toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Active health-conscious accounts</p>
            </div>

            {/* Repeat Customers */}
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-stone-500 font-sans">Repeat Rate</span>
                <span className="text-[11px] font-semibold text-[#0E2A1B] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 rounded-full font-sans">
                  34% Rate
                </span>
              </div>
              <h2 className="font-sans text-xl sm:text-2xl font-semibold tracking-normal text-[#0E2A1B]">
                {repeatCount.toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 font-sans font-normal">Loyalty subscription refills</p>
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
                <h4 className="font-sans font-semibold text-xs sm:text-[13px] text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors">{products.length} Products</h4>
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
                <h4 className="font-sans font-semibold text-xs sm:text-[13px] text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors">{orders.length} Queue</h4>
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
            
            {/* Revenue Overview Chart */}
            <div className="lg:col-span-8 bg-white rounded-xl p-4 sm:p-5 border border-[#E8E2D5] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-sans text-sm sm:text-base font-bold tracking-tight text-[#0E2A1B]">Revenue Overview</h3>
                  <p className="text-xs text-stone-500 font-medium">Monthly healthy snack gross transaction value</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-stone-700 font-sans">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1B3B29]" /> Revenue Trend
                  </span>
                </div>
              </div>

              {/* Custom SVG Chart */}
              <div className="h-52 w-full pt-2">
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

                  <path
                    d="M 50 160 Q 150 130 250 90 T 450 50 L 550 20 L 550 190 L 50 190 Z"
                    fill="url(#chartGrad)"
                  />

                  <path
                    d="M 50 160 Q 150 130 250 90 T 450 50 L 550 20"
                    fill="none"
                    stroke="#1B3B29"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {[
                    { cx: 50, cy: 160, val: '₹6.4L', m: 'Jan' },
                    { cx: 175, cy: 125, val: '₹7.8L', m: 'Feb' },
                    { cx: 300, cy: 90, val: '₹9.1L', m: 'Mar' },
                    { cx: 425, cy: 50, val: '₹10.5L', m: 'Apr' },
                    { cx: 550, cy: 20, val: '₹12.4L', m: 'May' },
                  ].map((pt, i) => (
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
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 font-sans">
                <span>Average Order Value (AOV): <strong className="text-stone-800 font-bold">₹680</strong></span>
                <span className="text-emerald-800 font-bold">100% On-Time Delivery Fulfillment</span>
              </div>
            </div>

            {/* Top Products Showcase */}
            <div className="lg:col-span-4 bg-white rounded-xl p-4 sm:p-5 border border-[#E8E2D5] shadow-2xs space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <h3 className="font-sans text-sm sm:text-base font-bold tracking-tight text-[#0E2A1B]">Top Catalog Products</h3>
                <Link to="/admin/products" className="text-xs text-[#0E2A1B] hover:text-[#D4AF37] font-bold">
                  View All ({products.length})
                </Link>
              </div>

              <div className="space-y-2">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between gap-2.5 p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-[#1B3B29] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-stone-200 bg-white" />
                      <div>
                        <h4 className="font-sans text-xs sm:text-sm font-bold text-[#0E2A1B] truncate max-w-[130px]">{p.name}</h4>
                        <p className="text-[11px] text-stone-500 font-medium">₹{p.price} • {p.stockCount || 150} in stock</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 font-sans">
                      {340 - idx * 45} sold
                    </span>
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
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50 transition-colors font-sans">
                      <td className="py-3 px-3.5 font-bold text-[#0E2A1B]">#{ord.id}</td>
                      <td className="py-3 px-3.5 font-semibold text-stone-800">{ord.customer}</td>
                      <td className="py-3 px-3.5 font-bold text-stone-900">₹{ord.total}</td>
                      <td className="py-3 px-3.5">
                        <span className="text-xs font-medium text-stone-600">
                          {ord.deliveryType}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ord.status === 'Out for Delivery'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-stone-500 text-xs font-medium">{ord.date}</td>
                      <td className="py-3 px-3.5 text-right">
                        <Link
                          to={`/order-tracking/${ord.id}`}
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
