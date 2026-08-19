import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  LayoutGrid, ChevronRight, Check, Leaf, Heart, Sparkles, 
  Package, Truck, Shield, Headphones, RefreshCw, List,
  ChevronLeft, SlidersHorizontal, ArrowUpDown, X, Filter
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

import { FLAVORS } from '../../../data/flavors';
import { useAdmin } from '../../../context/AdminContext';

export default function ShopPage() {
  const { products: PRODUCTS, categories: CATEGORIES } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategoryParam = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const filterType = searchParams.get('filter') || '';
  const tabParam = searchParams.get('tab') || '';

  const [selectedCategory, setSelectedCategory] = useState(activeCategoryParam);
  const [selectedFlavor, setSelectedFlavor] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('best-selling');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Mobile Bottom Sheet States
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Synchronize with URL
  useEffect(() => {
    if (activeCategoryParam) {
      setSelectedCategory(activeCategoryParam);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategoryParam, tabParam]);

  // Lock body scroll when mobile sheets are open
  useEffect(() => {
    if (isFilterSheetOpen || isSortSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFilterSheetOpen, isSortSheetOpen]);

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    setIsFilterSheetOpen(false);
    if (slug === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: slug });
    }
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedFlavor('all');
    setSelectedPriceRange('all');
    setCurrentPage(1);
    setSearchParams({});
    setIsFilterSheetOpen(false);
  };

  // Filter & Sort computation
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(product => {
      // Category switch
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      // Flavor filter
      if (selectedFlavor !== 'all' && product.flavor && !product.flavor.toLowerCase().includes(selectedFlavor.toLowerCase())) {
        return false;
      }
      // Price range
      if (selectedPriceRange === 'under-300' && product.price >= 300) return false;
      if (selectedPriceRange === '300-500' && (product.price < 300 || product.price > 500)) return false;
      if (selectedPriceRange === 'above-500' && product.price <= 500) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          product.name.toLowerCase().includes(q) ||
          product.flavor?.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q) ||
          product.tags?.some(t => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Quick filters from URL
      if (filterType === 'bestsellers' && !product.isBestseller) {
        return false;
      }
      if (filterType === 'new' && !product.isNewLaunch) {
        return false;
      }
      if (filterType === 'combos' && !product.isCombo) {
        return false;
      }
      if (filterType === 'offers' && !product.discountPercent) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'latest') return b.isNewLaunch ? -1 : 1;
      return (b.reviewsCount || 0) - (a.reviewsCount || 0); // Best Selling
    });
  }, [selectedCategory, selectedFlavor, selectedPriceRange, searchQuery, filterType, sortBy]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeCategoryObj = CATEGORIES.find(c => c.slug === selectedCategory);

  const sortOptions = [
    { value: 'best-selling', label: 'Best Selling' },
    { value: 'latest', label: 'Latest / New Launches' },
    { value: 'rating', label: 'Customer Rating (High)' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-24 md:pb-0">
      <AnnouncementBar />
      <Header />

      <main className="py-3 sm:py-8 md:py-10 max-w-[1550px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 font-sans">
        
        {/* Clean Breadcrumbs & Title */}
        <div className="mb-2.5 sm:mb-6">
          <nav className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-stone-500 font-medium mb-0.5">
            <Link to="/" className="hover:text-[#0E2A1B] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <button 
              onClick={() => handleCategorySelect('all')}
              className={`transition-colors ${selectedCategory === 'all' ? 'text-[#0E2A1B] font-bold' : 'hover:text-[#0E2A1B]'}`}
            >
              Shop
            </button>
            {selectedCategory !== 'all' && activeCategoryObj && (
              <>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[#1A402B] font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                  {activeCategoryObj.name}
                </span>
              </>
            )}
          </nav>
          
          <h1 className="font-serif text-lg sm:text-3xl lg:text-4xl font-extrabold text-[#182019] leading-tight">
            {tabParam === 'categories' 
              ? 'Explore All Categories' 
              : selectedCategory === 'all' 
                ? 'Shop All Healthy Snacks' 
                : activeCategoryObj?.name || 'Shop Snacks'}
          </h1>
        </div>

        {/* MOBILE CATEGORIES DIRECTORY VIEW (When tab=categories is active on mobile) */}
        {tabParam === 'categories' && (
          <div className="md:hidden mb-5 animate-fadeIn font-sans">
            <div className="rounded-2xl overflow-hidden border border-[#E8E2D5] shadow-md bg-white">
              {/* Dark Green Header */}
              <div className="bg-[#0E2A1B] text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-serif text-xs font-bold tracking-wider uppercase">CATEGORIES</h3>
                </div>
                <span className="text-[10px] font-bold text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded-full">
                  {CATEGORIES.length}
                </span>
              </div>

              {/* Category Tabs List */}
              <div className="p-2.5 space-y-1.5 bg-white">
                {/* All Products Tab */}
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-left group ${
                    selectedCategory === 'all'
                      ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-sm font-bold'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${selectedCategory === 'all' ? 'bg-[#D4AF37]' : 'bg-stone-400'}`} />
                    <span className="text-xs">All Products</span>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                    selectedCategory === 'all' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {PRODUCTS.length}
                  </span>
                </button>

                {/* Category Items */}
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-left group ${
                        isSelected
                          ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-sm font-bold'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#D4AF37]' : 'bg-stone-400'}`} />
                        <span className="text-xs">{cat.name}</span>
                      </div>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE HORIZONTAL CATEGORY PILL TABS (Always visible on mobile when not in tab=categories) */}
        {tabParam !== 'categories' && (
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2 -mx-3 px-3">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                  : 'bg-white border border-[#E8E2D5] text-stone-700 active:bg-stone-100'
              }`}
            >
              <span>All Products</span>
              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'all' ? 'bg-[#D4AF37] text-[#0E2A1B]' : 'bg-stone-100 text-stone-500'
              }`}>
                {PRODUCTS.length}
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                      : 'bg-white border border-[#E8E2D5] text-stone-700 active:bg-stone-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-[#D4AF37] text-[#0E2A1B]' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* MOBILE FILTER & SORT BAR (<= 767px only) */}
        <div className="md:hidden sticky top-14 z-30 bg-white border border-[#E8E2D5] rounded-xl shadow-xs p-1 mb-3 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#FAF7F2] border border-stone-200 text-[#0E2A1B] font-bold text-[11px] uppercase tracking-wider active:scale-98 min-h-[38px]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C89038]" />
            <span>FILTER</span>
            {(selectedCategory !== 'all' || selectedFlavor !== 'all' || selectedPriceRange !== 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            )}
          </button>

          <button
            onClick={() => setIsSortSheetOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-[#FAF7F2] border border-stone-200 text-[#0E2A1B] font-bold text-[11px] uppercase tracking-wider active:scale-98 min-h-[38px]"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#C89038]" />
            <span>SORT</span>
          </button>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 xl:gap-8 items-start">
          
          {/* LEFT SIDEBAR: CATEGORY NAVIGATION (Desktop & Tablet only >= 768px) */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-3 rounded-2xl overflow-hidden border border-[#E8E2D5] shadow-xs sticky top-24 self-start z-20">
            
            {/* Dark Green Sidebar Header */}
            <div className="bg-[#0E2A1B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif text-sm font-bold tracking-wider uppercase">CATEGORIES</h3>
              </div>
              <span className="text-[11px] font-bold text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded-full">
                {CATEGORIES.length}
              </span>
            </div>

            {/* Category Switch List */}
            <div className="bg-white p-3 space-y-1.5">
              
              {/* All Products Option */}
              <button
                onClick={() => handleCategorySelect('all')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-left ${
                  selectedCategory === 'all'
                    ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-sm font-bold'
                    : 'text-stone-700 hover:bg-stone-50 hover:text-[#0E2A1B] font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${selectedCategory === 'all' ? 'bg-[#D4AF37]' : 'bg-stone-300'}`} />
                  <span className="text-xs">All Products</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  selectedCategory === 'all' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-stone-100 text-stone-500'
                }`}>
                  {PRODUCTS.length}
                </span>
              </button>

              {/* Individual Categories */}
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-left group ${
                      isSelected
                        ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-sm font-bold'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-[#0E2A1B] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full transition-colors ${isSelected ? 'bg-[#D4AF37]' : 'bg-stone-300 group-hover:bg-[#0E2A1B]'}`} />
                      <span className="text-xs">{cat.name}</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      isSelected ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}

            </div>
          </aside>

          {/* RIGHT PRODUCT GRID AREA */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4 sm:space-y-6">
            
            {/* Top Toolbar (Desktop only sort/count) */}
            <div className="hidden md:flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-[#E8E2D5] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-600 font-medium">
                  Showing <strong className="text-[#0E2A1B]">{paginatedProducts.length}</strong> of <strong className="text-[#0E2A1B]">{filteredProducts.length}</strong> snacks
                </span>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className="text-[11px] text-[#C89038] hover:underline font-bold ml-2"
                  >
                    (Show All)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold bg-stone-50 text-[#0E2A1B] focus:outline-none cursor-pointer"
                  >
                    {sortOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle Icons */}
                <div className="flex items-center gap-1 border-l border-stone-200 pl-3">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-[#0E2A1B] text-[#D4AF37]'
                        : 'text-stone-400 hover:text-stone-700 bg-stone-50'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-[#0E2A1B] text-[#D4AF37]'
                        : 'text-stone-400 hover:text-stone-700 bg-stone-50'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Cards Grid: 2 columns on mobile (<=767px), 3-4 on tablet/desktop */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D5] space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-[#0E2A1B]/5 flex items-center justify-center text-stone-400">
                  <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8 text-[#C89038]" />
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0E2A1B]">No products found</h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                  Try adjusting your filter or search query to find delicious snacks.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#1B3B29] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-5">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-4 sm:pt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-stone-300 flex items-center justify-center text-stone-600 hover:border-[#0E2A1B] disabled:opacity-30 disabled:cursor-not-allowed bg-white font-bold min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-bold text-xs transition-all min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] ${
                        isActive
                          ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-md border border-[#D4AF37]/40'
                          : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-stone-300 flex items-center justify-center text-stone-600 hover:border-[#0E2A1B] disabled:opacity-30 disabled:cursor-not-allowed bg-white font-bold min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Bottom Trust Guarantee Strip */}
        <div className="mt-6 sm:mt-12 bg-white rounded-2xl p-3 sm:p-6 border border-[#E8E2D5] shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            
            <div className="flex items-center gap-2 sm:gap-3 pt-1.5 sm:pt-0 sm:pr-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shrink-0">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h5 className="text-[11px] sm:text-xs font-bold text-[#0E2A1B]">FREE SHIPPING</h5>
                <p className="text-[9.5px] sm:text-[10.5px] text-stone-500">Above ₹499</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-0 sm:px-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h5 className="text-[11px] sm:text-xs font-bold text-[#0E2A1B]">SECURE PAYMENT</h5>
                <p className="text-[9.5px] sm:text-[10.5px] text-stone-500">100% safe & secure</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-0 sm:px-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shrink-0">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h5 className="text-[11px] sm:text-xs font-bold text-[#0E2A1B]">24/7 SUPPORT</h5>
                <p className="text-[9.5px] sm:text-[10.5px] text-stone-500">Here to help</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-0 sm:pl-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/40 flex items-center justify-center text-[#C89038] shrink-0">
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h5 className="text-[11px] sm:text-xs font-bold text-[#0E2A1B]">EASY RETURNS</h5>
                <p className="text-[9.5px] sm:text-[10.5px] text-stone-500">Hassle-free</p>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* MOBILE FILTER BOTTOM SHEET (<= 767px) */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterSheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-[#D4AF37]/40 shadow-2xl p-5 max-h-[85dvh] flex flex-col space-y-4 animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C89038]" />
                <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Filter Snacks</h3>
              </div>
              <button 
                onClick={() => setIsFilterSheetOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Options */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              
              {/* Category Pills */}
              <div>
                <label className="font-bold text-[#0E2A1B] uppercase tracking-wider block mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-[#0E2A1B] text-[#D4AF37]'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    All Products
                  </button>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        selectedCategory === c.slug
                          ? 'bg-[#0E2A1B] text-[#D4AF37]'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="font-bold text-[#0E2A1B] uppercase tracking-wider block mb-2">
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-300', label: 'Under ₹300' },
                    { id: '300-500', label: '₹300 - ₹500' },
                    { id: 'above-500', label: 'Above ₹500' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPriceRange(p.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        selectedPriceRange === p.id
                          ? 'bg-[#0E2A1B] text-[#D4AF37]'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-200 grid grid-cols-2 gap-3">
              <button
                onClick={handleClearAllFilters}
                className="py-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs uppercase"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  setIsFilterSheetOpen(false);
                  setCurrentPage(1);
                }}
                className="py-3 rounded-xl bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs uppercase shadow-md"
              >
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MOBILE SORT BOTTOM SHEET (<= 767px) */}
      {isSortSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSortSheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-[#D4AF37]/40 shadow-2xl p-5 space-y-3 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-[#0E2A1B]">Sort Snacks</h3>
              <button onClick={() => setIsSortSheetOpen(false)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setIsSortSheetOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-left transition-all ${
                    sortBy === option.value
                      ? 'bg-[#0E2A1B] text-[#D4AF37]'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && <Check className="w-4 h-4 text-[#D4AF37]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
