import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Copy, Check, Edit2, Search, Filter, RefreshCw, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import usePagination from '../../../hooks/usePagination';
import AdminPagination from '../components/AdminPagination';
import CreateCouponModal from '../components/CreateCouponModal';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminCoupons() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { coupons, addCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, refreshCoupons, couponsLoading } = useAdmin();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Keep usage counts live: reload on open, when the tab regains focus, and every 30s
  useEffect(() => {
    if (!refreshCoupons) return undefined;
    refreshCoupons();
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refreshCoupons();
    };
    const timer = setInterval(refreshIfVisible, 30000);
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
    };
  }, [refreshCoupons]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshCoupons) await refreshCoupons();
      showFeedback('success', 'Coupons refreshed from live database.');
    } catch {
      showFeedback('error', 'Failed to refresh coupons from database.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleOpenCreate = () => {
    setCouponToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setCouponToEdit(coupon);
    setIsCreateModalOpen(true);
  };

  const handleSaveCoupon = async (couponData) => {
    try {
      if (couponToEdit) {
        await updateCoupon(couponToEdit._id || couponToEdit.id, couponData);
        showFeedback('success', `Coupon "${couponData.code}" updated successfully!`);
      } else {
        await addCoupon(couponData);
        showFeedback('success', `Coupon "${couponData.code}" created successfully!`);
      }
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to save coupon.');
      throw err;
    }
  };

  const handleDeleteCoupon = async (c) => {
    if (confirm(`Delete coupon code "${c.code}" permanently from database?`)) {
      try {
        await deleteCoupon(c._id || c.id);
        showFeedback('success', `Coupon "${c.code}" deleted permanently.`);
      } catch (err) {
        showFeedback('error', err?.message || 'Failed to delete coupon.');
      }
    }
  };

  const handleToggleStatus = async (c) => {
    try {
      await toggleCouponStatus(c._id || c.id);
      showFeedback('success', `Coupon "${c.code}" status updated.`);
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to toggle status.');
    }
  };

  const activeCount = useMemo(() => {
    return (coupons || []).filter(c => c.status === 'Active' || c.status === 'ACTIVE').length;
  }, [coupons]);

  const inactiveCount = useMemo(() => {
    return (coupons || []).filter(c => c.status === 'Inactive' || c.status === 'INACTIVE').length;
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    return (coupons || []).filter(c => {
      const matchesSearch = !searchTerm.trim() || 
        c.code?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const isActive = c.status === 'Active' || c.status === 'ACTIVE';
      const matchesStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'ACTIVE' ? isActive : !isActive;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchTerm, statusFilter]);

  const pagination = usePagination(filteredCoupons, { resetKey: `${statusFilter}|${searchTerm}` });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Coupons & Discount Engine" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          
          {/* Toast Feedback Alert */}
          {feedback.message && (
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-2.5">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-semibold">{feedback.message}</span>
              </div>
              <button 
                onClick={() => setFeedback({ type: '', message: '' })} 
                className="text-xs font-bold uppercase tracking-wider opacity-60 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Top Header & Actions */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#D4AF37]" />
                <h1 className="text-base sm:text-lg font-bold text-[#0E2A1B]">
                  Coupons & Discount Engine
                </h1>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Real-time promotional discount rules stored live in MongoDB
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 sm:ml-auto">
              <button
                type="button"
                onClick={handleManualRefresh}
                title="Refresh coupon data from database"
                className="p-2.5 rounded-lg border border-stone-200 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4.5 py-2.5 rounded-lg bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-bold text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:scale-102 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Create Coupon</span>
              </button>
            </div>
          </div>

          {/* Filters & Search Controls */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search coupon code or description..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses ({coupons?.length || 0})</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Coupons Table Card */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-xs sm:text-[12px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Coupon Code</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Min. Order</th>
                    <th className="py-3.5 px-4">Usage Count</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Validity</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-xs sm:text-sm">
                  {couponsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-2.5">
                          <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]" />
                          <span className="text-xs font-semibold text-stone-500">
                            Loading coupons from database...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Tag className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
                          <p className="text-sm font-bold text-stone-700">No coupons found</p>
                          <p className="text-xs text-stone-500">
                            {searchTerm || statusFilter !== 'ALL'
                              ? 'No coupons match your filter or search criteria.'
                              : 'No promotional coupons created yet. Click below to add your first coupon.'}
                          </p>
                          {!searchTerm && statusFilter === 'ALL' && (
                            <button
                              type="button"
                              onClick={handleOpenCreate}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#1B3B29] transition-all cursor-pointer mt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create First Coupon</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.pageItems.map((c) => {
                      const isActive = c.status === 'Active' || c.status === 'ACTIVE';
                      const isPercentage = c.discountType === 'PERCENTAGE' || c.type === 'Percentage';
                      const discountStr = isPercentage
                        ? `${c.discountValue ?? c.discount}% OFF${c.maxDiscount > 0 ? ` (Up to ₹${c.maxDiscount})` : ''}`
                        : `₹${c.discountValue ?? c.discount} FLAT OFF`;

                      const usageText = c.usageLimit > 0
                        ? `${c.usedCount ?? c.usageCount ?? 0} / ${c.usageLimit} redemptions`
                        : `${c.usedCount ?? c.usageCount ?? 0} used (Unlimited)`;

                      return (
                        <tr key={c._id || c.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-extrabold text-xs sm:text-sm text-[#0E2A1B] tracking-wider bg-[#FAF7F2] px-3 py-1 rounded-md border border-stone-200 shadow-2xs">
                                {c.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(c.code)}
                                className="text-stone-400 hover:text-[#0E2A1B] p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                                title="Copy code"
                              >
                                {copiedCode === c.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                            {c.description && (
                              <p className="text-xs text-stone-500 mt-1 max-w-xs truncate">{c.description}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-emerald-800">
                            {discountStr}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-stone-900">
                            ₹{c.minOrderValue ?? c.minOrder ?? 0}
                          </td>

                          <td className="py-3.5 px-4 text-stone-600 text-xs">
                            <span className="px-2 py-0.5 rounded bg-stone-100 font-medium">
                              {usageText}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c)}
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                              }`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-stone-600 text-xs font-medium">
                            {c.validity || (c.endDate ? `Until ${new Date(c.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : 'Ongoing')}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(c)}
                                className="p-1.5 text-stone-400 hover:text-[#0E2A1B] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit coupon rule"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(c)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete coupon rule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination pagination={pagination} label="coupon rules" />
          </div>

        </main>
      </div>

      <CreateCouponModal
        isOpen={isCreateModalOpen}
        couponToEdit={couponToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCouponToEdit(null);
        }}
        onSave={handleSaveCoupon}
      />
    </div>
  );
}
