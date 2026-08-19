import React, { useState, useEffect, useRef } from 'react';
import { X, Check, UploadCloud, Image as ImageIcon, Trash2, Plus, RefreshCw, Star } from 'lucide-react';

import { CATEGORIES } from '../../../data/categories';
import { useAdmin } from '../../../context/AdminContext';

const EMPTY_PRODUCT = {
  name: '',
  tagline: '',
  category: 'classic-makhana',
  subcategory: '',
  isBestseller: false,
  price: '',
  oldPrice: '',
  discountPercent: '',
  stockCount: '',
  badge: '',
  image: '',
  description: '',
  variants: [
    { id: 'v1', name: 'Standard Pack', weight: '250g', price: '', oldPrice: '', stock: '' }
  ]
};

export default function AddProductModal({ isOpen, onClose, onSave, initialData = null }) {
  const [activeTab, setActiveTab] = useState('basic');
  const fileInputRef = useRef(null);
  const { categories: adminCategories } = useAdmin();

  const allCategories = (adminCategories && adminCategories.length > 0) ? adminCategories : CATEGORIES;

  const [formData, setFormData] = useState(EMPTY_PRODUCT);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          subcategory: initialData.subcategory || '',
          isBestseller: !!initialData.isBestseller,
          variants: initialData.variants || [
            { id: 'v1', name: 'Standard Pack', weight: '250g', price: initialData.price || '', oldPrice: initialData.oldPrice || '', stock: initialData.stockCount || '' }
          ]
        });
      } else {
        setFormData(EMPTY_PRODUCT);
      }
      setActiveTab('basic');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Selected Category's live subcategories
  const selectedCategoryObj = allCategories.find(
    c => c.slug === formData.category || c.id === formData.category
  );
  const currentSubcategories = selectedCategoryObj?.subcategories || [];

  // Handle local file image upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Variant operations
  const handleAddVariant = () => {
    const newId = `v_${Date.now()}`;
    const newVariant = {
      id: newId,
      name: 'New Size / Pack',
      weight: '250g',
      price: formData.price || 249,
      oldPrice: formData.oldPrice || 299,
      stock: 100
    };
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }));
  };

  const handleUpdateVariant = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const handleRemoveVariant = (id) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).filter(v => v.id !== id)
    }));
  };

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
    <div 
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col h-[85vh] max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">CATALOG MANAGEMENT</span>
            <h3 className="font-sans text-base sm:text-xl font-bold mt-0.5">{initialData ? 'Edit Product' : 'Add New Snack Product'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Tabs */}
        <div className="flex border-b border-stone-200 px-4 sm:px-6 bg-[#FAF7F2] gap-4 sm:gap-6 shrink-0">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'pricing', label: 'Pricing & Stock' },
            { id: 'variants', label: 'Product Variants' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs sm:text-[13.5px] font-bold tracking-wide border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#0E2A1B] text-[#0E2A1B]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Container */}
        <div 
          data-lenis-prevent
          className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 overscroll-contain"
        >
          <form id="productForm" onSubmit={handleSubmit} className="space-y-4 font-sans">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Smoky Barbecue Makhana"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>

                {/* Category and Associated Subcategory Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          category: e.target.value,
                          subcategory: ''
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white cursor-pointer"
                    >
                      {allCategories.map(c => (
                        <option key={c.id} value={c.slug || c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Subcategory</label>
                    <select
                      value={formData.subcategory || ''}
                      onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                      disabled={currentSubcategories.length === 0}
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white cursor-pointer ${
                        currentSubcategories.length === 0 ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : ''
                      }`}
                    >
                      {currentSubcategories.length > 0 ? (
                        <>
                          <option value="">Select Subcategory (Optional)</option>
                          {currentSubcategories.map(sub => (
                            <option key={sub.id || sub.name} value={sub.name}>{sub.name}</option>
                          ))}
                        </>
                      ) : (
                        <option value="">No subcategories available</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Short Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Roasted fox nuts with hickory smoked paprika"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>

                {/* Homepage Best Sellers Visibility Section */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200 space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#0E2A1B]">
                    Homepage Visibility
                  </span>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.isBestseller ? 'bg-[#0E2A1B]/5 border-[#0E2A1B]' : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.isBestseller}
                      onChange={e => setFormData({ 
                        ...formData, 
                        isBestseller: e.target.checked,
                        badge: e.target.checked && !formData.badge ? 'Bestseller' : formData.badge
                      })}
                      className="w-4 h-4 mt-0.5 rounded text-[#0E2A1B] focus:ring-[#0E2A1B] accent-[#0E2A1B]"
                    />
                    <div>
                      <p className="text-xs sm:text-[13px] font-bold text-stone-900 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                        <span>Show in Best Sellers Section</span>
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">Feature this product in the Customer Favorites (Best Sellers) section on the Homepage</p>
                    </div>
                  </label>
                </div>

                {/* Upload Image Section */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1.5">
                    Product Image Upload *
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-[#0E2A1B] rounded-xl p-4 bg-[#FAF7F2] transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 group"
                  >
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-stone-200 bg-white shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    <div className="text-center sm:text-left space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm font-bold text-[#0E2A1B]">
                        <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                        <span>Click to Upload New Image</span>
                      </div>
                      <p className="text-xs text-stone-500 font-normal">
                        Supports PNG, JPG, WEBP formats up to 5MB.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#0E2A1B] bg-white px-2.5 py-1 rounded border border-stone-300 shadow-2xs hover:bg-stone-50"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Choose File</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Base Selling Price (₹)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      value={formData.oldPrice}
                      onChange={e => setFormData({ ...formData, oldPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Stock Count</label>
                    <input
                      type="number"
                      value={formData.stockCount}
                      onChange={e => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Bestseller, 20% OFF, New"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Product Variants Tab */}
            {activeTab === 'variants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-sans text-xs sm:text-sm font-bold text-[#0E2A1B]">Pack Sizes & Variants</h4>
                    <p className="text-xs text-stone-500">Configure different weights and packaging options for this snack item.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 rounded-md bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold flex items-center gap-1 hover:bg-[#1B3B29] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.variants || []).map((v, idx) => (
                    <div 
                      key={v.id || idx}
                      className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0E2A1B]">Variant #{idx + 1}</span>
                        {(formData.variants?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(v.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Variant Name</label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={e => handleUpdateVariant(v.id, 'name', e.target.value)}
                            placeholder="e.g. 250g Jar"
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Weight / Volume</label>
                          <input
                            type="text"
                            value={v.weight}
                            onChange={e => handleUpdateVariant(v.id, 'weight', e.target.value)}
                            placeholder="e.g. 250g"
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Selling Price (₹)</label>
                          <input
                            type="number"
                            value={v.price}
                            onChange={e => handleUpdateVariant(v.id, 'price', Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Original Price (₹)</label>
                          <input
                            type="number"
                            value={v.oldPrice}
                            onChange={e => handleUpdateVariant(v.id, 'oldPrice', Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Stock</label>
                          <input
                            type="number"
                            value={v.stock}
                            onChange={e => handleUpdateVariant(v.id, 'stock', Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer buttons (Fixed at bottom) */}
        <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="productForm"
            className="px-6 py-2.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-102 transition-all"
          >
            <Check className="w-4 h-4 text-[#D4AF37]" />
            <span>Save Product</span>
          </button>
        </div>

      </div>
    </div>
  );
}
