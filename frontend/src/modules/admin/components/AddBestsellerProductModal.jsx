import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Check, AlertCircle, Plus, Sparkles, Package } from 'lucide-react';
import { productApi } from '../../../utils/api';
import { useAdmin } from '../../../context/AdminContext';
import { resolveProductImage } from '../../../utils/productImage';

export default function AddBestsellerProductModal({ isOpen, onClose, onAdd, existingBestsellerProductIds = [] }) {
  const { products: contextProducts, categories: adminCategories } = useAdmin();
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch store products from API with fallback to contextProducts
  useEffect(() => {
    if (!isOpen) {
      setSelectedProductIds([]);
      setSearchQuery('');
      setSelectedCategory('all');
      setError('');
      return;
    }

    let isMounted = true;
    setLoading(true);

    productApi.getAllProducts()
      .then(res => {
        if (isMounted && res && res.data && res.data.products) {
          setAllProducts(res.data.products);
        } else if (isMounted && contextProducts) {
          setAllProducts(contextProducts);
        }
      })
      .catch(() => {
        if (isMounted && contextProducts) {
          setAllProducts(contextProducts);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, contextProducts]);

  // Set of existing bestseller IDs for instant lookup
  const existingSet = useMemo(() => {
    return new Set(existingBestsellerProductIds.map(id => String(id)));
  }, [existingBestsellerProductIds]);

  // Dynamic category options from AdminContext or default list
  const categoryOptions = useMemo(() => {
    if (adminCategories && adminCategories.length > 0) {
      return adminCategories;
    }
    return [
      { id: 'flavoured-makhana', slug: 'flavoured-makhana', name: 'Flavoured Makhana' },
      { id: 'plain-roasted-makhana', slug: 'plain-roasted-makhana', name: 'Plain / Roasted' },
      { id: 'makhana-combos', slug: 'makhana-combos', name: 'Combos & Gifting' },
      { id: 'healthy-fitness-makhana', slug: 'healthy-fitness-makhana', name: 'Fitness Snacks' }
    ];
  }, [adminCategories]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (selectedCategory !== 'all') {
        const catValue = (p.category || p.categorySlug || p.categoryId || '').toLowerCase();
        const targetValue = selectedCategory.toLowerCase();
        if (catValue !== targetValue) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const flavorMatch = (p.flavor || p.subtitle || '').toLowerCase().includes(q);
        return nameMatch || flavorMatch;
      }
      return true;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  const toggleSelect = (productId) => {
    const idStr = String(productId);
    if (existingSet.has(idStr)) return; // Prevent selecting already added products

    setSelectedProductIds(prev => 
      prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr]
    );
  };

  const handleSelectAllAvailable = () => {
    const availableIds = filteredProducts
      .map(p => String(p._id || p.id))
      .filter(id => !existingSet.has(id));

    if (selectedProductIds.length === availableIds.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(availableIds);
    }
  };

  const handleAddSubmit = () => {
    if (selectedProductIds.length === 0) {
      setError('Please select at least one product.');
      return;
    }
    onAdd(selectedProductIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans selection:bg-[#D4AF37] selection:text-[#0E2A1B] overflow-y-auto"
    >
      <div 
        data-lenis-prevent
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-[#E8E2D5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        
        {/* Modal Header */}
        <div className="bg-[#0E2A1B] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#143322] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
                Add Products to Bestsellers
              </h3>
              <p className="text-[11px] sm:text-xs text-[#A2B5A8]">
                Select from your existing store catalog to showcase in the Bestsellers carousel.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Search & Filter Toolbar */}
        <div className="p-3.5 sm:p-4 bg-[#FAF7F2] border-b border-[#E8E2D5] space-y-3 shrink-0">
          
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, flavour, or tag..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 bg-white"
              />
            </div>

            {/* Dynamic Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white font-medium text-stone-700 shrink-0 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Stats & Select All */}
          <div className="flex items-center justify-between text-xs text-stone-600 pt-0.5 px-0.5">
            <span>
              Showing <strong>{filteredProducts.length}</strong> product(s)
            </span>
            <button
              type="button"
              onClick={handleSelectAllAvailable}
              className="text-xs font-bold text-[#0E2A1B] hover:text-[#C58A2B] transition-colors underline cursor-pointer"
            >
              Toggle Select All Available
            </button>
          </div>

        </div>

        {/* Modal Products List (Scrollable) */}
        <div 
          data-lenis-prevent
          className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-2 max-h-[420px] divide-y divide-stone-100"
        >
          {loading ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading products catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <Package className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-stone-700">No matching products found</p>
              <p className="text-xs text-stone-500">Try changing your search keywords or category filter.</p>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const pId = String(prod._id || prod.id);
              const isAlreadyAdded = existingSet.has(pId);
              const isSelected = selectedProductIds.includes(pId);

              return (
                <div
                  key={pId}
                  onClick={() => !isAlreadyAdded && toggleSelect(pId)}
                  className={`pt-2 first:pt-0 flex items-center justify-between p-2.5 rounded-xl border transition-all select-none ${
                    isAlreadyAdded
                      ? 'bg-stone-100/70 border-stone-200 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#F7F3E9] border-[#D4AF37] shadow-xs cursor-pointer'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    
                    {/* Custom Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isAlreadyAdded
                          ? 'bg-stone-200 border-stone-300 text-stone-400'
                          : isSelected
                          ? 'bg-[#0E2A1B] border-[#0E2A1B] text-[#D4AF37]'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {(isSelected || isAlreadyAdded) && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>

                    {/* Product Image */}
                    <img
                      src={resolveProductImage(prod)}
                      alt={prod.name}
                      className="w-11 h-11 rounded-lg object-cover border border-stone-200 bg-[#FAF7F2] shrink-0"
                    />

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {prod.name}
                        </h4>
                        {prod.badge && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#0E2A1B]/10 text-[#0E2A1B] uppercase">
                            {prod.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {prod.subtitle || prod.flavor || prod.category}
                      </p>
                    </div>

                  </div>

                  {/* Right Side: Price & Status */}
                  <div className="text-right shrink-0 pl-3">
                    <div className="text-xs sm:text-sm font-extrabold text-[#0E2A1B]">
                      ₹{prod.price}
                    </div>
                    {isAlreadyAdded ? (
                      <span className="inline-block text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Already in Bestsellers
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 font-medium">
                        {prod.inStock !== false ? 'In Stock' : 'Out of Stock'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-[#FAF7F2] border-t border-[#E8E2D5] flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-stone-600">
            Selected: <strong className="text-[#0E2A1B]">{selectedProductIds.length}</strong> product(s)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSubmit}
              disabled={selectedProductIds.length === 0}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-[#0E2A1B] bg-[#D4AF37] hover:bg-[#E5C358] rounded-xl shadow-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Selected ({selectedProductIds.length})</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
