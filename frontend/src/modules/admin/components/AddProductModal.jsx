import React, { useState, useEffect, useRef } from 'react';
import { X, Check, UploadCloud, Image as ImageIcon, Trash2, Plus, RefreshCw, Star, Loader2, Cloud, Sparkles } from 'lucide-react';

import { CATEGORIES } from '../../../data/categories';
import { useAdmin } from '../../../context/AdminContext';
import { uploadApi } from '../../../utils/api';

const EMPTY_PRODUCT = {
  name: '',
  tagline: '',
  category: 'flavoured-makhana',
  subcategory: '',
  isBestseller: true,
  price: 249,
  oldPrice: 299,
  discountPercent: 17,
  stockCount: 150,
  badge: 'BESTSELLER',
  image: '',
  description: '',
  variants: [
    { id: 'v1', name: 'Standard Pack', weight: '150g', price: 249, oldPrice: 299, stock: 150 }
  ]
};

export default function AddProductModal({ isOpen, onClose, onSave, initialData = null }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { categories: adminCategories } = useAdmin();

  const allCategories = (adminCategories && adminCategories.length > 0) ? adminCategories : CATEGORIES;

  const [formData, setFormData] = useState(EMPTY_PRODUCT);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          price: initialData.price !== undefined ? initialData.price : 249,
          oldPrice: initialData.oldPrice !== undefined ? initialData.oldPrice : 299,
          stockCount: initialData.stockCount !== undefined ? initialData.stockCount : 150,
          subcategory: initialData.subcategory || '',
          isBestseller: initialData.isBestseller !== undefined ? Boolean(initialData.isBestseller) : true,
          variants: initialData.variants || [
            { id: 'v1', name: 'Standard Pack', weight: initialData.weight || '150g', price: initialData.price || 249, oldPrice: initialData.oldPrice || 299, stock: initialData.stockCount || 150 }
          ]
        });
      } else {
        setFormData(EMPTY_PRODUCT);
      }
      setActiveTab('basic');
      setIsUploadingImage(false);
      setIsSubmitting(false);
      setUploadStatusMsg('');
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

  // Handle local file image upload to Cloudinary
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary API
    setIsUploadingImage(true);
    setUploadStatusMsg('Uploading image to Cloudinary...');
    try {
      const res = await uploadApi.uploadImage(file, 'auriva_products');
      if (res && res.data && res.data.url) {
        setFormData(prev => ({ ...prev, image: res.data.url }));
        setUploadStatusMsg('Uploaded to Cloudinary!');
      }
    } catch (err) {
      console.warn('Cloudinary upload notification:', err.message);
      setUploadStatusMsg('Image preview saved');
    } finally {
      setIsUploadingImage(false);
      setTimeout(() => setUploadStatusMsg(''), 3500);
    }
  };

  // Variant operations
  const handleAddVariant = () => {
    const newId = `v_${Date.now()}`;
    const newVariant = {
      id: newId,
      name: 'New Size / Pack',
      weight: '300g',
      price: Math.round(Number(formData.price || 249) * 1.8),
      oldPrice: Math.round(Number(formData.oldPrice || 299) * 1.8),
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid selling price greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        price: priceNum,
        oldPrice: Number(formData.oldPrice || Math.round(priceNum * 1.2)),
        stockCount: Number(formData.stockCount || 150),
        isBestseller: Boolean(formData.isBestseller),
        badge: formData.badge || (formData.isBestseller ? 'BESTSELLER' : '')
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save product. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col h-[88vh] max-h-[88vh] animate-in fade-in zoom-in-95 duration-200 border border-[#D4AF37]/30"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> STORE CATALOG
            </span>
            <h3 className="font-sans text-base sm:text-xl font-bold mt-0.5">{initialData ? 'Edit Product' : 'Add New Snack Product'}</h3>
          </div>
          <button 
            type="button" 
            disabled={isSubmitting} 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Tabs */}
        <div className="flex border-b border-stone-200 px-4 sm:px-6 bg-[#FAF7F2] gap-4 sm:gap-6 shrink-0">
          {[
            { id: 'basic', label: 'Product Details & Pricing' },
            { id: 'variants', label: 'Pack Sizes & Variants' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
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
                
                {/* Title */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Artisanal Truffle & Herb Makhana"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-1 focus:ring-[#0E2A1B]"
                  />
                </div>

                {/* Category and Associated Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">Category *</label>
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
                    <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">Subcategory</label>
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

                {/* Pricing & Stock Row */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200 space-y-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#0E2A1B]">
                    Pricing & Inventory Details
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-bold text-stone-700 mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        placeholder="249"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-stone-700 mb-1">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.oldPrice}
                        onChange={e => setFormData({ ...formData, oldPrice: e.target.value })}
                        placeholder="299"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-stone-700 mb-1">
                        Stock Units
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stockCount}
                        onChange={e => setFormData({ ...formData, stockCount: e.target.value })}
                        placeholder="150"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Homepage Best Sellers Inclusion Option */}
                <div className={`p-4 rounded-xl border transition-all ${
                  formData.isBestseller 
                    ? 'bg-[#0E2A1B]/5 border-[#0E2A1B] shadow-2xs' 
                    : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0E2A1B] flex items-center gap-1.5">
                      <Star className={`w-3.5 h-3.5 ${formData.isBestseller ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-stone-400'}`} />
                      Bestseller Status
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      formData.isBestseller 
                        ? 'bg-[#0E2A1B] text-[#D4AF37]' 
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {formData.isBestseller ? 'Included in Bestsellers' : 'Regular Product'}
                    </span>
                  </div>
                  
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all bg-white ${
                    formData.isBestseller ? 'border-[#0E2A1B]/40 ring-1 ring-[#0E2A1B]/20' : 'border-stone-200 hover:border-stone-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.isBestseller}
                      onChange={e => setFormData({ 
                        ...formData, 
                        isBestseller: e.target.checked,
                        badge: e.target.checked && !formData.badge ? 'BESTSELLER' : formData.badge
                      })}
                      className="w-4 h-4 mt-0.5 rounded text-[#0E2A1B] focus:ring-[#0E2A1B] accent-[#0E2A1B] cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-[13.5px] font-bold text-stone-900 flex items-center gap-1.5">
                        <span>Include this product in Bestseller section</span>
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                        When enabled, this product automatically displays on the User App homepage in the <strong>"Our Bestsellers"</strong> carousel.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Upload Image Section with Direct Cloudinary */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1.5">
                    Product Image (Cloudinary Direct Upload)
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
                    className="border-2 border-dashed border-stone-300 hover:border-[#0E2A1B] rounded-xl p-4 bg-[#FAF7F2] transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 group relative"
                  >
                    {isUploadingImage ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-stone-100 border border-stone-200 flex flex-col items-center justify-center text-[#0E2A1B] shrink-0 gap-1 animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                        <span className="text-[9px] font-bold">Uploading...</span>
                      </div>
                    ) : formData.image ? (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-stone-200 bg-white shadow-2xs shrink-0"
                        />
                        {formData.image.includes('cloudinary') && (
                          <span className="absolute -bottom-1 -right-1 bg-[#0E2A1B] text-[#D4AF37] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                            <Cloud className="w-2.5 h-2.5" /> Cloud
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    <div className="text-center sm:text-left space-y-1 flex-1">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm font-bold text-[#0E2A1B]">
                        <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                        <span>{isUploadingImage ? 'Uploading directly to Cloudinary...' : 'Click to Upload Product Photo'}</span>
                      </div>
                      <p className="text-xs text-stone-500 font-normal">
                        Direct upload to Cloudinary storage. Supports PNG, JPG, WEBP formats.
                      </p>
                      {uploadStatusMsg && (
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-center sm:justify-start">
                          <Check className="w-3.5 h-3.5" />
                          <span>{uploadStatusMsg}</span>
                        </p>
                      )}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#0E2A1B] bg-white px-2.5 py-1 rounded border border-stone-300 shadow-2xs hover:bg-stone-50 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isUploadingImage ? 'animate-spin' : ''}`} />
                          <span>{isUploadingImage ? 'Processing...' : 'Choose File'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Tagline */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">Short Tagline / Flavor Note</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Infused with sun-dried Italian garden herbs"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the roast quality, ingredients, and flavor profile..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
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
                    <p className="text-xs text-stone-500">Configure multiple weight sizes for this snack item.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 rounded-md bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold flex items-center gap-1 hover:bg-[#1B3B29] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size</span>
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
                            placeholder="e.g. Family Pack"
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">Weight / Size</label>
                          <input
                            type="text"
                            value={v.weight}
                            onChange={e => handleUpdateVariant(v.id, 'weight', e.target.value)}
                            placeholder="e.g. 300g"
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
            disabled={isSubmitting}
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="productForm"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-102 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-[#D4AF37]" />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
