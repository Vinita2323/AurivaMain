import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, Mail, Phone, MapPin, Key, User, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { logoutAdmin } = useAdmin();

  const [profile, setProfile] = useState({
    name: 'Admin Manager',
    role: 'Super Administrator',
    email: 'admin@aurivafoods.com',
    phone: '+91 98765 43210',
    hub: 'AURIVÁ Central Fulfillment Hub, Indore, MP',
    department: 'Store Operations & Catalog Logistics',
    accessLevel: 'Tier 1 Executive Clearance'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out of the Admin Console?")) {
      logoutAdmin?.();
      onClose();
      navigate('/admin/login');
    }
  };

  return (
    <div 
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs font-sans overflow-y-auto"
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1B3B29] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-md">
              AD
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                ADMINISTRATOR PROFILE
              </span>
              <h3 className="font-sans text-base sm:text-lg font-bold mt-0.5">{profile.name}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 font-sans">
          
          {saveSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {/* Access Badge Card */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <div>
                <p className="text-xs sm:text-[13px] font-bold text-[#0E2A1B]">{profile.role}</p>
                <p className="text-[11px] text-stone-500 font-medium">{profile.accessLevel}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold uppercase border border-emerald-200">
              Active Session
            </span>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Headquarters Location</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.hub}
                onChange={e => setProfile({ ...profile, hub: e.target.value })}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
              />
            </div>

            {/* Actions Bar inside modal */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-200">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Check className="w-4 h-4 text-[#D4AF37]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-xs sm:text-sm font-bold transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
