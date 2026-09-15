import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Check, CreditCard, ShieldCheck, Smartphone, Building2, 
  Wallet, Plus, ArrowRight, Truck, Sparkles, ShoppingBag, 
  Lock, ArrowLeft, ChevronRight, CheckCircle2, Clock, 
  Tag, Gift, AlertCircle, Percent, Flame, Pencil, Trash2
} from 'lucide-react';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { resolveProductImage } from '../../../utils/productImage';
import { paymentApi } from '../../../utils/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
  
  const { 
    user, 
    addresses, 
    selectedAddressId, 
    setSelectedAddressId, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setPrimaryAddress, 
    placeOrder 
  } = useAuth();

  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Payment
  const [name, setName] = useState(user?.name || 'Vini Sharma');
  const [mobile, setMobile] = useState(user?.phone || '9876543210');
  const [email, setEmail] = useState(user?.email || 'vini.sharma@gmail.com');

  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'cod'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [isOrderPlacing, setIsOrderPlacing] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState({ 
    isConfigured: true, 
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TRZdg2aAOYv4KK' 
  });

  useEffect(() => {
    paymentApi.getConfig()
      .then(res => {
        if (res?.data && res.data.keyId) {
          setGatewayConfig(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('Indore');
  const [addrState, setAddrState] = useState('Madhya Pradesh');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrType, setAddrType] = useState('Home');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addressModalError, setAddressModalError] = useState('');

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Block background scroll when address modal is open
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

  const openAddModal = () => {
    setEditingAddressId(null);
    setAddrFullName(name || user?.name || '');
    setAddrPhone(mobile || (user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''));
    setAddrLine1('');
    setAddrLine2('');
    setAddrLandmark('');
    setAddrCity('Indore');
    setAddrState('Madhya Pradesh');
    setAddrPincode('');
    setAddrType('Home');
    setAddrIsDefault(addresses.length === 0);
    setAddressModalError('');
    setIsAddressModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddressId(addr.id || addr._id);
    setAddrFullName(addr.name || addr.fullName || '');
    setAddrPhone((addr.phone || addr.phoneNumber || '').replace(/\D/g, '').slice(-10));
    setAddrLine1(addr.addressLine1 || addr.street || '');
    setAddrLine2(addr.addressLine2 || '');
    setAddrLandmark(addr.landmark || '');
    setAddrCity(addr.city || 'Indore');
    setAddrState(addr.state || 'Madhya Pradesh');
    setAddrPincode(addr.pincode || addr.postalCode || '');
    setAddrType(addr.type || 'Home');
    setAddrIsDefault(Boolean(addr.isDefault));
    setAddressModalError('');
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressModalError('');
    if (!addrLine1.trim() || !addrCity.trim() || !addrPincode.trim()) {
      setAddressModalError('Please fill in Address, City, and Pincode');
      return;
    }

    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, {
          fullName: addrFullName,
          name: addrFullName,
          phoneNumber: addrPhone,
          phone: addrPhone,
          addressLine1: addrLine1,
          addressLine2: addrLine2,
          landmark: addrLandmark,
          street: addrLine1 + (addrLine2 ? `, ${addrLine2}` : '') + (addrLandmark ? `, Near ${addrLandmark}` : ''),
          city: addrCity,
          state: addrState,
          postalCode: addrPincode,
          pincode: addrPincode,
          addressType: addrType.toLowerCase(),
          type: addrType,
          isDefault: addrIsDefault
        });
      } else {
        const newId = await addAddress({
          fullName: addrFullName,
          name: addrFullName,
          phoneNumber: addrPhone,
          phone: addrPhone,
          addressLine1: addrLine1,
          addressLine2: addrLine2,
          landmark: addrLandmark,
          street: addrLine1 + (addrLine2 ? `, ${addrLine2}` : '') + (addrLandmark ? `, Near ${addrLandmark}` : ''),
          city: addrCity,
          state: addrState,
          postalCode: addrPincode,
          pincode: addrPincode,
          addressType: addrType.toLowerCase(),
          type: addrType,
          isDefault: addrIsDefault
        });
        if (newId) {
          setSelectedAddressId(newId);
        }
      }
      setIsAddressModalOpen(false);
    } catch (err) {
      setAddressModalError(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(id);
      } catch (err) {
        alert(err.message || 'Failed to delete address');
      }
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) return;
    const res = await applyCoupon(couponCodeInput.trim().toUpperCase());
    if (res && !res.success) {
      setCouponError(res.message || 'Invalid coupon code');
    } else if (res && res.success) {
      setCouponCodeInput('');
      setCouponError('');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setOrderError('Please select or add a delivery address to proceed.');
      setCurrentStep(1);
      return;
    }

    setOrderError('');
    setIsOrderPlacing(true);

    try {
      const isOnline = paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking';

      const orderPayload = {
        items: cartItems,
        subtotal,
        discount: discountAmount,
        couponApplied: appliedCoupon?.code,
        deliveryFee,
        tax,
        total,
        paymentMethod: paymentMethod === 'upi' 
          ? `UPI (${selectedUpiApp.toUpperCase()})` 
          : paymentMethod === 'card' 
          ? 'Credit/Debit Card' 
          : paymentMethod === 'netbanking'
          ? `Net Banking (${selectedBank.toUpperCase()})`
          : 'Cash on Delivery',
        selectedUpiApp,
        selectedBank,
        deliveryType: 'Standard Express Courier',
        address: selectedAddress
      };

      const newOrderId = await placeOrder(orderPayload);

      // Cash on Delivery proceeds directly to tracking
      if (!isOnline) {
        clearCart();
        setIsOrderPlacing(false);
        navigate(`/order-tracking/${newOrderId}`);
        return;
      }

      // Online payment flow with Razorpay Gateway
      let razorpayOrderId = null;
      let keyId = gatewayConfig.keyId || 'rzp_test_TRZdg2aAOYv4KK';
      let amount = Math.round(total * 100);
      let currency = 'INR';

      try {
        const orderSession = await paymentApi.createOrder({ orderId: newOrderId });
        if (orderSession?.data?.razorpayOrderId) {
          razorpayOrderId = orderSession.data.razorpayOrderId;
          keyId = orderSession.data.keyId || keyId;
          amount = orderSession.data.amount || amount;
          currency = orderSession.data.currency || currency;
        }
      } catch (sessionErr) {
        console.warn('[Checkout] Backend paymentApi.createOrder note:', sessionErr.message);
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Payment gateway SDK failed to load. Please check your internet connection.');
      }

      const rzpOptions = {
        key: keyId,
        amount,
        currency,
        name: 'AURIVÁ Foods',
        description: `Order #${newOrderId}`,
        order_id: razorpayOrderId || undefined,
        prefill: {
          name: selectedAddress?.name || user?.name || '',
          contact: selectedAddress?.phone || user?.phone || '',
          email: selectedAddress?.email || user?.email || '',
          method: paymentMethod === 'netbanking' ? 'netbanking' : paymentMethod === 'card' ? 'card' : 'upi'
        },
        theme: {
          color: '#0E2A1B'
        },
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment({
              orderId: newOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            clearCart();
            setIsOrderPlacing(false);
            navigate(`/order-tracking/${newOrderId}`);
          } catch (verifyErr) {
            setIsOrderPlacing(false);
            setOrderError(verifyErr.message || 'Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setIsOrderPlacing(false);
            setOrderError('Payment process was closed before completion. You can retry payment or choose Cash on Delivery.');
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', (resp) => {
        setIsOrderPlacing(false);
        setOrderError(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err) {
      setIsOrderPlacing(false);
      setOrderError(err.message || 'Unable to place order. Please verify item stock or address details.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] font-sans flex flex-col justify-between">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <AnnouncementBar />
          <Header />
        </div>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-[#0E2A1B] text-white px-3.5 py-3 shadow-md border-b border-[#D4AF37]/30 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <h1 className="font-serif text-base font-bold text-[#E8DFC8]">Checkout</h1>
          </div>
          <div className="w-8" />
        </header>

        <main className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center flex-1">
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] pb-24 md:pb-12 font-sans">
      {/* 1. DESKTOP HEADER: Shown only on md: and above */}
      <div className="hidden md:block">
        <AnnouncementBar />
        <Header />
      </div>

      {/* 2. DEDICATED MOBILE HEADER: Shown only on mobile (< md:) */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0E2A1B] text-white px-3.5 py-2.5 shadow-md border-b border-[#D4AF37]/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(prev => prev - 1);
              } else {
                navigate(-1);
              }
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <h1 className="font-serif text-base font-bold text-[#E8DFC8] tracking-tight leading-tight">
                Secure Checkout
              </h1>
            </div>
            <p className="text-[10px] text-[#D4AF37] font-medium leading-none mt-0.5">
              Step {currentStep} of 2 • {currentStep === 1 ? 'Delivery Address' : 'Payment Option'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-[#D4AF37]/30 text-[10px] text-[#D4AF37] font-bold">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>100% Safe</span>
        </div>
      </header>

      <main className="py-2.5 sm:py-8 md:py-12 max-w-[1450px] mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Secure Header: Desktop Only */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-8 pb-2.5 sm:pb-4 border-b border-[#E8E2D5]">
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
        <div className="max-w-2xl mx-auto mb-3.5 sm:mb-8 px-1 sm:px-0">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute top-3.5 sm:top-5 left-0 right-0 h-0.5 sm:h-1 bg-stone-200 -translate-y-1/2 z-0 rounded-full" />
            {/* Progress Fill */}
            <div 
              className="absolute top-3.5 sm:top-5 left-0 h-0.5 sm:h-1 bg-[#0E2A1B] -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
              style={{ width: `${(currentStep - 1) * 100}%` }}
            />

            {[
              { step: 1, title: 'Address', desc: 'Where to deliver' },
              { step: 2, title: 'Payment', desc: 'UPI, Card, COD' }
            ].map((s) => {
              const isPassed = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div key={s.step} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => s.step < currentStep && setCurrentStep(s.step)}>
                  <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all duration-300 shadow-xs sm:shadow-md ${
                    isPassed 
                      ? 'bg-[#0E2A1B] text-[#D4AF37]' 
                      : isCurrent 
                      ? 'bg-[#D4AF37] text-[#0E2A1B] ring-2 sm:ring-4 ring-[#0E2A1B]/20 scale-105 sm:scale-110' 
                      : 'bg-white text-stone-400 border border-stone-300'
                  }`}>
                    {isPassed ? <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" /> : s.step}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-1 sm:mt-2 transition-colors ${isCurrent ? 'text-[#0E2A1B]' : 'text-stone-500'}`}>
                    {s.title}
                  </span>
                  <span className="hidden sm:block text-[10px] text-stone-400">{s.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-8 items-start">
          
          {/* LEFT: Dynamic Step Forms (Animated Container) */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-6">
            
            {/* STEP 1: Customer Contact & Delivery Address */}
            <div className={`bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-8 border transition-all duration-300 ${
              currentStep === 1 
                ? 'border-[#0E2A1B] shadow-sm ring-1 ring-[#0E2A1B]/10' 
                : 'border-[#E8E2D5] shadow-xs opacity-90'
            }`}>
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 sm:pb-4 mb-3 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[10.5px] sm:text-xs font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <h2 className="font-serif text-sm sm:text-lg font-bold text-[#0E2A1B]">Delivery Address & Contact</h2>
                    <p className="text-[9.5px] sm:text-[11px] text-stone-500">Provide shipping details for fast dispatch</p>
                  </div>
                </div>
                {currentStep > 1 && (
                  <button 
                    onClick={() => setCurrentStep(1)} 
                    className="text-[10.5px] sm:text-xs text-[#C89038] font-bold hover:underline px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#FAF7F2] rounded-lg border border-[#E8E2D5]"
                  >
                    Change
                  </button>
                )}
              </div>

              {currentStep === 1 ? (
                <div className="space-y-3 sm:space-y-6 animate-fadeIn">
                  {/* Contact Info Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                    <div>
                      <label className="block text-[10.5px] sm:text-xs font-bold text-[#0E2A1B] mb-0.5 sm:mb-1">Recipient Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#0E2A1B] bg-stone-50 focus:bg-white transition-colors"
                        placeholder="e.g. Vini Sharma"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] sm:text-xs font-bold text-[#0E2A1B] mb-0.5 sm:mb-1">Mobile Number</label>
                      <div className="flex gap-1.5 sm:gap-2">
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#0E2A1B] bg-stone-50 focus:bg-white transition-colors"
                          placeholder="10-digit phone number"
                        />
                        <div className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-emerald-50 text-emerald-800 rounded-lg sm:rounded-xl text-[9.5px] sm:text-xs font-bold flex items-center gap-1 shrink-0 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>OTP Verified</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10.5px] sm:text-xs font-bold text-[#0E2A1B] mb-0.5 sm:mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#0E2A1B] bg-stone-50 focus:bg-white transition-colors"
                        placeholder="vini.sharma@gmail.com"
                      />
                    </div>
                  </div>

                  {/* Saved Addresses List */}
                  <div className="pt-2.5 sm:pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <label className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-wider text-[#0E2A1B]">
                        Select Delivery Address
                      </label>
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="text-[10.5px] sm:text-xs text-[#0E2A1B] hover:text-[#D4AF37] font-bold flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#0E2A1B] transition-all"
                      >
                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C89038]" /> 
                        <span>Add Address</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 relative group ${
                              isSelected
                                ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs'
                                : 'border-stone-200 bg-white hover:border-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#0E2A1B] text-[#D4AF37] uppercase tracking-wider">
                                  {addr.type || 'Home'}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[8.5px] sm:text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(addr);
                                  }}
                                  title="Edit Address"
                                  className="p-1 text-stone-400 hover:text-[#0E2A1B] rounded hover:bg-stone-100 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {addresses.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAddress(addr.id);
                                    }}
                                    title="Delete Address"
                                    className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-[#0E2A1B]">{addr.name}</p>
                            <p className="text-[10.5px] sm:text-xs text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                              {addr.street}, {addr.city} - {addr.pincode}
                            </p>
                            <p className="text-[9.5px] sm:text-[11px] text-stone-500 mt-1 font-medium">📞 {addr.phone}</p>
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
                      className="w-full sm:w-auto px-5 py-2.5 sm:px-8 sm:py-3.5 rounded-xl bg-[#0E2A1B] text-white hover:bg-[#1B3B29] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all group min-h-[40px] sm:min-h-[42px]"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] sm:text-xs text-stone-600 flex items-center justify-between bg-[#FAF7F2] p-2 sm:p-3 rounded-lg sm:rounded-xl">
                  <div className="truncate pr-2">
                    <span className="font-bold text-[#0E2A1B]">{selectedAddress?.name}</span> • {selectedAddress?.street}, {selectedAddress?.city} ({selectedAddress?.pincode})
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                </div>
              )}
            </div>

            {/* STEP 2: Payment Method & Place Order */}
            <div className={`bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-8 border transition-all duration-300 ${
              currentStep === 2 
                ? 'border-[#0E2A1B] shadow-sm ring-1 ring-[#0E2A1B]/10' 
                : 'border-[#E8E2D5] shadow-xs opacity-90'
            }`}>
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 sm:pb-4 mb-3 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0E2A1B] text-[#D4AF37] text-[10.5px] sm:text-xs font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h2 className="font-serif text-sm sm:text-lg font-bold text-[#0E2A1B]">Select Payment Option</h2>
                    <p className="text-[9.5px] sm:text-[11px] text-stone-500">Choose your preferred payment method</p>
                  </div>
                </div>
              </div>

              {currentStep === 2 ? (
                <div className="space-y-3 sm:space-y-6 animate-fadeIn">
                  
                  {/* Payment Options List */}
                  <div className="space-y-2 sm:space-y-3">
                    
                    {/* UPI Option */}
                    <div 
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'upi' ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3.5">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Smartphone className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-xs sm:text-sm font-bold text-[#0E2A1B]">UPI Instant Payment</span>
                            </div>
                            <p className="text-[9.5px] sm:text-[11px] text-stone-500">Google Pay, PhonePe, Paytm, BHIM</p>
                          </div>
                        </div>
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'upi' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {paymentMethod === 'upi' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>

                      {paymentMethod === 'upi' && (
                        <div className="mt-2.5 pt-2 border-t border-stone-200 flex flex-wrap gap-1.5 sm:gap-2 animate-fadeIn">
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
                              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border transition-all ${
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
                      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'card' ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3.5">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 text-[#0E2A1B] flex items-center justify-center shrink-0">
                            <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#C89038]" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-xs sm:text-sm font-bold text-[#0E2A1B]">Credit / Debit Card</span>
                            </div>
                            <p className="text-[9.5px] sm:text-[11px] text-stone-500">Visa, Mastercard, RuPay, Amex</p>
                          </div>
                        </div>
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'card' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {paymentMethod === 'card' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* Online Net Banking Option */}
                    <div 
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'netbanking' ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3.5">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-700" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-[#0E2A1B]">Online Net Banking</span>
                            <p className="text-[9.5px] sm:text-[11px] text-stone-500">SBI, HDFC, ICICI, Axis, Kotak & 50+ Banks</p>
                          </div>
                        </div>
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'netbanking' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {paymentMethod === 'netbanking' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>

                      {paymentMethod === 'netbanking' && (
                        <div className="mt-2.5 pt-2 border-t border-stone-200 flex flex-wrap gap-1.5 sm:gap-2 animate-fadeIn">
                          {[
                            { id: 'HDFC', name: 'HDFC Bank' },
                            { id: 'SBIN', name: 'SBI' },
                            { id: 'ICIC', name: 'ICICI' },
                            { id: 'UTIB', name: 'Axis' },
                            { id: 'KKBK', name: 'Kotak' },
                            { id: 'ALL', name: 'Other Banks' }
                          ].map(bank => (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBank(bank.id);
                              }}
                              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border transition-all ${
                                selectedBank === bank.id
                                  ? 'bg-[#0E2A1B] text-[#D4AF37] border-[#0E2A1B] shadow-xs'
                                  : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                              }`}
                            >
                              {bank.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cash on Delivery */}
                    <div 
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentMethod === 'cod' ? 'border-[#0E2A1B] bg-[#FAF7F2] shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3.5">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                            <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-[#0E2A1B]">Cash / UPI on Delivery</span>
                            <p className="text-[9.5px] sm:text-[11px] text-stone-500">Pay at doorstep via Cash or QR</p>
                          </div>
                        </div>
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          paymentMethod === 'cod' ? 'border-[#0E2A1B] bg-[#0E2A1B]' : 'border-stone-300'
                        }`}>
                          {paymentMethod === 'cod' && <Check className="w-2.5 h-2.5 text-[#D4AF37] stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Order Error Alert */}
                  {orderError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-semibold">{orderError}</span>
                    </div>
                  )}

                  {/* Actions & Place Order Trigger */}
                  <div className="pt-2.5 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-stone-600 hover:text-[#0E2A1B] flex items-center gap-1 self-start sm:self-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Address
                    </button>

                    <button
                      type="button"
                      disabled={isOrderPlacing}
                      onClick={handlePlaceOrder}
                      className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C358] to-[#C89038] text-[#0E2A1B] font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 min-h-[42px] sm:min-h-[44px]"
                    >
                      {isOrderPlacing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0E2A1B] border-t-transparent rounded-full animate-spin" />
                          <span>Processing Order...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-[#0E2A1B]" />
                          <span className="font-sans">CONFIRM & PAY ₹{total}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">Select delivery address to proceed with payment.</p>
              )}
            </div>

          </div>

          {/* RIGHT: Live Order Summary Card */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-6 sticky top-20">
            
            <div className="bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-6 border border-[#E8E2D5] shadow-xs space-y-3 sm:space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2 sm:pb-3">
                <h3 className="font-serif text-sm sm:text-lg font-bold text-[#0E2A1B] flex items-center gap-1.5 sm:gap-2">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#C89038]" />
                  <span>Order Summary</span>
                </h3>
                <span className="text-[10px] sm:text-xs font-bold text-[#D4AF37] bg-[#0E2A1B] px-2 py-0.5 sm:px-2.5 rounded-full">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-40 sm:max-h-56 overflow-y-auto divide-y divide-stone-100 pr-1 space-y-1 sm:space-y-1.5">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.weight}`} className="pt-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <img 
                        src={resolveProductImage(item)} 
                        alt="" 
                        className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg object-cover border border-[#E8E2D5] bg-[#FAF7F2] shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#0E2A1B] truncate text-xs">{item.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-stone-500">{item.weight} • Qty: {item.qty}</p>
                      </div>
                    </div>
                    <span className="font-sans font-bold text-[#0E2A1B] shrink-0 ml-2 text-xs">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-stone-100">
                {appliedCoupon ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                      <div>
                        <span className="font-bold text-emerald-900 text-[11px] sm:text-xs">{appliedCoupon.code}</span>
                        <p className="font-sans text-[9px] sm:text-[10px] text-emerald-700">Applied (₹{discountAmount} OFF)</p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[10px] sm:text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1 sm:space-y-1.5">
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        placeholder="Promo / Voucher"
                        className="flex-1 px-2.5 py-1.5 sm:py-2 text-xs rounded-lg sm:rounded-xl border border-stone-200 focus:outline-none focus:border-[#0E2A1B] uppercase tracking-wider bg-stone-50 font-bold text-[#0E2A1B]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0E2A1B] text-[#D4AF37] rounded-lg sm:rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#1B3B29] transition-colors"
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
              <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs pt-2 sm:pt-3 border-t border-stone-100">
                <div className="flex justify-between text-stone-600">
                  <span>Cart Subtotal</span>
                  <span className="font-sans font-bold text-stone-800">₹{subtotal}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Savings</span>
                    <span className="font-sans">-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Shipping / Delivery</span>
                  <span className="font-sans">{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Estimated Taxes (5%)</span>
                  <span className="font-sans">₹{tax}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 sm:pt-3 border-t border-dashed border-stone-200 font-bold text-[#0E2A1B]">
                  <span className="text-xs sm:text-base font-serif">Total Payable</span>
                  <span className="font-sans text-lg sm:text-2xl font-extrabold text-[#0E2A1B]">₹{total}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-stone-100 space-y-1 sm:space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
                  <span>100% Genuine Ayurvedic & Wetland Sourced</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-600 font-medium">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C89038] shrink-0" />
                  <span>Fresh Roasted Airtight Jars</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Add / Edit Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
          <form onSubmit={handleSaveAddress} className="bg-white rounded-xl sm:rounded-3xl p-4 sm:p-7 max-w-md w-full border border-[#E8E2D5] shadow-2xl space-y-3 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#0E2A1B]">
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAddressModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {addressModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{addressModalError}</span>
              </div>
            )}
            
            {/* Address Type Selector */}
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAddrType(type)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    addrType.toLowerCase() === type.toLowerCase()
                      ? 'bg-[#0E2A1B] text-[#D4AF37] border-[#0E2A1B] shadow-xs' 
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Recipient Name & Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={addrFullName}
                  onChange={(e) => setAddrFullName(e.target.value)}
                  placeholder="e.g. Vini Sharma"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                Flat / House No., Building, Street Address *
              </label>
              <textarea
                required
                rows={2}
                value={addrLine1}
                onChange={(e) => setAddrLine1(e.target.value)}
                placeholder="e.g. Flat 304, Green Heights, 5th Main Road"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>

            {/* Landmark / Area */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">
                Landmark or Area (Optional)
              </label>
              <input
                type="text"
                value={addrLandmark}
                onChange={(e) => setAddrLandmark(e.target.value)}
                placeholder="e.g. Near Lotus Lake / Behind Apollo Tower"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
              />
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">City *</label>
                <input
                  required
                  type="text"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="Indore"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">State</label>
                <input
                  type="text"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  placeholder="Madhya Pradesh"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">Pincode *</label>
                <input
                  required
                  type="text"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  placeholder="452001"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B]"
                />
              </div>
            </div>

            {/* Make Default Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={addrIsDefault}
                onChange={(e) => setAddrIsDefault(e.target.checked)}
                className="rounded border-stone-300 text-[#0E2A1B] focus:ring-[#0E2A1B] w-4 h-4"
              />
              <span className="text-xs text-stone-700 font-medium">Set as my default delivery address</span>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-1/2 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-[#0E2A1B] text-[#D4AF37] text-xs font-bold uppercase rounded-xl hover:bg-[#1B3B29] shadow-sm transition-colors"
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
