import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, FolderTree, 
  Boxes, Users, Tag, Star, Megaphone, Bell, 
  BarChart3, Settings, ExternalLink, X, ChefHat, UserCircle
} from 'lucide-react';
import Logo from '../../user/components/Logo';
import { adminDashboardApi, adminNotificationApi } from '../../../utils/api';
import { useAdmin } from '../../../context/AdminContext';

function formatBadge(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 999 ? '999+' : String(n);
}

export default function AdminSidebar({ isOpen, onClose, badges: badgesProp }) {
  const asideRef = useRef(null);
  const navRef = useRef(null);
  const { coupons } = useAdmin();
  const propOrders = badgesProp?.orders;
  const propCoupons = badgesProp?.coupons;
  const propNotifications = badgesProp?.notifications;
  const hasPropBadges = badgesProp != null;
  const [badges, setBadges] = useState({
    orders: propOrders,
    coupons: propCoupons ?? coupons?.length,
    notifications: propNotifications
  });

  // Lenis owns the page wheel — trap it on the sidebar so gentle scroll
  // moves the nav only, never the main admin content.
  useEffect(() => {
    const aside = asideRef.current;
    const nav = navRef.current;
    if (!aside || !nav) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      nav.scrollTop += e.deltaY;
    };

    aside.addEventListener('wheel', onWheel, { passive: false });
    return () => aside.removeEventListener('wheel', onWheel);
  }, []);

  // Prefer parent-provided badges (dashboard); otherwise fetch lightweight counts
  useEffect(() => {
    if (hasPropBadges) {
      setBadges((prev) => ({
        ...prev,
        orders: propOrders ?? prev.orders,
        coupons: propCoupons ?? prev.coupons ?? coupons?.length,
        notifications: propNotifications ?? prev.notifications
      }));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [summaryRes, unreadRes] = await Promise.all([
          adminDashboardApi.getSummary().catch(() => null),
          adminNotificationApi.getUnreadCount().catch(() => null)
        ]);
        if (cancelled) return;
        const quick = summaryRes?.data?.quick || summaryRes?.quick || {};
        const unread =
          unreadRes?.data?.unreadCount ??
          unreadRes?.data?.count ??
          unreadRes?.unreadCount ??
          quick.unreadNotifications;
        setBadges({
          orders: quick.queueCount,
          coupons: quick.couponCount ?? coupons?.length,
          notifications: unread
        });
      } catch {
        if (!cancelled) {
          setBadges((prev) => ({
            ...prev,
            coupons: prev.coupons ?? coupons?.length
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasPropBadges, propOrders, propCoupons, propNotifications, coupons?.length]);

  const links = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart, badge: formatBadge(badges.orders) },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Inventory', path: '/admin/inventory', icon: Boxes },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Coupons', path: '/admin/coupons', icon: Tag, badge: formatBadge(badges.coupons) },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Promotions', path: '/admin/promotions', icon: Megaphone },
    { name: 'Recipes', path: '/admin/recipes', icon: ChefHat },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: formatBadge(badges.notifications) },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Profile', path: '/admin/profile', icon: UserCircle },
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

      <aside
        ref={asideRef}
        data-lenis-prevent
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0E2A1B] text-[#E8DFC8] border-r border-[#D4AF37]/25 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Logo & Header — fixed height */}
        <div className="shrink-0">
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
        </div>

        {/* Navigation — own scroll; wheel never bubbles to main page / Lenis */}
        <nav
          ref={navRef}
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-1 no-scrollbar"
        >
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

        {/* Bottom Switch to Storefront — always visible */}
        <div className="shrink-0 p-4 border-t border-[#D4AF37]/20 bg-[#0A2014]">
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
