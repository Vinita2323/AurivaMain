import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export default function AdminSettings() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Store Settings" />

        <main className="p-4 sm:p-8 space-y-6 max-w-4xl">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D5] shadow-xs space-y-6">
            
            <div className="border-b border-stone-200 pb-4">
              <h2 className="font-serif text-xl font-bold text-[#0E2A1B]">General Store Configuration</h2>
              <p className="text-xs text-stone-500">Manage delivery thresholds, GST tax configuration, and support helpline.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Store Brand Name</label>
                  <input type="text" defaultValue="AURIVÁ Foods Private Limited" className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Support Email</label>
                  <input type="email" defaultValue="care@aurivafoods.com" className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Free Delivery Minimum (₹)</label>
                  <input type="number" defaultValue="499" className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Standard Delivery Fee (₹)</label>
                  <input type="number" defaultValue="40" className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">GST Tax Rate (%)</label>
                  <input type="number" defaultValue="5" className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Fulfillment Central Hub Address</label>
                <textarea rows={2} defaultValue="AURIVÁ Logistics Hub, Plot 14, Sanwer Road Industrial Area, Indore, Madhya Pradesh - 452015" className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300" />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                {saved ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Save className="w-4 h-4 text-[#D4AF37]" />}
                <span>{saved ? 'Settings Saved' : 'Save Configurations'}</span>
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
