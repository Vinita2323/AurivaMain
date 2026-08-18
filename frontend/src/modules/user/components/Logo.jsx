import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ variant = 'light', size = 'default', to = '/' }) {
  const isLight = variant === 'light'; // on dark green bg
  
  return (
    <Link to={to} className="flex items-center gap-2.5 group select-none">
      {/* Botanical Crest Icon */}
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-[#1B3B29] border border-[#D4AF37]/40 shadow-sm group-hover:border-[#D4AF37] transition-all">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#D4AF37]" fill="currentColor">
          <path d="M12 2C11.5 5 9 8 5 9C9 10 11.5 13 12 16C12.5 13 15 10 19 9C15 8 12.5 5 12 2Z" />
          <circle cx="12" cy="19" r="1.5" />
          <circle cx="7" cy="18" r="1" />
          <circle cx="17" cy="18" r="1" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`font-serif tracking-[0.18em] font-bold leading-none ${
          size === 'small' ? 'text-lg' : size === 'large' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
        } ${isLight ? 'text-white' : 'text-[#0E2A1B]'}`}>
          AURIV<span className="text-[#D4AF37]">Á</span>
        </span>
        <span className="text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#D4AF37] font-medium leading-tight">
          PREMIUM GOODNESS
        </span>
      </div>
    </Link>
  );
}
