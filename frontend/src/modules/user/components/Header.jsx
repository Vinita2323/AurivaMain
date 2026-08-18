import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu } from 'lucide-react';

import Logo from './Logo';
import SearchModal from './SearchModal';
import MobileDrawer from './MobileDrawer';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About Us', path: '/about' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#0E2A1B]/95 backdrop-blur-md py-2.5 sm:py-3 shadow-xl border-b border-[#D4AF37]/25' 
            : 'bg-[#0E2A1B] py-3 sm:py-4 border-b border-[#D4AF37]/15'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <Logo variant="light" size={isScrolled ? 'default' : 'large'} />
          </div>

          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((item) => {
              const isCurrent = location.pathname + location.search === item.path;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-xs xl:text-sm font-medium tracking-wide transition-all ${
                      (isActive && item.path === location.pathname) || isCurrent
                        ? 'text-[#D4AF37] font-semibold bg-white/5 border border-[#D4AF37]/30'
                        : 'text-[#E8DFC8] hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            {/* Search Icon (All screens) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl text-[#E8DFC8] hover:text-[#D4AF37] hover:bg-white/5 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search healthy snacks"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account Icon (Desktop & Tablet only) */}
            <Link
              to="/account"
              className="hidden md:flex p-2 sm:p-2.5 rounded-xl text-[#E8DFC8] hover:text-[#D4AF37] hover:bg-white/5 transition-all relative min-w-[44px] min-h-[44px] items-center justify-center"
              aria-label="Customer Account"
              title="My Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Wishlist Icon (Visible on all screens) */}
            <Link
              to="/wishlist"
              className="p-2 sm:p-2.5 rounded-xl text-[#E8DFC8] hover:text-[#D4AF37] hover:bg-white/5 transition-all relative min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#D4AF37] text-[#0E2A1B] text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link with badge (Desktop & Tablet only >= md) */}
            <Link
              to="/cart"
              className="hidden md:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-[#1B3B29] hover:bg-[#28543B] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm transition-all group min-h-[44px]"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#D4AF37] text-[#0E2A1B] text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse-gold">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-white group-hover:text-[#D4AF37]">
                Cart
              </span>
            </Link>
          </div>

        </div>
      </header>

      {/* Modals & Slide-out Drawers */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileDrawer isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </>
  );
}
