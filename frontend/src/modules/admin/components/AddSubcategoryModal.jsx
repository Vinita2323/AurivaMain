import React, { useState, useEffect, useRef } from 'react';
import { X, Check, UploadCloud, Image as ImageIcon, RefreshCw } from 'lucide-react';

export default function AddSubcategoryModal({ isOpen, onClose, onSave, parentCategory = null, initialData = null }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [order, setOrder] = useState(1);
  const [image, setImage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setStatus(initialData.status || 'Active');
        setOrder(initialData.order || 1);
        setImage(initialData.image || '');
      } else {
        setName('');
        setStatus('Active');
        setOrder((parentCategory?.subcategories?.length || 0) + 1);
        setImage('');
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialData, parentCategory]);

  if (!isOpen) return null;

  // Handle local file image upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a subcategory name.");
      return;
    }
    onSave({
      id: initialData?.id || `sub-${Date.now()}`,
      name: name.trim(),
      status,
      order: Number(order) || 1,
      image
    });
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
        className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
              {parentCategory ? `PARENT: ${parentCategory.name}` : 'SUB-TAXONOMY'}
            </span>
            <h3 className="font-sans text-base sm:text-lg font-bold mt-0.5">
              {initialData ? 'Edit Subcategory' : 'Add New Subcategory'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-sans overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Subcategory Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Peri Peri, Tangy Tomato..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
            />
          </div>

          {/* Subcategory Image Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Subcategory Image Upload
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
              className="border-2 border-dashed border-stone-300 hover:border-[#0E2A1B] rounded-xl p-3 bg-[#FAF7F2] transition-all cursor-pointer flex items-center gap-3 group"
            >
              {image ? (
                <img
                  src={image}
                  alt="Preview"
                  className="w-14 h-14 rounded-lg object-cover border border-stone-200 bg-white shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E2A1B]">
                  <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                  <span>{image ? 'Change Subcategory Image' : 'Upload Subcategory Image'}</span>
                </div>
                <p className="text-[11px] text-stone-400">PNG, JPG, WEBP formats up to 5MB</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0E2A1B] bg-white px-2 py-0.5 rounded border border-stone-300 shadow-2xs hover:bg-stone-50"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Choose File</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Display Order</label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={e => setOrder(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{initialData ? 'Save Changes' : 'Create Subcategory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
