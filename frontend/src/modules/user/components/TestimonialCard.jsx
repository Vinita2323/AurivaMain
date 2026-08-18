import React from 'react';
import { Star, CheckCircle2, Quote } from 'lucide-react';

export default function TestimonialCard({ review }) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D5] hover:border-[#D4AF37] shadow-md hover:shadow-[0_20px_40px_rgba(14,42,27,0.1),0_0_20px_rgba(212,175,55,0.2)] hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between relative group overflow-hidden text-left">
      
      {/* Light sheen animation sweep across card on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />

      {/* Decorative ambient corner glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-[#FAF3DE] rounded-bl-full group-hover:bg-[#F5E7B8] transition-colors duration-500 pointer-events-none -z-0" />

      {/* Decorative Gold Quote */}
      <Quote className="absolute top-4 right-4 w-7 h-7 text-[#D4AF37]/35 group-hover:text-[#D4AF37] group-hover:scale-110 transition-all duration-300 pointer-events-none z-10" />

      <div className="relative z-10">
        {/* Rating Stars (5 filled stars) */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(review.rating || 5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-xs transition-transform duration-300 group-hover:scale-105" />
          ))}
        </div>

        {/* Quote Title */}
        <h4 className="font-serif text-sm sm:text-[15px] font-bold text-[#0E2A1B] group-hover:text-[#28543B] mb-2 leading-snug transition-colors line-clamp-1">
          "{review.title || review.content.slice(0, 40) + '...'}"
        </h4>

        {/* Quote Content */}
        <p className="text-xs sm:text-[13px] text-stone-600 group-hover:text-stone-800 leading-relaxed italic transition-colors">
          "{review.content}"
        </p>
      </div>

      {/* Author Details with Verified Badge */}
      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-stone-100 relative z-10">
        <div className="relative">
          <img
            src={review.avatar}
            alt={review.author}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-all duration-300 group-hover:scale-105 shadow-xs"
          />
          {review.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h5 className="font-serif text-xs sm:text-sm font-bold text-[#0E2A1B] truncate">
              {review.author}
            </h5>
          </div>
          <p className="text-[10.5px] sm:text-[11px] text-stone-500 font-medium truncate">
            {review.role} • {review.city}
          </p>
        </div>
      </div>

    </div>
  );
}
