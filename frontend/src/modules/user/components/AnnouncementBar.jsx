import React from 'react';
import { Leaf, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  return (
    <aside 
      aria-label="Announcement" 
      className="bg-[#082012] text-[#FAF7F2] border-b border-[#D4AF37]/20 text-[10px] sm:text-[11.5px] py-2 px-3 sm:px-4 tracking-[0.1em] uppercase font-medium relative z-50 select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">
        
        {/* Center Main Announcement */}
        <div className="flex items-center justify-center gap-2 text-center">
          <Leaf className="w-3.5 h-3.5 text-[#C89038] fill-[#C89038]/30 shrink-0" />
          <p className="truncate sm:overflow-visible flex items-center gap-1.5 sm:gap-2">
            <span className="font-semibold text-white/95">FREE SHIPPING ON ORDERS ABOVE ₹499</span>
            <span className="opacity-40 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-white/85">PREMIUM MAKHANA, DELIVERED FRESH TO YOUR DOORSTEP</span>
          </p>
        </div>

        {/* Discreet Desktop Admin Link */}
        <div className="hidden xl:flex items-center gap-3 text-[10.5px] absolute right-0">
          <Link 
            to="/admin" 
            className="flex items-center gap-1 text-[#D4AF37]/80 hover:text-white transition-colors font-medium"
            title="Admin Panel"
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>Admin</span>
          </Link>
        </div>

      </div>
    </aside>
  );
}

