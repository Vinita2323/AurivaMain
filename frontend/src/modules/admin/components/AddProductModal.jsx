import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

import { CATEGORIES } from '../../../data/categories';
import { FLAVORS } from '../../../data/flavors';

export default function AddProductModal({ isOpen, onClose, onSave, initialData = null }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(() => {
    if (initialData) return initialData;
    return {
      name: '',
      tagline: '',
      category: 'makhana',
      flavor: 'Classic Salted',
      price: 249,
      oldPrice: 299,
      discountPercent: 20,
      stockCount: 150,
      badge: 'New',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=700&auto=format&fit=crop&q=80',
      description: 'Slow-roasted crispy fox nuts infused with pristine organic spices and cold pressed oil mist.',
      ingredients: 'Jumbo Fox Nuts (Phool Makhana 90%), Olive Oil (6%), Himalayan Rock Salt (4%).',
      calories: '105 kcal',
      protein: '4.8g',
      fiber: '3.6g'
    };
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Please enter a product name.");
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E8E2D5] shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">CATALOG MANAGEMENT</span>
            <h3 className="font-serif text-xl font-bold">{initialData ? 'Edit Product' : 'Add New Snack Product'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-[#FAF7F2] gap-4">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'pricing', label: 'Pricing & Stock' },
            { id: 'nutrition', label: 'Ingredients & Nutrition' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#0E2A1B] text-[#0E2A1B]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Smoky Barbecue Makhana"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Short Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Roasted fox nuts with hickory smoked paprika"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Flavor Profile</label>
                  <select
                    value={formData.flavor}
                    onChange={e => setFormData({ ...formData, flavor: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white"
                  >
                    {FLAVORS.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Product Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={formData.oldPrice}
                    onChange={e => setFormData({ ...formData, oldPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={formData.stockCount}
                    onChange={e => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={e => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. Bestseller, 20% OFF, New"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Ingredients</label>
                <textarea
                  rows={2}
                  value={formData.ingredients}
                  onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Calories</label>
                  <input
                    type="text"
                    value={formData.calories}
                    onChange={e => setFormData({ ...formData, calories: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Protein</label>
                  <input
                    type="text"
                    value={formData.protein}
                    onChange={e => setFormData({ ...formData, protein: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dietary Fiber</label>
                  <input
                    type="text"
                    value={formData.fiber}
                    onChange={e => setFormData({ ...formData, fiber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold uppercase tracking-wider text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>Save Product</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
