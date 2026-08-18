import React from 'react';
import { Plus } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminBanners() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { banners, deleteBanner } = useAdmin();

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Banner & Campaign Management" />

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#0E2A1B]">Promotional Banners</h2>
              <p className="text-xs text-stone-500">Configure homepage editorial banners and seasonal festival campaigns.</p>
            </div>
            <button 
              onClick={() => alert("Add banner dialog triggered.")}
              className="px-5 py-2.5 rounded-xl gold-gradient-btn text-[#0E2A1B] font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#0E2A1B]" />
              <span>Add Banner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {banners.map(b => (
              <div key={b.id} className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0E2A1B] text-[#D4AF37] px-2.5 py-0.5 rounded-md">
                    {b.tag}
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#0E2A1B] mt-2">{b.title}</h3>
                  <p className="text-xs text-stone-500 mt-1">{b.subtitle}</p>
                  <p className="text-[11px] text-stone-400 mt-3">Valid: {b.startDate} - {b.endDate}</p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">{b.status}</span>
                  <button onClick={() => deleteBanner(b.id)} className="text-xs text-rose-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
