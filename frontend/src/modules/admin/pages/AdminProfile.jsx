import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, LogOut, MapPin, Building2, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';
import { adminAuthApi } from '../../../utils/api';

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
  const {
    logoutAdmin,
    settings,
    updateSettings,
    refreshSettings,
    adminUser,
    updateAdminProfile
  } = useAdmin();

  const [profile, setProfile] = useState({
    name: adminUser?.name || 'Admin Manager',
    role: adminUser?.role === 'ADMIN' ? 'Super Administrator' : (adminUser?.role || 'Super Administrator'),
    email: adminUser?.email || 'admin@aurivafoods.com',
    phone: adminUser?.phone || '',
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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (refreshSettings) refreshSettings();

    (async () => {
      try {
        const res = await adminAuthApi.getProfile();
        const admin = res?.data?.admin;
        if (admin) {
          setProfile((prev) => ({
            ...prev,
            name: admin.name || prev.name,
            email: admin.email || prev.email,
            phone: admin.phone || prev.phone,
            role: admin.role === 'ADMIN' ? 'Super Administrator' : (admin.role || prev.role)
          }));
        }
      } catch (_) { /* keep context defaults */ }
    })();
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    setProfile((prev) => ({
      ...prev,
      name: adminUser.name || prev.name,
      email: adminUser.email || prev.email,
      phone: adminUser.phone || prev.phone
    }));
  }, [adminUser?.name, adminUser?.email, adminUser?.phone]);

  useEffect(() => {
    if (!settings) return;

    const isLegacyIndore =
      settings.warehousePincode === '452015' ||
      (settings.warehouseCity || '').toLowerCase().includes('indore');

    setProfile((prev) => ({
      ...prev,
      phone: prev.phone || settings.warehousePhone || settings.storePhone || prev.phone,
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
        : (settings.warehousePhone || prev.phone || prev.warehousePhone)
    }));
  }, [settings]);

  const fullAddress = [
    profile.warehouseAddress,
    profile.warehouseCity,
    profile.warehouseState,
    profile.warehousePincode ? `Pincode ${profile.warehousePincode}` : ''
  ].filter(Boolean).join(', ');

  const initials = (profile.name || 'AD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'AD';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setIsSaving(true);
    try {
      const hubAddress = `${profile.warehouseAddress.trim()}, ${profile.warehouseCity.trim()}, ${profile.warehouseState.trim()} - ${String(profile.warehousePincode || '').trim()}`;

      if (updateAdminProfile) {
        await updateAdminProfile({
          name: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim()
        });
      }

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

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Enter your current password and a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await adminAuthApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Could not update password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out of the Admin Console?')) {
      logoutAdmin?.();
      navigate('/admin/login');
    }
  };

  const pwdInputClass =
    'w-full px-3.5 py-2 pr-10 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] font-medium bg-white';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Administrator Profile" />

        <main className="p-4 sm:p-8 space-y-6 max-w-3xl">
          <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#0E2A1B] text-white flex items-center justify-between gap-3 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#1B3B29] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                    ADMINISTRATOR PROFILE
                  </span>
                  <h2 className="font-sans text-base sm:text-lg font-bold mt-0.5 truncate">{profile.name}</h2>
                </div>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="shrink-0 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E8DFC8] text-[#0E2A1B] text-xs sm:text-sm font-bold transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSaveError('');
                    }}
                    className="px-3.5 py-2 rounded-lg border border-white/25 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="admin-profile-form"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#E8DFC8] text-[#0E2A1B] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>

            <form id="admin-profile-form" onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 font-sans">
              {saveSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Profile & pickup address saved permanently.</span>
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
                    <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Login Email</label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-[#0E2A1B] disabled:bg-stone-50 disabled:text-stone-700 font-medium"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Used to sign in to the admin console.</p>
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

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#0A2014] text-white border-b border-[#D4AF37]/25 flex items-center gap-2.5">
              <KeyRound className="w-4.5 h-4.5 text-[#D4AF37]" />
              <div>
                <h3 className="text-sm sm:text-base font-bold">Login Credentials</h3>
                <p className="text-[11px] text-[#E8DFC8]/80 mt-0.5">
                  Change the password used to sign in. Login email is updated above under Account Details.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="p-5 sm:p-6 space-y-4 font-sans">
              {passwordSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Password updated. Use the new password next time you sign in.</span>
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs sm:text-sm font-semibold border border-rose-200">
                  {passwordError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Current login email</p>
                <p className="text-sm font-semibold text-[#0E2A1B] mt-0.5">{profile.email}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={pwdInputClass}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    aria-label="Toggle current password visibility"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.next ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className={pwdInputClass}
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((s) => ({ ...s, next: !s.next }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                      aria-label="Toggle new password visibility"
                    >
                      {showPasswords.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-[12.5px] font-bold text-stone-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className={pwdInputClass}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 rounded-lg bg-[#0E2A1B] hover:bg-[#1B3B29] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                  <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
