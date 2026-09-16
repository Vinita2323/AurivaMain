import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChefHat, Sparkles } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import chaatImg from '../../../assets/user/Flavored Makhana.jpg'; // Fallback
import periImg from '../../../assets/user/Premium Makhana.jpg'; // Fallback
import kheerImg from '../../../assets/user/Classic Makhana.jpg'; // Fallback

export default function RecipesSection() {
  const navigate = useNavigate();
  const { recipes = [] } = useAdmin();

  // Filter active recipes for display
  const activeRecipes = recipes.filter(r => (r.status === 'ACTIVE' || !r.status));
  const featuredRecipes = activeRecipes.filter(r => r.isFeatured !== false);
  const displayRecipes = (featuredRecipes.length > 0 ? featuredRecipes : activeRecipes).slice(0, 3);

  // Fallback images if recipe image is missing
  const fallbackImages = [chaatImg, periImg, kheerImg];

  return (
    <section className="bg-[#F7F3E9] overflow-hidden">
      <div className="w-full px-4 sm:px-6 md:px-8 xl:px-12 mx-auto pt-4 sm:pt-8 pb-4 sm:pb-8">
        
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 items-center">
          
          {/* Left Text Block */}
          <div className="lg:w-[30%] flex flex-col items-start text-left shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#0E2A1B] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3">
              <Sparkles className="w-3 h-3 text-[#C89038]" />
              <span>DELICIOUS RECIPES</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#C89038] leading-tight mb-2 sm:mb-4">
              MADE WITH AURIVA
            </h2>
            <p className="text-[#3A4B41] text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 max-w-sm">
              Quick, easy & healthy chef-curated recipes to make every snack bite exciting.
            </p>
            <button 
              onClick={() => navigate('/recipes')}
              id="recipes-section-explore-btn"
              className="bg-[#0E2A1B] hover:bg-[#143B24] text-[#D4AF37] font-bold uppercase tracking-wider text-[10px] sm:text-xs px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl inline-flex items-center gap-2 transition-all shadow-sm hover:shadow hover:gap-3 group cursor-pointer"
            >
              EXPLORE RECIPES
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Right Cards Grid/Scroll */}
          <div className="lg:w-[70%] w-full flex overflow-x-auto no-scrollbar gap-3 sm:gap-5 snap-x snap-mandatory py-2">
            
            {/* Dynamic Recipe Cards */}
            {displayRecipes.map((recipe, index) => {
              const imageSrc = recipe.image || fallbackImages[index % fallbackImages.length];
              return (
                <div 
                  key={recipe._id || recipe.id || index}
                  onClick={() => navigate('/recipes', { state: { recipeId: recipe._id || recipe.id } })}
                  className="min-w-[150px] sm:min-w-[210px] flex-1 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg snap-start group cursor-pointer border border-[#E8E2D5] bg-white transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img 
                      src={imageSrc} 
                      alt={recipe.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
                    
                    <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-full shadow-xs">
                      <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C89038]" />
                    </div>

                    {recipe.category && (
                      <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 bg-[#0E2A1B]/80 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-semibold text-[#D4AF37] border border-[#D4AF37]/30">
                        {recipe.category}
                      </div>
                    )}

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4">
                      <p className="text-[10px] text-[#D4AF37] font-medium tracking-wide uppercase mb-0.5">
                        {recipe.cookTime || recipe.prepTime || '10 mins'}
                      </p>
                      <h4 className="text-white font-bold text-xs sm:text-base leading-tight group-hover:text-[#D4AF37] transition-colors">
                        {recipe.title}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Coming Soon Card - Navigates to /recipes */}
            <div 
              id="recipes-coming-soon-card"
              onClick={() => navigate('/recipes')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/recipes'); } }}
              className="min-w-[150px] sm:min-w-[210px] flex-1 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl snap-start bg-[#0E2A1B] border-2 border-[#143B24] hover:border-[#D4AF37]/70 p-3.5 sm:p-5 flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="inline-flex items-center gap-1 text-[#C89038] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-1.5">
                  <span>MORE RECIPES</span>
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F7F3E9] leading-tight mb-2 sm:mb-3 group-hover:text-[#D4AF37] transition-colors">
                  COMING SOON
                </h3>
                <p className="text-[#A2B5A8] text-[11px] sm:text-xs leading-relaxed max-w-[150px]">
                  Explore all our healthy & tasty recipes collection now.
                </p>
              </div>
              <div className="flex justify-between items-end mt-4">
                <div className="flex items-center gap-1.5 text-[#D4AF37] text-xs font-bold">
                  <span className="hidden sm:inline">View All</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#143B24] group-hover:bg-[#D4AF37] group-hover:text-[#0E2A1B] flex items-center justify-center transition-all">
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
                <ChefHat className="w-12 h-12 sm:w-16 sm:h-16 text-[#143B24] absolute bottom-[-10px] right-[-10px] opacity-40 group-hover:scale-110 transition-transform" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
