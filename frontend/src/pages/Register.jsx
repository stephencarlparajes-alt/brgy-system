import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { MdPerson, MdLock, MdArrowForward, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const SECURITY_QUESTIONS = [
  "What is the name of your elementary school?",
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What is the name of the street you grew up on?",
  "What is your favorite childhood nickname?",
];

const PUROKS = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'];

const EMPTY = {
  first_name: '', last_name: '', middle_name: '', suffix: '',
  gender: '', age: '', purok: '', contact_number: '',
  is_voter: false, is_pwd: false, is_senior: false, is_minor: false,
  username: '', password: '', confirm_password: '',
  security_question: SECURITY_QUESTIONS[0], security_answer: '',
};

const STEP_LABELS = ['Personal Info', 'Classification', 'Account Setup'];

export default function Register() {
  const navigate            = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState(EMPTY);

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setN = k => e => setForm(p => ({ ...p, [k]: e.target.value === '' ? '' : Number(e.target.value) }));
  const tog  = k => () => setForm(p => ({ ...p, [k]: !p[k] }));

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.first_name.trim() || !form.last_name.trim()) return toast.error('First and last name are required.');
      if (!form.gender)              return toast.error('Please select your gender.');
      if (!form.age || form.age < 1) return toast.error('Please enter a valid age.');
      if (!form.purok)               return toast.error('Please select your Zone.');
      if (!form.contact_number.trim()) return toast.error('Contact number is required.');
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match.');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (!form.security_answer.trim()) return toast.error('Security answer is required.');
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Please wait for admin verification.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const checkBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
    border: active ? '2px solid #3a7bd5' : '1.5px solid #e8ecf5',
    background: active ? 'rgba(58,123,213,0.06)' : '#fafbff',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
    color: active ? '#3a7bd5' : '#7a8aaa',
    transition: 'all .15s', width: '100%', textAlign: 'left',
  });

  const photoPill = (label) => ({
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20, padding: '4px 12px', fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)', fontWeight: 600,
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── LEFT: Barangay Hall Photo ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <img src="/brgy-hall.png" alt="Barangay Sto. Tomas Hall"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(10,25,60,0.80) 0%, rgba(10,25,60,0.55) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <img src="/seal.png" alt="seal" style={{ width: 54, height: 54, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>E-Sto.Tomas</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Barangay Sto. Tomas, Magarao, Camarines Sur</div>
            </div>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-.5px' }}>
            Create Your<br />Resident Account
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 360 }}>
            Register to access barangay services online. Request documents, track your requests, and pay conveniently.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
            {['Online Requests', 'Track Status', 'Pay via GCash/Maya', 'Walk-in Support'].map(f => (
              <span key={f} style={photoPill(f)}>{f}</span>
            ))}
          </div>
          <div style={{ marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Barangay Sto. Tomas · All rights reserved
          </div>
        </div>
      </div>

      {/* ── RIGHT: Register Form ── */}
      <div style={{
        width: 460, flexShrink: 0, background: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '32px 38px', overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d1b3e', marginBottom: 3, letterSpacing: '-.3px' }}>Create Account</h2>
          <p style={{ fontSize: 12.5, color: '#7a8aaa' }}>Register to access barangay services online</p>
        </div>

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
          {STEP_LABELS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 4,
              background: step > i ? '#3a7bd5' : step === i+1 ? '#93c5fd' : '#e8ecf5',
              transition: 'background .3s' }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#aab2c8', textAlign: 'center', marginBottom: 18 }}>
          Step {step} of {STEP_LABELS.length} — <strong style={{ color: '#3a7bd5' }}>{STEP_LABELS[step-1]}</strong>
        </div>

        {/* ── STEP 1: Personal Info ── */}
        {step === 1 && (
          <form onSubmit={handleNext}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" value={form.first_name} onChange={set('first_name')} placeholder="Juan" required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" value={form.last_name} onChange={set('last_name')} placeholder="Dela Cruz" required />
              </div>
              <div className="form-group">
                <label className="form-label">Middle Name</label>
                <input className="form-input" value={form.middle_name} onChange={set('middle_name')} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label className="form-label">Suffix</label>
                <input className="form-input" value={form.suffix} onChange={set('suffix')} placeholder="Jr., Sr., III…" />
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="form-select" value={form.gender} onChange={set('gender')} required>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input className="form-input" type="number" min="1" max="120"
                  value={form.age} onChange={setN('age')} placeholder="e.g. 25" required />
              </div>
              <div className="form-group">
                <label className="form-label">Zone *</label>
                <select className="form-select" value={form.purok} onChange={set('purok')} required>
                  <option value="">Select Zone</option>
                  {PUROKS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number *</label>
                <input className="form-input" type="tel" value={form.contact_number}
                  onChange={set('contact_number')} placeholder="09XXXXXXXXX" required />
              </div>
            </div>
            <button className="login-submit" type="submit" style={{ marginTop: 4 }}>
              <span>Next</span> <MdArrowForward />
            </button>
          </form>
        )}

        {/* ── STEP 2: Classification ── */}
        {step === 2 && (
          <form onSubmit={handleNext}>
            <p style={{ fontSize: 12.5, color: '#7a8aaa', marginBottom: 14 }}>
              Select all that apply. These help the barangay provide the right services.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'is_voter',  label: 'Registered Voter',           emoji: '🗳️', desc: 'Registered to vote in Sto. Tomas' },
                { key: 'is_pwd',    label: 'Person with Disability (PWD)', emoji: '♿', desc: 'Has a PWD ID or recognized disability' },
                { key: 'is_senior', label: 'Senior Citizen',              emoji: '👴', desc: '60 years old and above' },
                { key: 'is_minor',  label: 'Minor',                       emoji: '👦', desc: 'Below 18 years old' },
              ].map(({ key, label, emoji, desc }) => (
                <button key={key} type="button" onClick={tog(key)} style={checkBtn(form[key])}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: form[key] ? 'rgba(58,123,213,0.12)' : '#f0f3fa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{emoji}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: form[key] ? '#3a7bd5' : '#1e2a45' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#aab2c8', fontWeight: 400 }}>{desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: form[key] ? '2px solid #3a7bd5' : '2px solid #dde3f0',
                    background: form[key] ? '#3a7bd5' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form[key] && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#aab2c8', marginBottom: 12, textAlign: 'center' }}>
              You can skip this step if none apply.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '11px', borderRadius: 10,
                border: '1.5px solid #e8ecf5', background: 'transparent', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 600, color: '#7a8aaa', cursor: 'pointer' }}>
                ← Back
              </button>
              <button className="login-submit" type="submit" style={{ flex: 2, margin: 0 }}>
                <span>Next</span> <MdArrowForward />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Account Setup ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <div className="input-wrap">
                <MdPerson />
                <input className="input-icon" type="text" placeholder="Choose a username"
                  value={form.username} onChange={set('username')} required minLength={4} autoComplete="username" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-wrap">
                <MdLock />
                <input className="input-icon" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#aab2c8', fontSize:18, display:'flex' }}>
                  {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className="input-wrap">
                <MdLock />
                <input className="input-icon" type={showCpw ? 'text' : 'password'} placeholder="Re-enter password"
                  value={form.confirm_password} onChange={set('confirm_password')} required autoComplete="new-password" />
                <button type="button" onClick={() => setShowCpw(p => !p)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#aab2c8', fontSize:18, display:'flex' }}>
                  {showCpw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Security Question *</label>
              <select className="form-select" value={form.security_question} onChange={set('security_question')}>
                {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Security Answer *</label>
              <input className="form-input" value={form.security_answer}
                onChange={set('security_answer')} placeholder="Your answer" required />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: '11px', borderRadius: 10,
                border: '1.5px solid #e8ecf5', background: 'transparent', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 600, color: '#7a8aaa', cursor: 'pointer' }}>
                ← Back
              </button>
              <button className="login-submit" type="submit" disabled={loading} style={{ flex: 2, margin: 0 }}>
                {loading ? 'Creating Account…' : <><span>Create Account</span><MdArrowForward /></>}
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: '#7a8aaa' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3a7bd5', fontWeight: 700 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
