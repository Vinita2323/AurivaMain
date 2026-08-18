import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Plus, Minus, Trash2, Tag, ArrowRight, ShieldCheck, 
  Sparkles, ChevronRight, AlertCircle, ArrowLeft, Truck, CheckCircle2,
  Heart, Leaf, Lock
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useCart } from '../../../context/CartContext';
import { PRODUCTS } from '../../../data/products';

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    itemCount, 
    subtotal, 
    discountAmount, 
    deliveryFee, 
    tax, 
    total, 
    appliedCoupon, 
    couponError, 
    couponSuccess, 
    updateQty, 
    removeFromCart, 
    applyCoupon, 
    removeCoupon,
    addToCart,
    clearCart
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [localCouponError, setLocalCouponError] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setLocalCouponError('');
    if (!couponCodeInput.trim()) return;
    const res = applyCoupon(couponCodeInput.trim().toUpperCase());
    if (!res) {
      setLocalCouponError('Invalid or expired coupon code');
    } else {
      setCouponCodeInput('');
    }
  };

  // Upsell recommendations
  const upsellProducts = PRODUCTS
    .filter(p => !cartItems.some(item => item.id === p.id))
    .slice(0, 4);

  const freeDeliveryThreshold = 499;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-36 md:pb-12 font-sans">
      <AnnouncementBar />
      <Header />

      <main className="py-3 sm:py-8 md:py-12 max-w-[1450px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation & Top Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-8 pb-2.5 sm:pb-4 border-b border-[#E8E2D5]">
          <div>
            <nav className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-stone-500 font-medium mb-0.5 sm:mb-1">
              <Link to="/" className="hover:text-[#0E2A1B] transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <Link to="/shop" className="hover:text-[#0E2A1B] transition-colors">Shop</Link>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[#0E2A1B] font-bold">Shopping Cart</span>
            </nav>
            <h1 className="font-serif text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E2A1B] tracking-tight">
              Your Wholesome Cart
            </h1>
          </div>

          {cartItems.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              <button
                onClick={clearCart}
                className="text-[11px] sm:text-xs text-stone-500 hover:text-rose-600 font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-stone-200 hover:border-rose-300 bg-white transition-all min-h-[32px] sm:min-h-[36px]"
              >
                Clear Cart
              </button>
              <span className="bg-[#0E2A1B] text-[#D4AF37] border border-[#D4AF37]/30 text-[11px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-xs">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl p-8 sm:p-16 text-center border border-[#E8E2D5] shadow-xs my-6 sm:my-8 max-w-xl mx-auto space-y-4 sm:space-y-5 animate-fadeIn font-sans">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-[#FAF7F2] border-2 border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shadow-inner">
              <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-3xl font-bold text-[#0E2A1B]">Your Cart is Currently Empty</h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-1.5 sm:mt-2 max-w-md mx-auto">
                Explore our selection of artisanal roasted phool makhana, energy nut blends, and gourmet seeds.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-102 group min-h-[44px]"
              >
                <span>Browse All Snacks</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          /* Cart with Items Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
            
            {/* LEFT: Cart Items Table / Cards */}
            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
              
              {/* Free Shipping Progress Indicator Bar */}
              <div className="bg-[#0E2A1B] rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white border border-[#D4AF37]/30 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5 sm:mb-2 relative z-10">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] shrink-0" />
                    <span className="font-bold">
                      {isFreeDelivery 
                        ? '🎉 You have unlocked FREE Express Delivery!' 
                        : `Add ₹${freeDeliveryThreshold - subtotal} more for FREE Delivery`}
                    </span>
                  </div>
                  <span className="font-extrabold text-[#D4AF37] ml-2 shrink-0">
                    {Math.round(deliveryProgress)}%
                  </span>
                </div>
                
                {/* Progress Track */}
                <div className="w-full bg-black/40 h-1.5 sm:h-2 rounded-full overflow-hidden relative z-10">
                  <div 
                    className="bg-gradient-to-r from-[#D4AF37] to-[#E5C358] h-full rounded-full transition-all duration-500"
                    style={{ width: `${deliveryProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Card Container */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-[#E8E2D5] shadow-xs divide-y divide-stone-100">
                {cartItems.map((item) => (
                  <div 
                    key={`${item.id}-${item.weight}`} 
                    className="py-3 sm:py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 animate-fadeIn"
                  >
                    {/* Item Thumbnail & Info */}
                    <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto flex-1 min-w-0">
                      <Link to={`/product/${item.id}`} className="shrink-0 group">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 sm:w-22 sm:h-22 rounded-xl sm:rounded-2xl object-cover bg-[#FAF7F2] border border-[#E8E2D5] p-0.5 sm:p-1 shadow-2xs group-hover:scale-105 transition-transform"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link 
                          to={`/product/${item.id}`} 
                          className="font-serif text-xs sm:text-base font-bold text-[#0E2A1B] hover:text-[#28543B] transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-[#0E2A1B] bg-[#FAF7F2] border border-[#E8E2D5] px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-md">
                            {item.weight}
                          </span>
                          <span className="text-xs font-bold text-[#0E2A1B]">₹{item.price}</span>
                          {item.oldPrice && (
                            <span className="text-[10px] sm:text-[11px] text-stone-400 line-through">₹{item.oldPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Price & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      
                      {/* Interactive Quantity Controller */}
                      <div className="flex items-center border border-stone-300 rounded-lg sm:rounded-xl bg-stone-50 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQty(item.id, item.weight, -1)}
                          className="p-1.5 sm:p-2.5 text-stone-600 hover:bg-stone-200 hover:text-[#0E2A1B] transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <span className="px-2.5 sm:px-4 text-xs font-bold text-stone-900 select-none">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.weight, 1)}
                          className="p-1.5 sm:p-2.5 text-stone-600 hover:bg-stone-200 hover:text-[#0E2A1B] transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>

                      {/* Total Line Price */}
                      <div className="text-right min-w-[60px] sm:min-w-[70px]">
                        <span className="font-serif text-sm sm:text-base font-extrabold text-[#0E2A1B]">
                          ₹{item.price * item.qty}
                        </span>
                        {item.qty > 1 && (
                          <p className="text-[9.5px] sm:text-[10px] text-stone-400">₹{item.price} each</p>
                        )}
                      </div>

                      {/* Remove Trash Button */}
                      <button
                        onClick={() => removeFromCart(item.id, item.weight)}
                        className="p-1.5 sm:p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove item from cart"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                    </div>

                  </div>
                ))}
              </div>

              {/* Continue Shopping CTA */}
              <div className="pt-1 sm:pt-2 flex items-center justify-between">
                <Link
                  to="/shop"
                  className="text-[11px] sm:text-xs font-bold text-[#0E2A1B] hover:text-[#28543B] flex items-center gap-1.5 group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Continue Shopping</span>
                </Link>
              </div>

            </div>

            {/* RIGHT: Order Summary Card */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6 sticky top-24">
              
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#E8E2D5] shadow-xs space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 sm:pb-3.5">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#C89038]" />
                    <span>Order Summary</span>
                  </h3>
                  <span className="text-[11px] sm:text-xs font-bold text-[#D4AF37] bg-[#0E2A1B] px-2 py-0.5 sm:px-2.5 rounded-full">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2.5 sm:space-y-3 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-stone-900">₹{subtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <span>Delivery Charges</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <strong className="text-emerald-700 font-bold uppercase">FREE</strong>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>Estimated Taxes (5% GST)</span>
                    <span className="font-bold text-stone-900">₹{tax}</span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-baseline pt-3 sm:pt-4 border-t border-dashed border-stone-200">
                    <div>
                      <span className="font-serif text-sm sm:text-base font-bold text-[#0E2A1B]">Grand Total</span>
                      {discountAmount > 0 && (
                        <p className="text-[10.5px] sm:text-[11px] text-emerald-700 font-medium">You save ₹{discountAmount}</p>
                      )}
                    </div>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#0E2A1B]">
                      ₹{total}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2.5 sm:pt-3 border-t border-stone-100">
                  <p className="text-[11px] sm:text-xs font-bold text-[#0E2A1B] mb-1.5 sm:mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#C89038]" />
                    <span>Apply Coupon Code</span>
                  </p>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <div>
                        <span className="font-bold text-emerald-900">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-emerald-700">{appliedCoupon.description}</p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          placeholder="e.g. AURIVA20"
                          className="flex-1 px-3 py-2 text-xs uppercase font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#0E2A1B] text-[#0E2A1B]"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-2 bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase rounded-xl hover:bg-[#1B3B29] transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {localCouponError && (
                        <p className="text-[10px] text-rose-600 font-medium">{localCouponError}</p>
                      )}
                    </form>
                  )}
                </div>

                {/* Checkout CTA Button */}
                <Link
                  to="/checkout"
                  className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C358] to-[#C89038] text-[#0E2A1B] font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group min-h-[44px]"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4 text-[#0E2A1B] group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-stone-500 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                  <span>Guaranteed safe and encrypted checkout</span>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* BOTTOM UPSELL SECTION: "You May Also Like" */}
        {cartItems.length > 0 && upsellProducts.length > 0 && (
          <section className="mt-8 sm:mt-20 pt-4 sm:pt-8 border-t border-[#E8E2D5]">
            <div className="mb-3.5 sm:mb-6">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#28543B] font-bold block">ADDITIONAL SNACKS</span>
              <h3 className="font-serif text-lg sm:text-2xl font-bold text-[#0E2A1B] mt-0.5">You May Also Like</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6">
              {upsellProducts.map(p => (
                <div key={p.id} className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E8E2D5] shadow-xs flex flex-col justify-between group hover:border-[#D4AF37] transition-all">
                  <Link to={`/product/${p.slug}`} className="block aspect-square rounded-lg sm:rounded-xl bg-[#FAF7F2] p-1 sm:p-2 mb-2 overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover rounded-md sm:rounded-lg group-hover:scale-105 transition-transform duration-500" 
                    />
                  </Link>
                  <div>
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-[#0E2A1B] truncate">{p.name}</h4>
                    <p className="text-xs font-extrabold text-[#0E2A1B] mt-0.5 sm:mt-1">₹{p.price}</p>
                  </div>
                  <button
                    onClick={() => addToCart(p, '250g', 1, false)}
                    className="mt-2 sm:mt-3 w-full py-1.5 sm:py-2 bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-[10.5px] sm:text-xs font-bold uppercase rounded-lg sm:rounded-xl transition-colors shadow-2xs min-h-[32px]"
                  >
                    + Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* MOBILE STICKY CHECKOUT BAR (Above mobile bottom nav) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-[56px] inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E8E2D5] px-4 py-2.5 sm:px-6 sm:py-3 z-40 md:hidden shadow-2xl flex items-center justify-between">
          <div className="pl-1">
            <span className="text-[10.5px] text-stone-500 font-medium block">Total Payable</span>
            <p className="font-sans text-base sm:text-lg font-extrabold text-[#0E2A1B] tracking-tight">₹{total}</p>
          </div>
          <Link
            to="/checkout"
            className="px-5 py-2.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md min-h-[40px]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
}
