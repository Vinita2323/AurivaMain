import React, { useState, useEffect } from 'react';
import { Users, Award, ShoppingBag, Search, Eye, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAuth } from '../../../context/AuthContext';

export default function AdminCustomers() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { customers, orders } = useAuth();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Compute CRM Metrics
  const totalSpendAll = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalOrdersAll = customers.reduce((acc, c) => acc + (c.totalOrders || 0), 0);
  const repeatCustomerCount = customers.filter(c => (c.totalOrders || 0) > 1).length;
  const repeatRate = Math.round((repeatCustomerCount / (customers.length || 1)) * 100);

  useEffect(() => {
    if (selectedCustomer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCustomer]);

  const filteredCustomers = customers.filter(c => {
    if (tierFilter !== 'All') {
      if (!c.tier.toLowerCase().includes(tierFilter.toLowerCase())) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Get orders of selected customer
  const customerOrders = selectedCustomer
    ? orders.filter(o => o.email === selectedCustomer.email || o.customer === selectedCustomer.name)
    : [];

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Customer Relationship Management (CRM)" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          
          {/* Top CRM KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Total Customers</span>
                <Users className="w-4 h-4 text-[#0E2A1B]" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#0E2A1B]">{customers.length.toLocaleString('en-IN')}</h2>
              <p className="text-xs text-stone-500 font-medium">Registered member profiles</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-800 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Repeat Rate</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-emerald-700">{repeatRate}%</h2>
              <p className="text-xs text-stone-500 font-medium">{repeatCustomerCount} recurring subscribers</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Total CRM Orders</span>
                <ShoppingBag className="w-4 h-4 text-[#0E2A1B]" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#0E2A1B]">{totalOrdersAll}</h2>
              <p className="text-xs text-stone-500 font-medium">Across all customer accounts</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Cumulative LTV</span>
                <Award className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#0E2A1B]">₹{totalSpendAll.toLocaleString('en-IN')}</h2>
              <p className="text-xs text-stone-500 font-medium">Total customer lifetime revenue</p>
            </div>
          </div>

          {/* Action Bar & Filter Tabs */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-[#FAF7F2] rounded-lg border border-stone-200 text-xs sm:text-sm">
              {['All', 'Gold', 'Platinum', 'Silver'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3.5 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
                    tierFilter === tier
                      ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tier === 'All' ? 'All Customers' : `${tier} Tier`}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="bg-[#FAF7F2] px-3.5 py-2 rounded-lg border border-stone-200 flex items-center gap-2.5 w-full sm:w-88 text-xs sm:text-sm">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, city, phone..."
                className="bg-transparent focus:outline-none text-xs sm:text-sm w-full text-stone-800 placeholder:text-stone-400 font-medium"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-xs sm:text-[12.5px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Loyalty Tier</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Reward Points</th>
                    <th className="py-3.5 px-4">Orders Placed</th>
                    <th className="py-3.5 px-4">Total Spent</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={c.avatar}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-stone-200 bg-[#FAF7F2] shrink-0"
                          />
                          <div>
                            <div className="font-sans font-bold text-sm sm:text-[15px] text-[#0E2A1B]">{c.name}</div>
                            <div className="text-xs sm:text-[12px] text-stone-500 font-medium">{c.email} • {c.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          c.tier.includes('Platinum')
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : c.tier.includes('Gold')
                            ? 'bg-[#D4AF37]/20 text-[#0E2A1B] border border-[#D4AF37]/40'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}>
                          {c.tier}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-stone-700 text-xs sm:text-sm font-medium">
                        {c.city}, {c.state}
                      </td>

                      <td className="py-3 px-4 font-bold text-amber-800 text-xs sm:text-sm">
                        ✨ {c.rewardsPoints} pts
                      </td>

                      <td className="py-3 px-4 font-semibold text-stone-900 text-xs sm:text-sm">
                        {c.totalOrders} orders
                      </td>

                      <td className="py-3 px-4 font-bold text-[#0E2A1B] text-sm sm:text-base">
                        ₹{c.totalSpent.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0E2A1B] hover:text-[#D4AF37] px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors shadow-2xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex items-center justify-between text-xs sm:text-sm text-stone-600">
              <span className="font-semibold">Showing {filteredCustomers.length} registered customers</span>
              <span className="hidden sm:inline font-medium">100% synchronized with user authentication profile</span>
            </div>
          </div>

        </main>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div 
          data-lenis-prevent
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCustomer(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
        >
          <div 
            data-lenis-prevent
            className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col my-auto"
          >
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <img src={selectedCustomer.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37]" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">{selectedCustomer.tier}</span>
                  <h3 className="font-sans text-base sm:text-xl font-bold mt-0.5">{selectedCustomer.name}</h3>
                  <p className="text-xs text-stone-300">Customer since {selectedCustomer.memberSince}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 font-sans">
              {/* Contact Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs sm:text-sm">
                <div>
                  <span className="text-stone-500 block text-[11px] font-bold uppercase">Phone</span>
                  <strong className="text-stone-800 font-semibold">{selectedCustomer.phone}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px] font-bold uppercase">Email</span>
                  <strong className="text-stone-800 font-semibold truncate block">{selectedCustomer.email}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px] font-bold uppercase">Reward Balance</span>
                  <strong className="text-amber-800 font-bold">{selectedCustomer.rewardsPoints} Points</strong>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px] font-bold uppercase">Lifetime Spend</span>
                  <strong className="text-[#0E2A1B] font-bold">₹{selectedCustomer.totalSpent}</strong>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="font-sans text-sm sm:text-base font-bold text-[#0E2A1B]">Order History ({customerOrders.length})</h4>
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No placed orders found for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(ord => (
                      <div key={ord.id} className="p-3 rounded-lg border border-stone-200 flex items-center justify-between text-xs sm:text-sm hover:bg-stone-50 transition-colors">
                        <div>
                          <div className="font-bold text-[#0E2A1B]">#{ord.id} • <span className="font-normal text-stone-500">{ord.date}</span></div>
                          <p className="text-xs text-stone-500 mt-0.5">{ord.items?.length || 1} snack items • {ord.deliveryType}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-stone-900 text-sm">₹{ord.total}</div>
                          <span className="text-[11px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-lg bg-[#0E2A1B] text-white text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#1B3B29] transition-colors"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
