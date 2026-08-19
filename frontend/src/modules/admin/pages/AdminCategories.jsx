import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  List, 
  FolderTree, 
  Layers,
  CheckCircle2,
  XCircle,
  FolderPlus
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import AddCategoryModal from '../components/AddCategoryModal';
import AddSubcategoryModal from '../components/AddSubcategoryModal';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminCategories() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { categories, setCategories, updateCategory, deleteCategory } = useAdmin();

  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'list'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Inactive'
  const [search, setSearch] = useState('');
  
  // Expanded items for Tree/List view
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const initial = {};
    categories.forEach(c => { initial[c.id] = true; });
    return initial;
  });

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [subModalParentCategory, setSubModalParentCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  // Toggle category expansion
  const toggleExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleExpandAll = () => {
    const allExp = {};
    categories.forEach(c => { allExp[c.id] = true; });
    setExpandedCategories(allExp);
  };

  const handleCollapseAll = () => {
    setExpandedCategories({});
  };

  // Toggle Category Active Status
  const toggleCategoryStatus = (catId) => {
    const target = categories.find(c => c.id === catId);
    if (!target) return;
    const newStatus = target.status === 'Inactive' ? 'Active' : 'Inactive';
    updateCategory(catId, { ...target, status: newStatus });
  };

  // Subcategory Actions
  const handleOpenAddSubcategory = (category) => {
    setSubModalParentCategory(category);
    setEditingSubcategory(null);
    setIsSubcategoryModalOpen(true);
  };

  const handleOpenEditSubcategory = (category, subcat) => {
    setSubModalParentCategory(category);
    setEditingSubcategory(subcat);
    setIsSubcategoryModalOpen(true);
  };

  const handleSaveSubcategory = (subData) => {
    if (!subModalParentCategory) return;
    const parentId = subModalParentCategory.id;
    const parent = categories.find(c => c.id === parentId);
    if (!parent) return;

    let updatedSubs = [...(parent.subcategories || [])];
    if (editingSubcategory) {
      updatedSubs = updatedSubs.map(s => s.id === editingSubcategory.id ? { ...s, ...subData } : s);
    } else {
      updatedSubs.push(subData);
    }

    updateCategory(parentId, { ...parent, subcategories: updatedSubs });
    setSubModalParentCategory(null);
    setEditingSubcategory(null);
  };

  const toggleSubcategoryStatus = (catId, subId) => {
    const parent = categories.find(c => c.id === catId);
    if (!parent) return;
    const updatedSubs = (parent.subcategories || []).map(s => {
      if (s.id === subId) {
        return { ...s, status: s.status === 'Inactive' ? 'Active' : 'Inactive' };
      }
      return s;
    });
    updateCategory(catId, { ...parent, subcategories: updatedSubs });
  };

  const handleDeleteSubcategory = (catId, subId) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    const parent = categories.find(c => c.id === catId);
    if (!parent) return;
    const updatedSubs = (parent.subcategories || []).filter(s => s.id !== subId);
    updateCategory(catId, { ...parent, subcategories: updatedSubs });
  };

  // CSV Export
  const exportToCSV = () => {
    let csv = "Category,Type,Status,Order,Subcategories Count\n";
    categories.forEach(cat => {
      csv += `"${cat.name}","Root Category","${cat.status || 'Active'}","${cat.order || 1}","${cat.subcategories?.length || 0}"\n`;
      (cat.subcategories || []).forEach(sub => {
        csv += `"-- ${sub.name}","Subcategory (${cat.name})","${sub.status || 'Active'}","${sub.order || 1}","-"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auriva_category_taxonomy_${Date.now()}.csv`);
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
      const matchParent = cat.name.toLowerCase().includes(q) || (cat.subtext && cat.subtext.toLowerCase().includes(q));
      const matchSub = (cat.subcategories || []).some(s => s.name.toLowerCase().includes(q));
      if (!matchParent && !matchSub) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Category Management" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4 w-full font-sans">
          
          {/* Top Breadcrumb & Taxonomy Structure Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#0E2A1B]">
              <span className="text-stone-400 font-bold">&gt;</span>
              <span>Category Management</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/40 shadow-xs self-start sm:self-auto">
              <span>TAXONOMY STRUCTURE ({categories.length} ROOT CATEGORIES)</span>
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
                  className="px-4 py-2 rounded-lg bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs sm:text-[13px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:scale-102 hover:bg-[#1B3B29] transition-all"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Add Category</span>
                </button>

                {/* View Switcher: Tree View / List View */}
                <div className="flex items-center bg-[#FAF7F2] p-1 rounded-lg border border-stone-200 text-xs">
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === 'tree'
                        ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Tree View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === 'list'
                        ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List View</span>
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
                    placeholder="Search by name..."
                    className="bg-transparent focus:outline-none text-stone-800 text-xs w-full placeholder:text-stone-400"
                  />
                </div>

                <button
                  onClick={exportToCSV}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Export Category Architecture to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Export CSV</span>
                </button>
              </div>

            </div>

            {/* Expand / Collapse All Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={handleExpandAll}
                className="px-3 py-1 rounded-md bg-[#FAF7F2] hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-semibold transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-3 py-1 rounded-md bg-[#FAF7F2] hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-semibold transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Hierarchical Categories & Subcategories List */}
          <div className="space-y-3 w-full">
            {filteredCategories.map((cat, catIdx) => {
              const isExpanded = !!expandedCategories[cat.id];
              const subcategories = cat.subcategories || [];
              const isActive = cat.status !== 'Inactive';

              return (
                <div key={cat.id} className="space-y-2.5">
                  
                  {/* Root Category Row Card */}
                  <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-all">
                    
                    {/* Left: Expand Toggle + Image + Category Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {subcategories.length > 0 ? (
                        <button
                          onClick={() => toggleExpand(cat.id)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors shrink-0"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                      ) : (
                        <div className="w-7 h-7 shrink-0" />
                      )}

                      {/* Image Thumbnail */}
                      <img
                        src={cat.image || 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=100'}
                        alt={cat.name}
                        className="w-12 h-12 rounded-lg object-cover border border-stone-200 bg-[#FAF7F2] shrink-0"
                      />

                      {/* Title & Badges */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-sans font-bold text-sm sm:text-base text-[#0E2A1B] truncate">
                            {cat.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                          {/* Active / Inactive Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>

                          {/* Subcategories count badge */}
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-semibold">
                            {subcategories.length} subcategories
                          </span>

                          {/* Order badge */}
                          <span className="text-stone-400 text-xs font-medium">
                            Order: {cat.order || catIdx + 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                      <button
                        onClick={() => handleOpenAddSubcategory(cat)}
                        className="px-3 py-1.5 rounded-lg bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold flex items-center gap-1 hover:bg-[#1B3B29] transition-all shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Subcategory</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => toggleCategoryStatus(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          isActive
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Indented Subcategories (Rendered strictly when expanded and subcategories exist) */}
                  {isExpanded && subcategories.length > 0 && (
                    <div className="pl-6 sm:pl-10 space-y-2 border-l-2 border-[#D4AF37]/50 ml-6 sm:ml-8 my-1">
                      {subcategories.map((sub, subIdx) => {
                        const isSubActive = sub.status !== 'Inactive';
                        return (
                          <div 
                            key={sub.id || subIdx}
                            className="bg-white/90 backdrop-blur-xs rounded-lg p-3 border border-[#E8E2D5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {/* Subcategory Icon / Thumbnail avatar */}
                              {sub.image ? (
                                <img
                                  src={sub.image}
                                  alt={sub.name}
                                  className="w-10 h-10 rounded-md object-cover border border-stone-200 bg-white shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-[#FAF7F2] border border-stone-200 flex items-center justify-center text-stone-700 font-bold text-xs shrink-0">
                                  {sub.name.charAt(0)}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-sans font-semibold text-xs sm:text-sm text-stone-900">
                                    {sub.name}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                                    Subcategory
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                                  <span className={`px-2 py-0.2 rounded text-[10.5px] font-semibold ${
                                    isSubActive 
                                      ? 'text-emerald-700 bg-emerald-50' 
                                      : 'text-rose-700 bg-rose-50'
                                  }`}>
                                    {isSubActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <span>Order: {sub.order || subIdx + 1}</span>
                                </div>
                              </div>
                            </div>

                            {/* Subcategory Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                onClick={() => handleOpenEditSubcategory(cat, sub)}
                                className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                                title="Edit Subcategory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => toggleSubcategoryStatus(cat.id, sub.id)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                                  isSubActive
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {isSubActive ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </main>
      </div>

      {/* Root Category Modal */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={(data) => {
          if (editingCategory) {
            updateCategory(editingCategory.id, data);
          } else {
            const newCat = {
              id: `cat-${Date.now()}`,
              ...data,
              subcategories: []
            };
            setCategories(prev => [...prev, newCat]);
          }
          setEditingCategory(null);
        }}
        initialData={editingCategory}
      />

      {/* Subcategory Modal */}
      <AddSubcategoryModal
        isOpen={isSubcategoryModalOpen}
        onClose={() => {
          setIsSubcategoryModalOpen(false);
          setSubModalParentCategory(null);
          setEditingSubcategory(null);
        }}
        parentCategory={subModalParentCategory}
        initialData={editingSubcategory}
        onSave={handleSaveSubcategory}
      />
    </div>
  );
}
