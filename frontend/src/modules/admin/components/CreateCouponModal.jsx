import React, { useState, useEffect } from 'react';
import { X, Check, Tag, AlertCircle } from 'lucide-react';

export default function CreateCouponModal({ isOpen, onClose, onSave, couponToEdit = null }) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(20);
  const [minOrderValue, setMinOrderValue] = useState(499);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (couponToEdit) {
      setCode(couponToEdit.code || '');
      setDiscountType(
        couponToEdit.discountType === 'FIXED' || couponToEdit.type === 'Flat'
          ? 'FIXED'
          : 'PERCENTAGE'
      );
      setDiscountValue(couponToEdit.discountValue ?? couponToEdit.discount ?? 20);
      setMinOrderValue(couponToEdit.minOrderValue ?? couponToEdit.minOrder ?? 0);
      setMaxDiscount(couponToEdit.maxDiscount || 0);
      setUsageLimit(couponToEdit.usageLimit || 0);
      setStartDate(
        couponToEdit.startDate
          ? new Date(couponToEdit.startDate).toISOString().split('T')[0]
          : ''
      );
      setEndDate(
        couponToEdit.endDate
          ? new Date(couponToEdit.endDate).toISOString().split('T')[0]
          : ''
      );
      setStatus(
        couponToEdit.status === 'Inactive' || couponToEdit.status === 'INACTIVE'
          ? 'INACTIVE'
          : 'ACTIVE'
      );
      setDescription(couponToEdit.description || '');
    } else {
      setCode('');
      setDiscountType('PERCENTAGE');
      setDiscountValue(20);
      setMinOrderValue(499);
      setMaxDiscount(0);
      setUsageLimit(0);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setStatus('ACTIVE');
      setDescription('');
    }
    setErrorMessage('');
  }, [couponToEdit, isOpen]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode) {
      setErrorMessage('Please enter a valid coupon code');
      return;
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      setErrorMessage('Discount value must be greater than 0');
      return;
    }

    if (discountType === 'PERCENTAGE' && numValue > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%');
      return;
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setErrorMessage('End date must be strictly after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...(couponToEdit?._id ? { _id: couponToEdit._id } : {}),
        ...(couponToEdit?.id ? { id: couponToEdit.id } : {}),
        code: cleanCode,
        discountType,
        type: discountType === 'PERCENTAGE' ? 'Percentage' : 'Flat',
        discountValue: numValue,
        discount: numValue,
        minOrderValue: Number(minOrderValue) || 0,
        minOrder: Number(minOrderValue) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        usageLimit: Number(usageLimit) || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status,
        description: description.trim()
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save coupon rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-sans text-base sm:text-lg font-bold">
              {couponToEdit ? `Edit Coupon: ${couponToEdit.code}` : 'Create Promo Coupon'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-stone-400 hover:text-white transition-colors p-1 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 font-sans text-stone-800">
          <div>
            <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. FESTIVE20"
              className="w-full px-3.5 py-2.5 uppercase font-bold text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none cursor-pointer"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Flat (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">
                Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'} *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Min. Order (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrderValue}
                onChange={e => setMinOrderValue(e.target.value)}
                placeholder="0 = No minimum"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                value={maxDiscount}
                onChange={e => setMaxDiscount(e.target.value)}
                placeholder="0 = Uncapped"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Usage Limit</label>
              <input
                type="number"
                min="0"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
                placeholder="0 = Unlimited"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-[13px] font-bold text-stone-700 mb-1">Description / Customer Note</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. 20% off on all Makhana tubs"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 rounded-lg border border-stone-300 hover:bg-stone-100 uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#0E2A1B] hover:bg-[#1B3B29] rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{isSubmitting ? 'Saving...' : couponToEdit ? 'Update Coupon' : 'Create Coupon'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
