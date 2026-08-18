import React, { useEffect } from 'react';
import { Check, ShoppingBag, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';

export default function CartToast() {
  const { cartToast, hideCartToast } = useCart();

  useEffect(() => {
    if (!cartToast) return;
    const timer = setTimeout(() => {
      hideCartToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [cartToast, hideCartToast]);

  if (!cartToast) return null;

  const { product, weight, qty, price } = cartToast;

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-[calc(100vw-32px)] sm:w-96 animate-fadeIn">
      <div className="bg-[#0E2A1B] text-white rounded-2xl p-4 border border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_25px_rgba(212,175,55,0.25)] relative overflow-hidden backdrop-blur-lg">
        
        {/* Top Gold Ambient Light Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Added to Cart!</span>
          </div>
          
          <button
            onClick={hideCartToast}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Details Row */}
        <div className="flex items-center gap-3 mb-3.5">
          <img
            src={product.image}
            alt={product.name}
            className="w-14 h-14 rounded-xl object-cover border border-[#D4AF37]/30 bg-white shrink-0 shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-serif text-sm font-bold text-white truncate leading-snug">
              {product.name}
            </h4>
            <p className="text-[11px] text-stone-300 mt-0.5">
              Pack: <span className="font-bold text-[#D4AF37]">{weight}</span> • Qty: {qty}
            </p>
            <p className="text-xs font-extrabold text-white mt-0.5">
              ₹{price * qty}
            </p>
          </div>
        </div>

        {/* Actions (View Cart + Checkout) */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#D4AF37]/15">
          <Link
            to="/cart"
            onClick={hideCartToast}
            className="w-full text-center py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#E8DFC8] text-xs font-bold uppercase tracking-wider transition-all border border-[#D4AF37]/20"
          >
            View Cart
          </Link>

          <Link
            to="/checkout"
            onClick={hideCartToast}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C89038] hover:from-[#E5C358] hover:to-[#D4AF37] text-[#0E2A1B] text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
          >
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Animated Progress Countdown Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40">
          <div 
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#C89038]" 
            style={{ 
              animation: 'shrinkWidth 4.5s linear forwards' 
            }} 
          />
        </div>

      </div>
    </div>
  );
}
