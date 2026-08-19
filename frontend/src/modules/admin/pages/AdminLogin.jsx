import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Logo from '../../user/components/Logo';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminAuthenticated, loginAdmin } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard or intended location
  useEffect(() => {
    if (isAdminAuthenticated) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAdminAuthenticated, navigate, location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const res = loginAdmin(email, password);
      setLoading(false);
      if (res.success) {
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Invalid admin credentials');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#D4AF37] selection:text-[#0E2A1B]">
      
      {/* Centered Enhanced Size Login Card */}
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card Header with Logo */}
          <div className="bg-[#0E2A1B] p-6 sm:p-8 text-center border-b border-[#D4AF37]/25 flex flex-col items-center justify-center space-y-3">
            <Logo variant="light" size="default" to="/admin/login" />
            <h2 className="font-sans text-xs sm:text-sm font-bold text-[#D4AF37] uppercase tracking-widest">
              ADMIN LOGIN
            </h2>
          </div>

          <div className="p-6 sm:p-9 space-y-5">
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4.5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@aurivafoods.com"
                    className="w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 text-stone-800 font-medium placeholder:text-stone-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 text-sm sm:text-base rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 text-stone-800 font-medium placeholder:text-stone-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5 text-stone-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm text-stone-600 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0E2A1B] rounded cursor-pointer" />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0E2A1B] hover:bg-[#163825] text-[#D4AF37] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-70 mt-2"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4 text-[#D4AF37]" />}
              </button>
            </form>

          </div>

        </div>
      </div>

    </div>
  );
}
