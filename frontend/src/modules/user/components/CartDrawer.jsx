import React from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';

export default function CartDrawer() {
  const { 
    isDrawerOpen, 
    setIsDrawerOpen, 
    cartItems, 
    itemCount, 
    subtotal, 
    discountAmount, 
    deliveryFee, 
    total, 
    updateQty, 
    removeFromCart 
  } = useCart();
  
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] text-[#182019] shadow-2xl flex flex-col border-l border-[#D4AF37]/30">
          
          {/* Header */}
          <div className="bg-[#0E2A1B] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-serif text-lg font-bold">Your Cart</h3>
              <span className="bg-[#D4AF37] text-[#0E2A1B] text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery threshold progress */}
          <div className="bg-[#1B3B29] px-4 py-2.5 text-xs text-[#E8DFC8] border-b border-[#D4AF37]/20">
            {subtotal >= 499 ? (
              <div className="flex items-center gap-1.5 text-[#E5C358] font-medium">
                <span>🎉 Congratulations! You have unlocked <strong>FREE Shipping</strong>.</span>
              </div>
            ) : (
              <div>
                <p>Add <strong>₹{499 - subtotal}</strong> more for <strong>FREE Shipping</strong></p>
                <div className="w-full bg-black/30 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-[#D4AF37] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / 499) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#E8E2D5]">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0E2A1B]/5 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-lg font-bold text-[#0E2A1B]">Your Cart is Empty</h4>
                <p className="text-xs text-stone-500 mt-1 mb-6">Discover our guilt-free roasted makhana & snacks.</p>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate('/shop');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={`${item.id}-${item.weight}`} className="pt-3 flex gap-3 items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#D4AF37]/20 bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm font-semibold text-[#0E2A1B] truncate">{item.name}</h4>
                    <p className="text-[11px] text-stone-500">Weight: {item.weight}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E2A1B]">
                        <span>₹{item.price}</span>
                        {item.oldPrice && (
                          <span className="text-[10px] text-stone-400 line-through font-normal">₹{item.oldPrice}</span>
                        )}
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-xs">
                        <button
                          onClick={() => updateQty(item.id, item.weight, -1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.weight, 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id, item.weight)}
                    className="text-stone-400 hover:text-red-500 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-white border-t border-[#E8E2D5] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Charges</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#0E2A1B] pt-2 border-t border-dashed border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-[#0E2A1B] text-base">₹{total}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/cart"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-[#0E2A1B] text-[#0E2A1B] text-xs font-semibold uppercase tracking-wider hover:bg-[#0E2A1B] hover:text-white transition-colors"
                >
                  View Full Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0E2A1B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#1B3B29] transition-all shadow-md"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>100% Secure Checkout with Razorpay & UPI</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
