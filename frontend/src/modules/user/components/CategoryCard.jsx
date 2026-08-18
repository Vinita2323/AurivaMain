import React from 'react';
import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group flex flex-col items-center text-center p-2 sm:p-3 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 focus:outline-none"
    >
      {/* Circular Image Frame with Gold Rim */}
      <div className="relative w-20 h-20 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48 rounded-full p-1 sm:p-1.5 bg-gradient-to-tr from-[#D4AF37] via-[#F7F3E9] to-[#D4AF37] shadow-sm sm:shadow-lg group-hover:shadow-2xl transition-all duration-500">
        <div className="w-full h-full rounded-full overflow-hidden bg-white border sm:border-2 border-white shadow-inner">
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
          />
        </div>
        {category.badge && (
          <span className="absolute -bottom-1 sm:-bottom-1.5 left-1/2 -translate-x-1/2 bg-[#0E2A1B] text-[#D4AF37] border border-[#D4AF37]/60 text-[8.5px] sm:text-[11px] font-bold px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
            {category.badge}
          </span>
        )}
      </div>

      {/* Name and Subtitle */}
      <div className="mt-2 sm:mt-4">
        <h4 className="font-serif text-[11.5px] sm:text-sm md:text-base font-bold text-[#0E2A1B] group-hover:text-[#28543B] transition-colors leading-tight">
          {category.name}
        </h4>
        <span className="text-[9.5px] sm:text-xs text-stone-500 font-normal block mt-0.5 sm:mt-1">
          {category.subtext || `${category.count}+ items`}
        </span>
      </div>
    </Link>
  );
}
