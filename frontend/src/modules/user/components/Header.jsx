import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, ShoppingCart, Heart } from 'lucide-react';

import Logo from './Logo';
import SearchModal from './SearchModal';
import MobileDrawer from './MobileDrawer';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useAuth } from '../../../context/AuthContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
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
    { name: 'HOME', path: '/' },
    { name: 'SHOP', path: '/shop' },
    { name: 'OUR STORY', path: '/about' },
    { name: 'RECIPES', path: '/recipes' },
    { name: 'CONTACT', path: '/contact' },
  ];

  const isLinkActive = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/' && !location.hash;
    }
    if (itemPath.startsWith('/#')) {
      const hash = itemPath.replace('/', '');
      return location.pathname === '/' && location.hash === hash;
    }
    if (itemPath === '/recipes') {
      return location.pathname.startsWith('/recipes');
    }
    if (itemPath.startsWith('/shop')) {
      return location.pathname === '/shop' || location.pathname.startsWith('/product');
    }
    if (itemPath === '/about') {
      return location.pathname === '/about';
    }
    return location.pathname === itemPath;
  };

  const handleNavClick = (e, item) => {
    if (item.path.startsWith('/#')) {
      const hash = item.path.replace('/#', '');
      if (location.pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `/#${hash}`);
        }
      }
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md py-3 sm:py-3.5 shadow-sm' 
            : 'bg-[#FAF7F2] py-3.5 sm:py-4'
        }`}
      >
        <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Auriva Brand Logo */}
          <div className="flex items-center z-10">
            <Logo variant="dark" size={isScrolled ? 'default' : 'large'} />
          </div>

          {/* Middle: Desktop Navigation Links (Centered) */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {navLinks.map((item) => {
              const active = isLinkActive(item.path);
              return (
                <div key={item.name} className="relative py-1 flex flex-col items-center">
                  <Link
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`text-[12px] xl:text-[13px] font-bold tracking-[0.08em] uppercase transition-colors duration-200 ${
                      active
                        ? 'text-[#C58A2B]'
                        : 'text-[#182019] hover:text-[#C58A2B]'
                    }`}
                  >
                    {item.name}
                  </Link>

                  {/* Active Indicator Underline */}
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#C58A2B] rounded-full mx-auto" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right: Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 justify-end z-10">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:p-2.5 rounded-full text-[#182019] hover:text-[#C58A2B] hover:bg-stone-200/40 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Search healthy snacks"
              title="Search"
            >
              <Search className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
            </button>

            {/* Wishlist Icon with Badge */}
            <Link
              to="/wishlist"
              className="p-2 sm:p-2.5 rounded-full text-[#182019] hover:text-[#C58A2B] hover:bg-stone-200/40 transition-colors relative min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Wishlist"
              title="Saved Snacks"
            >
              <div className="relative">
                <Heart className={`w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8] ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500/20' : ''}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs leading-none">
                    {wishlistCount}
                  </span>
                )}
              </div>
            </Link>

            {/* Shopping Cart Icon with Badge */}
            <Link
              to="/cart"
              className="p-2 sm:p-2.5 rounded-full text-[#182019] hover:text-[#C58A2B] hover:bg-stone-200/40 transition-colors relative min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#C58A2B] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs leading-none">
                    {itemCount}
                  </span>
                )}
              </div>
            </Link>

            {/* Profile / Account Icon */}
            <Link
              to="/account"
              className="p-2 sm:p-2.5 rounded-full text-[#182019] hover:text-[#C58A2B] hover:bg-stone-200/40 transition-colors relative min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label={user ? `Account (${user.name})` : "Customer Account"}
              title={user ? `Account: ${user.name}` : "My Account"}
            >
              <div className="relative flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full object-cover border border-[#D4AF37]"
                  />
                ) : (
                  <User className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
                )}
                {user && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                )}
              </div>
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

