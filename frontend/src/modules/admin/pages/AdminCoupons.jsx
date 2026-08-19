import React, { useState } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import CreateCouponModal from '../components/CreateCouponModal';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminCoupons() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { coupons, addCoupon, deleteCoupon, toggleCouponStatus } = useAdmin();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Coupons & Discount Engine" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          
          {/* Top Header & Create Button */}
          <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#0E2A1B]">Active Coupon Rules</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">Manage promotional codes, minimum order criteria and seasonal discounts.</p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4.5 py-2.5 rounded-lg bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-bold text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:scale-102 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Create Coupon</span>
            </button>
          </div>

          {/* Coupons Table Card */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-xs sm:text-[12.5px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Coupon Code</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Min. Order</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Validity</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {coupons.map((c) => {
                    const isActive = c.status === 'Active';
                    return (
                      <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-extrabold text-xs sm:text-sm text-[#0E2A1B] tracking-wider bg-[#FAF7F2] px-3 py-1 rounded-md border border-stone-200 shadow-2xs">
                              {c.code}
                            </span>
                            <button
                              onClick={() => handleCopy(c.code)}
                              className="text-stone-400 hover:text-[#0E2A1B] p-1 rounded-md hover:bg-stone-100 transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === c.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-[12px] text-stone-500 mt-1 max-w-xs">{c.description}</p>
                        </td>

                        <td className="py-3.5 px-4 text-stone-700 text-xs sm:text-sm font-semibold">
                          {c.type}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-800 text-sm sm:text-base">
                          {c.discountDisplay || `${c.discount}%`}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-stone-900 text-xs sm:text-sm">
                          ₹{c.minOrder}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleCouponStatus(c.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                            }`}
                          >
                            {c.status}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-stone-600 text-xs sm:text-sm font-medium">
                          {c.validity}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete coupon code ${c.code}?`)) {
                                deleteCoupon(c.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex items-center justify-between text-xs sm:text-sm text-stone-600">
              <span className="font-semibold">{coupons.length} promotional rules configured</span>
              <span className="hidden sm:inline font-medium">Applies in Cart and Checkout seamlessly</span>
            </div>
          </div>

        </main>
      </div>

      <CreateCouponModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={addCoupon}
      />
    </div>
  );
}
