import React from 'react';
import { Share2 } from 'lucide-react';

/** Public link to a product page on the site the visitor is on. */
export function getProductUrl(product) {
  const key = product?.id || product?._id || product?.slug;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/product/${key}`;
}

/** Opens WhatsApp with a ready-made message about the product. */
export function shareProductOnWhatsApp(product, price) {
  const cost = Number(price ?? product?.price);
  const lines = [
    `Check out *${product?.name || 'this product'}* on AURIVÁ${Number.isFinite(cost) && cost > 0 ? ` — ₹${cost}` : ''} 🌿`,
    getProductUrl(product)
  ];
  const href = `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(href, '_blank', 'noopener,noreferrer');
}

/**
 * "Share on WhatsApp" for a product.
 *   variant="icon"  → round icon button (product cards / image corner)
 *   variant="pill"  → icon + "Share" label
 */
export default function ProductShareButton({ product, price, variant = 'icon', className = '' }) {
  const handleClick = (e) => {
    // Inside cards the button sits on top of a link — don't navigate
    e.preventDefault();
    e.stopPropagation();
    shareProductOnWhatsApp(product, price);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Share on WhatsApp"
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Share on WhatsApp"
      title="Share on WhatsApp"
      className={`rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto bg-white/95 shadow-md border border-stone-200/80 text-stone-500 hover:text-[#0E2A1B] hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer ${className}`}
    >
      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
  );
}
