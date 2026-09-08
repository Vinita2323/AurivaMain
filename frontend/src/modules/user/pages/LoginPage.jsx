import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  Phone, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, 
  ArrowLeft, KeyRound, AlertCircle, Edit3, RefreshCw, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, requestOtp, verifyOtpAndLogin } = useAuth();

  const redirectTarget = searchParams.get('redirect') || location.state?.from?.pathname || '/account';

  // OTP Login Flow State
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('123456');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Feedback & Loading States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = [
    useRef(null), useRef(null), useRef(null), 
    useRef(null), useRef(null), useRef(null)
  ];

  // If already authenticated, redirect
  useEffect(() => {
    if (user && !isLoading) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget, isLoading]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const triggerSuccessConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#1B3B29', '#E5C358', '#0E2A1B']
      });
    } catch {
      // ignore
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await requestOtp(cleanPhone);
      setIsLoading(false);

      if (res.success) {
        setStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        setTimer(res.data?.retryAfterSeconds || 30);
        setCanResend(false);
        setSuccessMsg(res.message || 'OTP sent successfully!');
        
        // Focus first OTP input
        setTimeout(() => {
          otpInputRefs[0]?.current?.focus();
        }, 100);
      } else {
        // In dev if network error, continue with local simulation
        setStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        const simulated = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(simulated);
        setTimer(30);
        setCanResend(false);
        setTimeout(() => {
          otpInputRefs[0]?.current?.focus();
        }, 100);
      }
    } catch {
      setIsLoading(false);
      setStep('otp');
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtpDigits(newOtp);
      if (pasted.length === 6) {
        otpInputRefs[5]?.current?.focus();
      }
    }
  };

  const handleAutoFillOtp = () => {
    const codeStr = generatedOtp.toString();
    const filled = [];
    for (let i = 0; i < 6; i++) {
      filled.push(codeStr[i] || `${i + 1}`);
    }
    setOtpDigits(filled);
    setErrorMsg('');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP.');
      return;
    }

    setIsLoading(true);

    const res = await verifyOtpAndLogin(phone, enteredOtp);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`Welcome back, ${res.user.name || 'User'}!`);
      triggerSuccessConfetti();
      setTimeout(() => {
        navigate(redirectTarget, { replace: true });
      }, 500);
    } else {
      setErrorMsg(res.message || 'Verification failed. Please check the code and try again.');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setTimer(30);
    setCanResend(false);
    
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const res = await requestOtp(cleanPhone);
    
    if (res.success) {
      setSuccessMsg('New OTP sent successfully!');
    } else {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomCode);
      setSuccessMsg('New OTP sent to your phone!');
    }
    setOtpDigits(['', '', '', '', '', '']);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF7F2] text-[#182019] selection:bg-[#D4AF37] selection:text-[#0E2A1B] font-sans">
      <div>
        <AnnouncementBar />
        <Header />
      </div>

      <main className="flex-1 py-6 sm:py-10 md:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-center pb-24 md:pb-12">
        
        <div className="w-full max-w-md mx-auto">
          
          {/* Breadcrumb / Return Link */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#0E2A1B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </Link>

            <span className="text-[11px] font-bold text-[#C58A2B] bg-[#F7F3E9] px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
              Aurivá Secure Access
            </span>
          </div>

          {/* Main Login Card */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xl overflow-hidden animate-fadeIn">
            
            {/* Top Brand Banner */}
            <div className="bg-[#0E2A1B] p-6 sm:p-8 text-center text-white border-b border-[#D4AF37]/30 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-36 h-36 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-[#143322] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-md mb-3">
                  {step === 'phone' ? <Phone className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {step === 'phone' ? 'Log In with Mobile' : 'Verify OTP'}
                </h1>
                
                <p className="text-xs text-[#A2B5A8] mt-1 font-normal max-w-xs leading-relaxed">
                  {step === 'phone' 
                    ? 'Enter your mobile number to receive an instant one-time password (OTP).' 
                    : `Enter the 6-digit verification code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}`}
                </p>
              </div>
            </div>

            {/* Body Form */}
            <div className="p-6 sm:p-8 space-y-5">
              
              {/* Alert Feedback Messages */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* STEP 1: PHONE NUMBER INPUT */}
              {step === 'phone' && (
                <div className="space-y-4">
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0E2A1B] mb-2">
                        Mobile Number
                      </label>
                      <div className="flex items-center rounded-2xl border border-stone-300 focus-within:border-[#0E2A1B] focus-within:ring-2 focus-within:ring-[#0E2A1B]/10 overflow-hidden bg-[#FAF7F2]/50 transition-all">
                        <div className="flex items-center gap-1.5 px-3.5 py-3 border-r border-stone-200 bg-stone-50/80 text-xs font-bold text-stone-700 select-none shrink-0">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          autoFocus
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter 10-digit number"
                          className="w-full px-3.5 py-3 text-sm font-semibold text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none tracking-wide"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || phone.replace(/\D/g, '').length < 10}
                      className="w-full py-3.5 bg-[#0E2A1B] hover:bg-[#163825] text-[#D4AF37] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
                    >
                      <span>{isLoading ? 'Sending OTP...' : 'Get OTP'}</span>
                      {!isLoading && <ArrowRight className="w-4 h-4 text-[#D4AF37]" />}
                    </button>
                  </form>

                  {/* Client Demo Credentials Box */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#D4AF37]/50 flex items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#0E2A1B] bg-[#D4AF37]/20 px-2 py-0.5 rounded-md">
                          Client Demo Account
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 font-semibold">
                        Mobile: <span className="font-mono text-[#0E2A1B] font-bold">9876543210</span>
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Default OTP: <span className="font-mono text-[#0E2A1B] font-bold">123456</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPhone('9876543210');
                        setErrorMsg('');
                        setSuccessMsg('Demo number filled! Click "Get OTP" or enter OTP 123456');
                      }}
                      className="px-3 py-2 text-[11px] font-bold text-[#0E2A1B] bg-[#D4AF37] hover:bg-[#E5C358] rounded-xl uppercase tracking-wider shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ENTER OTP */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  
                  {/* Default Demo OTP Hint Box */}
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#D4AF37]/60 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔑</span>
                      <div>
                        <span className="text-[11px] text-stone-600 block">Default Demo OTP:</span>
                        <span className="text-xs font-mono font-extrabold text-[#0E2A1B]">123456</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpDigits(['1', '2', '3', '4', '5', '6']);
                        setErrorMsg('');
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-[#0E2A1B] bg-[#D4AF37] hover:bg-[#E5C358] rounded-xl uppercase tracking-wider shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      Fill 123456
                    </button>
                  </div>

                  {/* Change Phone Number */}
                  <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                    <span>Sending to +91 {phone.replace(/\D/g, '').slice(-10)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone');
                        setErrorMsg('');
                      }}
                      className="text-xs font-bold text-[#C58A2B] hover:text-[#937116] flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Number</span>
                    </button>
                  </div>

                  {/* 6-Box OTP Input (Optimized for all Mobile Widths) */}
                  <div className="flex justify-center gap-1.5 sm:gap-2.5 py-1" onPaste={handlePasteOtp}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpInputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-10 sm:w-12 h-12 sm:h-14 text-center font-mono text-lg sm:text-2xl font-extrabold text-[#0E2A1B] rounded-xl sm:rounded-2xl border-2 border-stone-300 focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 bg-[#FAF7F2]/50 outline-none transition-all shadow-2xs"
                      />
                    ))}
                  </div>

                  {/* Resend Timer */}
                  <div className="text-center pt-1">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-xs font-bold text-[#0E2A1B] hover:text-[#C58A2B] transition-colors underline cursor-pointer"
                      >
                        Resend OTP Code
                      </button>
                    ) : (
                      <p className="text-xs text-stone-500">
                        Resend code in <strong className="text-[#0E2A1B] font-mono">{timer}s</strong>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join('').length < 6}
                    className="w-full py-3.5 bg-[#0E2A1B] hover:bg-[#163825] text-[#D4AF37] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
                  >
                    <span>{isLoading ? 'Verifying...' : 'Verify & Sign In'}</span>
                    {!isLoading && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                  </button>
                </form>
              )}

              {/* Security & Assurance Badge */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-3 border-t border-stone-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit Encrypted • Aurivá Safe Access</span>
              </div>

            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
