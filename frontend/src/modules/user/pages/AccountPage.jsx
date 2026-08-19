import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Package, MapPin, Gift, Tag, CreditCard, Heart, User,
  LogOut, ChevronRight, ArrowRight, Copy, Check, Plus, 
  Edit3, Trash2, CheckCircle2, ShieldCheck, X, Sparkles, Lock,
  ArrowLeft, ChevronLeft
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useAdmin } from '../../../context/AdminContext';

export default function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = rawTab || 'orders';
  const isMobileMenu = !rawTab; // When no ?tab= param on mobile, show the vertical menu
  const navigate = useNavigate();

  const { coupons: INITIAL_COUPONS } = useAdmin();

  const { 
    user, 
    orders, 
    addresses, 
    selectedAddressId, 
    setSelectedAddressId, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setPrimaryAddress 
  } = useAuth();

  const { wishlistCount } = useWishlist();
  
  const [copiedCoupon, setCopiedCoupon] = useState('');

  // Address Modal State (Add or Edit)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrName, setAddrName] = useState(user?.name || '');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '');
  const [addrType, setAddrType] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Madhya Pradesh');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrIsPrimary, setAddrIsPrimary] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || 'Vini Sharma');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '9876543210');
  const [profileSaved, setProfileSaved] = useState(false);

  // Block background scrolling when modal is open
  useEffect(() => {
    if (isAddressModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddressModalOpen]);

  // Synchronize tabs
  useEffect(() => {
    if (rawTab === 'wishlist') {
      navigate('/wishlist');
    }
  }, [rawTab, navigate]);

  const setTab = (tabName) => {
    if (tabName === 'wishlist') {
      navigate('/wishlist');
    } else {
      setSearchParams({ tab: tabName });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToMenu = () => {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(''), 2000);
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddrName(user?.name || 'Vini Sharma');
    setAddrPhone(user?.phone || '9876543210');
    setAddrType('Home');
    setAddrStreet('');
    setAddrCity('Indore');
    setAddrState('Madhya Pradesh');
    setAddrPincode('');
    setAddrIsPrimary(addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddrName(addr.name || user?.name || '');
    setAddrPhone(addr.phone || user?.phone || '');
    setAddrType(addr.type || 'Home');
    setAddrStreet(addr.street || '');
    setAddrCity(addr.city || 'Indore');
    setAddrState(addr.state || 'Madhya Pradesh');
    setAddrPincode(addr.pincode || '');
    setAddrIsPrimary(selectedAddressId === addr.id || addr.isDefault);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim() || !addrPincode.trim()) return;

    const payload = {
      name: addrName.trim(),
      phone: addrPhone.trim(),
      type: addrType,
      street: addrStreet.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      pincode: addrPincode.trim(),
      isDefault: addrIsPrimary
    };

    if (editingAddressId) {
      updateAddress(editingAddressId, payload);
      if (addrIsPrimary) {
        setPrimaryAddress(editingAddressId);
      }
    } else {
      const newId = addAddress(payload);
      if (addrIsPrimary) {
        setPrimaryAddress(newId);
      }
    }

    setIsAddressModalOpen(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Complete List of Account Navigation Tabs
  const accountTabs = [
    { 
      id: 'orders', 
      label: 'My Orders', 
      desc: 'Track live orders & past invoices', 
      icon: Package, 
      badge: orders.length 
    },
    { 
      id: 'addresses', 
      label: 'Saved Addresses', 
      desc: 'Delivery addresses & preferences', 
      icon: MapPin, 
      badge: addresses.length 
    },
    { 
      id: 'rewards', 
      label: 'Loyalty Rewards', 
      desc: 'Tier benefits & point redemption', 
      icon: Gift, 
      badge: `${user?.rewardsPoints || 2475} pts` 
    },
    { 
      id: 'offers', 
      label: 'Offers & Coupons', 
      desc: 'Exclusive discount vouchers', 
      icon: Tag, 
      badge: INITIAL_COUPONS.length 
    },
    { 
      id: 'wishlist', 
      label: 'My Wishlist', 
      desc: 'Saved healthy favorites', 
      icon: Heart, 
      badge: wishlistCount || undefined 
    },
    { 
      id: 'cards', 
      label: 'Saved Payment Cards', 
      desc: 'Quick checkout payment methods', 
      icon: CreditCard 
    },
    { 
      id: 'profile', 
      label: 'Profile & Security', 
      desc: 'Personal details & password', 
      icon: User 
    },
  ];

  const currentTabObj = accountTabs.find(t => t.id === activeTab) || accountTabs[0];

  return (
    <div className={`min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] font-sans ${
      !isMobileMenu ? 'pb-8 md:pb-12' : 'pb-24 md:pb-12'
    }`}>
      <AnnouncementBar />
      <Header />

      <main className="py-4 sm:py-8 md:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Welcome Banner: Hidden on mobile when inside a subpage */}
        <div className={`bg-[#0E2A1B] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 text-white border border-[#D4AF37]/30 shadow-xl mb-4 sm:mb-6 flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 relative overflow-hidden ${
          !isMobileMenu ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="flex items-center gap-3 sm:gap-4 relative z-10 w-full sm:w-auto">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt={user?.name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-2xl font-bold tracking-tight text-white truncate">
                  Welcome back, {user?.name?.split(' ')[0] || 'Vini'} 👋
                </h1>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0E2A1B] uppercase tracking-wider whitespace-nowrap">
                  {user?.tier || 'Gold Member'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#A2B5A8] mt-0.5 truncate font-normal">
                {user?.email} • {user?.phone}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between sm:justify-end gap-3 bg-[#143322] px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-[#D4AF37]/20 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold block">Wellness Points</span>
              <p className="text-base sm:text-xl font-extrabold text-white tracking-tight">{user?.rewardsPoints || 2475} pts</p>
            </div>
            <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37] shrink-0" />
          </div>
        </div>

        {/* MOBILE VERTICAL MENU (Shown on Mobile when no tab is selected) */}
        {isMobileMenu && (
          <div className="lg:hidden space-y-2 mb-6 animate-fadeIn font-sans">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 px-1 mb-2">
              Account Menu
            </p>
            {accountTabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs active:bg-stone-50 transition-all text-left group min-h-[54px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#D4AF37]/30 flex items-center justify-center text-[#0E2A1B] group-hover:bg-[#0E2A1B] group-hover:text-[#D4AF37] transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0E2A1B] group-hover:text-[#C89038] transition-colors">
                        {item.label}
                      </h4>
                      <p className="text-[10.5px] text-stone-500 font-normal">{item.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-stone-200 text-[#0E2A1B]">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}

            {/* Mobile Logout Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  alert("Logged out of customer session.");
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-rose-200 text-rose-600 font-bold text-xs shadow-xs active:bg-rose-50 min-h-[48px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* MOBILE SUB-PAGE BACK BUTTON (Shown on Mobile when a tab is active) */}
        {!isMobileMenu && (
          <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-2.5 rounded-2xl border border-[#E8E2D5] shadow-xs font-sans">
            <button
              onClick={handleBackToMenu}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0E2A1B] hover:text-[#C89038] py-1 px-2 rounded-xl active:bg-stone-100 min-h-[36px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Account Menu</span>
            </button>
            <span className="text-[11px] font-bold text-[#C89038] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
              {currentTabObj.label}
            </span>
          </div>
        )}

        {/* 2-Column Account Layout (Desktop always displays sidebar + tab content; Mobile displays tab content only when tab is selected) */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start font-sans ${isMobileMenu ? 'hidden lg:grid' : 'grid'}`}>
          
          {/* LEFT: Dark Green Sidebar (Desktop only >= 1024px) */}
          <aside className="hidden lg:block lg:col-span-3 bg-[#0E2A1B] text-[#E8DFC8] rounded-3xl p-4 sm:p-5 border border-[#D4AF37]/30 shadow-xl space-y-1 sticky top-24">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Account Dashboard</p>
            
            {accountTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#0E2A1B] font-bold shadow-md'
                      : 'text-[#E8DFC8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-[#0E2A1B] text-[#D4AF37]' : 'bg-[#1B3B29] text-[#D4AF37]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 border-t border-[#D4AF37]/20 mt-3">
              <button
                onClick={() => {
                  alert("Logged out of customer session.");
                  navigate('/');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-white/5 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* RIGHT: Active Tab Content Area */}
          <section className="lg:col-span-9 space-y-4 sm:space-y-6">
            
            {/* 1. ORDERS TAB (Default) */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E8E2D5] shadow-xs space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3 sm:pb-4">
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#0E2A1B]">
                      My Orders & Past Shipments ({orders.length})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">Track live deliveries and view invoice history.</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-stone-200 bg-[#FAF7F2] space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0E2A1B]">Order #{ord.id}</span>
                            <span className="text-xs text-stone-500">• {ord.date}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">Payment: {ord.paymentMethod} • Total: <strong className="text-stone-900">₹{ord.total}</strong></p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.status}
                          </span>
                          <Link
                            to={`/order-tracking/${ord.id}`}
                            className="px-3 py-1.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                          >
                            Live Track
                          </Link>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {(ord.items || []).map((item, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-stone-200">
                            <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-stone-500">{item.weight} • Qty {item.qty}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. REWARDS TAB */}
            {activeTab === 'rewards' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E8E2D5] shadow-xs space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3 sm:pb-4">
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#0E2A1B]">Loyalty Points & Rewards</h3>
                    <p className="text-xs text-stone-500">Earn 10 points on every ₹100 spent.</p>
                  </div>
                  <div className="bg-[#0E2A1B] text-[#D4AF37] px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm">
                    {user?.rewardsPoints || 2475} Points
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active Perk</span>
                    <h4 className="text-sm sm:text-base font-bold text-[#0E2A1B]">Free Express Shipping</h4>
                    <p className="text-xs text-stone-600">Automatic zero delivery charges on all snack refills.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Redeem Voucher</span>
                    <h4 className="text-sm sm:text-base font-bold text-[#0E2A1B]">₹200 Off Coupon</h4>
                    <p className="text-xs text-stone-600">Redeem 2,000 points for an instant ₹200 wallet voucher.</p>
                    <button className="mt-2 px-3.5 py-1.5 bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold rounded-lg uppercase shadow-xs">
                      Redeem Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. OFFERS & COUPONS TAB */}
            {activeTab === 'offers' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E8E2D5] shadow-xs space-y-4 sm:space-y-6 animate-fadeIn">
                <h3 className="text-base sm:text-xl font-bold text-[#0E2A1B] border-b border-stone-200 pb-3 sm:pb-4">
                  Available Coupons & Vouchers ({INITIAL_COUPONS.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {INITIAL_COUPONS.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl border-2 border-dashed border-[#D4AF37]/60 bg-[#FAF7F2] flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-base font-extrabold text-[#0E2A1B] tracking-wider">{c.code}</span>
                        <p className="text-xs text-stone-600 mt-0.5 font-medium">{c.description}</p>
                        <p className="text-[10px] text-stone-400 mt-1">Valid till: {c.validity}</p>
                      </div>
                      <button
                        onClick={() => handleCopyCoupon(c.code)}
                        className="px-3 py-1.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold flex items-center gap-1 shrink-0 min-h-[36px]"
                      >
                        {copiedCoupon === c.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCoupon === c.code ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E8E2D5] shadow-xs space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3 sm:pb-4">
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#0E2A1B]">Saved Delivery Addresses</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Manage your delivery locations and set your primary address.</p>
                  </div>

                  <button
                    onClick={openAddAddressModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs font-bold uppercase tracking-wider transition-all shadow-sm min-h-[40px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="py-8 text-center text-stone-500 space-y-3">
                    <MapPin className="w-8 h-8 mx-auto text-stone-300" />
                    <p className="text-sm font-bold text-[#0E2A1B]">No saved addresses yet</p>
                    <button
                      onClick={openAddAddressModal}
                      className="px-4 py-2 rounded-xl bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase tracking-wider"
                    >
                      + Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {addresses.map((addr) => {
                      const isPrimary = selectedAddressId === addr.id || addr.isDefault;
                      return (
                        <div 
                          key={addr.id} 
                          className={`p-4 rounded-2xl border-2 transition-all duration-300 relative flex flex-col justify-between ${
                            isPrimary 
                              ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-md ring-2 ring-[#D4AF37]/40' 
                              : 'border-stone-200 bg-white hover:border-stone-400 shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                  isPrimary ? 'bg-[#0E2A1B] text-[#D4AF37]' : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {addr.type}
                                </span>
                                {isPrimary && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>Primary</span>
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setPrimaryAddress(addr.id)}
                                className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                  isPrimary ? 'text-[#0E2A1B]' : 'text-stone-400 hover:text-[#0E2A1B]'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isPrimary ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                                }`}>
                                  {isPrimary && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                                </div>
                                <span className="text-[11px]">{isPrimary ? 'Primary' : 'Set Primary'}</span>
                              </button>
                            </div>

                            <h4 className="font-bold text-sm text-[#0E2A1B]">
                              {addr.name || user?.name}
                            </h4>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed font-normal">
                              {addr.street}, {addr.city}, {addr.state} - <strong className="text-stone-900 font-bold">{addr.pincode}</strong>
                            </p>
                            <p className="text-[11px] text-stone-500 mt-1.5 font-medium">
                              📞 {addr.phone || user?.phone}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => openEditAddressModal(addr)}
                              className="text-xs font-bold text-[#0E2A1B] hover:text-[#C89038] flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {addresses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this address?")) {
                                    deleteAddress(addr.id);
                                  }
                                }}
                                className="text-xs font-bold text-stone-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. SAVED CARDS TAB */}
            {activeTab === 'cards' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E8E2D5] shadow-xs space-y-4 animate-fadeIn">
                <h3 className="text-base sm:text-xl font-bold text-[#0E2A1B] border-b border-stone-200 pb-3">
                  Saved Payment Cards
                </h3>

                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-[#0E2A1B] to-[#1B3B29] text-white max-w-sm border border-[#D4AF37]/40 shadow-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">AURIVÁ Preferred Card</span>
                    <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <p className="font-mono text-base tracking-widest pt-2">•••• •••• •••• 4289</p>
                  <div className="flex justify-between text-xs text-[#A2B5A8]">
                    <span>{user?.name?.toUpperCase() || 'VINI SHARMA'}</span>
                    <span>EXP 08/28</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. PROFILE & SECURITY TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E8E2D5] shadow-xs space-y-4 animate-fadeIn">
                <h3 className="text-base sm:text-xl font-bold text-[#0E2A1B] border-b border-stone-200 pb-3">
                  Profile & Account Settings
                </h3>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || 'vini.sharma@gmail.com'}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-100 text-stone-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:bg-[#1B3B29] transition-colors shadow-sm min-h-[44px]"
                  >
                    {profileSaved ? 'Saved Successfully ✓' : 'Update Profile'}
                  </button>
                </form>
              </div>
            )}

          </section>

        </div>

      </main>

      {/* ADD / EDIT ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
          <form 
            onSubmit={handleSaveAddress} 
            className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full border border-[#E8E2D5] shadow-2xl space-y-3.5 max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-base sm:text-lg font-bold text-[#0E2A1B]">
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Type Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0E2A1B] mb-1">
                Address Type
              </label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddrType(type)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      addrType === type 
                        ? 'bg-[#0E2A1B] text-[#D4AF37] border-[#0E2A1B] shadow-xs' 
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Recipient Name</label>
                <input
                  required
                  type="text"
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  placeholder="e.g. Vini Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Phone</label>
                <input
                  required
                  type="tel"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Flat / House No., Building, Street</label>
              <textarea
                required
                rows={2}
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="e.g. Flat 304, Green Heights, 5th Main Road"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>

            {/* City, State & Pincode */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                <input
                  required
                  type="text"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="e.g. Indore"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode</label>
                <input
                  required
                  type="text"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  placeholder="e.g. 452001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
            </div>

            {/* Set as Primary Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={addrIsPrimary}
                onChange={(e) => setAddrIsPrimary(e.target.checked)}
                className="w-4 h-4 text-[#0E2A1B] accent-[#0E2A1B] rounded"
              />
              <span className="text-xs font-medium text-stone-700">Set as my primary delivery address</span>
            </label>

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-2.5 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-1/2 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase rounded-xl hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase rounded-xl hover:bg-[#1B3B29] shadow-md transition-colors"
              >
                {editingAddressId ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
}
