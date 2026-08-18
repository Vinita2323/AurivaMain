import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, LayoutGrid, User, ShoppingCart } from 'lucide-react';
import { useCart } from '../../../context/CartContext';

export default function MobileBottomNav() {
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Check active routes
  const isHome = location.pathname === '/';
  const isShop = location.pathname === '/shop' && !location.search.includes('categories');
  const isCategories = location.pathname === '/shop' && location.search.includes('categories');
  const isAccount = location.pathname.startsWith('/account');
  const isCart = location.pathname.startsWith('/cart');
  const isAccountSubpage = location.pathname === '/account' && location.search.includes('tab=');

  if (isAccountSubpage) {
    return null;
  }

  const handleCategoriesClick = () => {
    navigate('/shop?tab=categories');
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-[#E8E2D5] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2px)' }}
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto px-1">
        
        {/* 1. HOME */}
        <NavLink
          to="/"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isHome ? 'text-[#0E2A1B]' : 'text-[#6B716B] hover:text-[#0E2A1B]'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${isHome ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isHome ? 'font-extrabold text-[#0E2A1B]' : 'font-medium'}`}>
            Home
          </span>
          {isHome && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          )}
        </NavLink>

        {/* 2. SHOP */}
        <NavLink
          to="/shop"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isShop ? 'text-[#0E2A1B]' : 'text-[#6B716B] hover:text-[#0E2A1B]'
          }`}
        >
          <ShoppingBag className={`w-5 h-5 transition-transform ${isShop ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isShop ? 'font-extrabold text-[#0E2A1B]' : 'font-medium'}`}>
            Shop
          </span>
          {isShop && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          )}
        </NavLink>

        {/* 3. CATEGORIES */}
        <button
          onClick={handleCategoriesClick}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isCategories ? 'text-[#0E2A1B]' : 'text-[#6B716B] hover:text-[#0E2A1B]'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 transition-transform ${isCategories ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isCategories ? 'font-extrabold text-[#0E2A1B]' : 'font-medium'}`}>
            Categories
          </span>
          {isCategories && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          )}
        </button>

        {/* 4. ACCOUNT */}
        <NavLink
          to="/account"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isAccount ? 'text-[#0E2A1B]' : 'text-[#6B716B] hover:text-[#0E2A1B]'
          }`}
        >
          <User className={`w-5 h-5 transition-transform ${isAccount ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] tracking-tight mt-0.5 ${isAccount ? 'font-extrabold text-[#0E2A1B]' : 'font-medium'}`}>
            Account
          </span>
          {isAccount && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          )}
        </NavLink>

        {/* 5. CART */}
        <NavLink
          to="/cart"
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isCart ? 'text-[#0E2A1B]' : 'text-[#6B716B] hover:text-[#0E2A1B]'
          }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 transition-transform ${isCart ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#D4AF37] text-[#0E2A1B] text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 ${isCart ? 'font-extrabold text-[#0E2A1B]' : 'font-medium'}`}>
            Cart
          </span>
          {isCart && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          )}
        </NavLink>

      </div>
    </nav>
  );
}
