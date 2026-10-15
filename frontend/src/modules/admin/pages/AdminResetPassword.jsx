import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '../../user/components/Logo';
import { adminAuthApi } from '../../../utils/api';

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = String(searchParams.get('token') || '').trim();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checking, setChecking] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setChecking(false);
      setTokenValid(false);
      setError('This reset link is missing or incomplete.');
      return undefined;
    }

    setChecking(true);
    adminAuthApi
      .verifyResetToken(token)
      .then((res) => {
        if (cancelled) return;
        setTokenValid(true);
        setAdminEmail(res?.data?.email || 'Indgroup26@gmail.com');
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setTokenValid(false);
        setError(err?.message || 'Invalid or expired reset link.');
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !tokenValid) return;
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await adminAuthApi.resetPassword({
        token,
        newPassword,
        confirmPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/admin/login', { replace: true }), 2500);
    } catch (err) {
      setError(err?.message || 'Could not reset password. Request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#D4AF37] selection:text-[#0E2A1B]">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-[#E8E2D5] shadow-2xl overflow-hidden">
          <div className="bg-[#0E2A1B] p-6 sm:p-8 text-center border-b border-[#D4AF37]/25 flex flex-col items-center justify-center space-y-3">
            <Logo variant="light" size="default" to="/admin/login" />
            <h2 className="font-sans text-xs sm:text-sm font-bold text-[#D4AF37] uppercase tracking-widest">
              Reset Password
            </h2>
          </div>

          <div className="p-6 sm:p-9 space-y-5">
            {checking && (
              <p className="text-sm text-stone-600 text-center">Verifying reset link…</p>
            )}

            {!checking && success && (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#0E2A1B]">Password updated</h3>
                <p className="text-sm text-stone-600">
                  You can now sign in with your new password. Redirecting to login…
                </p>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs uppercase tracking-wider rounded-xl"
                >
                  Go to Sign In
                </Link>
              </div>
            )}

            {!checking && !success && !tokenValid && (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#0E2A1B]">Link invalid</h3>
                <p className="text-sm text-stone-600">{error || 'This reset link is invalid or has expired.'}</p>
                <Link
                  to="/admin/forgot-password"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs uppercase tracking-wider rounded-xl"
                >
                  Request a new link
                </Link>
              </div>
            )}

            {!checking && !success && tokenValid && (
              <>
                <p className="text-sm text-stone-600">
                  Set a new password for <strong className="text-[#0E2A1B]">{adminEmail}</strong>.
                </p>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5" htmlFor="newPassword">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="newPassword"
                        type={showNew ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full pl-11 pr-11 py-3 text-sm sm:text-base rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 text-stone-800 font-medium placeholder:text-stone-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-11 pr-11 py-3 text-sm sm:text-base rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 text-stone-800 font-medium placeholder:text-stone-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#0E2A1B] hover:bg-[#163825] text-[#D4AF37] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-70"
                  >
                    <span>{loading ? 'Saving…' : 'Update Password'}</span>
                    {!loading && <ArrowRight className="w-4 h-4 text-[#D4AF37]" />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
