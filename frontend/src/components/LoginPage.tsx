import React, { useState } from 'react';
import { Eye, EyeOff, Zap, Mail, Smartphone, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginPageProps {
  onLogin: (user: { name: string; email: string; avatar?: string; method: string }) => void;
}

type LoginMode = 'choose' | 'phone' | 'otp';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<LoginMode>('choose');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  /* ── 1. Demo Login ──────────────────────────────── */
  const handleDemo = () => {
    setLoading('demo');
    setTimeout(() => {
      onLogin({
        name: 'Demo Operator',
        email: 'demo@thirdeye.ai',
        avatar: 'D',
        method: 'demo',
      });
      setLoading(null);
    }, 900);
  };

  /* ── 2. Google / Gmail OAuth via Supabase ───────── */
  const handleGoogleOAuth = async () => {
    setLoading('google');
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (error) throw error;
      // Redirect handled by Supabase — browser navigates to Google
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Configure OAuth in Supabase first.');
      setLoading(null);
    }
  };

  /* ── 3. Phone OTP via Supabase ──────────────────── */
  const handleSendOTP = async () => {
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    setLoading('phone');
    setError(null);
    try {
      const e164 = phone.startsWith('+') ? phone : `+${phone}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
      if (error) throw error;
      setOtpSent(true);
      setMode('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Enable Phone auth in Supabase.');
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) { setError('Enter the OTP from your SMS.'); return; }
    setLoading('otp');
    setError(null);
    try {
      const e164 = phone.startsWith('+') ? phone : `+${phone}`;
      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      onLogin({
        name: data.user?.phone || 'Mobile User',
        email: data.user?.phone || phone,
        avatar: '📱',
        method: 'phone',
      });
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[480px] h-[480px] bg-indigo-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[420px] h-[420px] bg-cyan-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-purple-700/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-2xl shadow-indigo-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Third<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Eye</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">AIOps Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl">

          {/* ─── Choose mode ─────────────────────────────── */}
          {mode === 'choose' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white text-center mb-6">Sign in to your workspace</h2>

              {/* Demo Login */}
              <button
                onClick={handleDemo}
                disabled={!!loading}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-600/20 to-cyan-600/10 hover:from-indigo-600/40 hover:to-cyan-600/20 hover:border-indigo-400/70 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg">
                  {loading === 'demo' ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                    Continue with Demo
                  </div>
                  <div className="text-xs text-slate-400">One-click instant access — no account needed</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              </button>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs text-slate-500 bg-slate-900">or sign in with</span>
                </div>
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogleOAuth}
                disabled={!!loading}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow">
                  {loading === 'google' ? (
                    <Loader2 className="w-5 h-5 text-slate-700 animate-spin" />
                  ) : (
                    /* Google G logo */
                    <svg viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.1 33.9 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.4 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.9 0 20-7.9 20-21 0-1.4-.2-2.7-.5-4z" />
                      <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.1-6.1C34.4 5.1 29.5 3 24 3c-7.6 0-14.2 4.3-17.7 10.7z" />
                      <path fill="#FBBC05" d="M24 45c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3C29.6 36.4 26.9 37 24 37c-5.5 0-10.1-3.1-11.7-7.6l-7 5.4C8.7 41.3 15.8 45 24 45z" />
                      <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.8 2.4-2.4 4.4-4.5 5.8l6.5 5.3C41.8 36.5 45 30.8 45 24c0-1.4-.2-2.7-.5-4z" />
                    </svg>
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-white group-hover:text-slate-100 transition-colors">
                    Continue with Google
                  </div>
                  <div className="text-xs text-slate-400">Sign in with your Gmail account via OAuth</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
              </button>

              {/* Phone OTP */}
              <button
                onClick={() => { setMode('phone'); setError(null); }}
                disabled={!!loading}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-white group-hover:text-slate-100 transition-colors">
                    Continue with Phone
                  </div>
                  <div className="text-xs text-slate-400">Receive a one-time OTP via SMS</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
              </button>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                  ⚠️ {error}
                </div>
              )}
            </div>
          )}

          {/* ─── Phone number entry ───────────────────────── */}
          {mode === 'phone' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setMode('choose'); setError(null); }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-base font-bold text-white">Enter your phone number</h2>
                  <p className="text-xs text-slate-400">We'll send a 6-digit OTP via SMS</p>
                </div>
              </div>

              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white text-sm placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={!!loading || !phone.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {loading === 'phone' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                ) : (
                  <>Send OTP via SMS <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}

          {/* ─── OTP verification ─────────────────────────── */}
          {mode === 'otp' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setMode('phone'); setError(null); setOtp(''); }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-base font-bold text-white">Enter OTP</h2>
                  <p className="text-xs text-slate-400">Sent to <span className="text-cyan-400">{phone}</span></p>
                </div>
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-white text-sm placeholder-slate-500 outline-none transition-all tracking-widest font-mono text-center text-lg"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={!!loading || otp.length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading === 'otp' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Verify & Sign In <ChevronRight className="w-4 h-4" /></>
                )}
              </button>

              <button
                onClick={handleSendOTP}
                disabled={!!loading}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer py-1"
              >
                Didn't receive it? Resend OTP
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Protected by ThirdEye AIOps · Zero-trust identity layer
        </p>
      </div>
    </div>
  );
};
