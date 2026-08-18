import React, { useEffect } from 'react';
import { 
  X, ChevronRight, Home, ShoppingBag, Heart, MapPin, 
  Gift, LayoutDashboard, Sparkles, Tag, Layers, Nut, Flower2 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import Logo from './Logo';
import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../../context/WishlistContext';

export default function MobileDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const mainNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shop All Snacks', path: '/shop', icon: ShoppingBag },
    { name: 'Roasted Makhana', path: '/shop?category=makhana', icon: Flower2 },
    { name: 'Dry Fruits & Nuts', path: '/shop?category=dry-fruits', icon: Nut },
    { name: 'Gourmet Seeds', path: '/shop?category=seeds', icon: Sparkles },
    { name: 'Gifting Combos', path: '/shop?filter=combos', icon: Layers, badge: 'Popular' },
    { name: 'About Us & Story', path: '/about', icon: Sparkles },
    { name: 'Special Offers', path: '/account?tab=offers', icon: Tag, badge: 'Save' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs bg-[#0E2A1B] text-white shadow-2xl flex flex-col border-r border-[#D4AF37]/30">
          
          {/* Header */}
          <div className="p-4 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0A2014]">
            <Logo variant="light" size="small" />
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Snippet */}
          <div className="p-4 bg-[#143322] border-b border-[#D4AF37]/20">
            <Link 
              to="/account" 
              onClick={onClose}
              className="flex items-center gap-3 group"
            >
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={user?.name}
                className="w-10 h-10 rounded-full border border-[#D4AF37] object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Welcome back</p>
                <h4 className="text-sm font-semibold truncate group-hover:text-[#D4AF37] transition-colors">{user?.name || 'Vini Sharma'}</h4>
                <p className="text-[10px] text-stone-300">{user?.rewardsPoints || 2450} Reward Pts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]/80">Menu</p>
            {mainNav.map((link) => {
              const isActive = location.pathname + location.search === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                    isActive 
                      ? 'bg-[#D4AF37] text-[#0E2A1B] font-bold shadow-md' 
                      : 'text-[#E8DFC8] hover:bg-white/5 hover:text-[#D4AF37]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-[#0E2A1B] text-[#D4AF37]' : 'bg-[#D4AF37] text-[#0E2A1B]'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-3 pb-1 border-t border-[#D4AF37]/20 my-2">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]/80">Quick Shortcuts</p>
              
              <Link
                to="/account?tab=orders"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#E8DFC8] hover:bg-white/5 min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span>My Orders & Tracking</span>
                </div>
              </Link>

              <Link
                to="/wishlist"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#E8DFC8] hover:bg-white/5 min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-[#D4AF37]" />
                  <span>My Wishlist</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="text-xs bg-[#D4AF37] text-[#0E2A1B] font-bold px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/account?tab=rewards"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-[#E8DFC8] hover:bg-white/5 min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                  <span>Loyalty Rewards</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Bottom Switch to Admin */}
          <div className="p-3 bg-[#0A2014] border-t border-[#D4AF37]/20 space-y-2">
            <Link
              to="/admin"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#D4AF37] text-[#0E2A1B] text-xs font-bold uppercase tracking-wider hover:bg-[#E5C358] transition-colors min-h-[44px]"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
            <div className="text-center text-[10px] text-stone-400">
              AURIVÁ Wellness • Naturally Premium
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
