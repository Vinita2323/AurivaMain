import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, Play } from 'lucide-react';
import philosophyImg from '../../../assets/user/philosophy.png';

export default function OurStorySection() {
  return (
    <section className="hidden md:block py-2 sm:py-4 bg-[#F7F3E9] px-2 sm:px-4 lg:px-4 max-w-[1550px] mx-auto">
      <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl bg-[#0E2A1B]">
        
        {/* Left Side: Text & Content (Dark Green) */}
        <div className="lg:w-2/5 bg-[#0E2A1B] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          
          <div className="inline-flex items-center gap-2 text-[#D4AF37] font-bold text-xs tracking-widest uppercase mb-2.5">
            <Leaf className="w-4 h-4 fill-current" />
            <span>Our Story</span>
          </div>
          
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#D4AF37] leading-tight mb-4">
            ROOTED IN<br />TRADITION,<br />PERFECTED<br />FOR YOU.
          </h2>
          
          <p className="text-[#A2B5A8] text-sm leading-relaxed mb-6 max-w-sm">
            At Auriva, we bring you the finest makhana from the heart of nature. Our passion for quality and purity ensures every bite you take is wholesome, nutritious and absolutely delicious.
          </p>
          
          {/* Stats Grid */}
          <div className="flex items-center gap-4 sm:gap-6 mb-6 text-left border-t border-[#D4AF37]/20 pt-4">
            <div>
              <h4 className="text-xl font-bold text-[#D4AF37] mb-1">10,000+</h4>
              <p className="text-[10px] text-[#A2B5A8] uppercase tracking-wider">Happy Customers</p>
            </div>
            <div className="w-px h-10 bg-[#D4AF37]/20"></div>
            <div>
              <h4 className="text-xl font-bold text-[#D4AF37] mb-1">50+</h4>
              <p className="text-[10px] text-[#A2B5A8] uppercase tracking-wider">Tons of Makhana<br/>Delivered</p>
            </div>
            <div className="w-px h-10 bg-[#D4AF37]/20"></div>
            <div>
              <h4 className="text-xl font-bold text-[#D4AF37] mb-1">25+</h4>
              <p className="text-[10px] text-[#A2B5A8] uppercase tracking-wider">Cities Served</p>
            </div>
          </div>
          
          <div>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C358] text-[#0E2A1B] px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>Know More About Us</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
        </div>
        
        {/* Right Side: Image Showcase */}
        <div className="lg:w-3/5 relative min-h-[400px] lg:min-h-auto lg:rounded-l-[3rem] overflow-hidden border-l border-white/10 lg:border-[#D4AF37]/30">
          <img 
            src={philosophyImg} 
            alt="Auriva Farms" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle gradient overlay to make text readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A1B]/60 to-transparent lg:w-1/3"></div>
          
          {/* Play Button Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/40 flex items-center justify-center group hover:scale-105 transition-transform bg-black/20 backdrop-blur-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/60 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-1" />
              </div>
            </button>
          </div>
          
          {/* Overlay Text */}
          <div className="absolute bottom-0 left-0 p-8 sm:p-12 z-10 w-full text-white">
            <div className="flex items-center gap-2 mb-3">
               <div className="w-4 h-px bg-[#D4AF37]"></div>
               <div className="w-2 h-2 rotate-45 bg-[#D4AF37]"></div>
               <div className="w-4 h-px bg-[#D4AF37]"></div>
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold mb-3 shadow-sm">
              From the Farms<br/>to Your Bowl
            </h3>
            <p className="text-lg text-white/90">
              Pure farms. Pure makhana.<br/>Pure goodness.
            </p>
          </div>
          
        </div>
        
      </div>
    </section>
  );
}
