import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, LogOut, MapPin, Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';

const SONIPAT_WAREHOUSE = {
  warehouseName: 'AURIVÁ Warehouse — Sonipat',
  warehouseAddress: 'House no. 1213, Sector 15',
  warehouseCity: 'Sonipat',
  warehouseState: 'Haryana',
  warehousePincode: '131001',
  warehousePhone: '+91 98765 43210',
  hubAddress: 'House no. 1213, Sector 15, Sonipat, Haryana - 131001'
};

export default function AdminProfile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logoutAdmin, settings, updateSettings, refreshSettings } = useAdmin();

  const [profile, setProfile] = useState({
    name: 'Admin Manager',
    role: 'Super Administrator',
    email: 'admin@aurivafoods.com',
    phone: '+91 98765 43210',
    accessLevel: 'Tier 1 Executive Clearance',
    warehouseName: SONIPAT_WAREHOUSE.warehouseName,
    warehouseAddress: SONIPAT_WAREHOUSE.warehouseAddress,
    warehouseCity: SONIPAT_WAREHOUSE.warehouseCity,
    warehouseState: SONIPAT_WAREHOUSE.warehouseState,
    warehousePincode: SONIPAT_WAREHOUSE.warehousePincode,
    warehousePhone: SONIPAT_WAREHOUSE.warehousePhone
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (refreshSettings) refreshSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    const isLegacyIndore =
      settings.warehousePincode === '452015' ||
      (settings.warehouseCity || '').toLowerCase().includes('indore');

    setProfile((prev) => ({
      ...prev,
      phone: settings.warehousePhone || settings.storePhone || prev.phone,
      warehouseName: isLegacyIndore
        ? SONIPAT_WAREHOUSE.warehouseName
        : (settings.warehouseName || SONIPAT_WAREHOUSE.warehouseName),
      warehouseAddress: isLegacyIndore
        ? SONIPAT_WAREHOUSE.warehouseAddress
        : (settings.warehouseAddress || SONIPAT_WAREHOUSE.warehouseAddress),
      warehouseCity: isLegacyIndore
        ? SONIPAT_WAREHOUSE.warehouseCity
        : (settings.warehouseCity || SONIPAT_WAREHOUSE.warehouseCity),
      warehouseState: isLegacyIndore
        ? SONIPAT_WAREHOUSE.warehouseState
        : (settings.warehouseState || SONIPAT_WAREHOUSE.warehouseState),
      warehousePincode: isLegacyIndore
        ? SONIPAT_WAREHOUSE.warehousePincode
        : (settings.warehousePincode || SONIPAT_WAREHOUSE.warehousePincode),
      warehousePhone: isLegacyIndore
        ? SONIPAT_WAREHOUSE.warehousePhone
        : (settings.warehousePhone || prev.phone)
    }));
  }, [settings]);

  const fullAddress = [
    profile.warehouseAddress,
    profile.warehouseCity,
    profile.warehouseState,
    profile.warehousePincode ? `Pincode ${profile.warehousePincode}` : ''
  ].filter(Boolean).join(', ');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setIsSaving(true);
    try {
      const hubAddress = `${profile.warehouseAddress.trim()}, ${profile.warehouseCity.trim()}, ${profile.warehouseState.trim()} - ${String(profile.warehousePincode || '').trim()}`;

      const payload = {
        warehouseName: profile.warehouseName.trim(),
        warehouseAddress: profile.warehouseAddress.trim(),
        warehouseCity: profile.warehouseCity.trim(),
        warehouseState: profile.warehouseState.trim(),
        warehousePincode: String(profile.warehousePincode || '').trim(),
        warehousePhone: profile.warehousePhone.trim() || profile.phone.trim(),
        hubAddress,
        storeAddress: hubAddress,
        storePhone: profile.phone.trim()
      };

      if (updateSettings) {
        await updateSettings(payload);
      }

      // Persist display profile locally for header/name convenience
      try {
        localStorage.setItem(
          'auriva_admin_profile',
          JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone
          })
        );
      } catch (_) { /* ignore */ }

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Could not save pickup address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out of the Admin Console?')) {
      logoutAdmin?.();
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Administrator Profile" />

        <main className="p-4 sm:p-8 space-y-6 max-w-3xl">
          <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs overflow-hidden">
            {/* Page header strip (same brand language as previous modal) */}
            <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center gap-3 border-b border-[#D4AF37]/30">
              <div className="w-11 h-11 rounded-full bg-[#1B3B29] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-md">
                AD
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  ADMINISTRATOR PROFILE
                </span>
                <h2 className="font-sans text-base sm:text-lg font-bold mt-0.5">{profile.name}</h2>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 font-sans">
              {saveSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Profile & pickup address saved. Shiprocket will use this warehouse for pickups.</span>
                </div>
              )}
              {saveError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs sm:text-sm font-semibold border border-rose-200">
                  {saveError}
                </div>
              )}

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

              {/* Identity */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0E2A1B]">
                  <User className="w-3.5 h-3.5" />
                  <span>Account Details</span>
                </div>

                <div>
                  <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
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
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Pickup / warehouse address for Shiprocket */}
              <div className="space-y-3.5 pt-2 border-t border-stone-200">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0E2A1B]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Shipment Pickup Address (Warehouse)</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Couriers pick orders from this address — not the customer delivery address.
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Warehouse / Pickup Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.warehouseName}
                    onChange={(e) => setProfile({ ...profile, warehouseName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Complete Street Address</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.warehouseAddress}
                    onChange={(e) => setProfile({ ...profile, warehouseAddress: e.target.value })}
                    placeholder="House no. 1213, Sector 15"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.warehouseCity}
                      onChange={(e) => setProfile({ ...profile, warehouseCity: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">State</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.warehouseState}
                      onChange={(e) => setProfile({ ...profile, warehouseState: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.warehousePincode}
                      onChange={(e) => setProfile({ ...profile, warehousePincode: e.target.value })}
                      maxLength={6}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Warehouse Phone</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.warehousePhone}
                    onChange={(e) => setProfile({ ...profile, warehousePhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#C89038] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Full pickup address</p>
                    <p className="text-xs sm:text-sm font-semibold text-[#0E2A1B] mt-0.5">{fullAddress}</p>
                  </div>
                </div>
              </div>

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
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-lg bg-[#0E2A1B] text-white hover:bg-[#1B3B29] text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
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
        </main>
      </div>
    </div>
  );
}
