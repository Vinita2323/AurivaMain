import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

/**
 * "Rate & Review" shortcut for an item of a DELIVERED order.
 * Opens the product page straight on its review form (eligibility is still enforced by the backend).
 */
export default function RateReviewButton({ order, item, className = '' }) {
  if (!order || order.status !== 'Delivered' || !item) return null;

  const pid = item.product?._id || item.product || item.productId || item.id;
  if (!pid) return null;

  return (
    <Link
      to={`/product/${pid}?review=1`}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors ${className}`}
    >
      <Star className="w-3 h-3 fill-[#D4AF37]" />
      <span>Rate &amp; Review</span>
    </Link>
  );
}
