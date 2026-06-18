import React, { useState, useEffect } from 'react';
import { UserPlus, Eye, EyeOff, CheckCircle2, AlertTriangle, Wrench, Star } from 'lucide-react';
import HoloInput from '../common/HoloInput';

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8)   s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[\W_]/.test(pw)) s++;
  return s;
}
const STR_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STR_COLORS = ['', '#dc2626', '#f97316', '#d97706', '#1f533a', '#059669'];

export default function TechnicianManagementView({ apiCall, setSuccessMsg }) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [errMsg, setErrMsg]           = useState('');

  // Form state
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [phone, setPhone]             = useState('');
  const [specialization, setSpec]     = useState('');
  const [expYears, setExpYears]       = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const pwStrength = getStrength(password);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const data = await apiCall('reports/dashboard.php');
      // Use technician list from dashboard data if available
      if (data?.technicians) {
        setTechnicians(data.technicians);
      }
    } catch (e) {}
    setLoading(false);
  };

  // Fetch technician list directly
  const fetchTechList = async () => {
    setLoading(true);
    try {
      const data = await apiCall('admin/technicians.php');
      setTechnicians(Array.isArray(data) ? data : []);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { fetchTechList(); }, []);

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setPhone('');
    setSpec(''); setExpYears(''); setErrMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg('');
    if (pwStrength < 4) {
      setErrMsg('Password is too weak. Needs uppercase, lowercase, number and special character.');
      return;
    }
    setSubmitting(true);
    try {
      await apiCall('auth/register_technician.php', 'POST', {
        name, email, password, phone: phone || null,
        specialization: specialization || null,
        experience_years: expYears ? parseInt(expYears) : 0
      });
      setSuccessMsg(`Technician "${name}" registered successfully!`);
      resetForm();
      setShowForm(false);
      fetchTechList();
    } catch (err) {
      setErrMsg(err?.message || 'Registration failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900">Technician Management</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Register and manage workshop technicians</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setErrMsg(''); }}
          className="px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-bold cursor-pointer hud-btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Technician'}
          <span className="animation"></span>
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 hud-border">
          <h3 className="text-base font-black text-zinc-900 mb-5 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#1f533a]" /> Register New Technician
          </h3>

          {errMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {errMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <HoloInput id="tn-name" label="Full Name" type="text" required
                value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <HoloInput id="tn-email" label="Email Address" type="email" required
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <HoloInput id="tn-phone" label="Phone Number (India)" type="text"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <HoloInput id="tn-spec" label="Specialization" type="text"
                value={specialization} onChange={e => setSpec(e.target.value)} />
            </div>
            <div>
              <HoloInput id="tn-exp" label="Experience (Years)" type="number" min="0" max="60"
                value={expYears} onChange={e => setExpYears(e.target.value)} />
            </div>
            <div>
              <HoloInput id="tn-pw" label="Password" type={showPw ? 'text' : 'password'} required
                value={password} onChange={e => setPassword(e.target.value)}>
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 z-20 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </HoloInput>
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all"
                        style={{ backgroundColor: i <= pwStrength ? STR_COLORS[pwStrength] : '#e4e4e7' }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase" style={{ color: STR_COLORS[pwStrength] }}>
                    {STR_LABELS[pwStrength]}
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button type="submit" disabled={submitting}
                className="px-8 py-3 rounded-xl text-sm font-bold cursor-pointer hud-btn-primary disabled:opacity-60">
                {submitting ? 'Registering…' : 'Register Technician'}
                <span className="animation"></span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Technician List */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden hud-border">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h3 className="text-sm font-black text-zinc-700 uppercase tracking-wider">Active Technicians</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f533a]"></div>
          </div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No technicians registered yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {technicians.map(t => (
              <div key={t.technician_id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1f533a]/10 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-[#1f533a]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.email}</p>
                    {t.specialization && (
                      <p className="text-xs text-[#1f533a] font-semibold mt-0.5">{t.specialization}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-black text-zinc-900">{parseFloat(t.rating || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">{t.experience_years || 0} yrs exp.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
