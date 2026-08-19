import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function AddCategoryModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    subtext: '',
    slug: '',
    description: '',
    badge: 'Popular',
    order: 1,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
    popular: true
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          name: '',
          subtext: 'Crispy & Hand-Roasted',
          slug: '',
          description: 'Slow-roasted artisan snacks infused with authentic spice blends.',
          badge: 'Popular',
          order: 1,
          status: 'Active',
          image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
          popular: true
        });
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const name = e.target.value;
    const autoSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: initialData ? prev.slug : autoSlug
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please provide a category title");
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div 
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">ROOT CATEGORY MANAGEMENT</span>
            <h3 className="font-sans text-base sm:text-xl font-bold mt-0.5">{initialData ? 'Edit Category' : 'Create New Category'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 font-sans">
          <div>
            <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Category Title *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. ROASTED SEED MIXES"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Subtext / Tagline</label>
              <input
                type="text"
                value={formData.subtext}
                onChange={e => setFormData({ ...formData, subtext: e.target.value })}
                placeholder="e.g. High Protein & Superseeds"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">URL Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. roasted-seed-mixes"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={formData.badge}
                onChange={e => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. Bestseller"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Order</label>
              <input
                type="number"
                min="1"
                value={formData.order || 1}
                onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Cover Image URL</label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0 bg-stone-100"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short overview of what makes this category special..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{initialData ? 'Update Category' : 'Create Category'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
