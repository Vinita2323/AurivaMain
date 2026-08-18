import React, { useState } from 'react';
import { X, Check, Tag } from 'lucide-react';

export default function CreateCouponModal({ isOpen, onClose, onSave }) {
  const [code, setCode] = useState('');
  const [type, setType] = useState('Percentage');
  const [discount, setDiscount] = useState(20);
  const [minOrder, setMinOrder] = useState(499);
  const [validity, setValidity] = useState('01 Jun - 30 Jun');
  const [description, setDescription] = useState('Special discount voucher');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code) {
      alert("Please enter a coupon code");
      return;
    }
    onSave({
      code: code.toUpperCase().trim(),
      type,
      discount: Number(discount),
      discountDisplay: type === 'Percentage' ? `${discount}%` : `₹${discount}`,
      minOrder: Number(minOrder),
      validity,
      description,
      status: "Active"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8E2D5] shadow-2xl overflow-hidden">
        
        <div className="p-6 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-serif text-lg font-bold">Create Promo Coupon</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. SNACK25"
              className="w-full px-3 py-2 uppercase font-bold text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Discount Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Flat">Flat (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Discount Value</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Min. Order (₹)</label>
              <input
                type="number"
                value={minOrder}
                onChange={e => setMinOrder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Validity Text</label>
              <input
                type="text"
                value={validity}
                onChange={e => setValidity(e.target.value)}
                placeholder="e.g. 15 Jun - 30 Jun"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. 25% off on monsoon party box"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 rounded-xl border border-stone-300 uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0E2A1B] hover:bg-[#1B3B29] rounded-xl uppercase flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Create Coupon</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
