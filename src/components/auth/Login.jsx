import React, { useState } from 'react';
import { Eye, EyeOff, MailCheck, KeyRound, RefreshCw } from 'lucide-react';
import HoloInput from '../common/HoloInput';

// Recovery step enum
const STEP = { EMAIL: 'email', OTP: 'otp', RESET: 'reset', DONE: 'done' };

// Password strength checker helper
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[a-z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[\W_]/.test(pw))         score++;
  return score; // 0-5
}

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', '#dc2626', '#f97316', '#d97706', '#1f533a', '#059669'];

export default function Login({ handleSetUser, apiCall, toggleView }) {
  // ── Login state
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [step, setStep]               = useState(STEP.EMAIL);
  const [recovEmail, setRecovEmail]   = useState('');
  const [otp, setOtp]                 = useState('');
  const [newPw, setNewPw]             = useState('');
  const [showNewPw, setShowNewPw]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errMsg, setErrMsg]           = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Login submit
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiCall('auth/login.php', 'POST', { email, password });
      handleSetUser(data);
    } catch (err) {}
  };

  // ── Recovery helpers
  const resetRecovery = () => {
    setStep(STEP.EMAIL); setRecovEmail(''); setOtp('');
    setNewPw(''); setErrMsg(''); setLoading(false);
    setShowRecovery(false);
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrMsg(''); setLoading(true);
    try {
      await apiCall('auth/send_otp.php', 'POST', { email: recovEmail, purpose: 'recover' });
      setStep(STEP.OTP);
      startResendCooldown();
    } catch (err) {
      setErrMsg(err?.message || 'Could not send OTP. Check the email and try again.');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async (purpose) => {
    setErrMsg(''); setLoading(true);
    try {
      await apiCall('auth/send_otp.php', 'POST', { email: recovEmail || '', purpose });
      startResendCooldown();
      setErrMsg('');
    } catch (err) {
      setErrMsg(err?.message || 'Could not resend OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrMsg(''); setLoading(true);
    try {
      await apiCall('auth/verify_otp.php', 'POST', { email: recovEmail, otp, purpose: 'recover' });
      setStep(STEP.RESET);
    } catch (err) {
      setErrMsg(err?.message || 'Invalid or expired OTP.');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrMsg('');
    if (getStrength(newPw) < 4) {
      setErrMsg('Password is too weak. Use uppercase, lowercase, numbers and a special character.');
      return;
    }
    setLoading(true);
    try {
      await apiCall('auth/reset_password.php', 'POST', { email: recovEmail, new_password: newPw });
      setStep(STEP.DONE);
    } catch (err) {
      setErrMsg(err?.message || 'Reset failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Recovery panel
  if (showRecovery) {
    const pwStrength = getStrength(newPw);
    return (
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-zinc-200 p-8 rounded-2xl shadow-2xl relative z-10 hud-border">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1f533a] to-[#b57351] rounded-t-2xl"></div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">
            {step === STEP.DONE ? 'Password Reset' : 'Recover Password'}
          </h2>
          <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider font-bold">
            {step === STEP.EMAIL && 'Step 1 of 3 — Enter your email'}
            {step === STEP.OTP   && 'Step 2 of 3 — Enter the OTP sent to your email'}
            {step === STEP.RESET && 'Step 3 of 3 — Set a new password'}
            {step === STEP.DONE  && 'Your password has been reset'}
          </p>
        </div>

        {/* Error banner */}
        {errMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errMsg}
          </div>
        )}

        {/* STEP 1: Email */}
        {step === STEP.EMAIL && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="pt-4 mb-6">
              <HoloInput id="recovEmail" label="Registered Email" type="email"
                required value={recovEmail} onChange={e => setRecovEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl transition-all cursor-pointer hud-btn-primary disabled:opacity-60">
              {loading ? 'Sending OTP…' : 'Send Verification Code'}
              <span className="animation"></span>
            </button>
            <button type="button" onClick={resetRecovery}
              className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-700 font-bold uppercase tracking-wider transition-colors">
              Cancel
            </button>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === STEP.OTP && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="p-3 bg-[#1f533a]/8 border border-[#1f533a]/20 rounded-xl flex items-start gap-3 mb-2">
              <MailCheck className="w-4 h-4 text-[#1f533a] mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-600 font-medium">
                A 6-digit code was sent to <strong>{recovEmail}</strong>. It expires in 10 minutes.
              </p>
            </div>
            <div className="pt-2 mb-6">
              <HoloInput id="recovOtp" label="6-Digit OTP Code" type="text"
                inputMode="numeric" maxLength={6} required
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full py-3.5 rounded-xl transition-all cursor-pointer hud-btn-primary disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify Code'}
              <span className="animation"></span>
            </button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setStep(STEP.EMAIL); setErrMsg(''); }}
                className="py-2.5 text-xs text-zinc-500 hover:text-zinc-700 font-bold uppercase tracking-wider transition-colors">
                ← Back
              </button>
              <button type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleResendOtp('recover')}
                className="py-2.5 text-xs text-[#b57351] hover:text-[#9e5c3e] font-bold uppercase tracking-wider transition-colors disabled:opacity-40">
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: New password */}
        {step === STEP.RESET && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="pt-2 mb-2">
              <HoloInput id="newPw" label="New Password"
                type={showNewPw ? 'text' : 'password'} required
                value={newPw} onChange={e => setNewPw(e.target.value)}>
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 z-20 transition-colors">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </HoloInput>
            </div>
            {/* Strength meter */}
            {newPw.length > 0 && (
              <div className="space-y-1.5 -mt-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ backgroundColor: i <= pwStrength ? STRENGTH_COLORS[pwStrength] : '#e4e4e7' }} />
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: STRENGTH_COLORS[pwStrength] || '#a1a1aa' }}>
                  {STRENGTH_LABELS[pwStrength]}
                </p>
                <ul className="text-[10px] text-zinc-500 space-y-0.5 font-medium">
                  {[
                    [/.{8,}/, '8+ characters'],
                    [/[A-Z]/, 'Uppercase letter'],
                    [/[a-z]/, 'Lowercase letter'],
                    [/[0-9]/, 'Number'],
                    [/[\W_]/, 'Special character (@#!…)'],
                  ].map(([re, label]) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <span className={re.test(newPw) ? 'text-[#059669]' : 'text-zinc-300'}>
                        {re.test(newPw) ? '✓' : '○'}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="submit" disabled={loading || pwStrength < 4}
              className="w-full py-3.5 rounded-xl transition-all cursor-pointer hud-btn-primary disabled:opacity-60">
              {loading ? 'Resetting…' : 'Set New Password'}
              <span className="animation"></span>
            </button>
          </form>
        )}

        {/* DONE */}
        {step === STEP.DONE && (
          <div className="space-y-6 text-center">
            <div className="bg-[#1f533a]/10 border border-[#1f533a]/20 p-5 rounded-xl">
              <KeyRound className="w-8 h-8 text-[#1f533a] mx-auto mb-2" />
              <p className="text-zinc-700 text-sm font-semibold">Password updated successfully.</p>
              <p className="text-zinc-500 text-xs mt-1">You can now log in with your new password.</p>
            </div>
            <button onClick={resetRecovery}
              className="w-full py-3.5 rounded-xl transition-all cursor-pointer hud-btn-primary">
              Back to Login
              <span className="animation"></span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Main login panel
  return (
    <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-zinc-200 p-8 rounded-2xl shadow-2xl relative z-10 hud-border">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1f533a] to-[#b57351] rounded-t-2xl"></div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight text-zinc-900 split-text">
          <strong>Login</strong>
        </h2>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-wider font-bold">Log in to your account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="mb-6">
          <HoloInput id="loginEmail" label="Email Address" type="email"
            required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-6">
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setShowRecovery(true)}
              className="text-[10px] text-[#b57351] hover:text-[#9e5c3e] uppercase tracking-wider font-extrabold transition-colors">
              Forgot Password?
            </button>
          </div>
          <HoloInput id="loginPassword" label="Password"
            type={showPassword ? 'text' : 'password'} required
            value={password} onChange={e => setPassword(e.target.value)}>
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors z-20">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </HoloInput>
        </div>
        <button type="submit" className="w-full py-3.5 rounded-xl transition-all cursor-pointer hud-btn-primary">
          Login
          <span className="animation"></span>
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="text-zinc-500 font-medium">New customer? </span>
        <button onClick={toggleView} className="text-[#1f533a] hover:underline font-black tracking-wide cursor-pointer">
          Register
        </button>
      </div>
    </div>
  );
}
