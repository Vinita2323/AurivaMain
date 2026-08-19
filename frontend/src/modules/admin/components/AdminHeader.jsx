import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminProfileModal from './AdminProfileModal';

export default function AdminHeader({ onMenuClick, title = "Dashboard" }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E2D5] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs font-sans">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-sans text-lg sm:text-xl font-bold text-[#0E2A1B]">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notifications Button */}
          <Link
            to="/admin/notifications"
            className="relative p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 hover:text-[#0E2A1B] hover:bg-stone-100 transition-colors"
            title="View Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full ring-2 ring-white" />
          </Link>

          {/* Interactive Admin Avatar & Profile Button */}
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-stone-200 hover:bg-stone-50 p-1.5 rounded-xl transition-all cursor-pointer group text-left"
            title="Open Admin Profile"
          >
            <div className="w-8.5 h-8.5 rounded-full bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs flex items-center justify-center border border-[#D4AF37] group-hover:scale-105 transition-transform shadow-2xs">
              AD
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs sm:text-[13px] font-bold text-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors leading-tight">Admin Manager</p>
              <p className="text-[11px] text-stone-400 font-medium">Head Office</p>
            </div>
          </button>
        </div>
      </header>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
