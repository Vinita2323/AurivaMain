import React, { useState, useEffect, useRef } from 'react';
import { X, Check, UploadCloud, Image as ImageIcon, Trash2, Plus, RefreshCw, Star, Loader2, Cloud, Sparkles, Link as LinkIcon, Layers } from 'lucide-react';

import { CATEGORIES } from '../../../data/categories';
import { useAdmin } from '../../../context/AdminContext';
import { uploadApi } from '../../../utils/api';
import { resolveProductImage } from '../../../utils/productImage';

const EMPTY_PRODUCT = {
  name: '',
  tagline: '',
  category: 'flavoured-makhana',
  isBestseller: true,
  price: 249,
  oldPrice: 299,
  discountPercent: 17,
  stockCount: 150,
  badge: 'BESTSELLER',
  image: '',
  gallery: [],
  description: '',
  details: '',
  productDetails: '',
  variants: [
    { id: 'v1', name: 'Standard Pack', weight: '150g', price: 249, oldPrice: 299, stock: 150 }
  ]
};

export default function AddProductModal({ isOpen, onClose, onSave, initialData = null, categories: propCategories = null }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef(null);
  const { categories: adminCategories, refreshCategories } = useAdmin();

  const allCategories = (propCategories && propCategories.length > 0)
    ? propCategories
    : (adminCategories && adminCategories.length > 0)
      ? adminCategories
      : CATEGORIES;

  const [formData, setFormData] = useState(EMPTY_PRODUCT);

  useEffect(() => {
    if (isOpen) {
      if (refreshCategories) {
        refreshCategories();
      }
      if (initialData) {
        const rawGallery = Array.isArray(initialData.gallery) && initialData.gallery.length > 0
          ? initialData.gallery
          : (initialData.image ? [initialData.image] : []);
        const mainImg = initialData.image || rawGallery[0] || '';
        const resolvedGallery = rawGallery.includes(mainImg)
          ? rawGallery
          : (mainImg ? [mainImg, ...rawGallery] : rawGallery);

        setFormData({
          ...initialData,
          image: mainImg,
          gallery: resolvedGallery,
          price: initialData.price !== undefined ? initialData.price : 249,
          oldPrice: initialData.oldPrice !== undefined ? initialData.oldPrice : 299,
          stockCount: initialData.stockCount !== undefined ? initialData.stockCount : 150,
          isBestseller: initialData.isBestseller !== undefined ? Boolean(initialData.isBestseller) : true,
          description: initialData.description || '',
          details: initialData.details || initialData.productDetails || '',
          productDetails: initialData.productDetails || initialData.details || '',
          variants: initialData.variants || [
            { id: 'v1', name: 'Standard Pack', weight: initialData.weight || '150g', price: initialData.price || 249, oldPrice: initialData.oldPrice || 299, stock: initialData.stockCount || 150 }
          ]
        });
      } else {
        const defaultCat = (allCategories && allCategories.length > 0)
          ? (allCategories[0].slug || allCategories[0].id || 'flavoured-makhana')
          : 'flavoured-makhana';
        setFormData({
          ...EMPTY_PRODUCT,
          category: defaultCat
        });
      }
      setActiveTab('basic');
      setIsUploadingImage(false);
      setIsSubmitting(false);
      setUploadStatusMsg('');
      setShowUrlInput(false);
      setUrlInputValue('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;


  // Multi-image upload to Cloudinary (up to 4 gallery photos)
  const handleGalleryFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentGallery = Array.isArray(formData.gallery) ? formData.gallery : [];
    const maxImages = 4;
    const remainingSlots = maxImages - currentGallery.length;

    if (remainingSlots <= 0) {
      alert("You can select up to 4 gallery photos. Please remove an existing photo first.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    // 1. Instant local base64 previews for rapid UI response
    const previewPromises = filesToProcess.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    const newPreviews = await Promise.all(previewPromises);

    setFormData(prev => {
      const existing = Array.isArray(prev.gallery) ? prev.gallery : [];
      const updated = [...existing, ...newPreviews].slice(0, maxImages);
      return {
        ...prev,
        gallery: updated,
        image: prev.image || updated[0] || ''
      };
    });

    // 2. Upload to Cloudinary API
    setIsUploadingImage(true);
    setUploadStatusMsg(`Uploading ${filesToProcess.length} photo(s) to Cloudinary...`);

    try {
      const uploadPromises = filesToProcess.map(file => uploadApi.uploadImage(file, 'auriva_products'));
      const results = await Promise.allSettled(uploadPromises);

      const uploadedUrls = [];
      results.forEach(res => {
        if (res.status === 'fulfilled' && res.value?.data?.url) {
          uploadedUrls.push(res.value.data.url);
        }
      });

      if (uploadedUrls.length > 0) {
        setFormData(prev => {
          const curGallery = Array.isArray(prev.gallery) ? [...prev.gallery] : [];
          let replaceIdx = 0;
          const finalGallery = curGallery.map(img => {
            if (typeof img === 'string' && img.startsWith('data:') && uploadedUrls[replaceIdx]) {
              return uploadedUrls[replaceIdx++];
            }
            return img;
          });
          return {
            ...prev,
            gallery: finalGallery,
            image: finalGallery[0] || prev.image || ''
          };
        });
        setUploadStatusMsg(`Uploaded ${uploadedUrls.length} photo(s) to Cloudinary!`);
      } else {
        setUploadStatusMsg('Photos preview saved');
      }
    } catch (err) {
      console.warn('Cloudinary upload error:', err.message);
      setUploadStatusMsg('Photos preview saved locally');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadStatusMsg(''), 4000);
    }
  };

  // Remove single image from gallery
  const handleRemoveGalleryImage = (idxToRemove) => {
    setFormData(prev => {
      const cur = Array.isArray(prev.gallery) ? prev.gallery : [];
      const updated = cur.filter((_, idx) => idx !== idxToRemove);
      return {
        ...prev,
        gallery: updated,
        image: updated[0] || ''
      };
    });
  };

  // Set selected gallery image as Primary Cover Photo
  const handleSetPrimaryImage = (targetIdx) => {
    setFormData(prev => {
      const cur = Array.isArray(prev.gallery) ? [...prev.gallery] : [];
      if (targetIdx < 0 || targetIdx >= cur.length) return prev;
      const [selected] = cur.splice(targetIdx, 1);
      const updated = [selected, ...cur];
      return {
        ...prev,
        gallery: updated,
        image: selected
      };
    });
  };

  // Add image by URL
  const handleAddUrlImage = () => {
    const url = urlInputValue.trim();
    if (!url) return;
    const cur = Array.isArray(formData.gallery) ? formData.gallery : [];
    if (cur.length >= 4) {
      alert("Maximum 4 photos allowed. Please remove a photo first.");
      return;
    }
    const updated = [...cur, url];
    setFormData(prev => ({
      ...prev,
      gallery: updated,
      image: prev.image || updated[0] || ''
    }));
    setUrlInputValue('');
    setShowUrlInput(false);
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
      const { subcategory, ...cleanFormData } = formData;
      const rawGallery = Array.isArray(formData.gallery) ? formData.gallery : [];
      const primaryImg = formData.image || rawGallery[0] || resolveProductImage();
      const finalGallery = rawGallery.length > 0
        ? (rawGallery.includes(primaryImg) ? rawGallery : [primaryImg, ...rawGallery])
        : [primaryImg];

      const payload = {
        ...cleanFormData,
        image: primaryImg,
        gallery: finalGallery,
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

                {/* Category Selection */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        category: e.target.value
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white cursor-pointer"
                  >
                    {allCategories.map(c => {
                      const catVal = c.slug || c.id || c._id;
                      return (
                        <option key={c.id || c.slug || c._id} value={catVal}>{c.name}</option>
                      );
                    })}
                  </select>
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

                {/* Product Photos & Gallery (3-4 Images Selection Option) */}
                <div className="p-3.5 sm:p-4 bg-[#FAF7F2] rounded-xl border border-stone-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block text-xs sm:text-[13px] font-bold text-stone-900">
                          Product Photos & Gallery
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          (formData.gallery?.length || 0) >= 3
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : (formData.gallery?.length || 0) > 0
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-stone-100 text-stone-600 border-stone-300'
                        }`}>
                          {(formData.gallery?.length || 0)} of 4 photos selected
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 font-normal">
                        Select <strong>3 to 4 images</strong> to showcase packaging front, roasted makhana texture, and nutrition details in the user app gallery slider.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] font-bold text-[#0E2A1B] hover:text-[#D4AF37] transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{showUrlInput ? 'Hide URL' : '+ Add via URL'}</span>
                    </button>
                  </div>

                  {/* Multi-file Hidden Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleGalleryFilesUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Add by URL input */}
                  {showUrlInput && (
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-300 animate-in fade-in duration-150">
                      <input
                        type="url"
                        value={urlInputValue}
                        onChange={e => setUrlInputValue(e.target.value)}
                        placeholder="Paste direct image URL (https://...)"
                        className="flex-1 px-3 py-1.5 text-xs bg-transparent focus:outline-none text-stone-800 placeholder:text-stone-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddUrlImage}
                        className="px-3 py-1.5 rounded bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#1B3B29] cursor-pointer"
                      >
                        Add Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUrlInput(false);
                          setUrlInputValue('');
                        }}
                        className="px-2 py-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Gallery Grid (3-4 Slots) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(formData.gallery || []).map((imgUrl, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div 
                          key={idx}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-white shadow-2xs group transition-all ${
                            isPrimary ? 'border-[#0E2A1B] ring-2 ring-[#D4AF37]/40' : 'border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <img
                            src={resolveProductImage(imgUrl)}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 pointer-events-none">
                            {isPrimary ? (
                              <span className="bg-[#0E2A1B] text-[#D4AF37] text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-[#D4AF37]" /> Cover
                              </span>
                            ) : (
                              <span className="bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-semibold px-1.5 py-0.5 rounded shadow-xs">
                                #{idx + 1}
                              </span>
                            )}

                            {imgUrl.includes('cloudinary') && (
                              <span className="bg-[#0E2A1B]/80 text-[#D4AF37] text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                                <Cloud className="w-2 h-2" /> Cloud
                              </span>
                            )}
                          </div>

                          {/* Hover Actions Bar */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveGalleryImage(idx);
                                }}
                                className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetPrimaryImage(idx);
                                }}
                                className="w-full py-1 rounded bg-white text-[#0E2A1B] hover:bg-[#D4AF37] text-[10px] font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Star className="w-2.5 h-2.5" />
                                <span>Set as Cover</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add More Photos Slot (Visible if fewer than 4 photos) */}
                    {(formData.gallery?.length || 0) < 4 && (
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-[#0E2A1B] bg-white/80 hover:bg-white transition-all flex flex-col items-center justify-center text-center p-3 gap-1.5 group cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                            <span className="text-[10px] font-bold text-stone-600">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-[#0E2A1B]/5 text-[#0E2A1B] group-hover:bg-[#0E2A1B] group-hover:text-[#D4AF37] flex items-center justify-center transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-stone-800">
                              Add Photo
                            </span>
                            <span className="text-[9.5px] text-stone-400 font-medium">
                              Slot {(formData.gallery?.length || 0) + 1} of 4
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Empty state / multi-upload banner if no photos added yet */}
                  {(!formData.gallery || formData.gallery.length === 0) && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-[#0E2A1B] rounded-xl p-5 bg-white text-center cursor-pointer transition-all space-y-2"
                    >
                      <UploadCloud className="w-8 h-8 text-[#D4AF37] mx-auto" />
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#0E2A1B]">
                          Click to select 3–4 gallery photos at once
                        </p>
                        <p className="text-[11px] text-stone-500 font-normal mt-0.5">
                          Hold <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">Ctrl</kbd> or <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px]">Shift</kbd> in file explorer to select multiple files. PNG, JPG, WEBP formats.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider shadow-xs hover:bg-[#1B3B29] pointer-events-none"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Choose 3–4 Photos</span>
                      </button>
                    </div>
                  )}

                  {/* Upload status message */}
                  {uploadStatusMsg && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadStatusMsg}</span>
                    </div>
                  )}
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
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">
                    Product Description
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5 font-normal">
                    Displays under the Description tab on the product details page.
                  </p>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the roast quality, ingredients, and flavor profile..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>

                {/* Product Details & Specifications */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-stone-800 mb-1">
                    Product Details & Specifications
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5 font-normal">
                    Displays under the Product Details tab on the storefront. Add key specifications, ingredients, storage, origin, or shelf life (one bullet per line).
                  </p>
                  <textarea
                    rows={4}
                    value={formData.productDetails || formData.details || ''}
                    onChange={e => setFormData({
                      ...formData,
                      productDetails: e.target.value,
                      details: e.target.value
                    })}
                    placeholder="• Grade: Premium 6-suta hand-graded jumbo fox nuts&#10;• Roast: Slow-roasted in virgin cold-pressed olive mist&#10;• Ingredients: 94% Fox Nuts, 4% Olive Mist, 2% Himalayan Salt&#10;• Shelf Life: 9 Months from packaging date&#10;• Storage: Store in a cool, airtight container"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] font-mono text-stone-800"
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
