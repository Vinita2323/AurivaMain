import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Download, 
  List, 
  LayoutGrid, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Tag,
  Package
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AddCategoryModal from '../components/AddCategoryModal';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminCategories() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { 
    categories, 
    products = [],
    addCategory,
    updateCategory, 
    deleteCategory,
    toggleCategoryStatus,
    refreshCategories,
    categoriesLoading
  } = useAdmin();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Inactive'
  const [search, setSearch] = useState('');
  
  // Feedback notification banner state
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4500);
  };

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Toggle Category Active Status (Async API)
  const handleToggleCategoryStatus = async (catId) => {
    const target = categories.find(c => (c.id || c._id) === catId);
    if (!target) return;
    const newStatus = target.status === 'Inactive' ? 'Active' : 'Inactive';
    try {
      await toggleCategoryStatus(catId);
      showFeedback('success', `Category "${target.name}" is now ${newStatus}.`);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update category status.');
    }
  };

  // Delete Category (Async API with Safety Check)
  const handleDeleteCategory = async (cat) => {
    const catProducts = products.filter(p => p.category === cat.slug || p.category === cat.id);
    const confirmMsg = catProducts.length > 0
      ? `Category "${cat.name}" currently has ${catProducts.length} associated products. Are you sure you want to delete it?`
      : `Are you sure you want to delete category "${cat.name}"?`;
    
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteCategory(cat.id || cat._id);
      showFeedback('success', `Category "${cat.name}" deleted successfully.`);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to delete category.');
    }
  };

  // CSV Export
  const exportToCSV = () => {
    let csv = "Category Name,Slug,Status,Order,Products Count,Description\n";
    categories.forEach(cat => {
      const pCount = products.filter(p => p.category === cat.slug || p.category === cat.id).length;
      const desc = (cat.description || '').replace(/"/g, '""');
      csv += `"${cat.name}","${cat.slug || ''}","${cat.status || 'Active'}","${cat.order || 1}","${pCount}","${desc}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auriva_categories_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredCategories = categories.filter(cat => {
    if (statusFilter !== 'all') {
      const catStat = cat.status || 'Active';
      if (catStat !== statusFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchName = (cat.name || '').toLowerCase().includes(q);
      const matchSlug = (cat.slug || '').toLowerCase().includes(q);
      const matchSubtext = (cat.subtext || '').toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchSubtext) return false;
    }
    return true;
  }).sort((a, b) => (a.order || a.sortOrder || 0) - (b.order || b.sortOrder || 0));

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Category Management" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full font-sans">
          
          {/* Status Feedback Notification Banner */}
          {feedback.message && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200 ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
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

          {/* Top Breadcrumb & Category Count Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#0E2A1B]">
              <span className="text-stone-400 font-bold">&gt;</span>
              <span>Category Management</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/40 shadow-xs self-start sm:self-auto">
              <span>CATALOG ({categories.length} CATEGORIES)</span>
            </div>
          </div>

          {/* Action & Filter Controls Bar */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Left Group: Add Category + View Modes */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs sm:text-[13px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-102 hover:bg-[#1B3B29] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Add Category</span>
                </button>

                {/* View Switcher: List View / Grid View */}
                <div className="flex items-center bg-[#FAF7F2] p-1 rounded-lg border border-stone-200 text-xs">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid View</span>
                  </button>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-stone-600">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-semibold text-stone-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Right Group: Search & Export CSV */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-stone-200 text-xs w-full sm:w-64">
                  <span className="text-stone-400 font-semibold">Search:</span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by category name..."
                    className="bg-transparent focus:outline-none text-stone-800 text-xs w-full placeholder:text-stone-400"
                  />
                </div>

                <button
                  onClick={exportToCSV}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Export Categories to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      await refreshCategories();
                      showFeedback('success', 'Categories refreshed from server!');
                    } catch (err) {
                      showFeedback('error', 'Failed to refresh categories from server.');
                    }
                  }}
                  disabled={categoriesLoading}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Reload categories from server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${categoriesLoading ? 'animate-spin text-[#D4AF37]' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

            </div>
          </div>

          {/* Categories Content: Loading / Empty / List / Grid */}
          <div className="w-full">
            {categoriesLoading ? (
              <div className="bg-white rounded-xl p-12 border border-[#E8E2D5] text-center space-y-3 shadow-2xs">
                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
                <p className="font-semibold text-stone-700 text-sm">Loading categories from server...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="bg-white rounded-xl p-10 border border-[#E8E2D5] text-center space-y-3 shadow-2xs">
                <Tag className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="font-sans font-bold text-base text-[#0E2A1B]">No Categories Found</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {search || statusFilter !== 'all'
                    ? "No categories match the selected filters or search query."
                    : "No categories have been added yet. Click 'Add Category' above to create one."}
                </p>
                {(search || statusFilter !== 'all') && (
                  <button
                    onClick={() => { setSearch(''); setStatusFilter('all'); }}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW */
              <div className="space-y-2.5">
                {filteredCategories.map((cat, catIdx) => {
                  const catKey = cat.id || cat._id || `cat-${catIdx}`;
                  const isActive = cat.status !== 'Inactive';
                  const pCount = products.filter(p => p.category === cat.slug || p.category === cat.id).length;

                  return (
                    <div 
                      key={catKey}
                      className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-all"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={cat.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=120'}
                          alt={cat.name}
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 bg-[#FAF7F2] shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-sans font-bold text-sm sm:text-base text-[#0E2A1B] truncate">
                              {cat.name}
                            </h3>
                            {cat.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-[#0E2A1B]/5 text-[#0E2A1B] border border-[#0E2A1B]/15 text-[10px] font-bold uppercase tracking-wider">
                                {cat.badge}
                              </span>
                            )}
                          </div>

                          {cat.subtext && (
                            <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                              {cat.subtext}
                            </p>
                          )}

                          <div className="flex items-center gap-2.5 mt-1 flex-wrap text-xs">
                            {/* Active / Inactive Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>

                            {/* Products count pill */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-semibold">
                              <Package className="w-3 h-3 text-amber-700" />
                              <span>{pCount} {pCount === 1 ? 'snack' : 'snacks'}</span>
                            </span>

                            {/* Order badge */}
                            <span className="text-stone-400 text-xs font-medium">
                              Order: {cat.order || cat.sortOrder || catIdx + 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleToggleCategoryStatus(cat.id || cat._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((cat, catIdx) => {
                  const catKey = cat.id || cat._id || `cat-${catIdx}`;
                  const isActive = cat.status !== 'Inactive';
                  const pCount = products.filter(p => p.category === cat.slug || p.category === cat.id).length;

                  return (
                    <div 
                      key={catKey}
                      className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all"
                    >
                      <div>
                        {/* Image Header */}
                        <div className="relative h-36 bg-[#FAF7F2] overflow-hidden border-b border-stone-200">
                          <img
                            src={cat.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400'}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                            {cat.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                                {cat.badge}
                              </span>
                            )}
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 text-xs font-bold border border-stone-200 shadow-2xs">
                              #{cat.order || cat.sortOrder || catIdx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-2">
                          <div>
                            <h3 className="font-sans font-bold text-base text-[#0E2A1B]">
                              {cat.name}
                            </h3>
                            {cat.subtext && (
                              <p className="text-xs text-stone-500 font-medium mt-0.5">
                                {cat.subtext}
                              </p>
                            )}
                          </div>

                          {cat.description && (
                            <p className="text-xs text-stone-600 line-clamp-2">
                              {cat.description}
                            </p>
                          )}

                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold">
                              <Package className="w-3.5 h-3.5 text-amber-700" />
                              <span>{pCount} {pCount === 1 ? 'snack product' : 'snack products'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3 bg-[#FAF7F2] border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleCategoryStatus(cat.id || cat._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                              : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsCategoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 rounded-lg bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Category Modal (Create / Edit) */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={async (data) => {
          try {
            if (editingCategory) {
              await updateCategory(editingCategory.id || editingCategory._id, data);
              showFeedback('success', `Category "${data.name || editingCategory.name}" updated successfully!`);
            } else {
              await addCategory(data);
              showFeedback('success', `Category "${data.name}" created successfully!`);
            }
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          } catch (err) {
            showFeedback('error', err.message || 'Failed to save category.');
          }
        }}
        initialData={editingCategory}
      />
    </div>
  );
}
