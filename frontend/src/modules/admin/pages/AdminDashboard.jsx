import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Eye 
} from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { ADMIN_STATS, INITIAL_ORDERS } from '../../../data/adminData';
import { PRODUCTS } from '../../../data/products';


export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const topProducts = PRODUCTS.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Executive Dashboard" />

        <main className="p-4 sm:p-8 space-y-8 max-w-7xl">
          
          {/* Top KPI Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Total Revenue */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Revenue</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {ADMIN_STATS.revenueGrowth}
                </span>
              </div>
              <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">
                ₹{ADMIN_STATS.totalRevenue.toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] text-stone-400">Monthly recurring snack orders</p>
            </div>

            {/* Today's Orders */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Today's Orders</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {ADMIN_STATS.ordersGrowth}
                </span>
              </div>
              <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">
                {ADMIN_STATS.todayOrders}
              </h2>
              <p className="text-[11px] text-stone-400">182 Quick Commerce • 74 Courier</p>
            </div>

            {/* Total Customers */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Customers</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {ADMIN_STATS.customersGrowth}
                </span>
              </div>
              <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">
                {ADMIN_STATS.totalCustomers.toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] text-stone-400">Active health-conscious accounts</p>
            </div>

            {/* Repeat Customers */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Repeat Customers</span>
                <span className="text-xs font-bold text-[#0E2A1B] bg-[#D4AF37]/20 px-2 py-0.5 rounded-md">
                  {ADMIN_STATS.repeatRate} Rate
                </span>
              </div>
              <h2 className="font-serif text-3xl font-extrabold text-[#0E2A1B]">
                {ADMIN_STATS.repeatCustomers.toLocaleString('en-IN')}
              </h2>
              <p className="text-[11px] text-stone-400">Loyalty subscription refills</p>
            </div>

          </div>

          {/* Charts & Top Products Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Revenue Overview Line / Area Chart */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-4 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Revenue Overview</h3>
                  <p className="text-xs text-stone-500">Monthly healthy snack gross transaction value</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-stone-700">
                    <span className="w-3 h-3 rounded-full bg-[#1B3B29]" /> Revenue Trend
                  </span>
                </div>
              </div>

              {/* Custom High-Fidelity SVG Chart */}
              <div className="h-64 w-full pt-4">
                <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B3B29" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#1B3B29" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#F0ECE1" strokeWidth="1" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="#F0ECE1" strokeWidth="1" />
                  <line x1="0" y1="140" x2="600" y2="140" stroke="#F0ECE1" strokeWidth="1" />
                  <line x1="0" y1="190" x2="600" y2="190" stroke="#E8E2D5" strokeWidth="1" />

                  {/* Area fill */}
                  <path
                    d="M 50 160 Q 150 130 250 90 T 450 50 L 550 20 L 550 190 L 50 190 Z"
                    fill="url(#chartGrad)"
                  />

                  {/* Curved Stroke Line */}
                  <path
                    d="M 50 160 Q 150 130 250 90 T 450 50 L 550 20"
                    fill="none"
                    stroke="#1B3B29"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  {[
                    { cx: 50, cy: 160, val: '₹6.4L', m: 'Jan' },
                    { cx: 175, cy: 125, val: '₹7.8L', m: 'Feb' },
                    { cx: 300, cy: 90, val: '₹9.1L', m: 'Mar' },
                    { cx: 425, cy: 50, val: '₹10.5L', m: 'Apr' },
                    { cx: 550, cy: 20, val: '₹12.4L', m: 'May' },
                  ].map((pt, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle cx={pt.cx} cy={pt.cy} r="5" fill="#D4AF37" stroke="#0E2A1B" strokeWidth="2.5" />
                      <text x={pt.cx} y={pt.cy - 12} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0E2A1B">
                        {pt.val}
                      </text>
                      <text x={pt.cx} y="210" textAnchor="middle" fontSize="11" fill="#8E958E">
                        {pt.m}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
                <span>Average Order Value (AOV): <strong className="text-stone-900">₹680</strong></span>
                <span className="text-emerald-700 font-bold">100% On-Time Delivery Fulfillment</span>
              </div>
            </div>

            {/* Top Products Showcase */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Top Products</h3>
                <Link to="/admin/products" className="text-xs text-[#0E2A1B] hover:text-[#D4AF37] font-bold">
                  View All
                </Link>
              </div>

              <div className="space-y-3.5">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#FAF7F2] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#1B3B29] text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-stone-200 bg-white" />
                      <div>
                        <h4 className="font-serif text-xs font-bold text-[#0E2A1B] truncate max-w-[130px]">{p.name}</h4>
                        <p className="text-[10px] text-stone-400">₹{p.price} • {p.stockCount} in stock</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">
                      {340 - idx * 45} sold
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Recent Incoming Orders</h3>
                <p className="text-xs text-stone-500">Live order queue from across India</p>
              </div>
              <Link
                to="/admin/orders"
                className="px-4 py-2 bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-bold uppercase rounded-xl tracking-wider transition-colors"
              >
                Manage All Orders
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {INITIAL_ORDERS.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-[#0E2A1B]">#{ord.id}</td>
                      <td className="py-4 px-4 font-semibold text-stone-800">{ord.customer}</td>
                      <td className="py-4 px-4 font-bold text-stone-900">₹{ord.total}</td>
                      <td className="py-4 px-4">
                        <span className="text-[11px] font-semibold text-stone-600">
                          {ord.deliveryType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'Out for Delivery'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-stone-500">{ord.date}</td>
                      <td className="py-4 px-4 text-right">
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
