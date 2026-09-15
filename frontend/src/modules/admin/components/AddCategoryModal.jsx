import React, { useState, useEffect, useRef } from 'react';
import { X, Check, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadApi } from '../../../utils/api';

export default function AddCategoryModal({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'Active',
    order: 1,
    image: '',
    subtext: '',
    badge: 'Popular',
    popular: true
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          slug: initialData.slug || '',
          description: initialData.description || '',
          status: initialData.status || 'Active',
          order: initialData.order || initialData.sortOrder || 1,
          image: initialData.image || '',
          subtext: initialData.subtext || '',
          badge: initialData.badge || 'Popular',
          popular: initialData.popular !== false
        });
        setShowUrlInput(!!initialData.image && !initialData.image.startsWith('data:'));
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          status: 'Active',
          order: 1,
          image: '',
          subtext: '',
          badge: 'Popular',
          popular: true
        });
        setShowUrlInput(false);
      }
      setIsUploadingImage(false);
      setIsSubmitting(false);
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
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      name: val,
      slug: initialData ? prev.slug : autoSlug
    }));
  };

  // Image file upload handler (Cloudinary + local preview)
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary backend
    setIsUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file, 'auriva_categories');
      if (res && res.data && res.data.url) {
        setFormData(prev => ({ ...prev, image: res.data.url }));
      }
    } catch (err) {
      console.warn('Image upload error (using local preview):', err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        slug: formData.slug || formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        order: Number(formData.order) || 1,
        sortOrder: Number(formData.order) || 1,
        image: formData.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80'
      };
      await onSave(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-sans text-lg font-bold text-stone-900">
              {initialData ? 'Edit Category' : 'Add New Category'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {initialData ? 'Update category information' : 'Create a category for your store catalog'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Classic Makhana"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 bg-white"
            />
            {formData.slug && (
              <p className="text-[11px] text-stone-400 mt-1 font-mono">
                Slug: <span className="text-stone-600">{formData.slug}</span>
              </p>
            )}
          </div>

          {/* Category Image */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700">Category Image</label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-[#0E2A1B] hover:underline font-medium cursor-pointer"
              >
                {showUrlInput ? 'Use file upload' : 'Enter image URL'}
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50">
              {/* Image Preview */}
              <div className="w-14 h-14 rounded-lg border border-stone-300 bg-white overflow-hidden shrink-0 flex items-center justify-center relative">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-stone-300" />
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload or URL */}
              <div className="flex-1 min-w-0">
                {showUrlInput ? (
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white font-mono"
                  />
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-semibold cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-stone-600" />
                      <span>{formData.image ? 'Change Image' : 'Upload Image'}</span>
                    </button>
                    <p className="text-[11px] text-stone-400 mt-1">PNG, JPG, or WEBP up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status & Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B] cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Display Order</label>
              <input
                type="number"
                min="1"
                value={formData.order || 1}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description for this category..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="px-5 py-2 rounded-xl bg-[#0E2A1B] hover:bg-[#1B3B29] text-[#D4AF37] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
              ) : (
                <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
              )}
              <span>{initialData ? 'Update Category' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
