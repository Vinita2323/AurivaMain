import React, { useState, useEffect } from 'react';
import { X, Check, MapPin, User, Package, ShieldCheck } from 'lucide-react';

export default function OrderStatusModal({ isOpen, onClose, order, onUpdateStatus }) {
  const [status, setStatus] = useState('Packed');

  useEffect(() => {
    if (order) {
      setStatus(order.status || 'Packed');
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateStatus(order.id, status);
    onClose();
  };

  return (
    <div 
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-xl max-w-2xl w-full border border-[#E8E2D5] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Modal Header (Fixed at top) */}
        <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">ORDER MANAGEMENT & DETAILS</span>
            <h3 className="font-sans text-base sm:text-xl font-bold mt-0.5">Order #{order.id}</h3>
            <p className="text-xs text-stone-300 font-normal">{order.date} • {order.paymentMethod || 'Online Payment (Prepaid)'}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div 
          data-lenis-prevent
          className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 overscroll-contain"
        >
          <form 
            id="orderFulfillmentForm" 
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            
            {/* Top Section: Single Unified Status Dropdown */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#0E2A1B] uppercase tracking-wider">
                  Order Fulfillment Status *
                </label>
                <span className="text-xs text-stone-500 font-medium">
                  Current: <strong className="text-[#0E2A1B]">{order.status}</strong>
                </span>
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white text-stone-800 shadow-2xs cursor-pointer"
              >
                <option value="Order Received">Order Received</option>
                <option value="Packed">Packed</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Section 2: Customer Info & Delivery Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Customer Details */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#E8E2D5] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E2A1B]">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  <span className="uppercase text-[10px] tracking-wider text-stone-500">Customer Details</span>
                </div>
                <p className="text-sm font-semibold text-stone-900">{order.customer}</p>
                <p className="text-xs text-stone-600 font-medium">📞 {order.phone || '+91 9876543210'}</p>
                <p className="text-xs text-stone-500">{order.email || 'customer@auriva.in'}</p>
              </div>

              {/* Delivery Address */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#E8E2D5] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E2A1B]">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span className="uppercase text-[10px] tracking-wider text-stone-500">
                    Delivery Address ({order.address?.type || 'Home'})
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-stone-700 font-medium leading-relaxed">
                  {order.address?.street || '502 Lotus Orchid, Scheme 54, Vijay Nagar'}, {order.address?.city || 'Indore'}, {order.address?.state || 'Madhya Pradesh'} - {order.address?.pincode || '452010'}
                </p>
              </div>
            </div>

            {/* Section 3: Ordered Items Summary */}
            <div className="space-y-2.5">
              <h4 className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0E2A1B] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#0E2A1B]" />
                <span>Ordered Snack Items ({order.items?.length || 1})</span>
              </h4>

              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {(order.items || [
                  { name: 'Classic Roasted Makhana', weight: '250g', qty: 1, price: order.total || 249, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150' }
                ]).map((it, i) => (
                  <div key={i} className="p-3 bg-white flex items-center justify-between text-xs sm:text-sm hover:bg-stone-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={it.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150'} alt="" className="w-11 h-11 rounded-lg object-cover border border-stone-200 bg-stone-50 shrink-0" />
                      <div>
                        <div className="font-semibold text-stone-900">{it.name}</div>
                        <span className="text-xs text-stone-400 font-normal">{it.weight || '250g'} • Qty: <strong className="text-stone-700">{it.qty || 1}</strong> • ₹{it.price || 0} each</span>
                      </div>
                    </div>
                    <div className="font-bold text-stone-900 text-sm">₹{(it.price || 0) * (it.qty || 1)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Financial Price Breakdown */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs sm:text-sm shadow-2xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-800">₹{order.subtotal || order.total || 0}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount Applied ({order.couponApplied || 'PROMO'})</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Delivery Charges</span>
                <span className="font-semibold text-stone-800">{order.deliveryFee === 0 || !order.deliveryFee ? 'FREE' : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST Tax</span>
                <span className="font-semibold text-stone-800">₹{order.tax || 0}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between font-sans text-sm sm:text-base font-bold text-[#0E2A1B]">
                <span>Total Paid Amount</span>
                <span className="text-[#0E2A1B]">₹{order.total}</span>
              </div>
            </div>

          </form>
        </div>

        {/* Modal Footer Actions (Fixed at bottom) */}
        <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-stone-300 text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="orderFulfillmentForm"
            className="px-5 py-2 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
          >
            <Check className="w-4 h-4 text-[#D4AF37]" />
            <span>Save & Update Order</span>
          </button>
        </div>

      </div>
    </div>
  );
}
