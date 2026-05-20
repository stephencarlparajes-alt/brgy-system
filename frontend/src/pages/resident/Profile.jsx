import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { MdPerson, MdLock, MdEdit, MdSave, MdClose } from 'react-icons/md';

export default function Profile() {
  const { user, login } = useAuth();

  // ── Profile form state ───────────────────────────────────────────────────
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name:  user?.first_name  || '',
    middle_name: user?.middle_name || '',
    last_name:   user?.last_name   || '',
    suffix:      user?.suffix      || '',
    email:       user?.email       || '',
    phone:       user?.phone       || user?.contact_number || '',
    address:     user?.address     || user?.purok || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password form state ──────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingPw, setSavingPw]   = useState(false);
  const [showPw, setShowPw]       = useState({ current: false, new: false, confirm: false });

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleProfileChange = e => setProfileForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await authAPI.updateProfile(profileForm);
      // Refresh user in context by re-fetching /me
      const res = await authAPI.me();
      // Manually update context — trigger a page reload is simpler with current AuthContext
      toast.success('Profile updated successfully!');
      setEditingProfile(false);
      // Soft refresh to sync context
      window.location.reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileForm({
      first_name:  user?.first_name  || '',
      middle_name: user?.middle_name || '',
      last_name:   user?.last_name   || '',
      suffix:      user?.suffix      || '',
      email:       user?.email       || '',
      phone:       user?.phone       || user?.contact_number || '',
      address:     user?.address     || user?.purok || '',
    });
    setEditingProfile(false);
  };

  const handlePwChange = e => setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePwSave = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.new_password.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await authAPI.changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  // ── Field renderer ───────────────────────────────────────────────────────
  const Field = ({ label, name, value, type = 'text', readOnly, span }) => (
    <div style={{ gridColumn: span === 2 ? 'span 2' : 'span 1', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {readOnly || !editingProfile ? (
        <div style={{
          padding: '9px 13px', borderRadius: 8, background: 'var(--bg)', fontSize: 13.5,
          color: value ? 'var(--text)' : 'var(--muted)', border: '1px solid var(--border)',
          minHeight: 38,
        }}>
          {value || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>—</span>}
        </div>
      ) : (
        <input
          name={name} value={value} type={type} onChange={handleProfileChange}
          style={{
            padding: '9px 13px', borderRadius: 8, border: '1.5px solid var(--blue)',
            fontSize: 13.5, color: 'var(--text)', background: '#fff', outline: 'none',
            fontFamily: 'var(--ff)', transition: 'border .15s',
          }}
        />
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Profile Header Card ── */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #3a7bd5, #1faa6b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: 1,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{fullName}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
            @{user?.username} &nbsp;·&nbsp;
            <span style={{
              background: 'rgba(31,170,107,0.1)', color: '#1faa6b',
              fontWeight: 600, fontSize: 11, padding: '2px 9px', borderRadius: 20,
            }}>Resident</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </div>
        </div>
      </div>

      {/* ── Personal Information Card ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(58,123,213,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
              <MdPerson size={18} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Personal Information</div>
          </div>
          {!editingProfile ? (
            <button
              onClick={() => setEditingProfile(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--blue)', background: 'transparent', color: 'var(--blue)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff)' }}>
              <MdEdit size={15} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleProfileCancel}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff)' }}>
                <MdClose size={15} /> Cancel
              </button>
              <button
                onClick={handleProfileSave} disabled={savingProfile}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff)', opacity: savingProfile ? 0.7 : 1 }}>
                <MdSave size={15} /> {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="First Name"   name="first_name"  value={profileForm.first_name} />
          <Field label="Last Name"    name="last_name"   value={profileForm.last_name} />
          <Field label="Middle Name"  name="middle_name" value={profileForm.middle_name} />
          <Field label="Suffix"       name="suffix"      value={profileForm.suffix} />
          <Field label="Username"     name="username"    value={user?.username} readOnly />
          <Field label="Phone Number" name="phone"       value={profileForm.phone} type="tel" />
          <Field label="Email Address" name="email"      value={profileForm.email} type="email" />
          <Field label="Address / Zone" name="address"  value={profileForm.address} />
        </div>
      </div>

      {/* ── Change Password Card ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(229,57,53,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e53935' }}>
            <MdLock size={18} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Change Password</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
          {[
            { label: 'Current Password', name: 'current_password', key: 'current' },
            { label: 'New Password',     name: 'new_password',     key: 'new' },
            { label: 'Confirm New Password', name: 'confirm_password', key: 'confirm' },
          ].map(({ label, name, key }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  name={name}
                  value={pwForm[name]}
                  type={showPw[key] ? 'text' : 'password'}
                  onChange={handlePwChange}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '9px 40px 9px 13px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13.5, color: 'var(--text)', background: '#fff', outline: 'none', fontFamily: 'var(--ff)', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, padding: 2 }}>
                  {showPw[key] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          ))}

          <div style={{ paddingTop: 4 }}>
            <button
              onClick={handlePwSave} disabled={savingPw || !pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password}
              style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#e53935', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff)', opacity: (savingPw || !pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
              <MdLock size={15} /> {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
