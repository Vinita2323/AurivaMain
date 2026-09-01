import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ variant = 'dark', size = 'default', to = '/', className = '' }) {
  const sizeClasses = {
    small: 'h-8 sm:h-9',
    default: 'h-10 sm:h-11 md:h-12',
    large: 'h-12 sm:h-14 md:h-16',
  }[size] || 'h-10 sm:h-12';

  return (
    <Link to={to} className={`inline-flex items-center group select-none shrink-0 ${className}`}>
      <img
        src="/AurivaLogo.png"
        alt="Auriva - Elevate Every Bite"
        className={`${sizeClasses} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02] ${
          variant === 'light' ? 'brightness-0 invert' : ''
        }`}
      />
    </Link>
  );
}

