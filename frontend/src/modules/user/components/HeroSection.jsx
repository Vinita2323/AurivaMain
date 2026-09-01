import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Star, Award, Heart, ShieldCheck, 
  Flame, Leaf, Sprout, Play, CheckCircle2, Globe, Truck, 
  Package, Wheat, Dumbbell, X, ChevronRight 
} from 'lucide-react';

import heroMakhanaImg from '../../../assets/user/hero_makhana.jpg';

export default function HeroSection() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Trust Features for the Floating Bottom Bar
  const trustFeatures = [
    {
      icon: Leaf,
      title: "100% Natural",
      desc: "Pure & clean ingredients"
    },
    {
      icon: Dumbbell,
      title: "High in Protein",
      desc: "Great source of plant based protein"
    },
    {
      icon: Wheat,
      title: "Gluten Free",
      desc: "Safe for gluten sensitive people"
    },
    {
      icon: Flame,
      title: "Roasted Not Fried",
      desc: "Perfectly roasted for better health"
    },
    {
      icon: Sparkles,
      title: "Light & Crunchy",
      desc: "Irresistible crunch in every bite"
    },
    {
      icon: Truck,
      title: "Delivered Fresh",
      desc: "Sealed for freshness, delivered to you"
    }
  ];

  return (
    <div className="relative">
      {/* ========================================================
          1. MAIN HERO CANVAS (Brand Dark Green #0E2A1B Theme)
         ======================================================== */}
      <section className="relative bg-[#0E2A1B] text-white overflow-hidden pt-6 sm:pt-10 lg:pt-14 pb-14 sm:pb-20 lg:pb-28">
        
        {/* Background Image & Brand Dark Green Theme Layers */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroMakhanaImg} 
            alt="AURIVÁ Gourmet Roasted Makhana in Artisanal Wooden Bowls with Pink Lotus"
            className="w-full h-full object-cover object-[75%_bottom] lg:object-[right_bottom] opacity-100"
          />
          {/* Brand Deep Forest Green (#0E2A1B) Left Fade Layer */}
          <div className="absolute inset-y-0 left-0 w-full lg:w-1/2 bg-gradient-to-r from-[#0E2A1B]/90 via-[#0E2A1B]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0E2A1B] to-transparent pointer-events-none" />
          
          {/* Subtle Golden & Emerald Theme Ambient Lights */}
          <div className="hidden lg:block absolute top-6 left-12 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        </div>




        {/* Right Side Cream Panel with Compact Organic Convex Curve (Desktop only >= lg) */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[270px] xl:w-[310px] z-10 pointer-events-auto select-none border-none outline-none overflow-hidden">
          {/* SVG Organic Curve Background (Bleeds outside top/right/bottom to eliminate any edge artifacts) */}
          <svg 
            className="absolute -top-4 -bottom-4 -right-4 w-[calc(100%+16px)] h-[calc(100%+32px)] drop-shadow-[-12px_0_24px_rgba(0,0,0,0.32)] border-none outline-none" 
            viewBox="0 0 350 850" 
            preserveAspectRatio="none"
          >
            {/* Seamless Cream Fill Shape that bleeds beyond outer bounds */}
            <path 
              d="M 115 -20 C 30 160, 0 340, 0 470 C 0 600, 45 730, 140 870 L 370 870 L 370 -20 Z" 
              fill="#FAF7F2" 
              className="border-none outline-none"
            />
          </svg>

          {/* Centered Content inside the organic cream curve */}
          <div className="relative z-20 h-full flex flex-col justify-center items-center pl-10 xl:pl-14 pr-4 xl:pr-6 py-6 space-y-7 xl:space-y-8">
            
            {/* Center Vertical Stats Stack (Enlarged & Centered) */}
            <div className="space-y-6 xl:space-y-7 flex flex-col items-center w-full">
              {/* Stat 1: Happy Customers */}
              <div className="flex items-center gap-3.5 w-full max-w-[210px] xl:max-w-[230px]">
                <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#0E2A1B] text-[#D4AF37] border-2 border-[#D4AF37]/50 flex items-center justify-center shrink-0 shadow-md">
                  <Leaf className="w-5 h-5 xl:w-6 xl:h-6 fill-[#D4AF37]/20" />
                </div>
                <div>
                  <h4 className="font-serif text-xl xl:text-2xl font-extrabold text-[#0E2A1B] leading-none">
                    100%<span className="text-[#C89038]">+</span>
                  </h4>
                  <p className="text-xs xl:text-[13px] text-stone-600 font-semibold mt-1 leading-tight">
                    Happy Customers
                  </p>
                </div>
              </div>

              {/* Stat 2: Tons of Makhana */}
              <div className="flex items-center gap-3.5 w-full max-w-[210px] xl:max-w-[230px]">
                <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#0E2A1B] text-[#D4AF37] border-2 border-[#D4AF37]/50 flex items-center justify-center shrink-0 shadow-md">
                  <Truck className="w-5 h-5 xl:w-6 xl:h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl xl:text-2xl font-extrabold text-[#0E2A1B] leading-none">
                    50<span className="text-[#C89038]">+</span>
                  </h4>
                  <p className="text-xs xl:text-[13px] text-stone-600 font-semibold mt-1 leading-tight">
                    Tons of Makhana Delivered
                  </p>
                </div>
              </div>

              {/* Stat 3: Cities Served */}
              <div className="flex items-center gap-3.5 w-full max-w-[210px] xl:max-w-[230px]">
                <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#0E2A1B] text-[#D4AF37] border-2 border-[#D4AF37]/50 flex items-center justify-center shrink-0 shadow-md">
                  <Globe className="w-5 h-5 xl:w-6 xl:h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl xl:text-2xl font-extrabold text-[#0E2A1B] leading-none">
                    25<span className="text-[#C89038]">+</span>
                  </h4>
                  <p className="text-xs xl:text-[13px] text-stone-600 font-semibold mt-1 leading-tight">
                    Cities Served
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Interactive "WATCH OUR STORY" Circular Play Button */}
            <div className="flex items-center justify-center pt-2">
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="group relative w-22 h-22 xl:w-24 xl:h-24 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105"
                aria-label="Watch Our Story Video"
              >
                {/* SVG Curved Text & Golden Track */}
                <svg className="w-full h-full" viewBox="0 0 120 120">
                  <defs>
                    <path id="curveTop" d="M 16,60 A 44,44 0 0,1 104,60" fill="none" />
                    <path id="curveBottom" d="M 16,60 A 44,44 0 0,0 104,60" fill="none" />
                  </defs>

                  {/* Outer Gold Rings */}
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="52" 
                    fill="none" 
                    stroke="#D4AF37" 
                    strokeWidth="1" 
                    strokeDasharray="3 3" 
                    opacity="0.6" 
                    className="group-hover:rotate-45 transition-transform duration-700 origin-center"
                  />
                  <circle cx="60" cy="60" r="44" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.8" />
                  
                  {/* Left & Right Accent Dots */}
                  <circle cx="15" cy="60" r="2" fill="#D4AF37" />
                  <circle cx="105" cy="60" r="2" fill="#D4AF37" />

                  {/* Arched Top Text: WATCH */}
                  <text fontSize="8" fontWeight="800" fill="#0E2A1B" letterSpacing="3">
                    <textPath href="#curveTop" startOffset="50%" textAnchor="middle">WATCH</textPath>
                  </text>

                  {/* Arched Bottom Text: OUR STORY (Upright) */}
                  <text fontSize="8" fontWeight="800" fill="#0E2A1B" letterSpacing="2" dominantBaseline="hanging">
                    <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">OUR STORY</textPath>
                  </text>
                </svg>

                {/* Center Dark Green Play Button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-full bg-[#0E2A1B] text-white border-2 border-[#D4AF37] flex items-center justify-center shadow-lg group-hover:bg-[#1B3B29] group-hover:border-[#F6E5A6] transition-all">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </button>
            </div>

          </div>

        </div>

        {/* ========================================================
            Main Hero Content Grid
           ======================================================== */}
        <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 lg:pr-56 xl:pr-64 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column Content (Primary Hero Messaging) */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-4 sm:space-y-6 text-center lg:text-left">
              
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#0E2A1B]/90 border border-[#D4AF37]/50 shadow-xs">
                <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37] fill-[#D4AF37]/30" />
                <span className="text-[9px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#D4AF37]">
                  PREMIUM & NATURAL
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-[32px] sm:text-5xl lg:text-[52px] xl:text-[58px] font-extrabold tracking-tight leading-[1.05] sm:leading-[1.08] text-[#F6E5A6]">
                ELEVATE <br />
                EVERY BITE, <br />
                <span className="text-[#D4AF37] italic font-serif">NATURALLY.</span>
              </h1>

              {/* Subtitle description */}
              <p className="text-[11px] sm:text-sm md:text-[14.5px] text-[#D2DFD6] font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
                Handpicked. Hygienically processed. Deliciously light. Auriva Makhana is the perfect balance of nutrition and taste.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-1 sm:pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-5 py-2.5 sm:px-8 sm:py-4 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] text-[#0E2A1B] font-extrabold text-[11px] sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-[0_10px_25px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[46px]"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>

                <a
                  href="#benefits"
                  className="w-full sm:w-auto px-4 py-2.5 sm:px-7 sm:py-4 rounded-full bg-black/40 hover:bg-black/60 border border-[#D4AF37]/60 text-white hover:text-[#D4AF37] font-bold text-[11px] sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[46px]"
                >
                  <span>DISCOVER BENEFITS</span>
                  <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">›</span>
                </a>
              </div>

              {/* Customer Social Proof */}
              <div className="pt-2 sm:pt-4 flex items-center justify-center lg:justify-start gap-3.5">
                {/* 3 Overlapping Avatars */}
                <div className="flex items-center -space-x-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                    alt="Customer"
                    className="w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 border-[#D4AF37] object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                    alt="Customer"
                    className="w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 border-[#D4AF37] object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
                    alt="Customer"
                    className="w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 border-[#D4AF37] object-cover shadow-sm"
                  />
                </div>

                {/* Rating copy */}
                <div className="text-left">
                  <p className="text-[10px] sm:text-xs font-bold text-white leading-tight">
                    Loved by 10,000+ Happy Customers
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex text-[#D4AF37] text-[10px] sm:text-xs">
                      {'★'.repeat(5)}
                    </div>
                    <span className="text-[9.5px] sm:text-[11px] font-bold text-white/90">4.8/5</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Center-Right Middle Content (Crafted with Care & Tradition Overlay) */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-4 text-center lg:text-left lg:pr-4 self-start -mt-4 lg:-mt-8 relative z-20">
              
              <div className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                <Leaf className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>ROOTED IN TRADITION,</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-3.5xl font-bold text-white tracking-tight">
                CRAFTED WITH CARE
              </h2>

              {/* Decorative flourish line */}
              <div className="flex items-center justify-center lg:justify-start gap-2 py-0.5">
                <div className="w-10 h-[1.5px] bg-[#D4AF37]/60" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]" />
                <div className="w-16 h-[1px] bg-[#D4AF37]/40" />
              </div>

              <p className="text-xs sm:text-[13px] text-[#D2DFD6] leading-relaxed max-w-md mx-auto lg:mx-0">
                From the clean waters of Mithila to your bowl, every makhana is carefully sourced, processed and roasted to perfection.
              </p>




              {/* Mobile Watch Story Trigger (< lg) */}
              <div className="lg:hidden pt-3 flex justify-center">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7F2] text-[#0E2A1B] text-xs font-bold uppercase tracking-wider shadow-md hover:bg-white transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#0E2A1B]" />
                  <span>Watch Our Story</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ========================================================
          2. FLOATING BOTTOM TRUST BAR (6 Feature Cards)
         ======================================================== */}
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 -mt-6 sm:-mt-10 lg:-mt-12 relative z-30">
        <div className="bg-[#FAF7F2] rounded-2xl sm:rounded-3xl border border-[#D4AF37]/40 shadow-2xl p-4 sm:p-5 lg:p-6 text-[#182019]">
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-2 lg:divide-x lg:divide-[#D4AF37]/25">
            {trustFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.title}
                  className={`flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl transition-all duration-300 hover:bg-white/60 ${
                    idx > 0 ? 'lg:pl-3 xl:pl-4' : ''
                  }`}
                >
                  {/* Icon Circle */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#0E2A1B] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shrink-0 shadow-xs">
                    <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0">
                    <h4 className="font-serif text-[11px] sm:text-[13px] font-bold text-[#0E2A1B] leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[9px] sm:text-[11px] text-stone-600 mt-0.5 leading-tight font-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================
          3. WATCH OUR STORY VIDEO MODAL
         ======================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-[#0E2A1B] rounded-3xl border border-[#D4AF37]/50 p-6 sm:p-8 shadow-2xl text-white">
            
            {/* Close Button */}
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
              aria-label="Close Video"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                <Leaf className="w-4 h-4 text-[#D4AF37]" />
                <span>The Aurivá Journey</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                From Wetland Harvest to Crunchy Perfection
              </h3>
              
              {/* Video Player / Showcase Frame */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-[#D4AF37]/30 shadow-inner flex items-center justify-center">
                <img 
                  src={heroMakhanaImg} 
                  alt="Auriva Story Background" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40">
                  <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-[#0E2A1B] flex items-center justify-center shadow-2xl mb-3 animate-pulse">
                    <Play className="w-7 h-7 fill-current ml-1" />
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white">
                    Discover Our Mithila Heritage
                  </h4>
                  <p className="text-xs text-[#D2DFD6] max-w-md mt-1">
                    Watch how our local artisan farmers harvest and roast lotus seeds in the heart of Bihar wetlands.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  to="/about"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0E2A1B] font-bold text-xs uppercase tracking-wider hover:bg-[#E5C358] transition-all"
                >
                  <span>Read Full Brand Story</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
