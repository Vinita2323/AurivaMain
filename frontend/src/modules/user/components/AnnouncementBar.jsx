import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Sparkles, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  const announcements = [
    { icon: Truck, text: 'Free Shipping on orders above ₹499', highlight: '₹499' },
    { icon: Sparkles, text: '100% Natural Harvested Lotus Seeds', highlight: '100% Natural' },
    { icon: ShieldCheck, text: '100% Secure & Encrypted Payments', highlight: 'Secure' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const CurrentIcon = announcements[currentIndex].icon;

  return (
    <aside aria-label="Announcement" className="bg-[#0A2014] text-[#E8DFC8] border-b border-[#D4AF37]/20 text-[10px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 tracking-wider uppercase">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        
        {/* Mobile Single Rotating Ticker (< sm) */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 w-full text-center truncate">
          <CurrentIcon className="w-3 h-3 text-[#D4AF37] shrink-0 animate-pulse-gold" />
          <span className="truncate">{announcements[currentIndex].text}</span>
        </div>

        {/* Desktop & Tablet Multi-Badge Row (>= sm) */}
        <div className="hidden sm:flex items-center justify-center gap-6 lg:gap-8 text-center w-full">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Free Shipping on orders above <strong className="text-[#D4AF37]">₹499</strong></span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>100% Natural Ingredients</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>100% Secure Payments</span>
          </div>
        </div>

        {/* Right Admin Link (desktop only) */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] absolute right-0">
          <span className="text-[#A2B5A8]">Helpline: +91 98765 43210</span>
          <span className="text-[#D4AF37]/40">|</span>
          <Link 
            to="/admin" 
            className="flex items-center gap-1 text-[#D4AF37] hover:text-white transition-colors font-medium"
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>Admin</span>
          </Link>
        </div>

      </div>
    </aside>
  );
}
