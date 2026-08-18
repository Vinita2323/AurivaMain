import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, Sparkles, Heart, ShieldCheck, ArrowRight, Sun, 
  Package, Truck, Award, Globe, CheckCircle2, ChevronRight,
  Droplets, Check, Users
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Assets
import HeroImg from '../../../assets/user/HeroImage.png';
import PhilosophyImg from '../../../assets/user/philosophy.png';
import ComboImg from '../../../assets/user/combo Makhana.jpg';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] font-sans">
      <AnnouncementBar />
      <Header />

      <main>
        
        {/* ===================================================
            1. HERO SECTION (Split-Screen)
           =================================================== */}
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Story Content */}
              <div className="lg:col-span-6 space-y-5 sm:space-y-6 z-10">
                
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#C89038]">
                    OUR STORY
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="font-serif text-3.5xl sm:text-5xl lg:text-5.5xl font-extrabold text-[#0E2A1B] leading-[1.15] tracking-tight">
                  Good Food. <br />
                  Better Everyday{' '}
                  <span className="text-[#D4AF37] italic font-serif">Living.</span>
                </h1>

                {/* Gold Decorative Flourish Line */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <div className="w-16 h-[1.5px] bg-[#D4AF37]/60" />
                  <div className="w-2 h-2 rounded-full border border-[#D4AF37] bg-[#FAF7F2]" />
                  <div className="w-8 h-[1px] bg-[#D4AF37]/40" />
                </div>

                {/* Supporting Copy */}
                <div className="space-y-3.5 text-xs sm:text-sm md:text-base text-[#182019]/85 leading-relaxed max-w-xl font-normal">
                  <p>
                    At AURIVÁ, we believe healthy snacking should be simple, natural and joyful.
                  </p>
                  <p className="text-stone-600">
                    We bring you wholesome makhana, dry fruits and superfood seeds — sourced from nature’s best, crafted with care, and made to brighten your everyday.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="pt-2 sm:pt-4">
                  <a
                    href="#purpose"
                    className="inline-flex items-center gap-3 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-xl hover:scale-102 group"
                  >
                    <span>DISCOVER OUR STORY</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1.5 transition-transform" />
                  </a>
                </div>

              </div>

              {/* Right Column: Hero Product Visual */}
              <div className="lg:col-span-6 relative flex justify-center items-center">
                {/* Soft ambient background glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 via-[#FAF7F2] to-transparent rounded-full blur-3xl -z-10 transform scale-90 pointer-events-none" />

                <div className="relative w-full max-w-[460px] aspect-square rounded-full overflow-hidden group shadow-xl">
                  <img
                    src={HeroImg}
                    alt="AURIVÁ Roasted Makhana Jar and Bowl with Dry Fruits"
                    className="w-full h-full object-cover rounded-full group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                </div>
              </div>

            </div>

            {/* ===================================================
                2. TRUST BENEFITS STRIP (Under Hero)
               =================================================== */}
            <div className="mt-12 sm:mt-16 bg-[#0E2A1B] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl border border-[#D4AF37]/30">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#D4AF37]/20">
                
                {/* 1. 100% Natural */}
                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-0 sm:px-3 first:pt-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">100% Natural</h4>
                    <p className="text-[11px] text-[#A2B5A8]">Pure & Clean</p>
                  </div>
                </div>

                {/* 2. No Preservatives */}
                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-0 sm:px-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">No Preservatives</h4>
                    <p className="text-[11px] text-[#A2B5A8]">Just Real Ingredients</p>
                  </div>
                </div>

                {/* 3. Rich in Nutrition */}
                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-0 sm:px-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">Rich in Nutrition</h4>
                    <p className="text-[11px] text-[#A2B5A8]">Goodness in Every Bite</p>
                  </div>
                </div>

                {/* 4. Hygienically Packed */}
                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-0 sm:px-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">Hygienically Packed</h4>
                    <p className="text-[11px] text-[#A2B5A8]">For Your Safety</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>


        {/* ===================================================
            3. OUR PURPOSE SECTION
           =================================================== */}
        <section id="purpose" className="py-16 sm:py-24 bg-white border-y border-[#E8E2D5]/70 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              
              {/* Left Column: Natural Bowl of Makhana Image */}
              <div className="lg:col-span-6 relative flex justify-center items-center">
                <div className="relative w-full max-w-[460px] aspect-square rounded-full overflow-hidden group shadow-xl mx-auto">
                  <img
                    src={PhilosophyImg}
                    alt="Wooden bowl filled with roasted makhana surrounded by fresh green leaves"
                    className="w-full h-full object-cover rounded-full group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                </div>
              </div>

              {/* Right Column: Purpose Copy */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#C89038]">
                    OUR PURPOSE
                  </span>
                </div>

                {/* Heading */}
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-4.5xl font-extrabold text-[#0E2A1B] leading-tight">
                  Rooted in Nature. <br />
                  Driven by{' '}
                  <span className="text-[#D4AF37] italic font-serif">Purpose.</span>
                </h2>

                {/* Paragraphs */}
                <div className="space-y-4 text-xs sm:text-sm md:text-base text-[#182019]/80 leading-relaxed font-normal">
                  <p>
                    We started AURIVÁ with a simple thought — why can’t healthy be delicious?
                  </p>
                  <p>
                    Every product we create is a step towards a better you and a healthier planet.
                  </p>
                  <p className="text-stone-600 font-medium">
                    Clean ingredients, honest processes and thoughtful packaging — that’s our promise.
                  </p>
                </div>

                {/* CTA */}
                <div className="pt-2">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-xl group"
                  >
                    <span>MEET THE FOUNDER</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>

              </div>

            </div>

          </div>
        </section>


        {/* ===================================================
            4. OUR PROCESS SECTION (Compact Horizontal 5-Step Process)
           =================================================== */}
        <section className="py-10 sm:py-14 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#C89038]">
                FROM NATURE TO YOU
              </span>
              <h2 className="font-serif text-2xl sm:text-3.5xl font-extrabold text-[#0E2A1B]">
                Our Process
              </h2>
            </div>

            {/* Desktop Single-Row 5-Step Process with Animated Connected Bridges */}
            <div className="hidden lg:flex items-center justify-between relative max-w-6xl mx-auto px-2">
              {[
                { step: '1', title: 'Carefully Sourced', text: 'Finest lotus seeds handpicked from trusted local farmers.', icon: Leaf },
                { step: '2', title: 'Slow Roasted', text: 'Slow-roasted to golden perfection for crunch & flavor.', icon: Sun },
                { step: '3', title: 'Quality Checked', text: 'Strict multi-tier quality checks for freshness & purity.', icon: Heart },
                { step: '4', title: 'Hygienically Packed', text: 'Sealed in airtight nitrogen-flushed protective jars.', icon: Package },
                { step: '5', title: 'Delivered to You', text: 'Fresh wholesome snacks dispatched straight to your doorstep.', icon: Truck },
              ].map((item, idx, arr) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.step}>
                    {/* Step Card */}
                    <div className="flex-1 flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 group max-w-[200px] relative z-10">
                      <div className="relative mb-2">
                        <div className="w-13 h-13 rounded-full bg-[#FAF7F2] border-2 border-[#D4AF37]/60 shadow-inner flex items-center justify-center text-[#0E2A1B] group-hover:border-[#0E2A1B] group-hover:scale-105 transition-all duration-300">
                          <Icon className="w-6 h-6 text-[#0E2A1B]" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                          {item.step}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#0E2A1B]">{item.title}</h4>
                      <p className="text-[11px] text-stone-600 leading-snug mt-1">
                        {item.text}
                      </p>
                    </div>

                    {/* Animated Connecting Bridge between Cards */}
                    {idx < arr.length - 1 && (
                      <div className="flex-1 flex items-center justify-center relative px-2 shrink-0 z-0">
                        {/* Flowing animated dashed line */}
                        <div className="w-full relative flex items-center justify-center">
                          <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none">
                            <line
                              x1="0"
                              y1="8"
                              x2="100%"
                              y2="8"
                              stroke="#D4AF37"
                              strokeWidth="2"
                              strokeDasharray="6 4"
                              className="animate-flow-dash opacity-75"
                            />
                          </svg>

                          {/* Glowing Animated Arrowhead in center */}
                          <div className="absolute inset-center w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#D4AF37] shadow-xs flex items-center justify-center text-[#0E2A1B] animate-arrow-bounce">
                            <ArrowRight className="w-3.5 h-3.5 text-[#C89038] stroke-[2.5]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile / Tablet Compact Timeline */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {[
                { step: '01', title: 'Carefully Sourced', text: 'Finest lotus seeds handpicked from trusted farmers.', icon: Leaf },
                { step: '02', title: 'Slow Roasted', text: 'Slow-roasted for maximum taste and crunch.', icon: Sun },
                { step: '03', title: 'Quality Checked', text: 'Strict checks to ensure purity and freshness.', icon: Heart },
                { step: '04', title: 'Hygienically Packed', text: 'Airtight packaging locking in nutrients.', icon: Package },
                { step: '05', title: 'Delivered to You', text: 'Wholesome snacks delivered right to your door.', icon: Truck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex gap-3 items-center p-3.5 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/50 flex items-center justify-center text-[#0E2A1B] shrink-0">
                      <Icon className="w-5 h-5 text-[#0E2A1B]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-[#D4AF37] bg-[#0E2A1B] px-1.5 py-0.2 rounded">
                          {item.step}
                        </span>
                        <h4 className="font-serif font-bold text-xs text-[#0E2A1B] truncate">{item.title}</h4>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>


        {/* ===================================================
            5. BRAND STATISTICS SECTION (White BG, Dark Green Cards)
           =================================================== */}
        <section className="py-8 sm:py-10 bg-white border-t border-[#E8E2D5]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              
              {/* Stat 1: 10K+ */}
              <div className="bg-[#0E2A1B] text-white rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/30 shadow-md hover:shadow-xl hover:border-[#D4AF37] hover:-translate-y-1 transition-all duration-300 text-center group">
                <div className="w-9 h-9 mx-auto rounded-xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#0E2A1B] transition-all duration-300 mb-2 shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  10K<span className="text-[#D4AF37]">+</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#A2B5A8] uppercase tracking-wider mt-0.5">
                  Happy Customers
                </p>
              </div>

              {/* Stat 2: 50+ */}
              <div className="bg-[#0E2A1B] text-white rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/30 shadow-md hover:shadow-xl hover:border-[#D4AF37] hover:-translate-y-1 transition-all duration-300 text-center group">
                <div className="w-9 h-9 mx-auto rounded-xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#0E2A1B] transition-all duration-300 mb-2 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  50<span className="text-[#D4AF37]">+</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#A2B5A8] uppercase tracking-wider mt-0.5">
                  Premium Products
                </p>
              </div>

              {/* Stat 3: 100% */}
              <div className="bg-[#0E2A1B] text-white rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/30 shadow-md hover:shadow-xl hover:border-[#D4AF37] hover:-translate-y-1 transition-all duration-300 text-center group">
                <div className="w-9 h-9 mx-auto rounded-xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#0E2A1B] transition-all duration-300 mb-2 shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  100<span className="text-[#D4AF37]">%</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#A2B5A8] uppercase tracking-wider mt-0.5">
                  Natural Ingredients
                </p>
              </div>

              {/* Stat 4: Pan India */}
              <div className="bg-[#0E2A1B] text-white rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/30 shadow-md hover:shadow-xl hover:border-[#D4AF37] hover:-translate-y-1 transition-all duration-300 text-center group">
                <div className="w-9 h-9 mx-auto rounded-xl bg-[#1B3B29] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#0E2A1B] transition-all duration-300 mb-2 shadow-xs">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-0.5">
                  Pan India
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#A2B5A8] uppercase tracking-wider mt-0.5">
                  Delivery Network
                </p>
              </div>

            </div>

          </div>
        </section>


      </main>

      <Footer />
    </div>
  );
}
