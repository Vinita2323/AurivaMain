import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, ShoppingBag, Trash2, ArrowRight, ChevronRight, 
  Sparkles, Star, Check, ArrowLeft, ShieldCheck, Truck, RefreshCw, Eye
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { PRODUCTS } from '../../../data/products';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();

  // Find products that are currently in the wishlist
  const wishlistedProducts = PRODUCTS.filter(p => wishlist.includes(p.id));

  // Similar snacks to recommend when empty or below
  const recommendedProducts = PRODUCTS.filter(p => !wishlist.includes(p.id)).slice(0, 6);

  const handleMoveAllToCart = () => {
    wishlistedProducts.forEach(product => {
      addToCart(product, '250g', 1, false);
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-16">
      <AnnouncementBar />
      <Header />

      <main className="py-8 sm:py-12 max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8E2D5]">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-1">
              <Link to="/" className="hover:text-[#0E2A1B] transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/shop" className="hover:text-[#0E2A1B] transition-colors">Shop</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0E2A1B] font-bold">My Wishlist</span>
            </nav>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0E2A1B] tracking-tight">
              Saved Snacks & Wishlist
            </h1>
          </div>

          {wishlistedProducts.length > 0 && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={clearWishlist}
                className="text-xs text-stone-500 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl border border-stone-200 hover:border-rose-300 bg-white transition-all shadow-2xs"
              >
                Clear Wishlist
              </button>

              <button
                onClick={handleMoveAllToCart}
                className="px-3.5 py-1.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Move All to Cart</span>
              </button>
            </div>
          )}
        </div>

        {wishlistedProducts.length === 0 ? (
          /* Empty Wishlist State */
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-[#E8E2D5] shadow-xs my-8 max-w-xl mx-auto space-y-5 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF7F2] border-2 border-[#D4AF37]/40 flex items-center justify-center text-rose-500 shadow-inner">
              <Heart className="w-10 h-10 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0E2A1B]">Your Wishlist is Empty</h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-2 max-w-md mx-auto">
                Save your favorite healthy snacks, roasted makhana flavors, and wellness combos so you can find them easily later.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-102 group"
              >
                <span>Discover Snacks</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          /* Compact Wishlist Items Grid */
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-600 font-medium">
                Showing <strong className="text-[#0E2A1B]">{wishlistedProducts.length}</strong> saved items
              </p>
              <Link to="/shop" className="text-xs font-bold text-[#0E2A1B] hover:text-[#28543B] flex items-center gap-1">
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Compact 5-6 Column Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {wishlistedProducts.map((p) => (
                <div 
                  key={p.id} 
                  className="bg-white p-3 rounded-2xl border border-[#E8E2D5] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative"
                >
                  {/* Thumbnail and Badge */}
                  <div className="relative mb-2">
                    <Link to={`/product/${p.slug}`} className="aspect-square rounded-xl bg-[#FAF7F2] p-2 flex items-center justify-center overflow-hidden block">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" 
                      />
                    </Link>

                    {/* Badge */}
                    {p.badge && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-[#0E2A1B] text-[#D4AF37] border border-[#D4AF37]/30 shadow-2xs">
                        {p.badge}
                      </span>
                    )}

                    {/* Remove from Wishlist Heart Button */}
                    <button
                      onClick={() => toggleWishlist(p.id)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 border border-stone-200 shadow-xs flex items-center justify-center text-rose-500 hover:scale-110 hover:bg-rose-50 transition-all"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-500">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-400 font-medium">({p.reviewsCount || 420})</span>
                    </div>

                    {/* Title */}
                    <Link 
                      to={`/product/${p.slug}`} 
                      className="font-serif text-xs font-bold text-[#0E2A1B] hover:text-[#28543B] block truncate transition-colors"
                      title={p.name}
                    >
                      {p.name}
                    </Link>

                    {/* Price and Discount */}
                    <div className="flex items-baseline gap-1.5 pt-0.5">
                      <span className="font-extrabold text-xs text-[#0E2A1B]">₹{p.price}</span>
                      {p.oldPrice && (
                        <span className="text-[10px] text-stone-400 line-through">₹{p.oldPrice}</span>
                      )}
                      {p.discount && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                          {p.discount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    onClick={() => addToCart(p, '250g', 1, false)}
                    className="mt-3 w-full py-1.5 bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-[11px] font-bold uppercase rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-98"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM RECOMMENDATIONS (Compact cards) */}
        {recommendedProducts.length > 0 && (
          <section className="mt-14 sm:mt-18 pt-8 border-t border-[#E8E2D5]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#28543B] font-bold">RECOMMENDED FOR YOU</span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0E2A1B] mt-0.5">Popular Healthy Snacks</h3>
              </div>
              <Link to="/shop" className="text-xs font-bold text-[#C89038] hover:underline">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {recommendedProducts.map(p => (
                <div 
                  key={p.id} 
                  className="bg-white p-3 rounded-2xl border border-[#E8E2D5] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative"
                >
                  <div className="relative mb-2">
                    <Link to={`/product/${p.slug}`} className="aspect-square rounded-xl bg-[#FAF7F2] p-2 flex items-center justify-center overflow-hidden block">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" 
                      />
                    </Link>
                    <button
                      onClick={() => toggleWishlist(p.id)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 border border-stone-200 shadow-xs flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Link 
                      to={`/product/${p.slug}`} 
                      className="font-serif text-xs font-bold text-[#0E2A1B] hover:text-[#28543B] block truncate transition-colors"
                      title={p.name}
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs font-extrabold text-[#0E2A1B]">₹{p.price}</p>
                  </div>

                  <button
                    onClick={() => addToCart(p, '250g', 1, false)}
                    className="mt-3 w-full py-1.5 bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-[11px] font-bold uppercase rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trust Badges */}
        <div className="mt-14 bg-white rounded-2xl p-5 border border-[#E8E2D5] shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            <div className="flex items-center gap-3 sm:pr-4">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shrink-0 mx-auto sm:mx-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#0E2A1B]">Free Express Delivery</h5>
                <p className="text-[10px] text-stone-500">On all prepaid orders above ₹499</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-4">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shrink-0 mx-auto sm:mx-0">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#0E2A1B]">100% Wetland Harvested</h5>
                <p className="text-[10px] text-stone-500">Naturally puffed Grade-A fox nuts</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:pl-4">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shrink-0 mx-auto sm:mx-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#0E2A1B]">Freshness Guarantee</h5>
                <p className="text-[10px] text-stone-500">Airtight nitrogen-flushed seal</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
