import React, { useState, useEffect } from 'react';
import { Save, Check, ShieldCheck, Truck, Percent, Building2 } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminSettings() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, updateSettings } = useAdmin();
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Store Settings & Rules" />

        <main className="p-4 sm:p-8 space-y-6 max-w-4xl">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-6">
            
            <div className="border-b border-stone-200 pb-4">
              <h2 className="font-serif text-xl font-bold text-[#0E2A1B]">General Store & Delivery Configuration</h2>
              <p className="text-xs text-stone-500 mt-0.5">Configure live delivery thresholds, GST tax calculations, and warehouse logistics address.</p>
            </div>

            <div className="space-y-4">
              {/* Brand & Support Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Store Brand Entity Name</label>
                  <input
                    type="text"
                    value={formData.storeName || ''}
                    onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Customer Support Email</label>
                  <input
                    type="email"
                    value={formData.supportEmail || ''}
                    onChange={e => setFormData({ ...formData, supportEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>
              </div>

              {/* Delivery Threshold, Fee & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Free Delivery Minimum (₹)</label>
                  <input
                    type="number"
                    value={formData.freeDeliveryThreshold ?? 499}
                    onChange={e => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Applied live at checkout</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Standard Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.standardDeliveryFee ?? 40}
                    onChange={e => setFormData({ ...formData, standardDeliveryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">For orders under threshold</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.gstRate ?? 5}
                    onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 bg-white"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Calculated in cart breakdown</span>
                </div>
              </div>

              {/* Central Hub Address */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Central Warehouse Logistics Hub Address</label>
                <textarea
                  rows={2}
                  value={formData.hubAddress || ''}
                  onChange={e => setFormData({ ...formData, hubAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Low Inventory Alert Threshold (Units)</label>
                <input
                  type="number"
                  value={formData.lowStockThreshold ?? 30}
                  onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                  className="w-48 px-3.5 py-2 text-xs rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                {saved ? '✅ Store settings synchronized successfully!' : 'Changes update store checkout calculation instantly'}
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:scale-102 transition-all"
              >
                {saved ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Save className="w-4 h-4 text-[#D4AF37]" />}
                <span>{saved ? 'Configurations Saved' : 'Save Store Rules'}</span>
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
