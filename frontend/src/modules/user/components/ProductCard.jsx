import React, { useState } from 'react';
import { Star, Heart, ShoppingBag, Check, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState(product.weight || '150g');

  const isWishlisted = isInWishlist(product.id);

  // Price calculation
  let currentPrice = product.price;
  let currentOldPrice = product.oldPrice;

  if (product.weightOptions) {
    const matched = product.weightOptions.find(w => w.weight === selectedWeight);
    if (matched) {
      currentPrice = matched.price;
      currentOldPrice = matched.oldPrice;
    }
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedWeight, 1, false);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  // Badge styling matching reference
  const getBadgeStyle = (badge) => {
    if (!badge) return '';
    const b = badge.toUpperCase();
    if (b.includes("CHEF")) {
      return 'bg-[#9A3828] text-white';
    }
    if (b.includes("CUSTOMER")) {
      return 'bg-[#133E28] text-[#E8DFC8] border border-[#D4AF37]/40';
    }
    if (b.includes("TOP RATED")) {
      return 'bg-[#C89038] text-white';
    }
    // Default Bestseller / Gold
    return 'bg-[#C89038] text-white';
  };

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-[#E8E2D5] hover:border-[#D4AF37] shadow-sm sm:shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.35),0_0_25px_rgba(212,175,55,0.2)] hover:-translate-y-1.5 sm:hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between relative overflow-hidden text-left">
      
      {/* Light sheen animation across card on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-20" />

      {/* Top Image Container (Full-bleed edge-to-edge) */}
      <div className="relative w-full aspect-[4/3.7] sm:aspect-square overflow-hidden bg-[#FAF7F2]">
        {/* Top Badges & Wishlist Action */}
        <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-2.5 sm:right-2.5 z-10 flex items-center justify-between pointer-events-none">
          {product.badge ? (
            <span className={`text-[8px] sm:text-[10px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md uppercase tracking-wider shadow-sm pointer-events-auto transition-transform duration-300 group-hover:scale-105 ${getBadgeStyle(product.badge)}`}>
              {product.badge}
            </span>
          ) : <div />}

          <button
            onClick={handleWishlistClick}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto bg-white/95 shadow-md border border-stone-200/80 hover:scale-115 active:scale-95 ${
              isWishlisted 
                ? 'text-rose-600 shadow-rose-200/50' 
                : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
            }`}
            aria-label="Add to Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
          </button>
        </div>

        {/* Product Image */}
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          />
        </Link>
      </div>

      {/* Product Details (with clean padding) */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        {/* Rating Stars (5 filled stars) + count */}
        <div className="flex items-center gap-1 mb-1 text-amber-500">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-[9.5px] sm:text-[11px] text-stone-500 font-medium ml-0.5">
            ({product.reviewsCount || 100})
          </span>
        </div>

        {/* Product Name */}
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="font-serif text-xs sm:text-[15px] font-bold text-[#0E2A1B] group-hover:text-[#28543B] line-clamp-1 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Subtitle / Flavor notes */}
        <p className="text-[10px] sm:text-xs text-stone-500 line-clamp-1 mt-0.5 mb-2 sm:mb-2.5">
          {product.subtitle || product.tagline || 'Artisanal Natural Seasoning'}
        </p>

        {/* Pricing with Discount Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-auto mb-2.5 sm:mb-3.5">
          <span className="text-sm sm:text-lg font-extrabold text-[#0E2A1B]">
            ₹{currentPrice}
          </span>
          {currentOldPrice && (
            <span className="text-[10.5px] sm:text-xs text-stone-400 line-through font-medium">
              ₹{currentOldPrice}
            </span>
          )}
          {product.discountPercent && (
            <span className="text-[8.5px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Actions (Add to Cart + Quick View) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleAddToCart}
            className={`flex-1 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg text-[9.5px] sm:text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs min-h-[32px] sm:min-h-[40px] ${
              isAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-[#0E2A1B] text-white hover:bg-[#154627] hover:shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-98'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]" />
                <span>ADDED</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]" />
                <span className="truncate">ADD TO CART</span>
              </>
            )}
          </button>

          <Link
            to={`/product/${product.slug}`}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-stone-100/90 text-stone-600 hover:text-[#0E2A1B] hover:bg-[#D4AF37]/20 hover:scale-105 flex items-center justify-center transition-all duration-300 shrink-0 shadow-2xs"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
