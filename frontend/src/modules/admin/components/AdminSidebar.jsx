import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, FolderTree, 
  Boxes, Users, Tag, Star, Megaphone, Bell, 
  BarChart3, Settings, ExternalLink, X 
} from 'lucide-react';
import Logo from '../../user/components/Logo';

export default function AdminSidebar({ isOpen, onClose }) {
  const links = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, badge: '256' },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Inventory', path: '/admin/inventory', icon: Boxes },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Coupons', path: '/admin/coupons', icon: Tag, badge: '5' },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Promotions', path: '/admin/promotions', icon: Megaphone },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: '3' },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs" 
          onClick={onClose} 
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0E2A1B] text-[#E8DFC8] border-r border-[#D4AF37]/25 flex flex-col justify-between transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Top Logo & Header */}
        <div>
          <div className="p-5 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#0A2014]">
            <Logo variant="light" size="default" to="/admin" />
            <button onClick={onClose} className="lg:hidden p-1 text-stone-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-3 bg-[#143322] border-b border-[#D4AF37]/15">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
              STORE ADMINISTRATION
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 max-h-[calc(100vh-210px)] overflow-y-auto no-scrollbar">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-md text-[13.5px] sm:text-sm font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#0E2A1B] font-bold shadow-sm'
                        : 'text-[#E8DFC8] hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#1B3B29] text-[#D4AF37]">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Switch to Storefront */}
        <div className="p-4 border-t border-[#D4AF37]/20 bg-[#0A2014]">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#1B3B29] hover:bg-[#28543B] text-[#D4AF37] border border-[#D4AF37]/30 text-xs sm:text-[13px] font-bold uppercase tracking-wider transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public Store</span>
          </Link>
        </div>

      </aside>
    </>
  );
}
