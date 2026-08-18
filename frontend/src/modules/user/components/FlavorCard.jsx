import React from 'react';
import { Link } from 'react-router-dom';

export default function FlavorCard({ flavor, isActive = false, onSelect }) {
  const content = (
    <div className={`group flex flex-col items-center text-center p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
      isActive ? 'scale-105' : 'hover:-translate-y-1'
    }`}>
      {/* Circular Image Container */}
      <div className={`relative w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full p-1 transition-all duration-300 ${
        isActive 
          ? 'ring-4 ring-[#D4AF37] shadow-xl bg-[#0E2A1B]' 
          : 'bg-white shadow-md hover:shadow-lg border border-[#E8E2D5]'
      }`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF7F2]">
          <img
            src={flavor.image}
            alt={flavor.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Flavor Title */}
      <h5 className={`mt-2 font-serif text-xs sm:text-sm font-semibold transition-colors ${
        isActive ? 'text-[#0E2A1B] font-bold underline decoration-[#D4AF37] decoration-2 underline-offset-4' : 'text-[#182019] group-hover:text-[#0E2A1B]'
      }`}>
        {flavor.name}
      </h5>
      <span className="text-[10px] text-stone-500 hidden sm:block max-w-[110px] truncate">
        {flavor.tagline}
      </span>
    </div>
  );

  if (onSelect) {
    return <div onClick={() => onSelect(flavor.name)}>{content}</div>;
  }

  return (
    <Link to={`/shop?flavor=${encodeURIComponent(flavor.name)}`}>
      {content}
    </Link>
  );
}
