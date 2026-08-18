import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Award, Heart, ShieldCheck, Flame, Gift, Leaf, FlaskConical, Droplets, Flower2, Mountain, Quote } from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import TrustBenefits from '../components/TrustBenefits';
import CategoryCard from '../components/CategoryCard';
import FlavorCard from '../components/FlavorCard';
import ProductCard from '../components/ProductCard';
import TestimonialCard from '../components/TestimonialCard';
import Footer from '../components/Footer';

import { PRODUCTS } from '../../../data/products';
import { CATEGORIES } from '../../../data/categories';
import { FLAVORS } from '../../../data/flavors';
import { REVIEWS } from '../../../data/reviews';
import heroImage from '../../../assets/user/HeroImage.png';
import philosophyImg from '../../../assets/user/philosophy.png';

export default function HomePage() {
  const bestSellers = PRODUCTS.filter(p => p.isBestseller).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F7F3E9] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-20 md:pb-0">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 2. HEADER */}
      <Header />

      <main>
        {/* 3. HERO SECTION (Dark Green Luxury × Botanical Elegance) */}
        <section className="relative bg-[#0E2A1B] text-white pt-5 pb-7 sm:pt-10 sm:pb-16 lg:pt-16 lg:pb-24 overflow-hidden border-b border-[#D4AF37]/20">
          
          {/* Subtle glowing ambient lights */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#1B3B29]/80 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
              
              {/* Left Hero Content */}
              <div className="lg:col-span-6 space-y-3 sm:space-y-6 text-center lg:text-left">
                
                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B3B29] border border-[#D4AF37]/40 shadow-xs">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]" />
                  <span className="text-[9px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#D4AF37]">
                    PREMIUM QUALITY
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.1]">
                  Real Ingredients. <br className="hidden sm:inline" />
                  <span className="gold-gradient-text">Real Nutrition.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-[11.5px] sm:text-base lg:text-lg text-[#D2DFD6] font-normal leading-relaxed max-w-md sm:max-w-xl mx-auto lg:mx-0">
                  Premium makhana and healthy snacks crafted for better everyday choices. Roasted to crispy perfection with 100% natural seasonings.
                </p>

                {/* CTA Buttons (Compact Grid on Mobile, Row on Desktop) */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-1 sm:pt-2">
                  <Link
                    to="/shop"
                    className="w-full sm:w-auto px-4 py-2.5 sm:px-8 sm:py-4 rounded-xl gold-gradient-btn font-bold text-[11px] sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all hover:scale-105 min-h-[42px] sm:min-h-[44px]"
                  >
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>

                  <Link
                    to="/shop?category=makhana"
                    className="w-full sm:w-auto px-4 py-2.5 sm:px-8 sm:py-4 rounded-xl border border-[#D4AF37]/60 text-[#F7F3E9] hover:bg-white/10 hover:border-[#D4AF37] font-semibold text-[11px] sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center min-h-[42px] sm:min-h-[44px]"
                  >
                    COLLECTION
                  </Link>
                </div>

                {/* Micro trust indicators */}
                <div className="pt-1.5 sm:pt-4 flex items-center justify-center lg:justify-start gap-3.5 sm:gap-6 text-[10px] sm:text-xs text-[#A2B5A8]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    <span><strong>4.9/5</strong> (4,500+ Reviews)</span>
                  </div>
                </div>
              </div>

              {/* Right Hero Product Composition (Hidden on mobile < lg, visible on desktop >= lg) */}
              <div className="hidden lg:flex lg:col-span-6 relative items-center justify-center">
                <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                  
                  {/* Decorative circular backdrop rings */}
                  <div className="absolute inset-4 rounded-full border border-[#D4AF37]/20 animate-spin" style={{ animationDuration: '60s' }} />
                  <div className="absolute inset-12 rounded-full border border-dashed border-[#D4AF37]/30" />
                  
                  {/* Main Product Jar / Packaging Showcase - Circular Framing */}
                  <div className="relative z-10 w-56 h-56 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_25px_50px_rgba(0,0,0,0.65)] ring-4 ring-[#D4AF37]/20 transition-transform duration-700 hover:scale-105">
                    <img
                      src={heroImage}
                      alt="AURIVÁ Roasted Makhana"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Floating floating botanical & ingredient badges */}
                  <div className="hidden sm:flex absolute -top-2 left-4 z-20 bg-[#1B3B29]/90 backdrop-blur-md border border-[#D4AF37]/40 text-[#F7F3E9] p-3 rounded-2xl shadow-xl items-center gap-2.5 animate-float-slow">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0E2A1B] flex items-center justify-center font-bold text-xs">
                      100%
                    </div>
                    <div>
                      <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">Superfood</p>
                      <p className="text-xs font-semibold">Lotus Seed Foxnuts</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex absolute -bottom-2 right-4 z-20 bg-[#1B3B29]/90 backdrop-blur-md border border-[#D4AF37]/40 text-[#F7F3E9] p-3 rounded-2xl shadow-xl items-center gap-2.5 animate-float-slow" style={{ animationDelay: '2s' }}>
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">Zero Cholesterol</p>
                      <p className="text-xs font-semibold">Slow Roasted in Olive Mist</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. TRUST BENEFITS (Immediately below hero) */}
        <TrustBenefits />

        {/* 5. SHOP BY CATEGORY (Warm Ivory Background with compact horizontal scroll on mobile) */}
        <section className="py-6 sm:py-16 lg:py-20 bg-[#F7F3E9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-3.5 sm:mb-10">
              <div>
                <span className="text-[9px] sm:text-xs uppercase tracking-widest text-[#28543B] font-bold block">
                  CURATED NUTRITION
                </span>
                <h2 className="font-serif text-lg sm:text-3xl md:text-4xl font-bold text-[#0E2A1B] mt-0.5">
                  Shop by Category
                </h2>
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#0E2A1B] hover:text-[#D4AF37] transition-colors group pb-0.5"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Category Cards Horizontal Swipe on Mobile & Grid on Desktop */}
            <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-1">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="min-w-[105px] sm:min-w-[150px] md:min-w-0 snap-start flex-1 shrink-0">
                  <CategoryCard category={cat} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. BEST SELLERS (Dark Luxury Theme - Compact on Mobile, Broad on Desktop) */}
        <section className="py-6 sm:py-16 lg:py-24 bg-[#081B11] text-white relative overflow-hidden border-y border-[#D4AF37]/25">
          {/* Animated Ambient Golden & Emerald Glows */}
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#143B24]/90 rounded-full blur-[110px] pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '3s' }} />
          
          {/* Subtle gold grid pattern accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.035] pointer-events-none" />

          <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
            
            {/* Section Header */}
            <div className="relative mb-5 sm:mb-12 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-[#133E28]/80 border border-[#D4AF37]/40 shadow-xs mb-1.5 sm:mb-2">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]" />
                <span className="text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold">
                  CUSTOMER FAVORITES
                </span>
              </div>
              
              <h2 className="font-serif text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#F7F3E9] flex items-center justify-center gap-2 sm:gap-6 mt-0.5 sm:mt-1">
                <span className="h-[1px] w-8 sm:w-20 bg-gradient-to-r from-transparent to-[#D4AF37]/60 hidden sm:inline-block" />
                <span className="tracking-wide">BEST SELLERS</span>
                <span className="h-[1px] w-8 sm:w-20 bg-gradient-to-l from-transparent to-[#D4AF37]/60 hidden sm:inline-block" />
              </h2>

              <div className="mt-2 sm:mt-4 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 flex justify-center">
                <Link
                  to="/shop?filter=bestsellers"
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#D4AF37] hover:text-[#F7F3E9] transition-all group py-1 px-2.5 rounded-lg hover:bg-white/5"
                >
                  <span>VIEW ALL PRODUCTS</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* 2-Col Mobile & 5-Card Wide Responsive Grid on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-5 lg:gap-6 xl:gap-7">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* 7. BRAND STORY SECTION (The Aurivá Philosophy - Compact Warm Ivory Botanical Style) */}
        <section id="story" className="py-5 sm:py-14 bg-[#FAF7F2] text-[#182019] relative overflow-hidden border-b border-[#EBE5DA]">
          
          <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 items-center">
              
              {/* Left Column: Philosophy Details */}
              <div className="lg:col-span-6 space-y-2.5 sm:space-y-4">
                
                {/* Eyebrow with gold leaf */}
                <div className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C89038] font-bold">
                  <span>THE AURIVÁ PHILOSOPHY</span>
                  <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C89038]" />
                </div>

                {/* Main Heading */}
                <h2 className="font-serif text-xl sm:text-3xl lg:text-[36px] font-extrabold leading-tight text-[#182019]">
                  Good Food. <br className="hidden sm:inline" />
                  <span className="text-[#1A402B]">Better Everyday Living.</span>
                </h2>

                {/* Delicate gold divider */}
                <div className="flex items-center gap-2 py-0.5">
                  <div className="h-[1px] w-8 sm:w-10 bg-[#D4AF37]/50" />
                  <Leaf className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D4AF37]" />
                  <div className="h-[1px] w-14 sm:w-20 bg-[#D4AF37]/50" />
                </div>

                {/* Paragraph */}
                <p className="text-[11px] sm:text-[13.5px] text-[#182019]/90 leading-relaxed max-w-xl font-medium">
                  At AURIVÁ, we believe healthy snacking shouldn’t be a compromise between good nutrition and great taste. We source the largest, purest fox nuts directly from organic wetlands, roasting them with cold-pressed oils and artisanal spices.
                </p>

                {/* 5-Feature Trust Strip */}
                <div className="bg-white rounded-xl border border-[#EBE5DA] p-2 sm:p-3 shadow-2xs">
                  <div className="grid grid-cols-5 gap-1 text-center items-center">
                    
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-stone-200 flex items-center justify-center text-[#0E2A1B] mb-0.5 sm:mb-1 bg-stone-50">
                        <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0E2A1B]" />
                      </div>
                      <span className="text-[8px] sm:text-[10.5px] font-bold text-[#0E2A1B] leading-tight">100% Natural</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-stone-200 flex items-center justify-center text-[#0E2A1B] mb-0.5 sm:mb-1 bg-stone-50">
                        <FlaskConical className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0E2A1B]" />
                      </div>
                      <span className="text-[8px] sm:text-[10.5px] font-bold text-[#0E2A1B] leading-tight">No Chemicals</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-stone-200 flex items-center justify-center text-[#0E2A1B] mb-0.5 sm:mb-1 bg-stone-50">
                        <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0E2A1B]" />
                      </div>
                      <span className="text-[8px] sm:text-[10.5px] font-bold text-[#0E2A1B] leading-tight">Cold-Pressed</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-stone-200 flex items-center justify-center text-[#0E2A1B] mb-0.5 sm:mb-1 bg-stone-50">
                        <Flower2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0E2A1B]" />
                      </div>
                      <span className="text-[8px] sm:text-[10.5px] font-bold text-[#0E2A1B] leading-tight">Sustainably</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-stone-200 flex items-center justify-center text-[#0E2A1B] mb-0.5 sm:mb-1 bg-stone-50">
                        <Mountain className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0E2A1B]" />
                      </div>
                      <span className="text-[8px] sm:text-[10.5px] font-bold text-[#0E2A1B] leading-tight">Himalayan</span>
                    </div>

                  </div>
                </div>

                {/* 2-Stat Metric Cards */}
                <div className="bg-white rounded-xl border border-[#EBE5DA] p-2.5 sm:p-3.5 shadow-2xs grid grid-cols-2 gap-2 sm:gap-3 divide-x divide-stone-200">
                  
                  <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-3">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-dashed border-[#D4AF37] flex items-center justify-center text-[#C89038] shrink-0 bg-[#FAF7F2]">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm sm:text-xl font-extrabold text-[#0E2A1B] leading-tight">100%</h4>
                      <p className="text-[9.5px] sm:text-xs font-bold text-[#0E2A1B] leading-tight">Chemical Free</p>
                      <p className="text-[8.5px] sm:text-[9.5px] font-medium text-stone-500 hidden sm:block">Pure. Safe. Always.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-dashed border-[#D4AF37] flex items-center justify-center text-[#C89038] shrink-0 bg-[#FAF7F2]">
                      <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif text-sm sm:text-xl font-extrabold text-[#0E2A1B] leading-tight">70% Less</h4>
                      <p className="text-[9.5px] sm:text-xs font-bold text-[#0E2A1B] leading-tight">Fat vs Snacks</p>
                      <p className="text-[8.5px] sm:text-[9.5px] font-medium text-stone-500 hidden sm:block">Light on you.</p>
                    </div>
                  </div>

                </div>

                {/* Button */}
                <div className="pt-0.5 sm:pt-1">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#163A26] hover:text-white border border-[#D4AF37]/40 font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-2xs transition-all hover:scale-105"
                  >
                    <span>KNOW OUR STORY</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </Link>
                </div>

              </div>

              {/* Right Column: Visual Showcase */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-xl border border-[#EBE5DA] bg-white group aspect-[16/10] sm:aspect-[4/3] max-h-[260px] sm:max-h-[460px]">
                  <img
                    src={philosophyImg}
                    alt="AURIVÁ The Philosophy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>



        {/* 9. WHY CHOOSE AURIVÁ? & BENEFITS SECTION (Compact & Luxury Glassmorphic) */}
        <section id="benefits" className="py-12 sm:py-16 bg-[#081B11] text-white relative overflow-hidden border-y border-[#D4AF37]/25">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#163E27]/80 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#133E28]/80 border border-[#D4AF37]/35 shadow-xs mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] font-bold">
                  HOLISTIC WELLNESS
                </span>
              </div>
              
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#F7F3E9] mt-0.5">
                Why Choose AURIVÁ?
              </h2>
              <p className="text-xs sm:text-[13px] text-[#A2B5A8] mt-1.5 max-w-lg mx-auto leading-relaxed">
                Every pack is engineered to fuel your body with wholesome nutrition, clean energy, and authentic taste.
              </p>
            </div>

            {/* 4 Compact Luxury Glass Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
              
              {/* Card 1 */}
              <div className="group bg-gradient-to-b from-[#133523]/80 to-[#0A1F14]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/25 hover:border-[#D4AF37] shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.25)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#091B11] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#081B11] transition-all duration-300 shadow-inner mb-3">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                    Protein Rich
                  </h4>
                  <p className="text-xs text-[#B5C7BB] leading-relaxed font-normal">
                    Naturally packed with clean plant protein to repair muscle tissues and keep you satiated for hours.
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#D4AF37] font-semibold">
                  <span>100% Plant Fuel</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="group bg-gradient-to-b from-[#133523]/80 to-[#0A1F14]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/25 hover:border-[#D4AF37] shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.25)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#091B11] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#081B11] transition-all duration-300 shadow-inner mb-3">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                    Heart Friendly
                  </h4>
                  <p className="text-xs text-[#B5C7BB] leading-relaxed font-normal">
                    Zero trans-fats and low sodium levels to support healthy blood pressure and long-term cardiovascular health.
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#D4AF37] font-semibold">
                  <span>0g Trans Fat</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="group bg-gradient-to-b from-[#133523]/80 to-[#0A1F14]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/25 hover:border-[#D4AF37] shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.25)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#091B11] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#081B11] transition-all duration-300 shadow-inner mb-3">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                    Low Calorie
                  </h4>
                  <p className="text-xs text-[#B5C7BB] leading-relaxed font-normal">
                    Less than 110 calories per serving. The ideal crunchy companion for guilt-free late-night or tea-time munching.
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#D4AF37] font-semibold">
                  <span>&lt; 110 kcal / pack</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60" />
                </div>
              </div>

              {/* Card 4 */}
              <div className="group bg-gradient-to-b from-[#133523]/80 to-[#0A1F14]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#D4AF37]/25 hover:border-[#D4AF37] shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.25)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#091B11] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#081B11] transition-all duration-300 shadow-inner mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                    100% Gluten Free
                  </h4>
                  <p className="text-xs text-[#B5C7BB] leading-relaxed font-normal">
                    Carefully processed in gluten-safe facilities with natural ingredients suitable for sensitive tummies.
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-[#D4AF37] font-semibold">
                  <span>Lab Certified</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60" />
                </div>
              </div>

            </div>

            {/* Ultra Compact Celebration Voucher Ribbon */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#173D29] via-[#0E281B] to-[#0A1F14] border border-[#D4AF37]/40 rounded-xl py-2.5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg hover:border-[#D4AF37] transition-all duration-300">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#E5C158] to-[#C89038] text-[#081B11] flex items-center justify-center shrink-0 shadow-sm">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/15 px-1.5 py-0.5 rounded">
                      CELEBRATION VOUCHER
                    </span>
                    <h3 className="font-serif text-sm sm:text-[15px] font-bold text-white">
                      20% OFF Your Next Order
                    </h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#A2B5A8]">
                    Use code <strong className="text-[#D4AF37] bg-black/40 px-1.5 py-0.2 rounded border border-[#D4AF37]/30 tracking-wider">AURIVA20</strong> at checkout
                  </p>
                </div>
              </div>

              <Link
                to="/shop"
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C89038] hover:from-[#E5C158] hover:to-[#D4AF37] text-[#081B11] font-extrabold text-[11px] uppercase tracking-wider shadow-sm hover:scale-105 transition-all whitespace-nowrap"
              >
                CLAIM OFFER →
              </Link>
            </div>

          </div>
        </section>



        {/* 11. TESTIMONIALS & EXCLUSIVE OFFERS (Hidden on mobile < md, visible on desktop/tablet >= md) */}
        <section className="hidden md:block py-14 sm:py-20 bg-gradient-to-b from-[#FAF7F2] via-[#F6F1E8] to-[#F1ECE2] border-t border-[#E8E2D5] relative overflow-hidden">
          {/* Subtle Ambient Light Glows */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#163E27]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
            
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#133E28]/10 border border-[#28543B]/20 mb-2.5 shadow-2xs">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-[#0E2A1B] font-bold">
                  REAL CUSTOMER VOICES
                </span>
              </div>
              
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold text-[#0E2A1B] mt-1">
                What Our Customers Say
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-md mx-auto">
                Over 25,000+ happy crunchers across India sharing their mindful snacking stories.
              </p>
            </div>

            {/* 4-Card Testimonials Grid with Mobile Horizontal Touch-Swipe */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-12 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2">
              {REVIEWS.map((review) => (
                <div key={review.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-start shrink-0 flex-1">
                  <TestimonialCard review={review} />
                </div>
              ))}
            </div>

            {/* Animated Exclusive Offers 30% Off Box */}
            <div className="bg-gradient-to-r from-[#091F13] via-[#103421] to-[#0A2014] rounded-3xl p-6 sm:p-8 md:p-10 border border-[#D4AF37]/45 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
              
              {/* Shimmer sheen sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              <div className="absolute -top-16 -right-16 w-60 h-60 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

              <div className="space-y-1.5 text-center md:text-left relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10.5px] font-extrabold uppercase tracking-widest mb-1 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>LIMITED TIME BUNDLES</span>
                </div>
                
                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                  Exclusive Offers: Up to <span className="text-[#D4AF37] drop-shadow-md">30% OFF</span>
                </h3>
                
                <p className="text-xs sm:text-sm text-[#A2B5A8] max-w-xl">
                  On curated party packs, mega snack jars, and combo subscription refills with free gift pouches.
                </p>
              </div>

              <Link
                to="/shop?filter=offers"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C89038] hover:from-[#E5C158] hover:to-[#D4AF37] text-[#081B11] font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-[0_8px_25px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all whitespace-nowrap relative z-10 flex items-center gap-2"
              >
                <span>SHOP OFFERS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* 12. FOOTER */}
      <Footer />
    </div>
  );
}
