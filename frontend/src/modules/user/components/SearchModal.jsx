import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../../../data/products';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.flavor.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
    setResults(filtered.slice(0, 6));
  }, [query]);

  if (!isOpen) return null;

  const handleSelectProduct = (slug) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/shop?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0E2A1B] text-white border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center px-4 py-3.5 border-b border-[#D4AF37]/20">
          <Search className="w-5 h-5 text-[#D4AF37] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roasted makhana, dry fruits, flavors, seeds..."
            className="w-full bg-transparent text-white placeholder-stone-400 text-base sm:text-lg focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-white mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Popular searches when query is empty */}
        {!query && (
          <div className="p-5 bg-[#091E13]">
            <p className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-3">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Classic Makhana', 'Peri Peri', 'Cheese Makhana', 'Himalayan Salt', 'California Almonds', 'Super Seeds', 'Pudina'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 rounded-full text-xs bg-[#1B3B29] text-[#E8DFC8] hover:bg-[#D4AF37] hover:text-[#0E2A1B] transition-all border border-[#D4AF37]/20"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Search Results */}
        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5 p-2">
            {results.map((product) => (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product.slug)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-stone-800 border border-white/10"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#D4AF37] transition-colors truncate">
                      {product.name}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-medium uppercase">
                      {product.flavor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-300 mt-1">
                    <span className="font-bold text-[#D4AF37]">₹{product.price}</span>
                    <span className="line-through text-stone-500 text-[11px]">₹{product.oldPrice}</span>
                    <span className="text-stone-400">•</span>
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" /> {product.rating}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="p-8 text-center text-stone-400">
            <p className="text-sm">No delicious snacks found for "{query}".</p>
            <p className="text-xs text-stone-500 mt-1">Try searching for "Makhana", "Peri Peri" or "Seeds"</p>
          </div>
        )}
      </div>
    </div>
  );
}
