import React, { useState, useRef } from 'react';
import { Leaf, Heart, Scale, ShieldCheck, Activity, Droplets, Flower2, Search, Settings, BadgeCheck, ArrowRight, Play, Pause } from 'lucide-react';
import homeMakhanaImg from '../../../assets/user/HomeMakhana.png'; 
import lotusImg from '../../../assets/user/philosophy.png';

export default function WhyAurivaSection() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="hidden md:block bg-[#F7F3E9] overflow-hidden">
      <div className="w-full flex flex-col">
        
        {/* Top Block: Nutrition */}
        <div className="flex flex-col lg:flex-row bg-[#F7F3E9] overflow-hidden">
          {/* Left: Why Auriva Text */}
          <div className="lg:w-[22%] bg-[#0E2A1B] text-white p-6 sm:p-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-[#D4AF37] font-bold text-[9px] sm:text-[10px] tracking-widest uppercase mb-2">
              <Leaf className="w-4 h-4 fill-current" />
              <span>WHY AURIVA?</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#D4AF37] leading-tight mb-5">
              NUTRITION THAT<br />LOVES YOU BACK.
            </h2>
            <button className="bg-[#D4AF37] hover:bg-[#C89038] text-[#0E2A1B] font-bold uppercase tracking-wider text-[10px] sm:text-xs px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl inline-flex items-center gap-2 self-start transition-colors cursor-pointer">
              EXPLORE BENEFITS
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Middle: 4 Icons */}
          <div className="lg:w-[58%] flex flex-col sm:flex-row items-center justify-around py-6 px-4 gap-4 sm:gap-2 bg-white/50">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center mb-3 text-[#C89038]">
                <Heart className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0E2A1B] text-sm mb-2">Good for<br/>Heart</h4>
              <p className="text-[#5A6B60] text-[11px] leading-relaxed">Helps in maintaining<br/>healthy heart</p>
            </div>
            {/* Benefit 2 */}
            <div className="flex flex-col items-center text-center flex-1 sm:border-l sm:border-[#E8E2D5] sm:pl-4">
              <div className="w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center mb-3 text-[#C89038]">
                <Scale className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0E2A1B] text-sm mb-2">Aids in<br/>Weight Management</h4>
              <p className="text-[#5A6B60] text-[11px] leading-relaxed">Low calorie, high<br/>nutrition snack</p>
            </div>
            {/* Benefit 3 */}
            <div className="flex flex-col items-center text-center flex-1 sm:border-l sm:border-[#E8E2D5] sm:pl-4">
              <div className="w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center mb-3 text-[#C89038]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0E2A1B] text-sm mb-2">Boosts<br/>Immunity</h4>
              <p className="text-[#5A6B60] text-[11px] leading-relaxed">Rich in antioxidants<br/>& essential nutrients</p>
            </div>
            {/* Benefit 4 */}
            <div className="flex flex-col items-center text-center flex-1 sm:border-l sm:border-[#E8E2D5] sm:pl-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#D4AF37] flex items-center justify-center mb-2 sm:mb-3 text-[#C89038]">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="font-bold text-[#0E2A1B] text-xs sm:text-sm mb-1 sm:mb-2">Improves<br/>Digestion</h4>
              <p className="text-[#5A6B60] text-[10px] sm:text-[11px] leading-relaxed">Light & easy<br/>on the stomach</p>
            </div>
          </div>

          {/* Right: Home Makhana Image */}
          <div className="lg:w-[20%] relative min-h-[180px] lg:min-h-0 bg-white/40 overflow-hidden">
            <img 
              src={homeMakhanaImg} 
              alt="Auriva Home Makhana" 
              className="absolute inset-0 w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500" 
            />
          </div>
        </div>

        {/* Bottom Block: Process */}
        <div className="flex flex-col lg:flex-row bg-[#0E2A1B] overflow-hidden">
          {/* Left: Lotus Image */}
          <div className="lg:w-[20%] relative min-h-[150px] lg:min-h-0">
            <img src={lotusImg} alt="Lotus fields" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0E2A1B]/90 lg:to-[#0E2A1B]"></div>
          </div>

          {/* Middle: Steps */}
          <div className="lg:w-[60%] py-6 px-4 sm:py-8 sm:px-6 flex flex-col justify-center items-center text-center text-white">
            <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className="hidden sm:block h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#D4AF37]"></div>
              <ArrowRight className="hidden sm:block w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D4AF37]" />
              <h3 className="font-serif text-base sm:text-xl font-bold text-[#F7F3E9] tracking-widest uppercase">
                FROM NATURE TO PERFECTION
              </h3>
              <ArrowRight className="hidden sm:block w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D4AF37] rotate-180" />
              <div className="hidden sm:block h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#D4AF37]"></div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-start justify-center gap-1.5 sm:gap-3 w-full">
              {/* Step 1 */}
              <div className="flex flex-col items-center max-w-[80px]">
                <div className="w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-2">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-[#A2B5A8] leading-tight">Pristine<br/>Water Bodies</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-[#D4AF37] self-center mt-4 hidden sm:block" />

              {/* Step 2 */}
              <div className="flex flex-col items-center max-w-[80px]">
                <div className="w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-2">
                  <Flower2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-[#A2B5A8] leading-tight">Careful<br/>Harvesting</span>
              </div>

              <ArrowRight className="w-4 h-4 text-[#D4AF37] self-center mt-4 hidden sm:block" />

              {/* Step 3 */}
              <div className="flex flex-col items-center max-w-[80px]">
                <div className="w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-2">
                  <Search className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-[#A2B5A8] leading-tight">Careful<br/>Selection</span>
              </div>

              <ArrowRight className="w-4 h-4 text-[#D4AF37] self-center mt-4 hidden sm:block" />

              {/* Step 4 */}
              <div className="flex flex-col items-center max-w-[80px]">
                <div className="w-12 h-12 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-2">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-[#A2B5A8] leading-tight">Hygienic<br/>Processing</span>
              </div>

              <ArrowRight className="w-4 h-4 text-[#D4AF37] self-center mt-4 hidden sm:block" />

              {/* Step 5 */}
              <div className="flex flex-col items-center max-w-[70px] sm:max-w-[80px]">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mb-1.5 sm:mb-2">
                  <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-[#A2B5A8] leading-tight">Quality<br/>Check</span>
              </div>
            </div>
          </div>

          {/* Right: Quality Check Video Showcase */}
          <div className="lg:w-[20%] p-4 sm:p-5 flex flex-col justify-center">
            <div 
              className="relative rounded-xl overflow-hidden mb-3 border border-[#D4AF37]/40 shadow-lg group cursor-pointer aspect-[16/10] sm:aspect-video bg-black"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={togglePlay}
            >
              <video 
                ref={videoRef}
                src="/working.mp4" 
                playsInline
                autoPlay
                loop
                muted
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Play/Pause Overlay Indicator on Hover / Paused */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                !isPlaying ? 'opacity-100' : isHovered ? 'opacity-90' : 'opacity-0'
              }`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/80 bg-black/50 backdrop-blur-xs flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:border-[#D4AF37]">
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-current ml-0.5" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-[#F7F3E9] text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">QUALITY CHECKED</h5>
                <p className="text-[9px] sm:text-[10px] text-[#A2B5A8] leading-tight">For your health, every time.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
