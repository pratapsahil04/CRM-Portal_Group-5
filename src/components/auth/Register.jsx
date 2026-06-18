import React, { useState } from 'react';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import HoloInput from '../common/HoloInput';

// Password strength checker
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[\W_]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', '#dc2626', '#f97316', '#d97706', '#1f533a', '#059669'];

const STEP = { FORM: 'form', OTP: 'otp' };

export default function Register({ handleSetUser, apiCall, toggleView }) {
  const [step, setStep]               = useState(STEP.FORM);

  // Form fields
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [phone, setPhone]             = useState('');
  const [address, setAddress]         = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP
  const [otp, setOtp]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [errMsg, setErrMsg]           = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const pwStrength = getStrength(password);

  const startResendCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  // Step 1: validate locally, then request OTP
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrMsg('');

    if (pwStrength < 4) {
      setErrMsg('Password is too weak. Use uppercase, lowercase, a number and a special character.');
      return;
    }

    setLoading(true);
    try {
      // This call checks if email is already taken server-side and fires OTP
      await apiCall('auth/send_otp.php', 'POST', { email, purpose: 'register' });
      setStep(STEP.OTP);
      startResendCooldown();
    } catch (err) {
      setErrMsg(err?.message || 'Could not send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // Step 2: verify OTP then register
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrMsg(''); setLoading(true);
    try {
      // Verify OTP
      await apiCall('auth/verify_otp.php', 'POST', { email, otp, purpose: 'register' });
      // Complete registration
      const data = await apiCall('auth/register.php', 'POST', { name, email, password, phone, address });
      handleSetUser(data);
    } catch (err) {
      setErrMsg(err?.message || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── OTP step
  if (step === STEP.OTP) {
    return (
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-zinc-200 p-8 rounded-2xl shadow-2xl relative z-10 hud-border">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b57351] to-[#1f533a] rounded-t-2xl"></div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Verify Email</h2>
          <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider font-bold">Step 2 of 2 — Enter your OTP</p>
        </div>

        {errMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errMsg}
          </div>
        )}

        <div className="p-3 bg-[#1f533a]/8 border border-[#1f533a]/20 rounded-xl flex items-start gap-3 mb-6">
          <MailCheck className="w-4 h-4 text-[#1f533a] mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-600 font-medium">
            A 6-digit code was sent to <strong>{email}</strong>. Enter it below to complete registration. Expires in 10 minutes.
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-5">
          <div className="mb-6">
            <HoloInput id="registerOtp" label="6-Digit OTP Code" type="text"
              inputMode="numeric" maxLength={6} required
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </div>
          <button type="submit" disabled={loading || otp.length < 6}
            className="w-full py-3 rounded-xl transition-all cursor-pointer hud-btn-orange disabled:opacity-60">
            {loading ? 'Verifying & Registering…' : 'Complete Registration'}
            <span className="animation"></span>
          </button>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => { setStep(STEP.FORM); setOtp(''); setErrMsg(''); }}
              className="py-2.5 text-xs text-zinc-500 hover:text-zinc-700 font-bold uppercase tracking-wider transition-colors">
              ← Back to Form
            </button>
            <button type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={async () => {
                try {
                  await apiCall('auth/send_otp.php', 'POST', { email, purpose: 'register' });
                  startResendCooldown();
                } catch (err) { setErrMsg(err?.message || 'Could not resend OTP.'); }
              }}
              className="py-2.5 text-xs text-[#b57351] hover:text-[#9e5c3e] font-bold uppercase tracking-wider transition-colors disabled:opacity-40">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Registration form
  return (
    <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-zinc-200 p-8 rounded-2xl shadow-2xl relative z-10 hud-border">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b57351] to-[#1f533a] rounded-t-2xl"></div>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-black tracking-tight text-zinc-900 split-text">
          <strong>Register</strong>
        </h2>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-wider font-bold">Create a new account</p>
      </div>

      {errMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {errMsg}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="mb-4">
          <HoloInput id="registerName" label="Full Name" type="text" required
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="mb-4">
          <HoloInput id="registerEmail" label="Email Address" type="email" required
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        {/* Password with strength meter */}
        <div className="mb-2">
          <HoloInput id="registerPassword" label="Password"
            type={showPassword ? 'text' : 'password'} required
            value={password} onChange={e => setPassword(e.target.value)}>
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors z-20">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </HoloInput>
        </div>

        {/* Strength meter */}
        {password.length > 0 && (
          <div className="space-y-1.5 px-0.5 mb-2">
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
                  <span className={re.test(password) ? 'text-[#059669]' : 'text-zinc-300'}>
                    {re.test(password) ? '✓' : '○'}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4 pt-1">
          <HoloInput id="registerPhone" label="Phone Number" type="text"
            value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        {/* Address textarea with same holo styling */}
        <div className="input-container mb-4">
          <textarea id="registerAddress" value={address}
            onChange={e => setAddress(e.target.value)}
            rows="2" className="holo-input py-2 h-auto" placeholder=" ">
          </textarea>
          <label htmlFor="registerAddress" className="input-label" data-text="Address">Address</label>
          <div className="input-border"></div>
          <div className="input-glow"></div>
          <div className="input-scanline"></div>
          <div className="input-corners">
            <div className="corner corner-tl"></div>
            <div className="corner corner-tr"></div>
            <div className="corner corner-bl"></div>
            <div className="corner corner-br"></div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl transition-all cursor-pointer hud-btn-orange disabled:opacity-60">
          {loading ? 'Sending OTP…' : 'Continue & Verify Email'}
          <span className="animation"></span>
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-zinc-500 font-medium">Already registered? </span>
        <button onClick={toggleView} className="text-[#b57351] hover:underline font-black tracking-wide cursor-pointer">
          Login
        </button>
      </div>
    </div>
  );
}
