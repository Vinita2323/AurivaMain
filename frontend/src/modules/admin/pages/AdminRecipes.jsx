import React, { useState, useRef, useEffect } from 'react';
import { 
  ChefHat, Plus, Search, Edit3, Trash2, CheckCircle2, 
  Clock, Flame, Users, Sparkles, X, Eye, EyeOff, AlertCircle,
  UploadCloud, Loader2, Image as ImageIcon
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';
import { uploadApi } from '../../../utils/api';

export default function AdminRecipes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { 
    recipes = [], 
    addRecipe, 
    updateRecipe, 
    deleteRecipe, 
    toggleRecipeFeatured, 
    toggleRecipeStatus 
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Healthy Snacks');
  const [formImage, setFormImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showUrlOption, setShowUrlOption] = useState(false);
  const fileInputRef = useRef(null);

  const [formPrepTime, setFormPrepTime] = useState('10 mins');
  const [formCookTime, setFormCookTime] = useState('5 mins');
  const [formServings, setFormServings] = useState('2 servings');
  const [formDifficulty, setFormDifficulty] = useState('Easy');
  const [formCalories, setFormCalories] = useState('160 kcal');
  const [formRecommendedProduct, setFormRecommendedProduct] = useState('Peri Peri Roasted Makhana');
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formIngredients, setFormIngredients] = useState(['']);
  const [formInstructions, setFormInstructions] = useState(['']);

  const categories = ['All', 'Healthy Snacks', 'Quick Bites', 'Desserts', 'Savory Chaats', 'Fitness & Protein'];

  // Handle Gallery Image File Selection
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast client-side image compression & instant preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(compressedDataUrl);
        setFormImage(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to server/Cloudinary if backend available
    setIsUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file, 'auriva_recipes');
      if (res && res.data && (res.data.url || res.data.secure_url)) {
        const uploadedUrl = res.data.url || res.data.secure_url;
        setFormImage(uploadedUrl);
        setImagePreview(uploadedUrl);
      }
    } catch (err) {
      console.warn('Backend image upload fallback to local preview data URL:', err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Open modal for Add
  const handleOpenAddModal = () => {
    setEditingRecipe(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Healthy Snacks');
    setFormImage('');
    setImagePreview('');
    setShowUrlOption(false);
    setFormPrepTime('10 mins');
    setFormCookTime('5 mins');
    setFormServings('2 servings');
    setFormDifficulty('Easy');
    setFormCalories('160 kcal');
    setFormRecommendedProduct('Peri Peri Roasted Makhana');
    setFormIsFeatured(true);
    setFormStatus('ACTIVE');
    setFormIngredients(['2 cups Auriva Makhana', '1 tsp Olive Oil or Ghee', 'Seasoning to taste']);
    setFormInstructions(['Dry roast the makhana on low flame until crisp.', 'Toss with your favorite seasoning and serve warm.']);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (recipe) => {
    setEditingRecipe(recipe);
    setFormTitle(recipe.title || '');
    setFormDescription(recipe.description || '');
    setFormCategory(recipe.category || 'Healthy Snacks');
    setFormImage(recipe.image || '');
    setImagePreview(recipe.image || '');
    setShowUrlOption(false);
    setFormPrepTime(recipe.prepTime || '10 mins');
    setFormCookTime(recipe.cookTime || '5 mins');
    setFormServings(recipe.servings || '2 servings');
    setFormDifficulty(recipe.difficulty || 'Easy');
    setFormCalories(recipe.calories || '160 kcal');
    setFormRecommendedProduct(recipe.recommendedProduct || 'Peri Peri Roasted Makhana');
    setFormIsFeatured(Boolean(recipe.isFeatured));
    setFormStatus(recipe.status || 'ACTIVE');
    setFormIngredients(recipe.ingredients?.length ? [...recipe.ingredients] : ['']);
    setFormInstructions(recipe.instructions?.length ? [...recipe.instructions] : ['']);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Please fill out the recipe title and description.');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      image: formImage.trim(),
      prepTime: formPrepTime.trim(),
      cookTime: formCookTime.trim(),
      servings: formServings.trim(),
      difficulty: formDifficulty,
      calories: formCalories.trim(),
      recommendedProduct: formRecommendedProduct.trim(),
      isFeatured: formIsFeatured,
      status: formStatus,
      ingredients: formIngredients.filter(i => i.trim() !== ''),
      instructions: formInstructions.filter(i => i.trim() !== '')
    };

    if (editingRecipe) {
      await updateRecipe(editingRecipe.id || editingRecipe._id, payload);
    } else {
      await addRecipe(payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (recipe) => {
    if (window.confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
      deleteRecipe(recipe.id || recipe._id);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch = 
      !searchQuery.trim() ||
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      categoryFilter === 'All' || r.category === categoryFilter;

    const matchesStatus = 
      statusFilter === 'All' || r.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const featuredCount = recipes.filter(r => r.isFeatured).length;
  const activeCount = recipes.filter(r => r.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <AdminHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto flex-1">
          
          {/* Top Title & Metrics Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0E2A1B] text-[#D4AF37] flex items-center justify-center shadow-xs">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0E2A1B] tracking-tight">
                    Recipe Management
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                    Manage recipes displayed in the "MADE WITH AURIVA" homepage section and Recipes showcase.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Recipe</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Recipes</span>
                <p className="text-2xl font-extrabold text-[#0E2A1B] mt-0.5">{recipes.length}</p>
              </div>
              <ChefHat className="w-7 h-7 text-[#D4AF37]" />
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Active On Store</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{activeCount}</p>
              </div>
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Featured On Homepage</span>
                <p className="text-2xl font-extrabold text-[#C89038] mt-0.5">{featuredCount}</p>
              </div>
              <Sparkles className="w-7 h-7 text-[#C89038]" />
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipe title or ingredients..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-stone-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-700 focus:outline-none focus:border-[#0E2A1B]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-700 focus:outline-none focus:border-[#0E2A1B]"
              >
                <option value="All">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {/* Recipes Cards Grid */}
          {filteredRecipes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-300 space-y-3">
              <ChefHat className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="font-bold text-sm text-stone-700">No recipes found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try adjusting your search filters or click "Add New Recipe" to create your first delicious recipe.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecipes.map((recipe) => (
                <div 
                  key={recipe.id || recipe._id}
                  className="rounded-2xl bg-white border border-[#E8E2D5] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Thumbnail Banner */}
                  <div className="aspect-[16/9] relative bg-stone-200 overflow-hidden">
                    {recipe.image ? (
                      <img 
                        src={recipe.image} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#143322] flex items-center justify-center text-[#D4AF37]">
                        <ChefHat className="w-12 h-12 opacity-60" />
                      </div>
                    )}

                    {/* Category Pill */}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-[#0E2A1B]/85 backdrop-blur-xs text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                      {recipe.category || 'Recipe'}
                    </span>

                    {/* Featured Star Badge */}
                    {recipe.isFeatured && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#0E2A1B] text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>Homepage</span>
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B] leading-snug">
                        {recipe.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {recipe.description}
                      </p>

                      {/* Meta Pills */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{recipe.prepTime}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{recipe.calories || '160 kcal'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                          <span>{recipe.servings}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      {/* Featured toggle & Status */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRecipeFeatured(recipe.id || recipe._id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                            recipe.isFeatured 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                          title={recipe.isFeatured ? 'Featured on Homepage' : 'Click to Feature on Homepage'}
                        >
                          {recipe.isFeatured ? '★ Featured' : '☆ Not Featured'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleRecipeStatus(recipe.id || recipe._id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            recipe.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {recipe.status === 'ACTIVE' ? 'Active' : 'Draft'}
                        </button>
                      </div>

                      {/* Edit / Delete Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(recipe)}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 transition-colors"
                          title="Edit Recipe"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(recipe)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Recipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Add / Edit Recipe Modal */}
      {isModalOpen && (
        <div 
          data-lenis-prevent
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            data-lenis-prevent
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col border border-[#E8E2D5] shadow-2xl overflow-hidden my-auto"
          >
            
            {/* Modal Header - Fixed at Top */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 bg-[#FAF7F2] shrink-0">
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-5 h-5 text-[#C89038]" />
                <h3 className="text-base sm:text-lg font-bold text-[#0E2A1B]">
                  {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecipe} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 font-sans" data-lenis-prevent>
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Recipe Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Makhana Chaat"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] bg-white"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Appetizing summary of this recipe..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              {/* Image Upload from Gallery */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    Recipe Image <span className="font-normal text-stone-400">(Upload from gallery)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlOption(!showUrlOption)}
                    className="text-[11px] font-semibold text-[#C89038] hover:text-[#0E2A1B] hover:underline cursor-pointer transition-colors"
                  >
                    {showUrlOption ? '← Upload from Gallery' : 'Or paste Image URL'}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />

                {!showUrlOption ? (
                  <div>
                    {formImage || imagePreview ? (
                      <div className="relative rounded-2xl border-2 border-[#D4AF37]/50 bg-[#FAF7F2] p-3 sm:p-3.5 flex items-center gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100 relative shadow-2xs">
                          <img
                            src={imagePreview || formImage}
                            alt="Recipe Preview"
                            className="w-full h-full object-cover"
                          />
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                              <Loader2 className="w-5 h-5 animate-spin mb-1 text-[#D4AF37]" />
                              <span className="text-[9px] font-bold">Uploading</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0E2A1B]">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Image Selected from Gallery</span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {isUploadingImage ? 'Optimizing & uploading to storage...' : 'Ready to show on recipe cards'}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-[#C89038]" />
                              <span>Change Image</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFormImage('');
                                setImagePreview('');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#D4AF37]/60 hover:border-[#D4AF37] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 group"
                      >
                        <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center text-[#C89038] group-hover:scale-110 transition-transform mb-2">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#0E2A1B]">
                          Click to browse and upload image from Gallery
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          PNG, JPG, JPEG, or WEBP (Automatically optimized)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => {
                        setFormImage(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="e.g. https://images.unsplash.com/... or /assets/recipe.jpg"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Paste an image URL, or switch back to upload from gallery.
                    </p>
                  </div>
                )}
              </div>

              {/* Preparation Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    placeholder="10 mins"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Cook Time</label>
                  <input
                    type="text"
                    value={formCookTime}
                    onChange={(e) => setFormCookTime(e.target.value)}
                    placeholder="5 mins"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Servings</label>
                  <input
                    type="text"
                    value={formServings}
                    onChange={(e) => setFormServings(e.target.value)}
                    placeholder="2 servings"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Chef Level">Chef Level</option>
                  </select>
                </div>
              </div>

              {/* Recommended Auriva Product */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Featured Auriva Product (for quick shopping)</label>
                <input
                  type="text"
                  value={formRecommendedProduct}
                  onChange={(e) => setFormRecommendedProduct(e.target.value)}
                  placeholder="e.g. Peri Peri Roasted Makhana"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>

              {/* Dynamic Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">Ingredients ({formIngredients.length})</label>
                  <button
                    type="button"
                    onClick={() => setFormIngredients([...formIngredients, ''])}
                    className="text-[11px] text-[#0E2A1B] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ing}
                        onChange={(e) => {
                          const updated = [...formIngredients];
                          updated[idx] = e.target.value;
                          setFormIngredients(updated);
                        }}
                        placeholder={`Ingredient ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none"
                      />
                      {formIngredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormIngredients(formIngredients.filter((_, i) => i !== idx))}
                          className="p-1 text-stone-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">Step-by-Step Instructions ({formInstructions.length})</label>
                  <button
                    type="button"
                    onClick={() => setFormInstructions([...formInstructions, ''])}
                    className="text-[11px] text-[#0E2A1B] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formInstructions.map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-stone-400 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={inst}
                        onChange={(e) => {
                          const updated = [...formInstructions];
                          updated[idx] = e.target.value;
                          setFormInstructions(updated);
                        }}
                        placeholder={`Step ${idx + 1} instruction...`}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none"
                      />
                      {formInstructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormInstructions(formInstructions.filter((_, i) => i !== idx))}
                          className="p-1 text-stone-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Switches: Featured on Homepage & Status */}
              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#0E2A1B] rounded"
                  />
                  <span className="text-xs font-semibold text-stone-700">
                    Feature on Homepage ("MADE WITH AURIVA" cards)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-700">Status:</span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white text-[#0E2A1B]"
                  >
                    <option value="ACTIVE">Active (Published)</option>
                    <option value="DRAFT">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              </div>

              {/* Modal Sticky Footer - Always visible at bottom */}
              <div className="p-4 sm:p-5 border-t border-stone-200 bg-[#FAF7F2] flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  {editingRecipe ? 'Update Recipe' : 'Save & Publish Recipe'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
