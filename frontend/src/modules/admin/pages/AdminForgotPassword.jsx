import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import Logo from '../../user/components/Logo';
import { adminAuthApi } from '../../../utils/api';

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await adminAuthApi.forgotPassword(email.trim());
      setInfoMessage(res?.message || '');
      setSent(true);
    } catch (err) {
      setError(
        err?.message ||
          'Unable to process this request right now. Confirm SMTP_* and ADMIN_RECOVERY_EMAIL are set on the backend.'
      );
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
              Forgot Password
            </h2>
          </div>

          <div className="p-6 sm:p-9 space-y-5">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#0E2A1B]">Check your inbox</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {infoMessage ||
                    'If this account is authorized for recovery, a password reset link has been sent to the configured recovery email. The link expires in 15 minutes.'}
                </p>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#0E2A1B] text-[#D4AF37] font-bold text-xs uppercase tracking-wider rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Enter the admin login email. A one-time reset link will be emailed to the secure recovery
                  inbox configured on the server.
                </p>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5" htmlFor="forgotEmail">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="forgotEmail"
                        type="email"
                        required
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter admin email"
                        className="w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-xl border border-stone-300 focus:outline-none focus:border-[#0E2A1B] focus:ring-2 focus:ring-[#0E2A1B]/10 text-stone-800 font-medium placeholder:text-stone-400 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#0E2A1B] hover:bg-[#163825] text-[#D4AF37] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-70"
                  >
                    <span>{loading ? 'Sending…' : 'Send Reset Link'}</span>
                    {!loading && <ArrowRight className="w-4 h-4 text-[#D4AF37]" />}
                  </button>
                </form>

                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#0E2A1B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
