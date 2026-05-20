import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SECURITY_QUESTIONS = [
  "What is the name of your elementary school?",
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What is the name of the street you grew up on?",
  "What is your favorite childhood nickname?",
];

export default function ForgotPassword() {
  const navigate  = useNavigate();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '', security_question: SECURITY_QUESTIONS[0],
    security_answer: '', new_password: '', confirm_password: '',
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyAnswer({
        username: form.username,
        security_question: form.security_question,
        security_answer: form.security_answer,
      });
      toast.success('Verified! Now set your new password.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      await authAPI.resetPassword({ new_password: form.new_password });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed.');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', height: 42, border: '1.5px solid #e8ecf5', borderRadius: 8,
    padding: '0 12px', fontSize: 13.5, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', color: '#1e2a45',
    transition: 'border-color .15s', background: '#fafbff',
  };

  const stepDot = (n) => ({
    width: 28, height: 28, borderRadius: '50%',
    background: step >= n ? '#3a7bd5' : 'rgba(255,255,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#fff', fontWeight: 600,
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
            Password<br />Recovery
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 360 }}>
            Verify your identity using your security question to reset your account password.
          </p>

          {/* Step indicators */}
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={stepDot(1)}>1</div>
              <span style={{ fontSize: 13, color: step >= 1 ? '#fff' : 'rgba(200,215,255,0.4)', fontWeight: 600 }}>Verify Identity</span>
            </div>
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', marginLeft: 14 }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={stepDot(2)}>2</div>
              <span style={{ fontSize: 13, color: step >= 2 ? '#fff' : 'rgba(200,215,255,0.4)', fontWeight: 600 }}>Reset Password</span>
            </div>
          </div>

          <div style={{ marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Barangay Sto. Tomas · All rights reserved
          </div>
        </div>
      </div>

      {/* ── RIGHT: Forgot Password Form ── */}
      <div style={{
        width: 420, flexShrink: 0, background: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 38px', overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1b3e', marginBottom: 4, letterSpacing: '-.3px' }}>
            {step === 1 ? 'Verify Identity' : 'Reset Password'}
          </h2>
          <p style={{ fontSize: 13, color: '#7a8aaa' }}>
            {step === 1
              ? 'Enter your username and answer your security question'
              : 'Enter your new password below'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e2a45', display: 'block', marginBottom: 6 }}>Username *</label>
              <input style={inputStyle} value={form.username} onChange={set('username')} required
                placeholder="Enter your username"
                onFocus={e => e.target.style.borderColor='#3a7bd5'}
                onBlur={e => e.target.style.borderColor='#e8ecf5'} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e2a45', display: 'block', marginBottom: 6 }}>Security Question *</label>
              <select style={{ ...inputStyle, padding: '0 12px', cursor: 'pointer' }}
                value={form.security_question} onChange={set('security_question')}>
                {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e2a45', display: 'block', marginBottom: 6 }}>Security Answer *</label>
              <input style={inputStyle} value={form.security_answer} onChange={set('security_answer')} required
                placeholder="Your answer"
                onFocus={e => e.target.style.borderColor='#3a7bd5'}
                onBlur={e => e.target.style.borderColor='#e8ecf5'} />
            </div>
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify Identity'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e2a45', display: 'block', marginBottom: 6 }}>New Password *</label>
              <input style={inputStyle} type="password" value={form.new_password} onChange={set('new_password')}
                required minLength={8} placeholder="Min. 8 characters"
                onFocus={e => e.target.style.borderColor='#3a7bd5'}
                onBlur={e => e.target.style.borderColor='#e8ecf5'} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e2a45', display: 'block', marginBottom: 6 }}>Confirm Password *</label>
              <input style={inputStyle} type="password" value={form.confirm_password} onChange={set('confirm_password')}
                required placeholder="Re-enter new password"
                onFocus={e => e.target.style.borderColor='#3a7bd5'}
                onBlur={e => e.target.style.borderColor='#e8ecf5'} />
            </div>
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ height: 1, background: '#f0f3fa', margin: '22px 0' }} />
        <div style={{ textAlign: 'center', fontSize: 12.5, color: '#7a8aaa' }}>
          <Link to="/login" style={{ color: '#3a7bd5', fontWeight: 700 }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
