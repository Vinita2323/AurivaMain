import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';


export default function AdminHeader({ onMenuClick, title = "Dashboard" }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E8E2D5] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#0E2A1B]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
          <Search className="w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search orders, SKU, coupons..."
            className="bg-transparent focus:outline-none text-stone-800 text-xs w-44"
          />
        </div>

        <button className="relative p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 hover:text-[#0E2A1B]">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full" />
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
          <div className="w-8 h-8 rounded-full bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs flex items-center justify-center border border-[#D4AF37]">
            AD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#0E2A1B]">Admin Manager</p>
            <p className="text-[10px] text-stone-400">Head Office</p>
          </div>
        </div>
      </div>
    </header>
  );
}
