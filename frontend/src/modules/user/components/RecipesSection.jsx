import React from 'react';
import { ArrowRight, ChefHat } from 'lucide-react';
import chaatImg from '../../../assets/user/Flavored Makhana.jpg'; // Placeholder
import periImg from '../../../assets/user/Premium Makhana.jpg'; // Placeholder
import kheerImg from '../../../assets/user/Classic Makhana.jpg'; // Placeholder

export default function RecipesSection() {
  return (
    <section className="bg-[#F7F3E9] overflow-hidden">
      <div className="w-full px-4 sm:px-6 md:px-8 xl:px-12 mx-auto pt-2 sm:pt-6 pb-2 sm:pb-6">
        
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-center">
          
          {/* Left Text Block */}
          <div className="lg:w-[30%] flex flex-col items-start text-left shrink-0">
            <h4 className="font-bold text-[#4A5D52] text-[10px] sm:text-sm tracking-widest uppercase mb-1.5 sm:mb-2">
              DELICIOUS RECIPES
            </h4>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#C89038] leading-tight mb-2 sm:mb-4">
              MADE WITH AURIVA
            </h2>
            <p className="text-[#3A4B41] text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 max-w-sm">
              Quick, easy & healthy recipes to make every bite exciting.
            </p>
            <button className="bg-[#0E2A1B] hover:bg-[#143B24] text-[#D4AF37] font-bold uppercase tracking-wider text-[9px] sm:text-xs px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl inline-flex items-center gap-2 transition-colors">
              EXPLORE RECIPES
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Cards Grid/Scroll */}
          <div className="lg:w-[70%] w-full flex overflow-x-auto no-scrollbar gap-3 sm:gap-5 snap-x snap-mandatory py-1 sm:py-2">
            
            {/* Card 1 */}
            <div className="min-w-[140px] sm:min-w-[210px] flex-1 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md snap-start group cursor-pointer border border-[#E8E2D5]/50">
              <div className="aspect-[4/5] relative">
                <img src={chaatImg} alt="Makhana Chaat" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 p-1 sm:p-1.5 rounded-full">
                  <ChefHat className="w-3 h-3 sm:w-4 sm:h-4 text-[#C89038]" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
                  <h4 className="text-white font-bold text-xs sm:text-base leading-tight">Makhana Chaat</h4>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="min-w-[140px] sm:min-w-[210px] flex-1 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md snap-start group cursor-pointer border border-[#E8E2D5]/50">
              <div className="aspect-[4/5] relative">
                <img src={periImg} alt="Peri Peri Makhana" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 p-1 sm:p-1.5 rounded-full">
                  <ChefHat className="w-3 h-3 sm:w-4 sm:h-4 text-[#C89038]" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
                  <h4 className="text-white font-bold text-xs sm:text-base leading-tight">Peri Peri Makhana</h4>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="min-w-[140px] sm:min-w-[210px] flex-1 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md snap-start group cursor-pointer border border-[#E8E2D5]/50">
              <div className="aspect-[4/5] relative">
                <img src={kheerImg} alt="Makhana Kheer" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 p-1 sm:p-1.5 rounded-full">
                  <ChefHat className="w-3 h-3 sm:w-4 sm:h-4 text-[#C89038]" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
                  <h4 className="text-white font-bold text-xs sm:text-base leading-tight">Makhana Kheer</h4>
                </div>
              </div>
            </div>

            {/* Card 4 - Coming Soon */}
            <div className="min-w-[140px] sm:min-w-[210px] flex-1 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md snap-start bg-[#0E2A1B] border border-[#143B24] p-3 sm:p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-[#C89038] text-[9px] sm:text-[10px] tracking-widest uppercase mb-1.5">
                  MORE RECIPES
                </h4>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F7F3E9] leading-tight mb-3">
                  COMING SOON
                </h3>
                <p className="text-[#A2B5A8] text-[11px] sm:text-xs leading-relaxed max-w-[140px]">
                  Stay tuned for more healthy & tasty recipes.
                </p>
              </div>
              <div className="flex justify-between items-end mt-3">
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#C89038] opacity-80 hover:translate-x-1.5 transition-transform cursor-pointer" />
                <ChefHat className="w-10 h-10 sm:w-14 sm:h-14 text-[#143B24] absolute bottom-[-8px] right-[-8px] opacity-50" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
