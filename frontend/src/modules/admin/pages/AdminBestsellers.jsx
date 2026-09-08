import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, Plus, ArrowUp, ArrowDown, Trash2, Eye, EyeOff, 
  Settings, Save, RefreshCw, CheckCircle2, AlertCircle, 
  HelpCircle, ExternalLink, GripVertical, ChevronLeft, ChevronRight,
  Package, Search, Sparkles
} from 'lucide-react';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AddBestsellerProductModal from '../components/AddBestsellerProductModal';
import EditBestsellerSectionModal from '../components/EditBestsellerSectionModal';
import { bestsellerApi } from '../../../utils/api';
import { PRODUCTS as DEFAULT_PRODUCTS } from '../../../data/products';

export default function AdminBestsellers() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bestsellers, setBestsellers] = useState([]);
  const [config, setConfig] = useState({
    isEnabled: true,
    sectionLabel: 'OUR BESTSELLERS',
    sectionHeading: 'DISCOVER OUR MOST LOVED FLAVOURS',
    viewAllText: 'VIEW ALL PRODUCTS',
    viewAllLink: '/shop'
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null); // item to remove confirmation

  // Filter / Search within bestsellers
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Feedback Messages
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  // Load Bestsellers from Backend API
  const fetchBestsellers = async () => {
    setLoading(true);
    try {
      const res = await bestsellerApi.getAdminBestsellers();
      if (res && res.data) {
        setBestsellers(res.data.bestsellers || []);
        if (res.data.config) {
          setConfig(res.data.config);
        }
      }
    } catch (err) {
      console.warn('Could not fetch from backend API, using initial store bestsellers fallback:', err.message);
      // Fallback from default data if offline
      const mockItems = DEFAULT_PRODUCTS.slice(0, 5).map((p, idx) => ({
        _id: `bs-mock-${p.id || idx}`,
        product: p,
        displayOrder: idx + 1,
        isActive: true
      }));
      setBestsellers(mockItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBestsellers();
  }, []);

  // Filtered Items for List
  const filteredBestsellers = useMemo(() => {
    return bestsellers.filter(item => {
      if (!item.product) return false;
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (item.product.name || '').toLowerCase();
        const flavor = (item.product.flavor || '').toLowerCase();
        return name.includes(q) || flavor.includes(q);
      }
      return true;
    });
  }, [bestsellers, statusFilter, searchQuery]);

  // Statistics
  const totalCount = bestsellers.length;
  const activeCount = bestsellers.filter(b => b.isActive).length;
  const inactiveCount = totalCount - activeCount;

  // Existing Product IDs (to disable duplicate adding in modal)
  const existingProductIds = useMemo(() => {
    return bestsellers.map(b => b.product?._id || b.product?.id).filter(Boolean);
  }, [bestsellers]);

  // Add Products Handler
  const handleAddProducts = async (productIds) => {
    try {
      const res = await bestsellerApi.addProducts(productIds);
      showFeedback('success', res.message || 'Products successfully added to Bestsellers!');
      fetchBestsellers();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to add products to Bestsellers.');
    }
  };

  // Remove Product Handler (Never deletes the Product itself)
  const handleConfirmRemove = async () => {
    if (!productToRemove) return;
    const id = productToRemove._id;
    const productName = productToRemove.product?.name || 'Product';

    try {
      await bestsellerApi.removeProduct(id);
      setBestsellers(prev => prev.filter(item => item._id !== id));
      showFeedback('success', `"${productName}" removed from Bestsellers. Product remains safe in your store.`);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to remove bestseller item.');
    } finally {
      setProductToRemove(null);
    }
  };

  // Toggle Active/Inactive status for a bestseller item
  const handleToggleStatus = async (item) => {
    const newStatus = !item.isActive;
    // Optimistic UI update
    setBestsellers(prev => prev.map(b => b._id === item._id ? { ...b, isActive: newStatus } : b));

    try {
      await bestsellerApi.toggleStatus(item._id, newStatus);
      showFeedback('success', `"${item.product?.name}" is now ${newStatus ? 'Active' : 'Inactive'} in Bestsellers.`);
    } catch (err) {
      // Revert on error
      setBestsellers(prev => prev.map(b => b._id === item._id ? { ...b, isActive: item.isActive } : b));
      showFeedback('error', err.message || 'Failed to update product status.');
    }
  };

  // Reordering: Move Up / Down
  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bestsellers.length) return;

    const newItems = [...bestsellers];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Re-assign displayOrder sequentially
    const updatedWithOrder = newItems.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setBestsellers(updatedWithOrder);

    // Save to backend
    setIsSavingOrder(true);
    try {
      const payload = updatedWithOrder.map(item => ({
        id: item._id,
        displayOrder: item.displayOrder
      }));
      await bestsellerApi.reorder(payload);
      showFeedback('success', 'Bestseller display order updated successfully.');
    } catch (err) {
      showFeedback('error', err.message || 'Failed to save reordered list.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Drag and drop HTML5 reordering
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newItems = [...bestsellers];
    const [dragged] = newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, dragged);

    const reordered = newItems.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setDraggedItemIndex(index);
    setBestsellers(reordered);
  };

  const handleDragEnd = async () => {
    setDraggedItemIndex(null);
    setIsSavingOrder(true);
    try {
      const payload = bestsellers.map((item, idx) => ({
        id: item._id,
        displayOrder: idx + 1
      }));
      await bestsellerApi.reorder(payload);
      showFeedback('success', 'Bestseller order saved.');
    } catch (err) {
      showFeedback('error', err.message || 'Failed to save reordered list.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Save Section Configuration (Global toggle & headings)
  const handleSaveConfig = async (newConfigData) => {
    try {
      const res = await bestsellerApi.updateSectionConfig(newConfigData);
      if (res && res.data && res.data.config) {
        setConfig(res.data.config);
      } else {
        setConfig(prev => ({ ...prev, ...newConfigData }));
      }
      showFeedback('success', 'Bestseller section configuration saved successfully.');
    } catch (err) {
      showFeedback('error', err.message || 'Failed to save section settings.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans selection:bg-[#D4AF37] selection:text-[#0E2A1B]">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Bestsellers Management" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto">
          
          {/* Top Hero / Breadcrumb Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#0E2A1B]">
                  <Flame className="w-5 h-5 text-[#C89038]" />
                </span>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#0E2A1B]">
                  Homepage Bestsellers Carousel
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
                Curate and order the products showcased in the <strong>"{config.sectionHeading}"</strong> carousel on your User App homepage.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5 shrink-0">
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 hover:border-[#0E2A1B] text-stone-700 hover:text-[#0E2A1B] bg-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Live Preview</span>
              </button>

              {/* Section Settings Button */}
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 hover:border-[#0E2A1B] text-stone-700 hover:text-[#0E2A1B] bg-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Section Settings</span>
              </button>

              {/* Add Products Button */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#0E2A1B] hover:bg-[#163825] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Add Products</span>
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback.message && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-fadeIn text-xs sm:text-sm font-semibold ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D5] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-stone-500">Total Selected</p>
                <p className="text-2xl font-serif font-extrabold text-[#0E2A1B] mt-0.5">{totalCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-stone-200 flex items-center justify-center text-[#0E2A1B]">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D5] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Active in Carousel</p>
                <p className="text-2xl font-serif font-extrabold text-emerald-800 mt-0.5">{activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D5] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-amber-700">Hidden / Inactive</p>
                <p className="text-2xl font-serif font-extrabold text-amber-800 mt-0.5">{inactiveCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <EyeOff className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D5] shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-stone-500">Section Visibility</p>
                <p className={`text-base sm:text-lg font-bold mt-1 ${config.isEnabled ? 'text-[#0E2A1B]' : 'text-stone-400'}`}>
                  {config.isEnabled ? '● LIVE ON APP' : '○ HIDDEN'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => handleSaveConfig({ isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0E2A1B]"></div>
              </label>
            </div>

          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8E2D5] shadow-sm overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 border-b border-[#E8E2D5] bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter bestsellers..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-300 shrink-0">
                {[
                  { id: 'all', label: 'All', count: totalCount },
                  { id: 'active', label: 'Active', count: activeCount },
                  { id: 'inactive', label: 'Inactive', count: inactiveCount }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

            </div>

            {/* List / Table Content */}
            <div className="divide-y divide-stone-100">
              {loading ? (
                <div className="py-16 text-center text-stone-500 space-y-2">
                  <div className="w-7 h-7 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold">Loading bestsellers list...</p>
                </div>
              ) : filteredBestsellers.length === 0 ? (
                <div className="py-16 text-center text-stone-500 space-y-3">
                  <Flame className="w-10 h-10 text-stone-300 mx-auto" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-800">
                      {totalCount === 0 ? 'No Bestsellers Configured' : 'No Matching Products'}
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-0.5">
                      {totalCount === 0 
                        ? 'Click the "+ Add Products" button above to choose products from your store catalog to feature.' 
                        : 'Try resetting your search query or status filter.'}
                    </p>
                  </div>
                  {totalCount === 0 && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-4 py-2 bg-[#0E2A1B] text-[#D4AF37] rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-102 transition-all cursor-pointer"
                    >
                      + Add First Product
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredBestsellers.map((item, index) => {
                    const prod = item.product;
                    if (!prod) return null;

                    return (
                      <div
                        key={item._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          !item.isActive ? 'bg-stone-50/70 opacity-75' : 'hover:bg-[#FAF7F2]/50'
                        } ${draggedItemIndex === index ? 'opacity-40 border-2 border-dashed border-[#D4AF37]' : ''}`}
                      >
                        
                        {/* Left Info with Drag Handle */}
                        <div className="flex items-center gap-3 min-w-0">
                          
                          {/* Drag Handle & Order Badge */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span 
                              className="p-1.5 text-stone-400 hover:text-stone-700 cursor-grab active:cursor-grabbing rounded" 
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4.5 h-4.5" />
                            </span>
                            <span className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-stone-200 text-xs font-mono font-extrabold text-[#0E2A1B] flex items-center justify-center shadow-2xs">
                              #{item.displayOrder || index + 1}
                            </span>
                          </div>

                          {/* Product Image */}
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=100&auto=format&fit=crop&q=80'}
                            alt={prod.name}
                            className="w-13 h-13 rounded-xl object-cover border border-stone-200 bg-[#FAF7F2] shrink-0"
                          />

                          {/* Product Meta */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-stone-900 truncate">
                                {prod.name}
                              </h3>
                              {prod.badge && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#0E2A1B] border border-[#D4AF37]/30 uppercase tracking-wide">
                                  {prod.badge}
                                </span>
                              )}
                              {!item.isActive && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
                                  Hidden from Section
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-stone-500 truncate mt-0.5">
                              {prod.subtitle || prod.flavor || prod.category} • Weight: {prod.weight || '150g'}
                            </p>
                          </div>

                        </div>

                        {/* Right Actions & Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-10 sm:pl-0">
                          
                          {/* Price */}
                          <div className="text-left sm:text-right">
                            <span className="text-sm font-extrabold text-[#0E2A1B] block">
                              ₹{prod.price}
                            </span>
                            {prod.oldPrice > prod.price && (
                              <span className="text-[11px] text-stone-400 line-through">
                                ₹{prod.oldPrice}
                              </span>
                            )}
                          </div>

                          {/* Active Switch */}
                          <div className="flex items-center gap-1.5">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isActive}
                                onChange={() => handleToggleStatus(item)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0E2A1B]"></div>
                            </label>
                            <span className="text-xs font-semibold text-stone-600 hidden md:inline">
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Accessible Move Up / Down Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMove(index, 'up')}
                              className="w-8 h-8 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-stone-600 hover:text-[#0E2A1B] transition-colors cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === bestsellers.length - 1}
                              onClick={() => handleMove(index, 'down')}
                              className="w-8 h-8 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-stone-600 hover:text-[#0E2A1B] transition-colors cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Remove from Bestsellers Button (Safe - never deletes product) */}
                          <button
                            type="button"
                            onClick={() => setProductToRemove(item)}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from Bestsellers"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Table Footer Instructions */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E2D5] flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-stone-400" />
                <span>Drag items using the handle <strong>☰</strong> or use the arrow buttons to rearrange display order.</span>
              </div>
              <span className="font-semibold text-stone-700">
                {activeCount} of {totalCount} items visible on app
              </span>
            </div>

          </div>

        </main>
      </div>

      {/* 1. ADD PRODUCTS MODAL */}
      <AddBestsellerProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProducts}
        existingBestsellerProductIds={existingProductIds}
      />

      {/* 2. SECTION CONFIGURATION MODAL */}
      <EditBestsellerSectionModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />

      {/* 3. SAFE REMOVE CONFIRMATION MODAL */}
      {productToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#E8E2D5] shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Remove from Bestsellers?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                <strong>"{productToRemove.product?.name}"</strong> will no longer appear in the Bestseller section on the User App.
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold mt-3">
                🛡️ <strong>Safety Guarantee:</strong> The product itself will <u>NOT</u> be deleted from your store catalog.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToRemove(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Remove from Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. LIVE INTERACTIVE USER APP PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-[#FAF7F2] w-full max-w-5xl rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Preview Modal Header */}
            <div className="bg-[#0E2A1B] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37]">
                  <Eye className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                    Live User App Section Preview
                  </h3>
                  <p className="text-[11px] text-[#A2B5A8]">
                    This is the exact carousel layout your customers see on the homepage.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Preview Section Container */}
            <div className="p-6 sm:p-8 overflow-y-auto bg-[#F7F3E9]">
              
              {!config.isEnabled ? (
                <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center text-amber-900 space-y-2">
                  <EyeOff className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="font-bold text-sm">Section Currently Disabled</h4>
                  <p className="text-xs text-amber-700">The Bestsellers section is turned OFF in settings and will not render on the homepage.</p>
                </div>
              ) : activeCount === 0 ? (
                <div className="p-8 rounded-2xl bg-stone-100 border border-stone-200 text-center text-stone-600 space-y-2">
                  <Package className="w-8 h-8 text-stone-400 mx-auto" />
                  <h4 className="font-bold text-sm">No Active Products</h4>
                  <p className="text-xs text-stone-500">Enable at least one product to display the carousel on the homepage.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Section Top Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-[#0E2A1B]">
                        {config.sectionLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-center">
                      <span className="hidden sm:block h-[1px] w-8 bg-[#D4AF37]"></span>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#C89038] tracking-wide">
                        {config.sectionHeading}
                      </h2>
                      <span className="hidden sm:block h-[1px] w-8 bg-[#D4AF37]"></span>
                    </div>

                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#0E2A1B]">
                      {config.viewAllText}
                    </span>
                  </div>

                  {/* Horizontal Scroll Preview */}
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {bestsellers.filter(b => b.isActive).map((item, idx) => {
                      const prod = item.product;
                      if (!prod) return null;

                      return (
                        <div 
                          key={item._id || idx}
                          className="w-[260px] min-w-[260px] bg-white rounded-2xl border border-[#E8E2D5] p-3 shadow-xs flex flex-col justify-between shrink-0"
                        >
                          <div>
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#FAF7F2] mb-3">
                              <img
                                src={prod.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80'}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                              {prod.badge && (
                                <span className="absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded bg-[#C89038] text-white uppercase">
                                  {prod.badge}
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                              {prod.name}
                            </h4>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">
                              {prod.subtitle || prod.flavor}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-3">
                            <span className="font-extrabold text-sm text-[#0E2A1B]">
                              ₹{prod.price}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-[#0E2A1B] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-stone-200">
                              Add to Cart
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>

            {/* Preview Footer */}
            <div className="p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
