import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChefHat, Clock, Flame, Users, Search, ArrowRight, 
  Sparkles, X, Check, ShoppingBag, Heart, Share2 
} from 'lucide-react';
import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAdmin } from '../../../context/AdminContext';

export default function RecipesPage() {
  const { recipes = [] } = useAdmin();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalRecipe, setActiveModalRecipe] = useState(null);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  useEffect(() => {
    // If navigated with a target recipeId, open its modal
    if (location.state?.recipeId && recipes.length > 0) {
      const match = recipes.find(r => (r._id === location.state.recipeId || r.id === location.state.recipeId));
      if (match) {
        setActiveModalRecipe(match);
      }
    }
  }, [location.state, recipes]);

  const categories = ['All', 'Healthy Snacks', 'Quick Bites', 'Desserts', 'Savory Chaats', 'Fitness & Protein'];

  // Only display published active recipes to customers
  const activeRecipes = recipes.filter(r => r.status === 'ACTIVE' || !r.status);

  const filteredRecipes = activeRecipes.filter(r => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = 
      !searchQuery.trim() ||
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleOpenModal = (recipe) => {
    setActiveModalRecipe(recipe);
    setCheckedIngredients({});
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] font-sans">
      <div>
        <AnnouncementBar />
        <Header />
      </div>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="bg-[#0E2A1B] text-white py-12 sm:py-16 lg:py-20 relative overflow-hidden border-b border-[#D4AF37]/20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#143322] border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-bold uppercase tracking-widest">
              <ChefHat className="w-3.5 h-3.5" />
              <span>DELICIOUS & HEALTHY RECIPES</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FAF7F2] leading-tight">
              MADE WITH <span className="text-[#D4AF37]">AURIVÁ</span>
            </h1>

            <p className="text-stone-300 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-light">
              Transform everyday snacking into wholesome culinary adventures. Explore chef-crafted, easy, and nutritious recipes made with Auriva's premium roasted superfoods.
            </p>

            {/* Quick Metrics */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 pt-4 text-xs sm:text-sm font-semibold text-[#D4AF37]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>100% Roasted Goodness</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Under 15 Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                <span>Low Calorie & High Protein</span>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <section className="sticky top-0 z-20 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D5] py-3.5 sm:py-4 px-4 sm:px-6 lg:px-8 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-200/60 border border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes or ingredients..."
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs rounded-full border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white shadow-2xs"
              />
            </div>

          </div>
        </section>

        {/* RECIPES SHOWCASE GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          {filteredRecipes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-3 max-w-md mx-auto my-8">
              <ChefHat className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-bold text-sm text-stone-800">No recipes matched your search</h3>
              <p className="text-xs text-stone-500">
                Try searching for another ingredient like "makhana", "chaat", or switch to "All" categories.
              </p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="px-4 py-2 rounded-xl bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id || recipe._id}
                  onClick={() => handleOpenModal(recipe)}
                  className="rounded-2xl sm:rounded-3xl bg-white border border-[#E8E2D5] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer group hover:-translate-y-1"
                >
                  {/* Card Image Banner */}
                  <div className="aspect-[4/3] relative bg-stone-100 overflow-hidden">
                    {recipe.image ? (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#143322] flex items-center justify-center text-[#D4AF37]">
                        <ChefHat className="w-14 h-14 opacity-50" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Category & Difficulty Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0E2A1B]/90 backdrop-blur-xs text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                        {recipe.category || 'Healthy Snack'}
                      </span>
                    </div>

                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/90 text-stone-800 text-[10px] font-bold uppercase">
                      {recipe.difficulty || 'Easy'}
                    </span>

                    {/* Prep Metrics Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold">
                      <span className="flex items-center gap-1 drop-shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{recipe.prepTime}</span>
                      </span>
                      <span className="flex items-center gap-1 drop-shadow-sm">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{recipe.calories || '160 kcal'}</span>
                      </span>
                      <span className="flex items-center gap-1 drop-shadow-sm">
                        <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{recipe.servings}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0E2A1B] group-hover:text-[#C89038] transition-colors leading-snug">
                        {recipe.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E2A1B] flex items-center gap-1 group-hover:text-[#C89038] transition-colors">
                        <span>View Recipe</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {recipe.ingredients?.length || 5} ingredients
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>

      </main>

      {/* INTERACTIVE RECIPE DETAIL MODAL */}
      {activeModalRecipe && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans"
          onClick={() => setActiveModalRecipe(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-[#E8E2D5] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Hero Banner */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-[#0E2A1B] overflow-hidden shrink-0">
              {activeModalRecipe.image ? (
                <img
                  src={activeModalRecipe.image}
                  alt={activeModalRecipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#D4AF37]">
                  <ChefHat className="w-16 h-16 opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setActiveModalRecipe(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title & Category on Image */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="px-2.5 py-0.5 rounded-md bg-[#D4AF37] text-[#0E2A1B] text-[10px] font-extrabold uppercase tracking-wider mb-2 inline-block">
                  {activeModalRecipe.category || 'Healthy Snack'}
                </span>
                <h2 className="font-serif text-xl sm:text-3xl font-bold leading-tight">
                  {activeModalRecipe.title}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 space-y-6 flex-1">
              
              {/* Metrics Quick Bar */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Prep Time</span>
                  <p className="text-xs sm:text-sm font-bold text-[#0E2A1B] mt-0.5">{activeModalRecipe.prepTime}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Cook Time</span>
                  <p className="text-xs sm:text-sm font-bold text-[#0E2A1B] mt-0.5">{activeModalRecipe.cookTime}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Calories</span>
                  <p className="text-xs sm:text-sm font-bold text-amber-600 mt-0.5">{activeModalRecipe.calories || '160 kcal'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Difficulty</span>
                  <p className="text-xs sm:text-sm font-bold text-[#0E2A1B] mt-0.5">{activeModalRecipe.difficulty || 'Easy'}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {activeModalRecipe.description}
              </p>

              {/* Recommended Product Box */}
              {activeModalRecipe.recommendedProduct && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">Recommended Auriva Product</span>
                      <p className="text-xs font-bold text-[#0E2A1B]">{activeModalRecipe.recommendedProduct}</p>
                    </div>
                  </div>
                  <Link
                    to="/shop"
                    onClick={() => setActiveModalRecipe(null)}
                    className="px-3 py-1.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors"
                  >
                    Shop Snack
                  </Link>
                </div>
              )}

              {/* Ingredients Checklist */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0E2A1B] mb-2.5 flex items-center gap-2">
                  <span>Ingredients Checklist</span>
                  <span className="text-[10px] font-normal text-stone-400">({activeModalRecipe.ingredients?.length || 0} items)</span>
                </h3>
                <div className="space-y-1.5">
                  {(activeModalRecipe.ingredients || []).map((ing, idx) => (
                    <label 
                      key={idx}
                      onClick={() => toggleIngredient(idx)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checkedIngredients[idx])}
                        onChange={() => {}}
                        className="w-4 h-4 accent-[#0E2A1B] rounded mt-0.5 shrink-0"
                      />
                      <span className={`text-xs ${checkedIngredients[idx] ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                        {ing}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0E2A1B] mb-2.5">
                  Step-by-Step Instructions
                </h3>
                <div className="space-y-3">
                  {(activeModalRecipe.instructions || []).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed flex-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-stone-400">
                Healthy recipe made with Auriva Pure Roasted Superfoods
              </span>
              <button
                onClick={() => setActiveModalRecipe(null)}
                className="px-4 py-2 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
