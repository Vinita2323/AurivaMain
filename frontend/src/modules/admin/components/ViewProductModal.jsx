import React, { useEffect } from 'react';
import { X, Flame, Package, Tag, Star } from 'lucide-react';
import { resolveProductImage } from '../../../utils/productImage';

function DetailRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2 border-b border-stone-100 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 sm:w-36 shrink-0">{label}</span>
      <span className="text-sm text-stone-800 font-medium break-words">{value}</span>
    </div>
  );
}

export default function ViewProductModal({ isOpen, onClose, product, categories = [] }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const displayImage = resolveProductImage(product);
  const gallery = Array.isArray(product.gallery)
    ? product.gallery.filter((img) => typeof img === 'string' && img.trim())
    : [];
  const categoryName =
    categories.find(
      (c) => c.slug === product.category || (c.id || c._id) === product.category
    )?.name || product.category?.replace(/-/g, ' ');

  const weightOptions =
    (Array.isArray(product.weightOptions) && product.weightOptions.length > 0 && product.weightOptions) ||
    (Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants.map((v) => ({
          weight: v.weight,
          price: v.price,
          oldPrice: v.oldPrice,
          isDefault: v.isDefault
        }))
      : []);

  const isActive = product.inStock !== false;

  return (
    <div
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans overflow-hidden"
    >
      <div
        data-lenis-prevent
        className="bg-white rounded-2xl max-w-2xl w-full h-[90vh] max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-[#0E2A1B] text-white">
          <div>
            <h3 className="font-sans text-lg font-bold">Product Details</h3>
            <p className="text-xs text-[#E8DFC8]/80 mt-0.5">Read-only catalog view</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#E8DFC8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full sm:w-40 h-40 rounded-xl object-cover border border-stone-200 bg-[#FAF7F2]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-sans text-xl font-bold text-[#0E2A1B]">{product.name}</h4>
                {product.isBestseller && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                    <Flame className="w-2.5 h-2.5 text-[#C89038]" />
                    Bestseller
                  </span>
                )}
              </div>
              {(product.tagline || product.flavor || product.subtitle) && (
                <p className="text-sm text-stone-500 mt-1">
                  {product.tagline || product.flavor || product.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="text-2xl font-bold text-[#0E2A1B]">₹{product.price}</span>
                {product.oldPrice ? (
                  <span className="text-sm text-stone-400 line-through">₹{product.oldPrice}</span>
                ) : null}
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {product.stockCount ?? 0} units
                </span>
                {product.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {Number(product.rating).toFixed(1)} ({product.reviewsCount ?? 0} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>

          {gallery.length > 1 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">Gallery</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((img, idx) => (
                  <img
                    key={`${img}-${idx}`}
                    src={img}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-stone-200 shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E2A1B] mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Catalog Info
            </p>
            <DetailRow label="Category" value={categoryName} />
            <DetailRow label="Slug" value={product.slug} />
            <DetailRow label="Weight" value={product.weight} />
            <DetailRow label="Badge" value={product.badge} />
            <DetailRow label="SKU" value={product.sku} />
            <DetailRow label="Product ID" value={product._id || product.id} />
          </div>

          {weightOptions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">Weight / Variants</p>
              <div className="space-y-2">
                {weightOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-stone-200 text-sm"
                  >
                    <span className="font-semibold text-stone-800">
                      {opt.weight}
                      {opt.isDefault ? ' (default)' : ''}
                    </span>
                    <span className="text-stone-600">
                      ₹{opt.price}
                      {opt.oldPrice ? ` · was ₹${opt.oldPrice}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(product.description || product.details || product.productDetails) && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">Description</p>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                {product.description || product.details || product.productDetails}
              </p>
            </div>
          )}

          {product.ingredients && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">Ingredients</p>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{product.ingredients}</p>
            </div>
          )}

          {(product.shippingWeightKg || product.lengthCm) && (
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">Shipping</p>
              <DetailRow label="Weight (kg)" value={product.shippingWeightKg} />
              <DetailRow
                label="Dimensions (cm)"
                value={
                  product.lengthCm
                    ? `${product.lengthCm} × ${product.breadthCm || '—'} × ${product.heightCm || '—'}`
                    : null
                }
              />
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-3 border-t border-stone-100 bg-[#FAF7F2] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-sm font-bold hover:bg-[#1B3B29] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
