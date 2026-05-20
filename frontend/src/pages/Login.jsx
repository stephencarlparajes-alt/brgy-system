import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdPerson, MdLock, MdArrowForward, MdShield, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function Login() {
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const [role, setRole]       = useState('admin');
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ ...form, role });
      toast.success(`Welcome back, ${res.user.first_name}!`);
      navigate(res.user.role === 'admin' ? '/admin' : '/portal', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', height: 42, border: '1.5px solid #e8ecf5', borderRadius: 8,
    padding: '0 12px 0 38px', fontSize: 13.5, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', color: '#1e2a45',
    transition: 'border-color .15s', background: '#fafbff',
  };

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
            Document Request<br />Management System
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 360 }}>
            Request barangay documents online or walk in at the barangay hall. Fast, secure, and convenient for all residents.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
            {['Clearance', 'Indigency', 'Residency', 'Business Permit'].map(d => (
              <span key={d} style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '4px 12px', fontSize: 11.5,
                color: 'rgba(255,255,255,0.85)', fontWeight: 600,
              }}>{d}</span>
            ))}
          </div>
          <div style={{ marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Barangay Sto. Tomas · All rights reserved
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login Form ── */}
      <div style={{
        width: 420, flexShrink: 0, background: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 38px', overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d1b3e', marginBottom: 4, letterSpacing: '-.3px' }}>Welcome Back</h2>
          <p style={{ fontSize: 13, color: '#7a8aaa' }}>Sign in to your account to continue</p>
        </div>

        {/* Role Tabs */}
        <div className="role-tabs" style={{ marginBottom: 20 }}>
          <button type="button" className={`role-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
            <MdShield size={14} /> Admin
          </button>
          <button type="button" className={`role-tab ${role === 'resident' ? 'active' : ''}`} onClick={() => setRole('resident')}>
            <MdPerson size={14} /> Resident
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1e2a45', display: 'block', marginBottom: 6 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <MdPerson style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#aab2c8', fontSize:17 }} />
              <input style={inputStyle} type="text" placeholder="Enter username"
                value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required autoComplete="username"
                onFocus={e => e.target.style.borderColor='#3a7bd5'}
                onBlur={e => e.target.style.borderColor='#e8ecf5'} />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1e2a45', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <MdLock style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#aab2c8', fontSize:17 }} />
              <input style={{ ...inputStyle, paddingRight: 40 }}
                type={showPw ? 'text' : 'password'} placeholder="Enter password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required autoComplete="current-password"
                onFocus={e => e.target.style.borderColor='#3a7bd5'}
                onBlur={e => e.target.style.borderColor='#e8ecf5'} />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{
                position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'#aab2c8', display:'flex', padding:0,
              }}>
                {showPw ? <MdVisibilityOff size={17}/> : <MdVisibility size={17}/>}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)',
              borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#e53935', marginBottom: 14,
            }}>{error}</div>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : <><span>Sign In as {role === 'admin' ? 'Admin' : 'Resident'}</span><MdArrowForward /></>}
          </button>
        </form>

        <div style={{ height: 1, background: '#f0f3fa', margin: '22px 0' }} />
        <div style={{ textAlign: 'center', fontSize: 12.5, color: '#7a8aaa', lineHeight: 2.2 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#3a7bd5', fontWeight: 700 }}>Register here</Link><br />
          <Link to="/forgot-password" style={{ color: '#aab2c8', fontSize: 12 }}>🔑 Forgot Password?</Link><br />
          <Link to="/" style={{ color: '#aab2c8', fontSize: 12 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
