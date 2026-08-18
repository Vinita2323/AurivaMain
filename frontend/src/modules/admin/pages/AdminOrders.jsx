import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAuth } from '../../../context/AuthContext';


export default function AdminOrders() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { orders } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const tabs = ['All', 'Quick Commerce', 'Courier', 'Processing', 'Packed', 'Dispatched', 'Delivered'];

  const filteredOrders = orders.filter(o => {
    if (activeTab !== 'All') {
      if (activeTab === 'Quick Commerce' && o.deliveryType !== 'Quick Commerce') return false;
      if (activeTab === 'Courier' && o.deliveryType !== 'Courier') return false;
      if (['Processing', 'Packed', 'Dispatched', 'Delivered'].includes(activeTab) && o.status !== activeTab) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Orders Fulfillment" />

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 bg-white rounded-2xl border border-[#E8E2D5] shadow-xs">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-[#0E2A1B] text-[#D4AF37]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="bg-white p-3 rounded-2xl border border-[#E8E2D5] flex items-center gap-2 w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Order ID or Customer..."
              className="bg-transparent focus:outline-none text-xs w-full text-stone-800"
            />
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-4 px-4">Order ID</th>
                    <th className="py-4 px-4">Customer</th>
                    <th className="py-4 px-4">Items</th>
                    <th className="py-4 px-4">Amount</th>
                    <th className="py-4 px-4">Delivery Mode</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredOrders.map(ord => (
                    <tr key={ord.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-[#0E2A1B]">#{ord.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-stone-900">{ord.customer}</div>
                        <div className="text-[10px] text-stone-400">{ord.phone}</div>
                      </td>
                      <td className="py-4 px-4 text-stone-600">
                        {ord.items?.length || 1} snack items
                      </td>
                      <td className="py-4 px-4 font-bold text-stone-900">₹{ord.total}</td>
                      <td className="py-4 px-4">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {ord.deliveryType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
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
                          <span>Track</span>
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
