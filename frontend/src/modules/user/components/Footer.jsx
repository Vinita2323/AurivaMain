import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, ArrowUp, ChevronDown } from 'lucide-react';

import Logo from './Logo';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0A2014] text-[#E8DFC8] border-t border-[#D4AF37]/30 pt-10 sm:pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Newsletter Section */}
        <div className="bg-[#143322] border border-[#D4AF37]/30 rounded-3xl p-5 sm:p-8 lg:p-10 mb-10 sm:mb-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                STAY NOURISHED & CONNECTED
              </span>
              <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                Join the <span className="gold-gradient-text">AURIVÁ Circle</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#A2B5A8] max-w-md">
                Get healthy snack inspiration, new seasonal launches, and exclusive member discounts delivered to your inbox.
              </p>
            </div>

            <div className="lg:col-span-6">
              {subscribed ? (
                <div className="p-4 bg-[#0E2A1B] border border-[#D4AF37]/50 rounded-2xl text-center text-[#D4AF37] font-semibold text-xs sm:text-sm animate-in fade-in">
                  🌿 Welcome to the circle! Check your email for a special 20% welcome voucher.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 px-4 py-3 sm:py-3.5 rounded-xl bg-[#091E13] border border-[#D4AF37]/30 text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 sm:py-3.5 rounded-xl gold-gradient-btn font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-102 transition-transform"
                  >
                    <span>Subscribe</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Links - Desktop Grid & Mobile Accordion */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8 py-6 sm:py-8 border-b border-[#D4AF37]/15">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Logo variant="light" size="large" />
            <p className="text-xs text-[#A2B5A8] leading-relaxed max-w-sm">
              AURIVÁ crafts pure, gourmet roasted makhana, rich dry fruits, and nutrient-dense superfood blends to elevate your daily wellness routine with zero compromises.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1B3B29] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0E2A1B] transition-all">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1B3B29] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0E2A1B] transition-all">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1B3B29] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0E2A1B] transition-all">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 1: SHOP (Accordion on Mobile) */}
          <div className="border-t border-[#D4AF37]/15 md:border-t-0 pt-4 md:pt-0">
            <button 
              onClick={() => toggleSection('shop')}
              className="w-full flex items-center justify-between md:cursor-default font-serif text-sm font-bold text-[#D4AF37] uppercase tracking-wider"
            >
              <span>Shop</span>
              <ChevronDown className={`w-4 h-4 md:hidden text-[#D4AF37] transition-transform duration-300 ${openSections['shop'] ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2 text-xs text-[#A2B5A8] pt-3 md:block ${openSections['shop'] ? 'block' : 'hidden md:block'}`}>
              <li><Link to="/shop" className="hover:text-white transition-colors">Roasted Makhana</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Dry Fruits & Nuts</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Seeds & Mixes</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Gifting Combos</Link></li>
            </ul>
          </div>

          {/* Column 2: COMPANY (Accordion on Mobile) */}
          <div className="border-t border-[#D4AF37]/15 md:border-t-0 pt-4 md:pt-0">
            <button 
              onClick={() => toggleSection('company')}
              className="w-full flex items-center justify-between md:cursor-default font-serif text-sm font-bold text-[#D4AF37] uppercase tracking-wider"
            >
              <span>Company</span>
              <ChevronDown className={`w-4 h-4 md:hidden text-[#D4AF37] transition-transform duration-300 ${openSections['company'] ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2 text-xs text-[#A2B5A8] pt-3 md:block ${openSections['company'] ? 'block' : 'hidden md:block'}`}>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/about#purpose" className="hover:text-white transition-colors">Our Story & Purpose</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Why AURIVÁ?</Link></li>
              <li><Link to="/admin" className="hover:text-[#D4AF37] transition-colors font-medium">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Column 3: CUSTOMER CARE (Accordion on Mobile) */}
          <div className="border-t border-[#D4AF37]/15 md:border-t-0 pt-4 md:pt-0">
            <button 
              onClick={() => toggleSection('customer')}
              className="w-full flex items-center justify-between md:cursor-default font-serif text-sm font-bold text-[#D4AF37] uppercase tracking-wider"
            >
              <span>Customer Care</span>
              <ChevronDown className={`w-4 h-4 md:hidden text-[#D4AF37] transition-transform duration-300 ${openSections['customer'] ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2 text-xs text-[#A2B5A8] pt-3 md:block ${openSections['customer'] ? 'block' : 'hidden md:block'}`}>
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/account?tab=orders" className="hover:text-white transition-colors">Orders & Invoices</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link to="/order-tracking/AV10294" className="hover:text-white transition-colors">Track Live Order</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & back-to-top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A2B5A8] text-center sm:text-left">
          <p>© 2024 AURIVÁ India Pvt. Ltd. All Rights Reserved.</p>
          <div className="flex items-center justify-center gap-3 text-[11px] flex-wrap">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
            <span>•</span>
            <Link to="/shipping" className="hover:text-white">Shipping Policy</Link>
            <span>•</span>
            <Link to="/refund" className="hover:text-white">Refund Policy</Link>
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center justify-center gap-1 text-xs text-[#D4AF37] hover:text-white transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
