import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Flame, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AddProductModal from '../components/AddProductModal';
import { useAdmin } from '../../../context/AdminContext';
import { CATEGORIES } from '../../../data/categories';
import { resolveProductImage } from '../../../utils/productImage';

export default function AdminProducts() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { products, categories, refreshCategories, addProduct, updateProduct, deleteProduct, toggleProductStatus, refreshProducts } = useAdmin();

  useEffect(() => {
    if (refreshCategories) {
      refreshCategories();
    }
  }, []);

  const [activeStatusFilter, setActiveStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4500);
  };

  // Compute counts
  const activeCount = products.filter(p => p.inStock !== false).length;
  const inactiveCount = products.length - activeCount;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (activeStatusFilter === 'active' && p.inStock === false) return false;
      if (activeStatusFilter === 'inactive' && p.inStock !== false) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (p.name || '').toLowerCase().includes(q) || (p.flavor && p.flavor.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, activeStatusFilter, selectedCategory, searchQuery]);

  const handleEdit = (prod) => {
    setEditingProduct(prod);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (data) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id || editingProduct._id, data);
        showFeedback('success', `"${data.name || editingProduct.name}" updated successfully! Changes are live on the store.`);
      } else {
        await addProduct(data);
        showFeedback('success', `"${data.name}" added to catalog! ${data.isBestseller ? 'Automatically featured in Bestsellers.' : 'Live on user app.'}`);
      }
    } catch (err) {
      showFeedback('error', err.message || 'Failed to save product.');
    }
    setEditingProduct(null);
  };

  const handleToggle = async (p) => {
    const nextStatus = p.inStock === false;
    try {
      await toggleProductStatus(p.id || p._id);
      showFeedback('success', `"${p.name}" is now ${nextStatus ? 'In Stock (Active)' : 'Out of Stock (Inactive)'}.`);
    } catch (err) {
      showFeedback('error', 'Failed to toggle product status.');
    }
  };

  const handleDelete = async (p) => {
    if (confirm(`Are you sure you want to delete "${p.name}"? This will remove it from the store catalog.`)) {
      try {
        await deleteProduct(p.id || p._id);
        showFeedback('success', `"${p.name}" was removed from the catalog.`);
      } catch (err) {
        showFeedback('error', 'Failed to delete product.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans selection:bg-[#D4AF37] selection:text-[#0E2A1B]">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Products Catalog" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full font-sans max-w-7xl mx-auto">
          
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
                className="text-xs font-bold uppercase tracking-wider opacity-60 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Top Action Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Status Tabs: All, Active, Inactive */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-[#E8E2D5] shadow-2xs">
              {[
                { id: 'all', label: 'All Products', count: products.length },
                { id: 'active', label: 'Active', count: activeCount },
                { id: 'inactive', label: 'Inactive', count: inactiveCount },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-[13px] font-semibold transition-all ${
                    activeStatusFilter === tab.id
                      ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                      : 'text-stone-600 hover:text-[#0E2A1B]'
                  }`}
                >
                  {tab.label} <span className="opacity-75 text-xs font-normal">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (refreshProducts) {
                    await refreshProducts();
                    showFeedback('success', 'Catalog refreshed from live database.');
                  }
                }}
                className="px-3.5 py-2 rounded-md bg-white border border-stone-200 text-stone-700 hover:bg-[#FAF7F2] font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Refresh product list"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Add Product Button */}
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 rounded-md gold-gradient-btn text-[#0E2A1B] font-bold text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:scale-102 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#0E2A1B]" />
                <span>Add Product</span>
              </button>
            </div>

          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white rounded-lg p-3 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-[#FAF7F2] px-3.5 py-2 rounded-md border border-stone-200 text-xs sm:text-sm w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by product name or flavor..."
                className="bg-transparent focus:outline-none text-stone-800 text-xs sm:text-sm w-full placeholder:text-stone-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs sm:text-[13px] text-stone-600 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-stone-300 text-xs sm:text-[13px] font-semibold bg-stone-50 text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {(categories && categories.length > 0 ? categories : CATEGORIES).map(c => {
                  const catVal = c.slug || c.id || c._id;
                  return (
                    <option key={c.id || c.slug || c._id} value={catVal}>{c.name}</option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Products Table Card */}
          <div className="bg-white rounded-lg border border-[#E8E2D5] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-xs sm:text-[12.5px] font-bold">
                  <tr>
                    <th className="py-3.5 px-5 w-[8%]">Image</th>
                    <th className="py-3.5 px-5 w-[28%]">Product Name</th>
                    <th className="py-3.5 px-5 w-[18%]">Category</th>
                    <th className="py-3.5 px-5 w-[14%]">Price</th>
                    <th className="py-3.5 px-5 w-[14%]">Stock</th>
                    <th className="py-3.5 px-5 w-[11%]">Status</th>
                    <th className="py-3.5 px-5 w-[7%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-xs sm:text-sm">
                  {filteredProducts.map((p) => {
                    const isActive = p.inStock !== false;
                    const displayImage = resolveProductImage(p);
                    return (
                      <tr key={p.id || p._id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <img
                            src={displayImage}
                            alt=""
                            className="w-11 h-11 rounded-md object-cover border border-stone-200 bg-[#FAF7F2] p-0.5"
                          />
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold text-sm sm:text-[15px] text-[#0E2A1B]">{p.name}</span>
                            {p.isBestseller && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                                <Flame className="w-2.5 h-2.5 text-[#C89038]" />
                                Bestseller
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <span className="text-xs text-stone-400 font-normal">{p.flavor || p.subtitle || 'Natural Seasoning'} • {p.weight || '150g'}</span>
                            {p.gallery && p.gallery.length > 1 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <ImageIcon className="w-2.5 h-2.5 text-emerald-600" />
                                {p.gallery.length} photos
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 capitalize text-stone-700 font-medium text-xs sm:text-[13.5px]">
                          {(categories || []).find(c => (c.slug === p.category || (c.id || c._id) === p.category))?.name || p.category?.replace(/-/g, ' ')}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-sm sm:text-base text-stone-900">₹{p.price}</span>
                          {p.oldPrice && (
                            <span className="text-xs text-stone-400 line-through ml-1.5">₹{p.oldPrice}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`font-semibold text-xs sm:text-sm ${p.stockCount < 50 ? 'text-amber-700' : 'text-stone-700'}`}>
                            {p.stockCount ?? 150} units
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => handleToggle(p)}
                            className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`/product/${p.id || p._id || p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-stone-500 hover:text-[#0E2A1B] hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                              title="View product in storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom count info */}
            <div className="p-3.5 border-t border-stone-200 bg-[#FAF7F2] flex items-center justify-between text-xs sm:text-sm text-stone-500">
              <span className="font-medium">Showing {filteredProducts.length} snack items</span>
              <span className="text-xs text-stone-400">100% synchronized with live database & storefront</span>
            </div>
          </div>

        </main>
      </div>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        categories={categories}
      />
    </div>
  );
}
