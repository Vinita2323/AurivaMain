import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Sparkles, X, Check } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminPromotions() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { promotions, categories, addPromotion, deletePromotion, togglePromotionStatus } = useAdmin();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    type: 'Category Discount',
    discount: 20,
    category: 'all',
    bannerTag: 'Special Offer',
    startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    endDate: '31 Dec 2024',
    minOrder: 499
  });

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const filteredPromos = promotions.filter(p => {
    if (activeFilter === 'active' && p.status !== 'Active') return false;
    if (activeFilter === 'inactive' && p.status === 'Active') return false;
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a campaign name");
      return;
    }
    addPromotion(formData);
    setIsModalOpen(false);
    setFormData({
      name: '',
      tagline: '',
      type: 'Category Discount',
      discount: 20,
      category: 'all',
      bannerTag: 'Special Offer',
      startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      endDate: '31 Dec 2024',
      minOrder: 499
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Promotions & Campaign Engine" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          
          {/* Top Bar */}
          <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-[#0E2A1B]">Seasonal Deals & Flash Offers</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">Configure bundle deals, flash sales, category markdowns, and festival campaigns.</p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4.5 py-2.5 rounded-lg bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-bold text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:scale-102 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Create Campaign</span>
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] rounded-lg border border-stone-200 shadow-2xs w-fit text-xs sm:text-sm">
            {[
              { id: 'all', label: 'All Campaigns', count: promotions.length },
              { id: 'active', label: 'Active', count: promotions.filter(p => p.status === 'Active').length },
              { id: 'inactive', label: 'Inactive', count: promotions.filter(p => p.status !== 'Active').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-md font-bold transition-all ${
                  activeFilter === tab.id
                    ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Promotions Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {filteredPromos.map(p => {
              const isActive = p.status === 'Active';
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-[#E8E2D5] shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-all w-full"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-[#0E2A1B] text-[#D4AF37] px-2.5 py-1 rounded-md shadow-2xs">
                        {p.bannerTag || 'Campaign'}
                      </span>
                      <button
                        onClick={() => togglePromotionStatus(p.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {p.status}
                      </button>
                    </div>

                    <h3 className="font-sans text-sm sm:text-base font-bold text-[#0E2A1B]">{p.name}</h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">{p.tagline}</p>

                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200 text-xs sm:text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Discount Benefit:</span>
                        <strong className="text-emerald-800 font-bold">{p.discount}% OFF</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Min. Order Value:</span>
                        <strong className="text-stone-800 font-semibold">₹{p.minOrder || 499}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Offer Type:</span>
                        <span className="font-semibold text-stone-800">{p.type}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 font-medium">
                      Active: {p.startDate} — {p.endDate}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">Applied to Storefront</span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete promotion "${p.name}"?`)) {
                          deletePromotion(p.id);
                        }
                      }}
                      className="text-xs sm:text-sm text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </main>
      </div>

      {/* Create Promotion Modal */}
      {isModalOpen && (
        <div 
          data-lenis-prevent
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
        >
          <div 
            data-lenis-prevent
            className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
          >
            <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">CAMPAIGN BUILDER</span>
                <h3 className="font-sans text-base sm:text-xl font-bold mt-0.5">New Promotional Offer</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 font-sans">
              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Festive Diwali Royal Gifting Box"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Tagline / Subtext</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Flat 25% OFF on luxury assortments"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Campaign Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Category Discount">Category Discount</option>
                    <option value="BOGO Offer">BOGO Offer</option>
                    <option value="Flat Off">Flat Off</option>
                    <option value="Festive Exclusive">Festive Exclusive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Target Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Minimum Order (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrder}
                    onChange={e => setFormData({ ...formData, minOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span>Launch Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
