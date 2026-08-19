import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function AddBannerModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    cta: 'Shop Now',
    link: '/shop',
    tag: 'Hero Banner',
    status: 'Active',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        subtitle: '',
        cta: 'Shop Now',
        link: '/shop',
        tag: 'Promotional',
        status: 'Active',
        startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        endDate: '31 Dec 2024'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a banner headline");
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E8E2D5] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">MARKETING CAMPAIGN</span>
            <h3 className="font-serif text-xl font-bold">{initialData ? 'Edit Campaign Banner' : 'Create New Banner'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Banner Headline *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Real Ingredients. Real Nutrition."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Subtitle / Subtext</label>
            <textarea
              rows={2}
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. Premium slow-roasted makhana crafted for mindful snacking."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Campaign Tag</label>
              <select
                value={formData.tag}
                onChange={e => setFormData({ ...formData, tag: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none bg-white"
              >
                <option value="Hero Banner">Hero Banner</option>
                <option value="Promotional">Promotional</option>
                <option value="Flash Sale">Flash Sale</option>
                <option value="Seasonal Fest">Seasonal Fest</option>
                <option value="New Launch">New Launch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Button CTA Text</label>
              <input
                type="text"
                value={formData.cta}
                onChange={e => setFormData({ ...formData, cta: e.target.value })}
                placeholder="e.g. Shop Now"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Target Link</label>
              <input
                type="text"
                value={formData.link}
                onChange={e => setFormData({ ...formData, link: e.target.value })}
                placeholder="e.g. /shop"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Start Date</label>
              <input
                type="text"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                placeholder="e.g. 01 Aug 2024"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">End Date</label>
              <input
                type="text"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                placeholder="e.g. 31 Dec 2024"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-102 transition-all"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{initialData ? 'Save Changes' : 'Publish Banner'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
