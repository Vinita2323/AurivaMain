import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, Play, Pause, Sparkles, Award } from 'lucide-react';
import philosophyImg from '../../../assets/user/philosophy.png';

export default function OurStorySection() {
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
    <section className="py-4 sm:py-8 bg-[#F7F3E9] px-3 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
      <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl bg-[#0E2A1B] border border-[#D4AF37]/30">
        
        {/* Left Side: Text & Content (Dark Green) */}
        <div className="lg:w-2/5 bg-[#0E2A1B] text-white p-6 sm:p-8 lg:p-12 flex flex-col justify-center relative z-10">
          
          <div className="inline-flex items-center gap-2 text-[#D4AF37] font-bold text-xs tracking-widest uppercase mb-3">
            <Leaf className="w-4 h-4 fill-current" />
            <span>Our Story</span>
          </div>
          
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#F6E5A6] leading-tight mb-4">
            ROOTED IN<br />TRADITION,<br />PERFECTED<br />FOR YOU.
          </h2>
          
          <p className="text-[#A2B5A8] text-sm leading-relaxed mb-6 max-w-sm font-normal">
            At Auriva, we bring you the finest makhana from the heart of nature. Our passion for quality and purity ensures every bite you take is wholesome, nutritious and absolutely delicious.
          </p>
          
          {/* Stats Grid */}
          <div className="flex items-center gap-4 sm:gap-6 mb-8 text-left border-t border-[#D4AF37]/25 pt-5">
            <div>
              <h4 className="text-xl sm:text-2xl font-serif font-extrabold text-[#D4AF37] mb-1 leading-none">10,000+</h4>
              <p className="text-[10px] sm:text-[11px] text-[#A2B5A8] uppercase tracking-wider font-semibold">Happy Customers</p>
            </div>
            <div className="w-px h-10 bg-[#D4AF37]/25"></div>
            <div>
              <h4 className="text-xl sm:text-2xl font-serif font-extrabold text-[#D4AF37] mb-1 leading-none">50+</h4>
              <p className="text-[10px] sm:text-[11px] text-[#A2B5A8] uppercase tracking-wider font-semibold">Tons Makhana<br/>Delivered</p>
            </div>
            <div className="w-px h-10 bg-[#D4AF37]/25"></div>
            <div>
              <h4 className="text-xl sm:text-2xl font-serif font-extrabold text-[#D4AF37] mb-1 leading-none">25+</h4>
              <p className="text-[10px] sm:text-[11px] text-[#A2B5A8] uppercase tracking-wider font-semibold">Cities Served</p>
            </div>
          </div>
          
          <div>
            <Link
              to="/about"
              className="inline-flex items-center gap-2.5 bg-[#D4AF37] hover:bg-[#E5C358] text-[#0E2A1B] px-7 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-[0_8px_20px_rgba(212,175,55,0.35)] hover:scale-105 active:scale-95 transition-all"
            >
              <span>Know More About Us</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
        </div>
        
        {/* Right Side: Video Showcase */}
        <div 
          className="lg:w-3/5 relative min-h-[380px] sm:min-h-[440px] lg:min-h-[520px] lg:rounded-l-[3rem] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#D4AF37]/30 group select-none cursor-pointer bg-black"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={togglePlay}
        >
          {/* HTML5 Video */}
          <video 
            ref={videoRef}
            src="/SecondVideo.mp4" 
            poster={philosophyImg}
            playsInline
            autoPlay
            loop
            muted
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
          />

          {/* Gradients Overlay for legibility & dark luxury mood */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A1B]/70 via-[#0E2A1B]/20 to-transparent lg:w-1/2 pointer-events-none" />

          {/* Top Floating Badge */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-[10.5px] font-extrabold uppercase tracking-wider shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Aurivá Farm Film</span>
            </div>
          </div>

          {/* Center Interactive Play / Pause Button with Golden Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className={`transition-all duration-300 ${
              !isPlaying 
                ? 'opacity-100 scale-100' 
                : isHovered 
                  ? 'opacity-80 scale-95' 
                  : 'opacity-0 scale-75'
            }`}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#D4AF37]/60 flex items-center justify-center bg-black/40 backdrop-blur-md shadow-[0_0_35px_rgba(212,175,55,0.4)]">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#D4AF37] text-[#0E2A1B] flex items-center justify-center shadow-lg">
                  {isPlaying ? (
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-[#0E2A1B]" />
                  ) : (
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-[#0E2A1B] ml-1" />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Overlay Text Bottom */}
          <div className="absolute bottom-0 left-0 p-6 sm:p-10 lg:p-12 z-20 w-full text-white pointer-events-none">
            <div className="flex items-center gap-2 mb-2.5">
               <div className="w-6 h-[1.5px] bg-[#D4AF37]"></div>
               <div className="w-2 h-2 rotate-45 bg-[#D4AF37]"></div>
               <div className="w-10 h-[1px] bg-[#D4AF37]/60"></div>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white leading-tight drop-shadow-md">
              From the Farms<br/>to Your Bowl
            </h3>
            <p className="text-sm sm:text-base text-[#D2DFD6] font-normal max-w-md drop-shadow">
              Pure farms. Pure makhana.<br/>Pure goodness.
            </p>
          </div>
          
        </div>
        
      </div>
    </section>
  );
}
