import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Check, CreditCard, ShieldCheck, Smartphone, Building2, 
  Wallet, Plus, ArrowRight, Truck, Sparkles, ShoppingBag, 
  Lock, ArrowLeft, ChevronRight, CheckCircle2, Clock, 
  Tag, Gift, AlertCircle, Percent, Flame
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    subtotal, 
    discountAmount, 
    deliveryFee, 
    tax, 
    total, 
    appliedCoupon, 
    applyCoupon,
    removeCoupon,
    clearCart,
    updateQty
  } = useCart();
  
  const { user, addresses, selectedAddressId, setSelectedAddressId, addAddress, placeOrder } = useAuth();

  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Delivery, 3: Payment
  const [name, setName] = useState(user?.name || 'Vini Sharma');
  const [mobile, setMobile] = useState(user?.phone || '9876543210');
  const [email, setEmail] = useState(user?.email || 'vini.sharma@gmail.com');

  const [deliveryMethod, setDeliveryMethod] = useState('quick'); // 'quick' or 'standard'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'cod', 'netbanking'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isOrderPlacing, setIsOrderPlacing] = useState(false);

  // New Address Form State
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState] = useState('Madhya Pradesh');
  const [newPincode, setNewPincode] = useState('');
  const [newType, setNewType] = useState('Home');

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Block background scroll when address modal is open
  useEffect(() => {
    if (isAddAddressOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddAddressOpen]);

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (newStreet && newCity && newPincode) {
      const newId = addAddress({
        type: newType,
        street: newStreet,
        city: newCity,
        state: newState || 'Madhya Pradesh',
        pincode: newPincode,
        phone: mobile,
        name: name
      });
      setSelectedAddressId(newId);
      setIsAddAddressOpen(false);
      setNewStreet('');
      setNewCity('');
      setNewPincode('');
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) return;
    const res = applyCoupon(couponCodeInput.trim().toUpperCase());
    if (!res.success) {
      setCouponError(res.message || 'Invalid coupon code');
    } else {
      setCouponCodeInput('');
    }
  };

  const handlePlaceOrder = () => {
    setIsOrderPlacing(true);
    setTimeout(() => {
      const orderPayload = {
        items: cartItems,
        subtotal,
        discount: discountAmount,
        couponApplied: appliedCoupon?.code,
        deliveryFee,
        tax,
        total,
        paymentMethod: paymentMethod === 'upi' ? `UPI (${selectedUpiApp.toUpperCase()})` : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery',
        deliveryType: deliveryMethod === 'quick' ? 'Hyperlocal Quick Delivery' : 'Standard Express',
        address: selectedAddress
      };

      const newOrderId = placeOrder(orderPayload);
      clearCart();
      setIsOrderPlacing(false);
      navigate(`/order-tracking/${newOrderId}`);
    }, 1200);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] font-sans">
        <AnnouncementBar />
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#0E2A1B]/5 border border-[#D4AF37]/30 flex items-center justify-center text-[#C89038] mb-4 sm:mb-6 shadow-sm">
            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0E2A1B]">Your Cart is Empty</h2>
          <p className="text-stone-600 text-xs sm:text-sm mt-1.5 sm:mt-2 mb-6 sm:mb-8 max-w-md mx-auto">
            You don't have any healthy snacks in your cart to checkout yet.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] font-bold text-xs uppercase tracking-wider transition-all shadow-md min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Snacks</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-28 md:pb-12 font-sans">
      <AnnouncementBar />
      <Header />

      <main className="py-3 sm:py-8 md:py-12 max-w-[1450px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Secure Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-8 pb-2.5 sm:pb-4 border-b border-[#E8E2D5]">
          <div>
            <nav className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-stone-500 font-medium mb-0.5 sm:mb-1">
              <Link to="/" className="hover:text-[#0E2A1B] transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <Link to="/shop" className="hover:text-[#0E2A1B] transition-colors">Shop</Link>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[#0E2A1B] font-bold">Secure Checkout</span>
            </nav>
            <h1 className="font-serif text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E2A1B] tracking-tight">
              Checkout & Fast Dispatch
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-[#E8E2D5] shadow-xs self-start sm:self-auto">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#0E2A1B] leading-tight">256-Bit SSL Encrypted</p>
              <p className="text-[8.5px] sm:text-[9.5px] text-stone-500">100% Safe & Verified</p>
            </div>
          </div>
        </div>

        {/* Top Animated Progress Stepper */}
        <div className="max-w-3xl mx-auto mb-5 sm:mb-10 px-2 sm:px-0">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute top-4 sm:top-1/2 left-0 right-0 h-1 bg-stone-200 -translate-y-1/2 z-0 rounded-full" />
            {/* Progress Fill */}
            <div 
              className="absolute top-4 sm:top-1/2 left-0 h-1 bg-[#0E2A1B] -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />

            {[
              { step: 1, title: 'Address', desc: 'Where to deliver' },
              { step: 2, title: 'Delivery', desc: 'Choose speed' },
              { step: 3, title: 'Payment', desc: 'UPI, Card, COD' }
            ].map((s) => {
              const isPassed = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div key={s.step} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => s.step < currentStep && setCurrentStep(s.step)}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm sm:shadow-md ${
                    isPassed 
                      ? 'bg-[#0E2A1B] text-[#D4AF37]' 
                      : isCurrent 
                      ? 'bg-[#D4AF37] text-[#0E2A1B] ring-2 sm:ring-4 ring-[#0E2A1B]/20 scale-105 sm:scale-110' 
                      : 'bg-white text-stone-400 border border-stone-300'
                  }`}>
                    {isPassed ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" /> : s.step}
                  </div>
                  <span className={`text-[10.5px] sm:text-xs font-bold mt-1.5 sm:mt-2 transition-colors ${isCurrent ? 'text-[#0E2A1B]' : 'text-stone-500'}`}>
                    {s.title}
                  </span>
                  <span className="hidden sm:block text-[10px] text-stone-400">{s.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          
          {/* LEFT: Dynamic Step Forms (Animated Container) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* STEP 1: Customer Contact & Delivery Address */}
            <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border transition-all duration-300 ${
              currentStep === 1 
                ? 'border-[#0E2A1B] shadow-md ring-1 ring-[#0E2A1B]/10' 
                : 'border-[#E8E2D5] shadow-xs opacity-90'
            }`}>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 sm:pb-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[11px] sm:text-xs font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B]">Delivery Address & Contact</h2>
                    <p className="text-[10px] sm:text-[11px] text-stone-500">Provide shipping details for fast dispatch</p>
                  </div>
                </div>
                {currentStep > 1 && (
                  <button 
                    onClick={() => setCurrentStep(1)} 
                    className="text-xs text-[#C89038] font-bold hover:underline px-2.5 py-1 bg-[#FAF7F2] rounded-lg border border-[#E8E2D5]"
                  >
                    Change
                  </button>
                )}
              </div>

              {currentStep === 1 ? (
                <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                  {/* Contact Info Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-[#0E2A1B] mb-1">Recipient Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#0E2A1B] bg-stone-50 focus:bg-white transition-colors"
                        placeholder="e.g. Vini Sharma"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-[#0E2A1B] mb-1">Mobile Number</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#0E2A1B] bg-stone-50 focus:bg-white transition-colors"
                          placeholder="10-digit phone number"
                        />
                        <div className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 shrink-0 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>OTP Verified</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] sm:text-xs font-bold text-[#0E2A1B] mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#0E2A1B] bg-stone-50 focus:bg-white transition-colors"
                        placeholder="vini.sharma@gmail.com"
                      />
                    </div>
                  </div>

                  {/* Saved Addresses List */}
                  <div className="pt-3 sm:pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                      <label className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#0E2A1B]">
                        Select Delivery Address
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddAddressOpen(true)}
                        className="text-[11px] sm:text-xs text-[#0E2A1B] hover:text-[#D4AF37] font-bold flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#0E2A1B] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C89038]" /> 
                        <span>Add Address</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 relative ${
                              isSelected
                                ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs'
                                : 'border-stone-200 bg-white hover:border-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                              <span className="text-[9.5px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#0E2A1B] text-[#D4AF37] uppercase tracking-wider">
                                {addr.type}
                              </span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-xs font-bold text-[#0E2A1B]">{addr.name}</p>
                            <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                              {addr.street}, {addr.city} - {addr.pincode}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1 font-medium">📞 {addr.phone}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="pt-2 sm:pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all group min-h-[42px]"
                    >
                      <span>Proceed to Delivery</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-600 flex items-center justify-between bg-[#FAF7F2] p-2.5 sm:p-3 rounded-xl">
                  <div>
                    <span className="font-bold text-[#0E2A1B]">{selectedAddress?.name}</span> • {selectedAddress?.street}, {selectedAddress?.city} ({selectedAddress?.pincode})
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                </div>
              )}
            </div>

            {/* STEP 2: Delivery Speed & Method */}
            <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border transition-all duration-300 ${
              currentStep === 2 
                ? 'border-[#0E2A1B] shadow-md ring-1 ring-[#0E2A1B]/10' 
                : 'border-[#E8E2D5] shadow-xs opacity-90'
            }`}>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 sm:pb-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[11px] sm:text-xs font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B]">Delivery Speed & Method</h2>
                    <p className="text-[10px] sm:text-[11px] text-stone-500">Pick standard express or ultrafast dispatch</p>
                  </div>
                </div>
                {currentStep > 2 && (
                  <button 
                    onClick={() => setCurrentStep(2)} 
                    className="text-xs text-[#C89038] font-bold hover:underline px-2.5 py-1 bg-[#FAF7F2] rounded-lg border border-[#E8E2D5]"
                  >
                    Change
                  </button>
                )}
              </div>

              {currentStep === 2 ? (
                <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    
                    {/* Quick Hyperlocal Option */}
                    <div
                      onClick={() => setDeliveryMethod('quick')}
                      className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 relative ${
                        deliveryMethod === 'quick'
                          ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#0E2A1B]">Hyperlocal Quick Dispatch</span>
                            <p className="text-[9.5px] sm:text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> ETA 25 - 40 Mins
                            </p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          deliveryMethod === 'quick' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {deliveryMethod === 'quick' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed">
                        Packed in temperature-monitored dark stores and delivered directly to your doorstep.
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                        <span className="text-[10.5px] sm:text-[11px] font-bold text-[#0E2A1B]">Delivery Charge:</span>
                        <span className="text-[11px] sm:text-xs font-extrabold text-emerald-700">FREE on orders above ₹499</span>
                      </div>
                    </div>

                    {/* Standard National Courier Option */}
                    <div
                      onClick={() => setDeliveryMethod('standard')}
                      className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 relative ${
                        deliveryMethod === 'standard'
                          ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-[#0E2A1B] flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C89038]" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#0E2A1B]">Express Air Courier</span>
                            <p className="text-[9.5px] sm:text-[10px] text-stone-500 font-medium">1 - 2 Business Days</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          deliveryMethod === 'standard' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {deliveryMethod === 'standard' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed">
                        Shipped via priority courier with live SMS & WhatsApp tracking updates.
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                        <span className="text-[10.5px] sm:text-[11px] font-bold text-[#0E2A1B]">Delivery Charge:</span>
                        <span className="text-[11px] sm:text-xs font-extrabold text-emerald-700">FREE</span>
                      </div>
                    </div>

                  </div>

                  <div className="pt-2 sm:pt-4 flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-stone-600 hover:text-[#0E2A1B] flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all group min-h-[42px]"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : currentStep > 2 ? (
                <div className="text-xs text-stone-600 flex items-center justify-between bg-[#FAF7F2] p-2.5 sm:p-3 rounded-xl">
                  <div>
                    <span className="font-bold text-[#0E2A1B]">
                      {deliveryMethod === 'quick' ? 'Hyperlocal Quick Dispatch (25-40 Mins)' : 'Express Air Courier (1-2 Days)'}
                    </span>
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Complete address step to select delivery speed.</p>
              )}
            </div>

            {/* STEP 3: Payment Method & Place Order */}
            <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border transition-all duration-300 ${
              currentStep === 3 
                ? 'border-[#0E2A1B] shadow-md ring-1 ring-[#0E2A1B]/10' 
                : 'border-[#E8E2D5] shadow-xs opacity-90'
            }`}>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 sm:pb-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[11px] sm:text-xs font-extrabold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B]">Select Payment Option</h2>
                    <p className="text-[10px] sm:text-[11px] text-stone-500">Choose your preferred payment method</p>
                  </div>
                </div>
              </div>

              {currentStep === 3 ? (
                <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                  
                  {/* Payment Options List */}
                  <div className="space-y-2.5 sm:space-y-3">
                    
                    {/* UPI Option */}
                    <div 
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'upi' ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-3.5">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-[#0E2A1B]">UPI Instant Payment</span>
                            <p className="text-[10px] sm:text-[11px] text-stone-500">Google Pay, PhonePe, Paytm, BHIM</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'upi' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {paymentMethod === 'upi' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>

                      {paymentMethod === 'upi' && (
                        <div className="mt-3 pt-2.5 border-t border-stone-200 flex flex-wrap gap-1.5 sm:gap-2 animate-fadeIn">
                          {[
                            { id: 'gpay', name: 'Google Pay' },
                            { id: 'phonepe', name: 'PhonePe' },
                            { id: 'paytm', name: 'Paytm' },
                            { id: 'bhim', name: 'BHIM UPI' }
                          ].map(app => (
                            <button
                              key={app.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUpiApp(app.id);
                              }}
                              className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border transition-all ${
                                selectedUpiApp === app.id
                                  ? 'bg-[#0E2A1B] text-[#D4AF37] border-[#0E2A1B] shadow-xs'
                                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                              }`}
                            >
                              {app.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Credit / Debit Card Option */}
                    <div 
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'card' ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-3.5">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-[#0E2A1B] flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#C89038]" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-[#0E2A1B]">Credit / Debit Card</span>
                            <p className="text-[10px] sm:text-[11px] text-stone-500">Visa, Mastercard, RuPay, Amex</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'card' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {paymentMethod === 'card' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div 
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'cod' ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 sm:gap-3.5">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-[#0E2A1B]">Cash / UPI on Delivery</span>
                            <p className="text-[10px] sm:text-[11px] text-stone-500">Pay at doorstep via Cash or QR</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'cod' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {paymentMethod === 'cod' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Actions & Place Order Trigger */}
                  <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-bold text-stone-600 hover:text-[#0E2A1B] flex items-center gap-1 self-start sm:self-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Delivery
                    </button>

                    <button
                      type="button"
                      disabled={isOrderPlacing}
                      onClick={handlePlaceOrder}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C358] to-[#C89038] text-[#0E2A1B] font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      {isOrderPlacing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0E2A1B] border-t-transparent rounded-full animate-spin" />
                          <span>Processing Order...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-[#0E2A1B]" />
                          <span>CONFIRM & PAY ₹{total}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Select address and delivery speed to proceed with payment.</p>
              )}
            </div>

          </div>

          {/* RIGHT: Live Order Summary Card */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 sticky top-24">
            
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#E8E2D5] shadow-xs space-y-3.5 sm:space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 sm:pb-3">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#C89038]" />
                  <span>Order Summary</span>
                </h3>
                <span className="text-[11px] sm:text-xs font-bold text-[#D4AF37] bg-[#0E2A1B] px-2 py-0.5 sm:px-2.5 rounded-full">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-44 sm:max-h-56 overflow-y-auto divide-y divide-stone-100 pr-1 space-y-1.5">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.weight}`} className="pt-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={item.image} 
                        alt="" 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover border border-[#E8E2D5] bg-[#FAF7F2] shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#0E2A1B] truncate">{item.name}</p>
                        <p className="text-[9.5px] sm:text-[10px] text-stone-500">{item.weight} • Qty: {item.qty}</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#0E2A1B] shrink-0 ml-2">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-stone-100">
                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 sm:p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                      <div>
                        <span className="font-bold text-emerald-900">{appliedCoupon.code}</span>
                        <p className="text-[9.5px] sm:text-[10px] text-emerald-700">Applied (₹{discountAmount} OFF)</p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[10.5px] sm:text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        placeholder="Enter Promo / Voucher"
                        className="flex-1 px-3 py-1.5 sm:py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#0E2A1B] uppercase tracking-wider bg-stone-50 font-bold text-[#0E2A1B]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0E2A1B] text-[#D4AF37] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#1B3B29] transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-rose-600 font-medium">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 text-xs pt-2.5 sm:pt-3 border-t border-stone-100">
                <div className="flex justify-between text-stone-600">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-stone-800">₹{subtotal}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Savings</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Shipping / Delivery</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Estimated Taxes (5%)</span>
                  <span>₹{tax}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2.5 sm:pt-3 border-t border-dashed border-stone-200 text-sm font-bold text-[#0E2A1B]">
                  <span className="text-sm sm:text-base font-serif">Total Payable</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#0E2A1B]">₹{total}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-stone-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
                  <span>100% Genuine Ayurvedic & Wetland Sourced</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-stone-600 font-medium">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C89038] shrink-0" />
                  <span>Fresh Roasted Airtight Jars</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Add Address Modal */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
          <form onSubmit={handleAddNewAddress} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full border border-[#E8E2D5] shadow-2xl space-y-3.5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B]">Add New Delivery Address</h3>
              <button 
                type="button" 
                onClick={() => setIsAddAddressOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewType(type)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    newType === type ? 'bg-[#0E2A1B] text-[#D4AF37] border-[#0E2A1B] shadow-xs' : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">House / Flat No., Building, Street Address</label>
              <textarea
                required
                rows={2}
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                placeholder="e.g. Flat 304, Green Heights, 5th Main Road"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                <input
                  required
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Indore"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode</label>
                <input
                  required
                  type="text"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  placeholder="e.g. 452001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="w-1/2 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase rounded-xl hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase rounded-xl hover:bg-[#1B3B29] shadow-sm"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
}
